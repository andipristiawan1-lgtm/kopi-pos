export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    // Cek apakah user adalah owner
    const cookie = context.request.headers.get("Cookie");
    if (!cookie)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    const match = cookie.match(/session_token=([^;]+)/);
    if (!match)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const session = await context.env.DB.prepare(
      "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
    )
      .bind(match[1])
      .first<any>();

    if (session?.role !== "owner")
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });

    // Hitung tanggal hari ini (format YYYY-MM-DD)
    const today = new Date().toISOString().slice(0, 10);

    // Query statistik
    const stats = await context.env.DB.prepare(
      `
      SELECT 
        COUNT(id) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM orders 
      WHERE status = 'completed' AND date(created_at, 'unixepoch') = ?
    `,
    )
      .bind(today)
      .first<any>();

    return Response.json({
      totalOrders: stats?.total_orders || 0,
      totalRevenue: stats?.total_revenue || 0,
      date: today,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
