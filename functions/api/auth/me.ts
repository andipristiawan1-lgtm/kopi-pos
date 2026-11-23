export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  const cookieHeader = context.request.headers.get("Cookie");
  if (!cookieHeader)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Ambil session_token dari cookie
  const match = cookieHeader.match(/session_token=([^;]+)/);
  if (!match) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const token = match[1];

  const now = Math.floor(Date.now() / 1000);

  // Cari session di DB dan join dengan tabel users
  const session = await context.env.DB.prepare(
    `
      SELECT u.id, u.name, u.role 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.id = ? AND s.expires_at > ?
    `,
  )
    .bind(token, now)
    .first<any>();

  if (!session) {
    return Response.json({ error: "Session expired" }, { status: 401 });
  }

  return Response.json({ user: session });
};
