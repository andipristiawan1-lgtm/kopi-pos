export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const isEnabled = await context.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'is_booking_enabled'",
    ).first<{ value: string }>();

    if (isEnabled?.value === "0") {
      return Response.json(
        { error: "Fitur booking sedang dinonaktifkan oleh pemilik." },
        { status: 403 },
      );
    }

    const body: any = await context.request.json();
    const tableNumber = String(body?.tableNumber || "").trim();
    const customerName = String(body?.customerName || "").trim();
    const customerPhone = String(body?.customerPhone || "").replace(/\D/g, "");

    if (!tableNumber) {
      return Response.json(
        { error: "Pilih meja terlebih dahulu." },
        { status: 400 },
      );
    }
    if (customerName.length < 2) {
      return Response.json(
        { error: "Nama pelanggan tidak valid." },
        { status: 400 },
      );
    }
    if (customerPhone.length < 8 || customerPhone.length > 15) {
      return Response.json(
        { error: "Nomor WhatsApp tidak valid." },
        { status: 400 },
      );
    }

    if (body.items !== undefined && !Array.isArray(body.items)) {
      return Response.json(
        { error: "Daftar menu tidak valid." },
        { status: 400 },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const orderNumber = `BOOK-${dateStr}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`;

    const table = await context.env.DB.prepare(
      "SELECT booking_price, is_bookable, status FROM tables WHERE table_number = ?",
    )
      .bind(tableNumber)
      .first<{
        booking_price: number;
        is_bookable: number;
        status: string;
      }>();

    if (!table) {
      return Response.json({ error: "Meja tidak ditemukan." }, { status: 400 });
    }
    if (table.is_bookable === 0) {
      return Response.json(
        { error: "Meja ini tidak tersedia untuk booking." },
        { status: 400 },
      );
    }
    if (table.status !== "available") {
      return Response.json(
        { error: "Meja sedang tidak tersedia." },
        { status: 409 },
      );
    }

    const dpAmount = table.booking_price || 0;
    let menuSubtotal = 0;
    const menuMap = new Map<
      number,
      { id: number; price: number; name: string }
    >();

    if (body.items && body.items.length > 0) {
      if (body.items.length > 100) {
        return Response.json(
          { error: "Jumlah item menu terlalu banyak." },
          { status: 400 },
        );
      }

      const normalizedItems = body.items.map((item: any) => ({
        menuItemId: Number(item?.menuItemId),
        quantity: Number(item?.quantity),
      }));

      if (
        normalizedItems.some(
          (item: { menuItemId: number; quantity: number }) =>
            !Number.isInteger(item.menuItemId) ||
            item.menuItemId < 1 ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99,
        )
      ) {
        return Response.json(
          { error: "Data item menu tidak valid." },
          { status: 400 },
        );
      }

      const menuIds = [
        ...new Set(
          normalizedItems.map((item: { menuItemId: number }) => item.menuItemId),
        ),
      ];
      const placeholders = menuIds.map(() => "?").join(",");
      const { results: dbMenus } = await context.env.DB.prepare(
        `SELECT id, price, name FROM menu_items WHERE id IN (${placeholders}) AND is_available = 1`,
      )
        .bind(...menuIds)
        .all<{ id: number; price: number; name: string }>();

      for (const menu of dbMenus) menuMap.set(menu.id, menu);

      for (const item of normalizedItems) {
        const dbMenu = menuMap.get(item.menuItemId);
        if (!dbMenu) {
          return Response.json({ error: "Menu tidak tersedia." }, { status: 400 });
        }
        menuSubtotal += dbMenu.price * item.quantity;
      }

      (body as any)._normalizedItems = normalizedItems;
    }

    const totalAmount = dpAmount + menuSubtotal;

    const insertOrder = await context.env.DB.prepare(
      `INSERT INTO orders
       (order_number, order_type, table_number, customer_name, customer_phone, status, total_amount, payment_method, created_at, updated_at)
       VALUES (?, 'booking', ?, ?, ?, 'pending', ?, 'transfer', ?, ?)`,
    )
      .bind(
        orderNumber,
        tableNumber,
        customerName,
        customerPhone,
        totalAmount,
        now,
        now,
      )
      .run();

    if (!insertOrder.success) throw new Error("Gagal membuat booking");

    const getOrder = await context.env.DB.prepare(
      "SELECT id FROM orders WHERE order_number = ?",
    )
      .bind(orderNumber)
      .first<{ id: number }>();

    if (!getOrder) throw new Error("Booking tidak berhasil disimpan");

    const statements = [];
    if ((body as any)._normalizedItems) {
      for (const item of (body as any)._normalizedItems) {
        const dbMenu = menuMap.get(item.menuItemId)!;
        statements.push(
          context.env.DB.prepare(
            `INSERT INTO order_items
             (order_id, menu_item_id, menu_item_name, quantity, price_at_time, subtotal)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).bind(
            getOrder.id,
            item.menuItemId,
            dbMenu.name,
            item.quantity,
            dbMenu.price,
            dbMenu.price * item.quantity,
          ),
        );
      }
    }

    statements.push(
      context.env.DB.prepare(
        "UPDATE tables SET status = 'booked' WHERE table_number = ? AND status = 'available'",
      ).bind(tableNumber),
    );

    await context.env.DB.batch(statements);

    return Response.json({
      success: true,
      orderNumber,
      totalAmount,
      dpAmount,
      menuSubtotal,
    });
  } catch {
    return Response.json({ error: "Gagal membuat booking" }, { status: 500 });
  }
};
