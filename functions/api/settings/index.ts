// GET: Ambil semua pengaturan (Publik, karena frontend butuh nomor WA)
export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM settings",
    ).all();
    const settingsObj = results.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return Response.json({ data: settingsObj });
  } catch {
    return Response.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
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
      .first<{ role: string }>();

    if (session?.role !== "owner")
      return Response.json({ error: "Akses Ditolak" }, { status: 403 });

    const body: any = await context.request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "Format pengaturan tidak valid" }, { status: 400 });
    }

    const statements = [];

    for (const [key, rawValue] of Object.entries(body)) {
      let finalValue = String(rawValue);

      if (key === "is_booking_enabled") {
        if (finalValue !== "0" && finalValue !== "1") {
          return Response.json({ error: "Status booking tidak valid" }, { status: 400 });
        }
      } else if (key === "booking_time_limit") {
        const number = Number(finalValue);
        if (!Number.isInteger(number) || number < 1 || number > 1440) {
          return Response.json({ error: "Batas waktu harus 1–1440 menit" }, { status: 400 });
        }
        finalValue = String(number);
      } else if (key === "booking_warning_minutes") {
        const number = Number(finalValue);
        if (!Number.isInteger(number) || number < 0) {
          return Response.json({ error: "Waktu peringatan tidak valid" }, { status: 400 });
        }
        finalValue = String(number);
      } else if (key === "wa_admin") {
        finalValue = finalValue.replace(/\D/g, "");
        if (finalValue.startsWith("0")) finalValue = "62" + finalValue.slice(1);
        else if (finalValue && !finalValue.startsWith("62")) finalValue = "62" + finalValue;
      }

      statements.push(
        context.env.DB.prepare(
          `INSERT INTO settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        ).bind(key, finalValue),
      );
    }

    if (
      body.booking_time_limit !== undefined &&
      body.booking_warning_minutes !== undefined
    ) {
      const limit = Number(body.booking_time_limit);
      const warning = Number(body.booking_warning_minutes);
      if (warning >= limit) {
        return Response.json(
          { error: "Waktu peringatan harus lebih kecil dari batas waktu booking" },
          { status: 400 },
        );
      }
    }

    if (statements.length > 0) await context.env.DB.batch(statements);

    return Response.json({ success: true, message: "Pengaturan disimpan" });
  } catch {
    return Response.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
};
