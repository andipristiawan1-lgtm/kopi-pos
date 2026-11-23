export const onRequestPatch: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const id = context.params.id;
    const body: any = await context.request.json();
    const newStatus = body.status; // 'preparing', 'completed', atau 'cancelled'

    if (!["preparing", "completed", "cancelled"].includes(newStatus)) {
      return Response.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);

    await context.env.DB.prepare(
      "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
    )
      .bind(newStatus, now, id)
      .run();

    return Response.json({
      success: true,
      message: `Pesanan diubah menjadi ${newStatus}`,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
