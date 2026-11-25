export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
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

    // Update Harga DP jika ada
    if (body.booking_price !== undefined) {
      await context.env.DB.prepare(
        "UPDATE tables SET booking_price = ? WHERE id = ?",
      )
        .bind(body.booking_price, body.id)
        .run();
    }

    // Update Status Bookable (Aktif/Mati) jika ada
    if (body.is_bookable !== undefined) {
      const bookableValue = body.is_bookable ? 1 : 0; // Ubah boolean ke 1/0
      await context.env.DB.prepare(
        "UPDATE tables SET is_bookable = ? WHERE id = ?",
      )
        .bind(bookableValue, body.id)
        .run();
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
