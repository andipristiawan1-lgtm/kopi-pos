export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
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
    const body: any = await context.request.json();
    const now = Math.floor(Date.now() / 1000);

    // Generate hash password (PBKDF2 Web Crypto)
    const salt = crypto.randomUUID().replace(/-/g, "");
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(body.password);
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
      .bind(body.email, body.name, passwordHash, now)
      .run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");
    if (!id)
      return Response.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await context.env.DB.prepare(
      "DELETE FROM users WHERE id = ? AND role != 'owner'",
    )
      .bind(id)
      .run();
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
