// GET: Ambil semua kategori
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM categories ORDER BY name ASC"
    ).all();
    return Response.json({ data: results });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

// POST: Tambah kategori baru
export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const body: any = await context.request.json();
    const now = Math.floor(Date.now() / 1000);
    
    // Format nama: huruf kecil, spasi jadi strip
    const name = body.name.toLowerCase().trim().replace(/\s+/g, '-');

    await context.env.DB.prepare(
      "INSERT INTO categories (name, created_at) VALUES (?, ?)"
    ).bind(name, now).run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Kategori mungkin sudah ada." }, { status: 500 });
  }
};

// DELETE: Hapus kategori
export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    if (!id) return Response.json({ error: "ID tidak ditemukan" }, { status: 400 });

    // Cek apakah ada menu yang memakai kategori ini
    const category = await context.env.DB.prepare("SELECT name FROM categories WHERE id = ?").bind(id).first<any>();
    if (category) {
      const count = await context.env.DB.prepare("SELECT COUNT(*) as total FROM menu_items WHERE category = ?").bind(category.name).first<any>();
      if (count && count.total > 0) {
        return Response.json({ 
          error: `Kategori ini sedang digunakan oleh ${count.total} menu. Hapus atau ubah menu tersebut terlebih dahulu.` 
        }, { status: 400 });
      }
    }

    await context.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};