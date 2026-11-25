export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const id = context.params.id;
    const now = Math.floor(Date.now() / 1000);

    const order = await context.env.DB.prepare(
      "SELECT id, order_type, table_number, status FROM orders WHERE id = ?",
    )
      .bind(id)
      .first<{ id: number; order_type: string; table_number: string | null; status: string }>();

    if (!order) {
      return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return Response.json({ error: "Pesanan sudah selesai atau dibatalkan" }, { status: 409 });
    }

    await context.env.DB.prepare(
      "UPDATE order_items SET kitchen_status = 'served' WHERE order_id = ? AND kitchen_status = 'ready'",
    )
      .bind(id)
      .run();

    const remaining = await context.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM order_items WHERE order_id = ? AND kitchen_status != 'served'",
    )
      .bind(id)
      .first<{ total: number }>();

    const servedCount = await context.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM order_items WHERE order_id = ? AND kitchen_status = 'served'",
    )
      .bind(id)
      .first<{ total: number }>();

    if ((remaining?.total || 0) === 0) {
      await context.env.DB.prepare(
        "UPDATE orders SET status = 'completed', updated_at = ? WHERE id = ?",
      )
        .bind(now, id)
        .run();

      if (
        (order.order_type === "dine_in" || order.order_type === "booking") &&
        order.table_number
      ) {
        await context.env.DB.prepare(
          "UPDATE tables SET status = 'available' WHERE table_number = ?",
        )
          .bind(order.table_number)
          .run();
      }

      return Response.json({
        success: true,
        status: "completed",
        servedCount: servedCount?.total || 0,
      });
    }

    return Response.json({
      success: true,
      status: "partial",
      servedCount: servedCount?.total || 0,
      remainingCount: remaining?.total || 0,
    });
  } catch {
    return Response.json({ error: "Gagal menandai pesanan tersaji" }, { status: 500 });
  }
};
