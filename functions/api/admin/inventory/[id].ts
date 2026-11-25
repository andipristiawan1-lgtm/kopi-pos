async function checkOwner(context: any) {
  const cookie = context.request.headers.get("Cookie");
  const match = cookie?.match(/session_token=([^;]+)/);
  if (!match) return false;
  const session = await context.env.DB.prepare(
    "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
  ).bind(match[1]).first<any>();
  return session?.role === "owner";
}

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (!(await checkOwner(context))) return Response.json({ error: "Akses Ditolak" }, { status: 403 });
  try {
    const body: any = await context.request.json();
    const name = String(body.name || "").trim();
    const unit = String(body.unit || "").trim();
    const stock = Number(body.stock);
    const minimumStock = Number(body.minimumStock);
    if (!name || !unit || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(minimumStock) || minimumStock < 0) {
      return Response.json({ error: "Data barang tidak valid" }, { status: 400 });
    }
    const now = Math.floor(Date.now() / 1000);
    await context.env.DB.prepare(
      "UPDATE inventory_items SET name = ?, unit = ?, stock = ?, minimum_stock = ?, updated_at = ? WHERE id = ?",
    ).bind(name, unit, stock, minimumStock, now, context.params.id).run();
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Gagal memperbarui barang" }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (!(await checkOwner(context))) return Response.json({ error: "Akses Ditolak" }, { status: 403 });
  try {
    await context.env.DB.prepare("DELETE FROM inventory_items WHERE id = ?")
      .bind(context.params.id).run();
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Barang sudah digunakan dan tidak dapat dihapus" }, { status: 400 });
  }
};
