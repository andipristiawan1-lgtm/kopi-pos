type NotificationInput = {
  secret: string;
  text: string;
  sourceApp: string | null;
  notificationTitle: string | null;
  appName: string | null;
};

type NotificationContext = Parameters<PagesFunction<{ DB: D1Database }>>[0];

const MAX_MESSAGE_LENGTH = 4000;
const MAX_AMOUNT_CANDIDATES = 5;
const MATCH_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Mengubah potongan angka dari notifikasi menjadi nominal integer.
 * Mendukung format Indonesia: "25.000", "25.000,00", "Rp 1.500.000".
 */
function parseAmount(raw: string): number | null {
  let cleaned = raw.replace(/[^0-9.,]/g, "");

  const lastComma = cleaned.lastIndexOf(",");
  if (lastComma !== -1) {
    const decimals = cleaned.slice(lastComma + 1);
    cleaned =
      decimals.length > 0 && decimals.length <= 2 && /^\d+$/.test(decimals)
        ? cleaned.slice(0, lastComma) // koma = pemisah desimal ("25.000,00")
        : cleaned.replace(/,/g, ""); // koma = pemisah ribuan ("25,000")
  }

  cleaned = cleaned.replace(/\./g, "");
  if (!cleaned) return null;

  const amount = Number(cleaned);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

const AMOUNT_PATTERNS = [
  /(?:Rp\.?|IDR)\s*([0-9][0-9.,]*)/gi,
  /(?:nominal|jumlah|total|transfer|masuk|received|credit)\s*[:=]?\s*(?:Rp\.?\s*)?([0-9][0-9.,]*)/gi,
];

const NON_NOMINAL_CONTEXT = /(saldo|balance|sisa|ref\b|referensi|kode\s*transaksi)/i;

/**
 * Mengumpulkan semua kandidat nominal sesuai urutan kemunculan/prioritas pola.
 * Pemanggil memilih kandidat yang benar-benar cocok dengan total pesanan, sehingga
 * angka lain (biaya admin, nomor referensi, saldo) tidak memicu salah cocok.
 */
function extractAmountCandidates(message: string): number[] {
  const text = message.replace(/\u00a0/g, " ").replace(/\s+/g, " ");
  const candidates: number[] = [];

  for (const pattern of AMOUNT_PATTERNS) {
    for (const found of text.matchAll(pattern)) {
      const start = found.index ?? 0;
      const before = text.slice(Math.max(0, start - 25), start);
      if (NON_NOMINAL_CONTEXT.test(before)) continue;

      const amount = parseAmount(found[1]);
      if (amount === null || candidates.includes(amount)) continue;

      candidates.push(amount);
      if (candidates.length >= MAX_AMOUNT_CANDIDATES) return candidates;
    }
  }

  return candidates;
}

function sanitizeMessage(message: string): string {
  return message
    .replace(/(otp|pin|password|token)[\s:=]*[0-9A-Za-z-]+/gi, "[SECRET]")
    .slice(0, MAX_MESSAGE_LENGTH);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleNotification(
  context: NotificationContext,
  input: NotificationInput,
): Promise<Response> {
  const db = context.env.DB;
  const { secret, text, sourceApp, notificationTitle, appName } = input;

  const configuredSecret = await db
    .prepare("SELECT value FROM settings WHERE key = 'payment_webhook_secret'")
    .first<{ value: string }>();

  if (!configuredSecret?.value || !secret || !safeEqual(secret, configuredSecret.value)) {
    return Response.json({ error: "Secret tidak valid" }, { status: 403 });
  }

  const rawMessage = sanitizeMessage(text);
  if (!rawMessage) {
    return Response.json({ error: "Pesan tidak ditemukan" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const dedupSource = `${sourceApp || ""}|${notificationTitle || ""}|${rawMessage}|${Math.floor(now / 300)}`;
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(dedupSource));
  const finalDedupKey = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  const existing = await db
    .prepare("SELECT id, status FROM payment_logs WHERE dedup_key = ?")
    .bind(finalDedupKey)
    .first<{ id: number; status: string }>();

  if (existing) {
    return Response.json({
      success: true,
      duplicate: true,
      status: existing.status,
      logId: existing.id,
    });
  }

  const candidates = extractAmountCandidates(rawMessage);
  const primaryAmount = candidates[0] ?? null;

  const insertLog = await db
    .prepare(
      `INSERT INTO payment_logs
       (dedup_key, source_app, app_name, notification_title, raw_message, extracted_amount, notification_time, status, received_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    )
    .bind(
      finalDedupKey,
      sourceApp,
      appName,
      notificationTitle,
      rawMessage,
      primaryAmount,
      now,
      now,
    )
    .run();

  const logId = Number(insertLog.meta.last_row_id) || null;

  if (!insertLog.success || !logId) {
    return Response.json({ error: "Gagal menyimpan log pembayaran" }, { status: 500 });
  }

  const closeLog = (status: "manual" | "ignored", matchedOrderId: number | null = null) =>
    db
      .prepare(
        "UPDATE payment_logs SET status = ?, matched_order_id = ?, processed_at = ? WHERE id = ?",
      )
      .bind(status, matchedOrderId, now, logId)
      .run();

  if (candidates.length === 0) {
    await closeLog("manual");
    return Response.json({ success: true, status: "manual", logId });
  }

  const cutoff = now - MATCH_WINDOW_SECONDS;
  const placeholders = candidates.map(() => "?").join(",");
  const { results: matches } = await db
    .prepare(
      `SELECT id, order_number, total_amount
       FROM orders
       WHERE is_paid = 0
         AND COALESCE(payment_method, 'cash') != 'cash'
         AND status NOT IN ('completed', 'cancelled')
         AND created_at >= ?
         AND total_amount IN (${placeholders})
       ORDER BY created_at DESC
       LIMIT 2`,
    )
    .bind(cutoff, ...candidates)
    .all<{ id: number; order_number: string; total_amount: number }>();

  if (matches.length !== 1) {
    const status = matches.length > 1 ? "manual" : "ignored";
    await closeLog(status);
    return Response.json({ success: true, status, logId, candidates });
  }

  const order = matches[0];
  const claim = await db
    .prepare("UPDATE orders SET is_paid = 1, updated_at = ? WHERE id = ? AND is_paid = 0")
    .bind(now, order.id)
    .run();

  if (claim.meta.changes === 0) {
    // Order sudah dilunasi proses lain (kasir / notifikasi lain) lebih dulu.
    await closeLog("manual", order.id);
    return Response.json({
      success: true,
      status: "manual",
      reason: "order_already_paid",
      logId,
      orderNumber: order.order_number,
    });
  }

  await db
    .prepare(
      `UPDATE payment_logs
       SET status = 'matched', matched_order_id = ?, processed_at = ?
       WHERE id = ?`,
    )
    .bind(order.id, now, logId)
    .run();

  return Response.json({
    success: true,
    status: "matched",
    logId,
    orderNumber: order.order_number,
  });
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const pathSecret = String(context.params?.secret || "");
    const querySecret = url.searchParams.get("secret") || "";

    return await handleNotification(context, {
      secret: querySecret || pathSecret,
      text: url.searchParams.get("text") || "",
      sourceApp: url.searchParams.get("pkg") || null,
      notificationTitle: url.searchParams.get("title") || null,
      appName: url.searchParams.get("name") || null,
    });
  } catch {
    return Response.json({ error: "Gagal memproses callback pembayaran" }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const body: any = await context.request.json().catch(() => ({}));
    const url = new URL(context.request.url);

    // Secret tidak pernah ditulis ke URL pada jalur POST agar tidak tercatat di log akses.
    return await handleNotification(context, {
      secret: String(body.secret || url.searchParams.get("secret") || ""),
      text: String(body.text || ""),
      sourceApp: body.pkg ? String(body.pkg) : null,
      notificationTitle: body.title ? String(body.title) : null,
      appName: body.name ? String(body.name) : null,
    });
  } catch {
    return Response.json({ error: "Payload callback tidak valid" }, { status: 400 });
  }
};
