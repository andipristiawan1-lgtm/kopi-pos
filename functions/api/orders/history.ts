export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (
  context,
) => {
  try {
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const startDate = url.searchParams.get("startDate") || "";
    const endDate = url.searchParams.get("endDate") || "";

    const offset = (page - 1) * limit;

    // Bangun Query Dinamis
    let whereClause = "WHERE 1=1";
    const bindings: any[] = [];

    if (search) {
      whereClause += " AND (order_number LIKE ? OR customer_name LIKE ?)";
      bindings.push(`%${search}%`, `%${search}%`);
    }

    if (status !== "all") {
      whereClause += " AND status = ?";
      bindings.push(status);
    }

    if (startDate && endDate) {
      // Asumsi input date dari frontend formatnya YYYY-MM-DD
      whereClause += " AND date(created_at, 'unixepoch') BETWEEN ? AND ?";
      bindings.push(startDate, endDate);
    }

    // 1. Hitung Total Data (untuk Pagination)
    const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
    const countResult = await context.env.DB.prepare(countQuery)
      .bind(...bindings)
      .first<any>();
    const totalItems = countResult?.total || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Ambil Data (dengan join items)
    const dataQuery = `
      SELECT o.*, 
        (SELECT json_group_array(json_object(
          'name', oi.menu_item_name, 
          'quantity', oi.quantity
        )) FROM order_items oi WHERE oi.order_id = o.id) as items
      FROM orders o 
      ${whereClause} 
      ORDER BY o.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    // Tambahkan limit dan offset ke bindings
    const dataBindings = [...bindings, limit, offset];
    const { results: orders } = await context.env.DB.prepare(dataQuery)
      .bind(...dataBindings)
      .all();

    // Format JSON items
    const formattedOrders = orders.map((order: any) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
    }));

    return Response.json({
      data: formattedOrders,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
};
