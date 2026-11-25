async function checkOwner(context: any) {
  const cookie = context.request.headers.get("Cookie");
  if (!cookie) return false;
  const match = cookie.match(/session_token=([^;]+)/);
  if (!match) return false;
  const session = await context.env.DB.prepare(
    "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
  )
    .bind(match[1])
    .first<any>();
  return session?.role === "owner";
}

// PUT: Update menu
export const onRequestPut: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  if (!(await checkOwner(context)))
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });

  try {
    const id = context.params.id;
    const body: any = await context.request.json();

    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const category = String(body.category || "").trim();
    const description = String(body.description || "").trim();
    const imageUrl = String(body.image_url || "").trim();

    if (!name || !category || !Number.isInteger(price) || price < 0) {
      return Response.json({ error: "Data menu tidak valid" }, { status: 400 });
    }

    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      return Response.json(
        { error: "URL gambar harus diawali http atau https" },
        { status: 400 },
      );
    }

    await context.env.DB.prepare(
      `
      UPDATE menu_items
      SET name = ?, description = ?, price = ?, category = ?, is_available = ?, image_url = ?
      WHERE id = ?
    `,
    )
      .bind(
        name,
        description,
        price,
        category,
        body.is_available ? 1 : 0,
        imageUrl || null,
        id,
      )
      .run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

// DELETE: Hapus menu
export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  if (!(await checkOwner(context)))
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });

  try {
    const id = context.params.id;
    await context.env.DB.prepare("DELETE FROM menu_items WHERE id = ?")
      .bind(id)
      .run();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Gagal menghapus (mungkin menu sudah dipakai di pesanan)" },
      { status: 500 },
    );
  }
};
