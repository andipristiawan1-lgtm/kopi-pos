export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const orderNumber = context.params.orderNumber;

    // Ambil data order
    const order = await context.env.DB.prepare(
      "SELECT * FROM orders WHERE order_number = ?",
    )
      .bind(orderNumber)
      .first<any>();

    if (!order) {
      return Response.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 },
      );
    }

    // Ambil item pesanan
    const { results: items } = await context.env.DB.prepare(
      "SELECT menu_item_name as name, quantity, price_at_time, subtotal FROM order_items WHERE order_id = ?",
    )
      .bind(order.id)
      .all();

    return Response.json({
      data: {
        ...order,
        items,
      },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
