export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const body: any = await context.request.json();
    const now = Math.floor(Date.now() / 1000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `BOOK-${dateStr}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    // Ambil harga DP meja
    const table = await context.env.DB.prepare(
      "SELECT booking_price FROM tables WHERE table_number = ?",
    )
      .bind(body.tableNumber)
      .first<any>();
    const dpAmount = table?.booking_price || 0;

    // Insert ke tabel orders (sebagai pesanan khusus booking)
    const insert = await context.env.DB.prepare(
      `
      INSERT INTO orders (order_number, order_type, table_number, customer_name, customer_phone, status, total_amount, payment_method, created_at, updated_at)
      VALUES (?, 'booking', ?, ?, ?, 'pending', ?, 'transfer', ?, ?)
    `,
    )
      .bind(
        orderNumber,
        body.tableNumber,
        body.customerName,
        body.customerPhone,
        dpAmount,
        now,
        now,
      )
      .run();

    // Ubah status meja jadi 'booked'
    await context.env.DB.prepare(
      "UPDATE tables SET status = 'booked' WHERE table_number = ?",
    )
      .bind(body.tableNumber)
      .run();

    return Response.json({ success: true, orderNumber, dpAmount });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
