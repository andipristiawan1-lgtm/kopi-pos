export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  // (Tambahkan validasi Owner di sini jika perlu)
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM tables ORDER BY table_number ASC",
    ).all();
    return Response.json({ data: results });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const body: any = await context.request.json();
    // Update harga booking (DP)
    await context.env.DB.prepare(
      "UPDATE tables SET booking_price = ? WHERE id = ?",
    )
      .bind(body.booking_price, body.id)
      .run();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
