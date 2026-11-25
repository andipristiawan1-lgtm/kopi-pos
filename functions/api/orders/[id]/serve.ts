export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const id = context.params.id;
    const body: any = await context.request.json().catch(() => ({}));
    const now = Math.floor(Date.now() / 1000);
    const itemIds = Array.isArray(body.itemIds)
      ? body.itemIds.map((itemId: unknown) => Number(itemId)).filter(Number.isInteger)
      : null;

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

    if (itemIds) {
      if (itemIds.length === 0) {
        return Response.json({ error: "Pilih minimal satu item yang siap" }, { status: 400 });
      }

      const placeholders = itemIds.map(() => "?").join(",");
      await context.env.DB.prepare(
        `UPDATE order_items SET kitchen_status = 'served', served_at = ?
         WHERE order_id = ? AND kitchen_status = 'ready' AND id IN (${placeholders})`,
      )
        .bind(now, id, ...itemIds)
        .run();
    } else {
      await context.env.DB.prepare(
        "UPDATE order_items SET kitchen_status = 'served', served_at = ? WHERE order_id = ? AND kitchen_status = 'ready'",
      )
        .bind(now, id)
        .run();
    }

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
