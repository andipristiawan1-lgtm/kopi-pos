export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    // Ambil semua menu yang tersedia, urutkan berdasarkan kategori
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name",
    ).all();

    // Format data agar lebih rapi saat dikonsumsi frontend
    const formattedMenu = results.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.image_url,
    }));

    return Response.json({ data: formattedMenu });
  } catch (error) {
    return Response.json(
      { error: "Gagal mengambil data menu", details: String(error) },
      { status: 500 },
    );
  }
};
