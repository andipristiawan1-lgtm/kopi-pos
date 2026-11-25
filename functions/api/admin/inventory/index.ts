async function checkOwner(context: any) {
  const cookie = context.request.headers.get("Cookie");
  if (!cookie) return false;
  const match = cookie.match(/session_token=([^;]+)/);
  if (!match) return false;
  const session = await context.env.DB.prepare(
    "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
  ).bind(match[1]).first<any>();
  return session?.role === "owner";
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (!(await checkOwner(context))) {
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });
  }

  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM inventory_items ORDER BY name ASC",
    ).all();

    return Response.json({ data: results });
  } catch {
    return Response.json({ error: "Gagal memuat daftar barang" }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (!(await checkOwner(context))) {
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });
  }

  try {
    const body: any = await context.request.json();
    const name = String(body.name || "").trim();
    const unit = String(body.unit || "").trim();
    const stock = Number(body.stock);
    const minimumStock = Number(body.minimumStock);

    if (!name || !unit) {
      return Response.json({ error: "Nama dan satuan wajib diisi" }, { status: 400 });
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isFinite(minimumStock) || minimumStock < 0) {
      return Response.json({ error: "Stok dan stok minimum tidak valid" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);
    await context.env.DB.prepare(
      `INSERT INTO inventory_items (name, unit, stock, minimum_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(name, unit, stock, minimumStock, now, now).run();

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Gagal menambah barang" }, { status: 500 });
  }
};
