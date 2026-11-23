import bcrypt from "bcryptjs";

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const { email, password } = (await context.request.json()) as any;

    // 1. Cari user di database
    const user = await context.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
    )
      .bind(email)
      .first<any>();

    if (!user) {
      return Response.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    // 2. Cek password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return Response.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    // 3. Buat session token (UUID acak)
    const sessionId = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 hari

    // 4. Simpan session ke database
    await context.env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    )
      .bind(sessionId, user.id, expiresAt)
      .run();

    // 5. Set Cookie HttpOnly
    const cookie = `session_token=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`;

    return Response.json(
      {
        success: true,
        user: { id: user.id, name: user.name, role: user.role },
      },
      { headers: { "Set-Cookie": cookie } },
    );
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
