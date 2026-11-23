// GET: Ambil semua pengaturan (Publik, karena frontend butuh nomor WA)
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM settings",
    ).all();
    // Ubah format array menjadi object: { wa_admin: "628...", ... }
    const settingsObj = results.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return Response.json({ data: settingsObj });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};

// POST: Simpan pengaturan (Hanya Owner)
export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    // Cek Owner
    const cookie = context.request.headers.get("Cookie");
    if (!cookie)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    const match = cookie.match(/session_token=([^;]+)/);
    if (!match)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const session = await context.env.DB.prepare(
      "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
    )
      .bind(match[1])
      .first<any>();

    if (session?.role !== "owner")
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });

    // Proses update
    const body: any = await context.request.json();
    const statements = [];

    for (const [key, value] of Object.entries(body)) {
      let finalValue = String(value);

      // JIKA YANG DIUPDATE ADALAH NOMOR WA, LAKUKAN FORMATTING
      if (key === "wa_admin") {
        // 1. Hapus semua karakter selain angka (spasi, strip, dll)
        finalValue = finalValue.replace(/\D/g, "");

        // 2. Jika diawali dengan '0', ubah menjadi '62'
        if (finalValue.startsWith("0")) {
          finalValue = "62" + finalValue.slice(1);
        }
        // 3. Jika belum diawali '62' (misal user ngetik langsung 8xxxx), tambahkan '62'
        else if (!finalValue.startsWith("62")) {
          finalValue = "62" + finalValue;
        }
      }

      statements.push(
        context.env.DB.prepare(
          `
          INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `,
        ).bind(key, finalValue),
      );
    }

    if (statements.length > 0) {
      await context.env.DB.batch(statements);
    }

    return Response.json({ success: true, message: "Pengaturan disimpan" });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
