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

    if (!order) {
      return Response.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    if (!["pending", "preparing", "ready", "completed", "cancelled"].includes(newStatus)) {
      return Response.json({ error: "Status pesanan tidak valid" }, { status: 400 });
    }

    // ========================================================
    // VALIDASI BARU: Cegah status 'completed' jika belum bayar
    // ========================================================
    if (newStatus === "completed" && !order.is_paid) {
      return Response.json(
        { error: "Pesanan belum dibayar. Harap terima pembayaran terlebih dahulu." },
        { status: 400 }
      );
    }

    await context.env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
    )
      .bind(newStatus, now, id)
      .run();

    if (newStatus === "preparing") {
      await context.env.DB.prepare(
        "UPDATE order_items SET kitchen_status = 'preparing' WHERE order_id = ? AND kitchen_status = 'pending'",
      ).bind(id).run();
    }

    if (newStatus === "ready") {
      await context.env.DB.prepare(
        "UPDATE order_items SET kitchen_status = 'ready' WHERE order_id = ? AND kitchen_status IN ('pending', 'preparing')",
      ).bind(id).run();
    }

    // Jika selesai/batal, kosongkan meja
    if (
      (newStatus === "completed" || newStatus === "cancelled") &&
      (order.order_type === "dine_in" || order.order_type === "booking") &&
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