export const onRequestPatch: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const id = context.params.id;
    const now = Math.floor(Date.now() / 1000);

    // Update is_paid menjadi 1 (true)
    const result = await context.env.DB.prepare(
      "UPDATE orders SET is_paid = 1, updated_at = ? WHERE id = ?",
    )
      .bind(now, id)
      .run();

    if (result.meta.changes === 0) {
      return Response.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, message: "Pembayaran diterima" });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
