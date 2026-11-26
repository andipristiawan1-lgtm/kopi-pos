export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const url = new URL(context.request.url);
    const customerPhone = String(url.searchParams.get("phone") || "")
      .replace(/\D/g, "");

    if (customerPhone.length < 8 || customerPhone.length > 15) {
      return Response.json(
        { error: "Nomor WhatsApp tidak valid" },
        { status: 400 },
      );
    }

    const { results } = await context.env.DB.prepare(
      `SELECT id, order_number, order_type, table_number, customer_name,
              status, total_amount, payment_method, is_paid, created_at
       FROM orders
       WHERE customer_phone = ?
       ORDER BY created_at DESC
       LIMIT 20`,
    )
      .bind(customerPhone)
      .all();

    return Response.json({ data: results || [] });
  } catch {
    return Response.json(
      { error: "Gagal memuat riwayat pesanan" },
      { status: 500 },
    );
  }
};
