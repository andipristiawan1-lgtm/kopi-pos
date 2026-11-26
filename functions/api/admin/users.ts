export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const session = await requireOwner(context);
    if (session?.role !== "owner") {
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });
    }

    const { results } = await context.env.DB.prepare(
      "SELECT id, email, name, role, is_active FROM users ORDER BY role DESC",
    ).all();
    return Response.json({ data: results });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const session = await requireOwner(context);
    if (session?.role !== "owner") {
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });
    }

    const body: any = await context.request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || password.length < 6) {
      return Response.json(
        { error: "Nama, email, dan password minimal 6 karakter wajib diisi" },
        { status: 400 },
      );
    }

    const now = Math.floor(Date.now() / 1000);

    // Generate hash password (PBKDF2 Web Crypto)
    const salt = crypto.randomUUID().replace(/-/g, "");
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
    const hashHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const passwordHash = `${salt}:${hashHex}`;

    await context.env.DB.prepare(
      "INSERT INTO users (email, name, role, password_hash, is_active, created_at) VALUES (?, ?, 'cashier', ?, 1, ?)",
    )
      .bind(email, name, passwordHash, now)
      .run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const session = await requireOwner(context);
    if (session?.role !== "owner") {
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });
    }

    const body: any = await context.request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ error: "ID akun tidak valid" }, { status: 400 });
    }

    const target = await context.env.DB.prepare(
      "SELECT role FROM users WHERE id = ?",
    ).bind(id).first<{ role: string }>();

    if (!target || target.role === "owner") {
      return Response.json({ error: "Akun tidak dapat diubah" }, { status: 400 });
    }

    if (body.isActive !== undefined) {
      const isActive = body.isActive ? 1 : 0;
      await context.env.DB.prepare(
        "UPDATE users SET is_active = ? WHERE id = ?",
      ).bind(isActive, id).run();

      if (isActive === 0) {
        await context.env.DB.prepare(
          "DELETE FROM sessions WHERE user_id = ?",
        ).bind(id).run();
      }

      return Response.json({ success: true });
    }

    if (body.password !== undefined) {
      const password = String(body.password);
      if (password.length < 6) {
        return Response.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
      }

      const salt = crypto.randomUUID().replace(/-/g, "");
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"],
      );
      const derivedBits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-512" },
        keyMaterial,
        512,
      );
      const hashHex = Array.from(new Uint8Array(derivedBits))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");

      await context.env.DB.prepare(
        "UPDATE users SET password_hash = ? WHERE id = ?",
      ).bind(`${salt}:${hashHex}`, id).run();

      await context.env.DB.prepare(
        "DELETE FROM sessions WHERE user_id = ?",
      ).bind(id).run();

      return Response.json({ success: true });
    }

    return Response.json({ error: "Aksi akun tidak dikenali" }, { status: 400 });
  } catch {
    return Response.json({ error: "Gagal memperbarui akun kasir" }, { status: 500 });
  }
};

async function requireOwner(context: any) {
  const cookie = context.request.headers.get("Cookie");
  const match = cookie?.match(/session_token=([^;]+)/);
  if (!match) return null;

  return context.env.DB.prepare(
    `SELECT u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > ? AND u.is_active = 1`,
  )
    .bind(match[1], Math.floor(Date.now() / 1000))
    .first<any>();
}
