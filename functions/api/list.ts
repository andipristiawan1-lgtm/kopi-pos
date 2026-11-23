export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    // Ambil semua pesanan aktif (pending & preparing)
    const { results } = await context.env.DB.prepare(
      `
        SELECT o.*, 
          (SELECT json_group_array(json_object(
            'name', oi.menu_item_name, 
            'quantity', oi.quantity
          )) FROM order_items oi WHERE oi.order_id = o.id) as items
        FROM orders o 
        WHERE o.status IN ('pending', 'preparing') 
        ORDER BY o.created_at ASC
      `,
    ).all();

    // Format JSON string dari SQLite menjadi object
    const formattedOrders = results.map((order: any) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
    }));

    return Response.json({ data: formattedOrders });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
