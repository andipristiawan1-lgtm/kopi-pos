export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const body: any = await context.request.json();

    // 1. Validasi Input
    if (!body.items || body.items.length === 0) {
      return Response.json({ error: "Keranjang kosong" }, { status: 400 });
    }
    if (body.orderType === "dine_in" && !body.tableNumber) {
      return Response.json(
        { error: "Nomor meja wajib diisi" },
        { status: 400 },
      );
    }

    // 2. Generate Data Pesanan
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const orderNumber = `KOPI-${dateStr}-${randomStr}`;
    const now = Math.floor(Date.now() / 1000);

    // 3. Validasi Harga dari Database
    let subtotal = 0;
    const menuIds = body.items.map((i: any) => i.menuItemId);
    const placeholders = menuIds.map(() => "?").join(",");

    const { results: dbMenus } = await context.env.DB.prepare(
      `SELECT id, price, name FROM menu_items WHERE id IN (${placeholders})`,
    )
      .bind(...menuIds)
      .all();

    const menuMap = new Map(dbMenus.map((m: any) => [m.id, m]));

    for (const item of body.items) {
      const dbMenu: any = menuMap.get(item.menuItemId);
      if (!dbMenu)
        throw new Error(`Menu ID ${item.menuItemId} tidak ditemukan`);
      subtotal += dbMenu.price * item.quantity;
    }

    // 4. Buat Kode Unik untuk Non-Cash (1 - 999)
    let uniqueCode = 0;
    const paymentMethod = body.paymentMethod || "cash";

    if (paymentMethod !== "cash") {
      uniqueCode = Math.floor(Math.random() * 999) + 1;
    }

    // Total akhir = subtotal menu + kode unik
    const totalAmount = subtotal + uniqueCode;

    // 5. Insert Order ke Database (Tambahkan payment_method & unique_code)
    const insertOrder = await context.env.DB.prepare(
      `
      INSERT INTO orders (order_number, order_type, table_number, customer_name, status, total_amount, payment_method, unique_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `,
    )
      .bind(
        orderNumber,
        body.orderType,
        body.tableNumber || null,
        body.customerName || "Pelanggan",
        totalAmount,
        paymentMethod,
        uniqueCode,
        now,
        now,
      )
      .run();

    if (!insertOrder.success) {
      throw new Error("Gagal insert order ke database");
    }

    // 6. Ambil ID Order yang Baru Dibuat
    const getOrder = await context.env.DB.prepare(
      "SELECT id FROM orders WHERE order_number = ?",
    )
      .bind(orderNumber)
      .first<any>();

    if (!getOrder || !getOrder.id) {
      throw new Error("Gagal mengambil ID order");
    }

    const orderId = getOrder.id;
    const itemStatements = [];

    // 7. Siapkan Item untuk Batch Insert
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

    // 8. Eksekusi Item (Batch)
    if (itemStatements.length > 0) {
      await context.env.DB.batch(itemStatements);
    }

    // 9. Kembalikan Response Sukses
    return Response.json({
      success: true,
      orderNumber,
      subtotal,
      uniqueCode,
      totalAmount,
      paymentMethod,
      message: "Pesanan berhasil dibuat",
    });
  } catch (error) {
    return Response.json(
      { error: "Gagal membuat pesanan", details: String(error) },
      { status: 500 },
    );
  }
};
