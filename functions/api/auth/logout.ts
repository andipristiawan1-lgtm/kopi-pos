export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  const cookieHeader = context.request.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/session_token=([^;]+)/);
    if (match) {
      await context.env.DB.prepare("DELETE FROM sessions WHERE id = ?")
        .bind(match[1])
        .run();
    }
  }

  // Hapus cookie
  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": "session_token=; Path=/; HttpOnly; Secure; Max-Age=0",
      },
    },
  );
};
