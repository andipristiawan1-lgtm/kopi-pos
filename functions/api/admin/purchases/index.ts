async function checkOwner(context: any) {
  const cookie = context.request.headers.get("Cookie");
  const match = cookie?.match(/session_token=([^;]+)/);
  if (!match) return false;
  const session = await context.env.DB.prepare(
    "SELECT u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
  ).bind(match[1]).first<any>();
  return session?.role === "owner";
}

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (!(await checkOwner(context))) return Response.json({ error: "Akses Ditolak" }, { status: 403 });

  try {
    const { results: purchases } = await context.env.DB.prepare(
      "SELECT * FROM purchases ORDER BY purchase_date DESC, id DESC",
    ).all();

    const data = [];
    for (const purchase of purchases as any[]) {
      const { results: items } = await context.env.DB.prepare(
        "SELECT * FROM purchase_items WHERE purchase_id = ?",
      ).bind(purchase.id).all();
      data.push({ ...purchase, items: items || [] });
    }

    return Response.json({ data });
  } catch {
    return Response.json({ error: "Gagal memuat riwayat pembelian" }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (context) => {
  if (!(await checkOwner(context))) return Response.json({ error: "Akses Ditolak" }, { status: 403 });

  try {
    const body: any = await context.request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) return Response.json({ error: "Minimal satu barang belanja" }, { status: 400 });

    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const itemId = Number(item.itemId);
      const itemName = String(item.itemName || "").trim();
      const unit = String(item.unit || "").trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if ((!Number.isInteger(itemId) || itemId < 1) && !itemName) {
        return Response.json({ error: "Barang belanja tidak valid" }, { status: 400 });
      }
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(unitPrice) || unitPrice < 0) {
        return Response.json({ error: "Jumlah atau harga barang tidak valid" }, { status: 400 });
      }

      let inventoryItem: any = null;
      if (Number.isInteger(itemId) && itemId > 0) {
        inventoryItem = await context.env.DB.prepare(
          "SELECT id, name, unit FROM inventory_items WHERE id = ?",
        ).bind(itemId).first<any>();
        if (!inventoryItem) return Response.json({ error: "Barang tidak ditemukan" }, { status: 400 });
      }

      const finalName = inventoryItem?.name || itemName;
      const finalUnit = inventoryItem?.unit || unit;
      if (!finalUnit) return Response.json({ error: "Satuan barang wajib diisi" }, { status: 400 });

      const subtotal = Math.round(quantity * unitPrice);
      totalAmount += subtotal;
      normalizedItems.push({
        itemId: inventoryItem?.id || null,
        itemName: finalName,
        unit: finalUnit,
        quantity,
        unitPrice,
        subtotal,
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const purchaseDate = Number(body.purchaseDate) || now;
    const dateStr = new Date(purchaseDate * 1000).toISOString().slice(0, 10).replace(/-/g, "");
    const purchaseNumber = `BEL-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

    const insertPurchase = await context.env.DB.prepare(
      `INSERT INTO purchases
       (purchase_number, supplier_name, invoice_number, purchase_date, status, payment_status, notes, total_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'received', ?, ?, ?, ?, ?)`,
    ).bind(
      purchaseNumber,
      String(body.supplierName || "").trim() || null,
      String(body.invoiceNumber || "").trim() || null,
      purchaseDate,
      body.paymentStatus === "paid" ? "paid" : "unpaid",
      String(body.notes || "").trim() || null,
      totalAmount,
      now,
      now,
    ).run();

    if (!insertPurchase.success) throw new Error("Gagal menyimpan pembelian");

    const purchase = await context.env.DB.prepare(
      "SELECT id FROM purchases WHERE purchase_number = ?",
    ).bind(purchaseNumber).first<any>();
    if (!purchase) throw new Error("Pembelian tidak ditemukan");

    const statements = [];
    for (const item of normalizedItems) {
      statements.push(context.env.DB.prepare(
        `INSERT INTO purchase_items
         (purchase_id, item_id, item_name, unit, quantity, unit_price, subtotal, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(purchase.id, item.itemId, item.itemName, item.unit, item.quantity, item.unitPrice, item.subtotal, now));

      if (item.itemId) {
        statements.push(context.env.DB.prepare(
          "UPDATE inventory_items SET stock = stock + ?, updated_at = ? WHERE id = ?",
        ).bind(item.quantity, now, item.itemId));
      }
    }

    await context.env.DB.batch(statements);

    return Response.json({ success: true, purchaseNumber, totalAmount });
  } catch {
    return Response.json({ error: "Gagal menyimpan pembelian" }, { status: 500 });
  }
};
