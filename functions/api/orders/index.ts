// 1. Insert ke tabel orders
const insertOrder = await context.env.DB.prepare(
  `
      INSERT INTO orders (order_number, order_type, table_number, customer_name, status, total_amount, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
    `,
)
  .bind(
    orderNumber,
    body.orderType,
    body.tableNumber || null,
    body.customerName || "Pelanggan",
    totalAmount,
    now,
    now,
  )
  .run();

if (!insertOrder.success) {
  throw new Error("Gagal insert order");
}

// 2. Dapatkan ID order yang baru saja dibuat
const getOrder = await context.env.DB.prepare(
  "SELECT id FROM orders WHERE order_number = ?",
)
  .bind(orderNumber)
  .first<any>();

if (!getOrder || !getOrder.id) {
  throw new Error("Gagal mengambil ID order");
}

const orderId = getOrder.id;
const itemStatements = [];

// 3. Siapkan query untuk order_items
for (const item of body.items) {
  const dbMenu = menuMap.get(item.menuItemId) as any;
  itemStatements.push(
    context.env.DB.prepare(
      `
          INSERT INTO order_items (order_id, menu_item_id, menu_item_name, quantity, price_at_time, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
    ).bind(
      orderId,
      item.menuItemId,
      dbMenu.name,
      item.quantity,
      dbMenu.price,
      dbMenu.price * item.quantity,
    ),
  );
}

// 4. Eksekusi batch untuk items
if (itemStatements.length > 0) {
  await context.env.DB.batch(itemStatements);
}

return Response.json({
  success: true,
  orderNumber,
  totalAmount,
  message: "Pesanan berhasil dibuat",
});
