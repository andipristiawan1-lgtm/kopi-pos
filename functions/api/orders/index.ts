export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const body: any = await context.request.json();

    if (!body.items || body.items.length === 0) {
      return Response.json({ error: "Keranjang kosong" }, { status: 400 });
    }
    if (body.orderType === "dine_in" && !body.tableNumber) {
      return Response.json(
        { error: "Nomor meja wajib diisi" },
        { status: 400 },
      );
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomStr = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const orderNumber = `KOPI-${dateStr}-${randomStr}`;
    const now = Math.floor(Date.now() / 1000);

    // 1. Validasi Harga
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

    // 2. Kode Unik (jika non-cash)
    let uniqueCode = 0;
    const allowedPayments = ["cash", "transfer", "ewallet"];
    const paymentMethod = allowedPayments.includes(body.paymentMethod)
      ? body.paymentMethod
      : "cash";
    if (paymentMethod !== "cash") {
      uniqueCode = Math.floor(Math.random() * 999) + 1;
    }
    const totalAmount = subtotal + uniqueCode;

    // 3. Cek meja aktif (jika dine_in)
    let existingOrder = null;
    if (body.orderType === "dine_in" && body.tableNumber) {
      existingOrder = await context.env.DB.prepare(
        `
        SELECT id, order_number FROM orders WHERE table_number = ? AND order_type = 'dine_in' AND status IN ('pending', 'preparing') LIMIT 1
      `, // <-- PASTIKAN order_number IKUT DI-SELECT
      )
        .bind(body.tableNumber)
        .first<any>();
    }

    let orderId = 0;
    let finalOrderNumber = orderNumber;

    if (existingOrder) {
      // SKENARIO A: TAMBAH PESANAN KE TAGIHAN MEJA
      orderId = existingOrder.id;
      finalOrderNumber = existingOrder.order_number; // <-- GUNAKAN NOMOR ASLI

      // Update total_amount di tabel orders
      await context.env.DB.prepare(
        `
        UPDATE orders SET total_amount = total_amount + ?, updated_at = ? WHERE id = ?
      `,
      )
        .bind(totalAmount, now, orderId)
        .run();
    } else {
      // SKENARIO B: BUAT TAGIHAN BARU
      const insertOrder = await context.env.DB.prepare(
        `
        INSERT INTO orders (order_number, order_type, table_number, customer_name, status, total_amount, payment_method, unique_code, is_paid, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
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
          body.isPaid === true ? 1 : 0,
          now,
          now,
        )
        .run();

      if (!insertOrder.success) throw new Error("Gagal insert order");

      const getOrder = await context.env.DB.prepare(
        "SELECT id FROM orders WHERE order_number = ?",
      )
        .bind(orderNumber)
        .first<any>();
      orderId = getOrder.id;

      // Update status meja jadi 'occupied'
      if (body.orderType === "dine_in" && body.tableNumber) {
        await context.env.DB.prepare(
          "UPDATE tables SET status = 'occupied' WHERE table_number = ?",
        )
          .bind(body.tableNumber)
          .run();
      }
    }

    // 4. Insert order items
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
    if (itemStatements.length > 0) await context.env.DB.batch(itemStatements);

    return Response.json({
      success: true,
      orderNumber: finalOrderNumber,
      totalAmount,
      paymentMethod,
    });
  } catch (error) {
    return Response.json(
      { error: "Gagal membuat pesanan", details: String(error) },
      { status: 500 },
    );
  }
};
