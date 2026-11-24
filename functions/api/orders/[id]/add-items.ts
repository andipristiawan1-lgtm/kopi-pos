export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const orderId = context.params.id;
    const body: any = await context.request.json();

    if (!body.items || body.items.length === 0)
      return Response.json({ error: "Tidak ada item" }, { status: 400 });

    let additionalTotal = 0;
    const menuIds = body.items.map((i: any) => i.menuItemId);
    const placeholders = menuIds.map(() => "?").join(",");
    const { results: dbMenus } = await context.env.DB.prepare(
      `SELECT id, price, name FROM menu_items WHERE id IN (${placeholders})`,
    )
      .bind(...menuIds)
      .all();
    const menuMap = new Map(dbMenus.map((m: any) => [m.id, m]));

    const itemStatements = [];
    for (const item of body.items) {
      const dbMenu: any = menuMap.get(item.menuItemId);
      if (!dbMenu) throw new Error(`Menu ID tidak ditemukan`);
      const subtotal = dbMenu.price * item.quantity;
      additionalTotal += subtotal;
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
          subtotal,
        ),
      );
    }

    if (itemStatements.length > 0) await context.env.DB.batch(itemStatements);

    const now = Math.floor(Date.now() / 1000);
    await context.env.DB.prepare(
      `
      UPDATE orders SET total_amount = total_amount + ?, updated_at = ? WHERE id = ?
    `,
    )
      .bind(additionalTotal, now, orderId)
      .run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
