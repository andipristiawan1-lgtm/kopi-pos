export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('is_booking_enabled', 'booking_time_limit', 'booking_warning_minutes')",
    ).all();

    const settings = results.reduce((acc: any, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return Response.json({
      isEnabled: settings.is_booking_enabled === "1",
      timeLimit: parseInt(settings.booking_time_limit || "60"),
      warningMinutes: parseInt(settings.booking_warning_minutes || "15"),
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
