export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  try {
    const result = await context.env.DB.prepare(
      "SELECT COUNT(*) as total FROM menu_items",
    ).first<{ total: number }>();

    return Response.json({
      status: "ok",
      menuCount: result?.total ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { status: "error", message: String(error) },
      { status: 500 },
    );
  }
};
