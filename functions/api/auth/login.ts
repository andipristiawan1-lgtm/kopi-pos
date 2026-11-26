import { compare } from "bcryptjs";

// Fungsi untuk memverifikasi password dengan Web Crypto (PBKDF2)
async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (storedHash.startsWith("$2")) {
    return compare(password, storedHash);
  }

  const [salt, originalHash] = storedHash.split(":");
  if (!salt || !originalHash) return false;

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-512",
    },
    keyMaterial,
    512,
  );

  const derivedHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return derivedHex === originalHash;
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const { email, password } = (await context.request.json()) as any;

    if (!email || !password) {
      return Response.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await context.env.DB.prepare(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
    )
      .bind(normalizedEmail)
      .first<any>();

    if (!user) {
      return Response.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return Response.json(
        { error: "Email atau password salah" },
        { status: 401 },
      );
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;

    await context.env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    )
      .bind(sessionId, user.id, expiresAt)
      .run();

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
