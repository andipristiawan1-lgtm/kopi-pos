export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const body: any = await context.request.json();

    // Validasi input dasar
    if (!body.items || body.items.length === 0) {
      return Response.json({ error: "Keranjang kosong" }, { status: 400 });
    }
    if (body.orderType === "dine_in" && !body.tableNumber) {
      return Response.json(
        { error: "Nomor meja wajib diisi untuk Dine-in" },
        { status: 400 },
      );
    }

    // Generate order number: KOPI-YYYYMMDD-XXX (3 digit acak)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const orderNumber = `KOPI-${dateStr}-${randomStr}`;
    const now = Math.floor(Date.now() / 1000); // Unix timestamp

    // Hitung total amount (verifikasi harga di backend untuk keamanan)
    let totalAmount = 0;
    const menuIds = body.items.map((i: any) => i.menuItemId);

    // Ambil harga asli dari DB untuk mencegah manipulasi harga dari frontend
    const placeholders = menuIds.map(() => "?").join(",");
    const { results: dbMenus } = await context.env.DB.prepare(
      `SELECT id, price, name FROM menu_items WHERE id IN (${placeholders})`,
    )
      .bind(...menuIds)
      .all();

    const menuMap = new Map(dbMenus.map((m: any) => [m.id, m]));

    for (const item of body.items) {
      const dbMenu = menuMap.get(item.menuItemId) as any;
      if (!dbMenu)
        throw new Error(`Menu ID ${item.menuItemId} tidak ditemukan`);
      totalAmount += dbMenu.price * item.quantity;
    }

    // Siapkan query batch (Atomik)
    const statements = [];

    // 1. Insert ke tabel orders
    statements.push(
      context.env.DB.prepare(
        `
        INSERT INTO orders (order_number, order_type, table_number, customer_name, status, total_amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
      `,
      ).bind(
        orderNumber,
        body.orderType,
        body.tableNumber || null,
        body.customerName || "Pelanggan",
        totalAmount,
        now,
        now,
      ),
    );

    // 2. Insert ke tabel order_items (loop)
    for (const item of body.items) {
      const dbMenu = menuMap.get(item.menuItemId) as any;
      statements.push(
        context.env.DB.prepare(
          `
          INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, price_at_time, subtotal)
          VALUES ((SELECT id FROM orders WHERE order_number = ?), ?, ?, ?, ?, ?)
        `,
        ).bind(
          orderNumber,
          item.menuItemId,
          dbMenu.name,
          item.quantity,
          dbMenu.price,
          dbMenu.price * item.quantity,
        ),
      );
    }

    // Eksekusi semua query secara atomik (jika satu gagal, semua batal)
    await context.env.DB.batch(statements);

    return Response.json({
      success: true,
      orderNumber,
      totalAmount,
      message: "Pesanan berhasil dibuat",
    });
  } catch (error) {
    return Response.json(
      { error: "Gagal membuat pesanan", details: String(error) },
      { status: 500 },
    );
  }
};
