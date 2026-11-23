// Fungsi helper untuk mengecek apakah user adalah owner
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

// GET: Ambil semua menu (termasuk yang tidak tersedia)
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  if (!(await checkOwner(context)))
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });

  const { results } = await context.env.DB.prepare(
    "SELECT * FROM menu_items ORDER BY category, name",
  ).all();
  return Response.json({ data: results });
};

// POST: Tambah menu baru
export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  if (!(await checkOwner(context)))
    return Response.json({ error: "Akses Ditolak" }, { status: 403 });

  try {
    const body: any = await context.request.json();
    const now = Math.floor(Date.now() / 1000);

    await context.env.DB.prepare(
      `
      INSERT INTO menu_items (name, description, price, category, is_available, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `,
    )
      .bind(body.name, body.description || "", body.price, body.category, now)
      .run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
