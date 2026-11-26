function extractAmount(message: string): number | null {
  const text = message.replace(/\u00a0/g, " ").replace(/\s+/g, " ");

  const patterns = [
    /(?:Rp|IDR|Rp\.)\s*([0-9][0-9.,]*)/gi,
    /(?:nominal|jumlah|total|transfer|masuk|received|credit)\s*[:=]?\s*([0-9][0-9.,]*)/gi,
  ];

  for (const pattern of patterns) {
    const match = text.matchAll(pattern);
    for (const found of match) {
      const digits = found[1].replace(/[^0-9]/g, "");
      const amount = Number(digits);
      if (Number.isSafeInteger(amount) && amount > 0) return amount;
    }
  }

  return null;
}

function sanitizeMessage(message: string): string {
  return message
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, "[CARD]")
    .replace(/\b\d{6}\b/g, "[PIN]")
    .replace(/(otp|pin|password|token)[\s:=]*[0-9A-Za-z-]+/gi, "[SECRET]")
    .slice(0, 4000);
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const pathSecret = String(context.params.secret || "");
    const url = new URL(context.request.url);

    const querySecret = url.searchParams.get("secret") || "";
    const secret = querySecret || pathSecret;

    const rawMessage = sanitizeMessage(url.searchParams.get("text") || "");
    if (!rawMessage) {
      return Response.json({ error: "Pesan tidak ditemukan" }, { status: 400 });
    }

    const sourceApp = url.searchParams.get("pkg") || null;
    const notificationTitle = url.searchParams.get("title") || null;
    const appName = url.searchParams.get("name") || null;
    const now = Math.floor(Date.now() / 1000);
    const encoder = new TextEncoder();
    const dedupSource = `${sourceApp || ""}|${notificationTitle || ""}|${rawMessage}|${Math.floor(now / 300)}`;
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(dedupSource));
    const finalDedupKey = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const existing = await context.env.DB.prepare(
      "SELECT id, status FROM payment_logs WHERE dedup_key = ?",
    ).bind(finalDedupKey).first<{ id: number; status: string }>();

    if (existing) {
      return Response.json({ success: true, duplicate: true, status: existing.status, logId: existing.id });
    }

    const configuredSecret = await context.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'payment_webhook_secret'",
    ).first<{ value: string }>();

    if (!configuredSecret?.value || secret !== configuredSecret.value) {
      return Response.json({ error: "Secret tidak valid" }, { status: 403 });
    }

    const extractedAmount = extractAmount(rawMessage);
    const insertLog = await context.env.DB.prepare(
      `INSERT INTO payment_logs
       (dedup_key, source_app, app_name, notification_title, raw_message, extracted_amount, notification_time, status, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    ).bind(
      finalDedupKey,
      sourceApp,
      appName,
      notificationTitle,
      rawMessage,
      extractedAmount,
      now,
      now,
    ).run();

    if (!insertLog.success) {
      return Response.json({ error: "Gagal menyimpan log pembayaran" }, { status: 500 });
    }

    const log = await context.env.DB.prepare(
      "SELECT id FROM payment_logs WHERE dedup_key = ?",
    ).bind(finalDedupKey).first<{ id: number }>();

    if (!extractedAmount) {
      await context.env.DB.prepare(
        "UPDATE payment_logs SET status = 'manual', processed_at = ? WHERE id = ?",
      ).bind(now, log?.id).run();
      return Response.json({ success: true, status: "manual", logId: log?.id });
    }

    const cutoff = now - 24 * 60 * 60;
    const matches = await context.env.DB.prepare(
      `SELECT id, order_number, total_amount
       FROM orders
       WHERE is_paid = 0
         AND payment_method != 'cash'
         AND status NOT IN ('completed', 'cancelled')
         AND created_at >= ?
         AND total_amount = ?
       ORDER BY created_at DESC
       LIMIT 2`,
    ).bind(cutoff, extractedAmount).all<{ id: number; order_number: string; total_amount: number }>();

    if (matches.results.length === 1) {
      const order = matches.results[0];
      await context.env.DB.prepare(
        "UPDATE orders SET is_paid = 1, updated_at = ? WHERE id = ? AND is_paid = 0",
      ).bind(now, order.id).run();

      await context.env.DB.prepare(
        `UPDATE payment_logs
         SET status = 'matched', matched_order_id = ?, processed_at = ?
         WHERE id = ?`,
      ).bind(order.id, now, log?.id).run();

      return Response.json({
        success: true,
        status: "matched",
        logId: log?.id,
        orderNumber: order.order_number,
      });
    }

    const status = matches.results.length > 1 ? "manual" : "ignored";
    await context.env.DB.prepare(
      "UPDATE payment_logs SET status = ?, processed_at = ? WHERE id = ?",
    ).bind(status, now, log?.id).run();

    return Response.json({ success: true, status, logId: log?.id });
  } catch {
    return Response.json({ error: "Gagal memproses callback pembayaran" }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const url = new URL(context.request.url);

    if (body.secret) url.searchParams.set("secret", String(body.secret));
    if (body.text) url.searchParams.set("text", String(body.text));
    if (body.pkg) url.searchParams.set("pkg", String(body.pkg));
    if (body.title) url.searchParams.set("title", String(body.title));
    if (body.name) url.searchParams.set("name", String(body.name));

    const syntheticRequest = new Request(url.toString(), {
      method: "GET",
    });

    return onRequestGet({
      ...context,
      request: syntheticRequest,
    } as any);
  } catch {
    return Response.json({ error: "Payload callback tidak valid" }, { status: 400 });
  }
};
