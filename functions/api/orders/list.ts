export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    // 1. Ambil pesanan
    const { results: orders } = await context.env.DB.prepare(
      "SELECT * FROM orders WHERE status IN ('pending', 'preparing') ORDER BY created_at ASC",
    ).all();

    if (!orders || orders.length === 0) {
      return Response.json({ data: [] });
    }

    // 2. Ambil item untuk setiap pesanan
    const formattedOrders = [];
    for (const order of orders) {
      const { results: items } = await context.env.DB.prepare(
        "SELECT menu_item_name as name, quantity FROM order_items WHERE order_id = ?",
      )
        .bind(order.id)
        .all();

      formattedOrders.push({
        ...order,
        items: items || [],
      });
    }

    return Response.json({ data: formattedOrders });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
