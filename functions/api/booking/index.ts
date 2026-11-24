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

    // 1. Ambil harga DP meja
    const table = await context.env.DB.prepare(
      "SELECT booking_price FROM tables WHERE table_number = ?",
    )
      .bind(body.tableNumber)
      .first<any>();
    const dpAmount = table?.booking_price || 0;

    // 2. Hitung total harga menu (jika ada)
    let menuSubtotal = 0;
    let menuMap = new Map();

    if (body.items && body.items.length > 0) {
      const menuIds = body.items.map((i: any) => i.menuItemId);
      const placeholders = menuIds.map(() => "?").join(",");
      const { results: dbMenus } = await context.env.DB.prepare(
        `SELECT id, price, name FROM menu_items WHERE id IN (${placeholders})`,
      )
        .bind(...menuIds)
        .all();

      menuMap = new Map(dbMenus.map((m: any) => [m.id, m]));

      for (const item of body.items) {
        const dbMenu: any = menuMap.get(item.menuItemId);
        if (!dbMenu)
          throw new Error(`Menu ID ${item.menuItemId} tidak ditemukan`);
        menuSubtotal += dbMenu.price * item.quantity;
      }
    }

    // 3. Total akhir = DP Meja + Total Menu
    const totalAmount = dpAmount + menuSubtotal;

    // 4. Insert ke tabel orders
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
        totalAmount,
        now,
        now,
      )
      .run();

    if (!insert.success) throw new Error("Gagal membuat booking");

    // 5. Ambil ID order yang baru dibuat
    const getOrder = await context.env.DB.prepare(
      "SELECT id FROM orders WHERE order_number = ?",
    )
      .bind(orderNumber)
      .first<any>();
    const orderId = getOrder.id;

    // 6. Insert item menu (jika ada)
    if (body.items && body.items.length > 0) {
      const itemStatements = [];
      for (const item of body.items) {
        const dbMenu: any = menuMap.get(item.menuItemId);
        itemStatements.push(
          context.env.DB.prepare(
            `
            INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, price_at_time, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)
          `,
          ).bind(
            orderId,
            item.menuItemId,
            dbMenu.name,
            item.quantity,
            dbMenu.price,
            dbMenu.price * item.quantity,
          ),
        );
      }
      await context.env.DB.batch(itemStatements);
    }

    // 7. Ubah status meja jadi 'booked'
    await context.env.DB.prepare(
      "UPDATE tables SET status = 'booked' WHERE table_number = ?",
    )
      .bind(body.tableNumber)
      .run();

    return Response.json({
      success: true,
      orderNumber,
      totalAmount,
      dpAmount,
      menuSubtotal,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
