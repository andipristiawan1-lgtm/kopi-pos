export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM tables ORDER BY table_number ASC",
    ).all();
    return Response.json({ data: results });
  } catch {
    return Response.json({ error: "Gagal memuat data meja" }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const cookie = context.request.headers.get("Cookie");
    const match = cookie?.match(/session_token=([^;]+)/);
    if (!match) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await context.env.DB.prepare(
      "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
    )
      .bind(match[1])
      .first<{ role: string }>();

    if (session?.role !== "owner") {
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });
    }

    const body: any = await context.request.json();
    if (!Number.isInteger(body.id) || body.id < 1) {
      return Response.json({ error: "ID meja tidak valid" }, { status: 400 });
    }

    if (body.booking_price !== undefined) {
      const price = Number(body.booking_price);
      if (!Number.isInteger(price) || price < 0) {
        return Response.json({ error: "Harga DP tidak valid" }, { status: 400 });
      }
      await context.env.DB.prepare(
        "UPDATE tables SET booking_price = ? WHERE id = ?",
      )
        .bind(price, body.id)
        .run();
    }

    if (body.is_bookable !== undefined) {
      if (typeof body.is_bookable !== "boolean") {
        return Response.json({ error: "Status meja tidak valid" }, { status: 400 });
      }
      const bookableValue = body.is_bookable ? 1 : 0;
      await context.env.DB.prepare(
        "UPDATE tables SET is_bookable = ? WHERE id = ?",
      )
        .bind(bookableValue, body.id)
        .run();
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Gagal menyimpan pengaturan meja" }, { status: 500 });
  }
};
