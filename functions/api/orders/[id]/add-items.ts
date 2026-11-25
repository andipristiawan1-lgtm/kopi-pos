export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const orderId = context.params.id;
    const body: any = await context.request.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return Response.json({ error: "Tidak ada item" }, { status: 400 });
    }

    const order = await context.env.DB.prepare(
      "SELECT id, status FROM orders WHERE id = ?",
    )
      .bind(orderId)
      .first<{ id: number; status: string }>();

    if (!order) {
      return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    let additionalTotal = 0;
    const menuIds = body.items.map((item: any) => Number(item.menuItemId));

    if (menuIds.some((id: number) => !Number.isInteger(id) || id < 1)) {
      return Response.json({ error: "Item menu tidak valid" }, { status: 400 });
    }

    const placeholders = menuIds.map(() => "?").join(",");
    const { results: dbMenus } = await context.env.DB.prepare(
      `SELECT id, price, name FROM menu_items WHERE id IN (${placeholders}) AND is_available = 1`,
    )
      .bind(...menuIds)
      .all<{ id: number; price: number; name: string }>();

    const menuMap = new Map(dbMenus.map((menu) => [menu.id, menu]));
    const statements = [];

    for (const item of body.items) {
      const menuItemId = Number(item.menuItemId);
      const quantity = Number(item.quantity);
      const menu = menuMap.get(menuItemId);

      if (!menu) {
        return Response.json({ error: "Menu tidak tersedia" }, { status: 400 });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return Response.json({ error: "Jumlah menu tidak valid" }, { status: 400 });
      }

      const subtotal = menu.price * quantity;
      additionalTotal += subtotal;

      statements.push(
        context.env.DB.prepare(
          `INSERT INTO order_items
           (order_id, menu_item_id, menu_item_name, quantity, price_at_time, subtotal, kitchen_status, is_additional)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', 1)`,
        ).bind(orderId, menuItemId, menu.name, quantity, menu.price, subtotal),
      );
    }

    statements.push(
      context.env.DB.prepare(
        `UPDATE orders
         SET total_amount = total_amount + ?, status = 'pending', updated_at = ?
         WHERE id = ?`,
      ).bind(additionalTotal, Math.floor(Date.now() / 1000), orderId),
    );

    await context.env.DB.batch(statements);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Gagal menambah menu" }, { status: 500 });
  }
};
