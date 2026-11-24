export const onRequestPatch: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const id = context.params.id;
    const body: any = await context.request.json();
    const newStatus = body.status;
    const now = Math.floor(Date.now() / 1000);

    const order = await context.env.DB.prepare(
      "SELECT * FROM orders WHERE id = ?",
    )
      .bind(id)
      .first<any>();

    await context.env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
    )
      .bind(newStatus, now, id)
      .run();

    // Jika selesai/batal, kosongkan meja
    if (
      (newStatus === "completed" || newStatus === "cancelled") &&
      order.order_type === "dine_in" &&
      order.table_number
    ) {
      await context.env.DB.prepare(
        "UPDATE tables SET status = 'available' WHERE table_number = ?",
      )
        .bind(order.table_number)
        .run();
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
