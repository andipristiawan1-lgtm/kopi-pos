async function requireOwner(context: any) {
  const cookie = context.request.headers.get("Cookie");
  const match = cookie?.match(/session_token=([^;]+)/);
  if (!match) return null;

  return context.env.DB.prepare(
    `SELECT u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > ? AND u.is_active = 1`,
  )
    .bind(match[1], Math.floor(Date.now() / 1000))
    .first<any>();
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  const session = await requireOwner(context);
  if (session?.role !== "owner") {
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });
  }

  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get("status") || "";

    let query = "SELECT * FROM payment_logs";
    const binds: any[] = [];

    if (status) {
      query += " WHERE status = ?";
      binds.push(status);
    }

    query += " ORDER BY received_at DESC LIMIT 200";

    let statement = context.env.DB.prepare(query);
    if (binds.length > 0) statement = statement.bind(...binds);

    const { results } = await statement.all();
    return Response.json({ data: results });
  } catch {
    return Response.json({ error: "Gagal memuat log pembayaran" }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (context) => {
  const session = await requireOwner(context);
  if (session?.role !== "owner") {
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });
  }

  try {
    const body: any = await context.request.json();
    const logId = Number(body.logId);
    const orderId = Number(body.orderId);

    if (!Number.isInteger(logId) || logId < 1) {
      return Response.json({ error: "Log pembayaran tidak valid" }, { status: 400 });
    }

    const log = await context.env.DB.prepare(
      "SELECT id, status FROM payment_logs WHERE id = ?",
    ).bind(logId).first<{ id: number; status: string }>();

    if (!log) {
      return Response.json({ error: "Log pembayaran tidak ditemukan" }, { status: 404 });
    }

    if (body.action === "ignore") {
      const now = Math.floor(Date.now() / 1000);
      await context.env.DB.prepare(
        "UPDATE payment_logs SET status = 'ignored', processed_at = ? WHERE id = ?",
      ).bind(now, logId).run();
      return Response.json({ success: true, status: "ignored" });
    }

    if (!Number.isInteger(orderId) || orderId < 1) {
      return Response.json({ error: "Pesanan tidak valid" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - 24 * 60 * 60;
    const order = await context.env.DB.prepare(
      `SELECT id, order_number, total_amount, is_paid, created_at
       FROM orders
       WHERE id = ? AND is_paid = 0 AND created_at >= ?
         AND status NOT IN ('completed', 'cancelled')`,
    ).bind(orderId, cutoff).first<any>();

    if (!order) {
      return Response.json({ error: "Pesanan tidak valid atau sudah lewat batas 24 jam" }, { status: 409 });
    }

    await context.env.DB.prepare(
      "UPDATE orders SET is_paid = 1, updated_at = ? WHERE id = ? AND is_paid = 0",
    ).bind(now, orderId).run();

    await context.env.DB.prepare(
      "UPDATE payment_logs SET status = 'matched', matched_order_id = ?, processed_at = ? WHERE id = ?",
    ).bind(orderId, now, logId).run();

    return Response.json({ success: true, status: "matched", orderNumber: order.order_number });
  } catch {
    return Response.json({ error: "Gagal memproses log pembayaran" }, { status: 500 });
  }
};
