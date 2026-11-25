import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ============================================
// USERS — Owner & Kasir
// ============================================
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["owner", "cashier"] }).notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================
// MENU ITEMS — < 100 item
// ============================================
export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // dalam rupiah
  category: text("category").notNull(), // "kopi", "non-kopi", "makanan"
  isAvailable: integer("is_available", { mode: "boolean" })
    .default(true)
    .notNull(),
  imageUrl: text("image_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================
// ORDERS — Pesanan (online, dine-in, take-away)
// ============================================
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderNumber: text("order_number").notNull().unique(), // KOPI-20241122-001
  orderType: text("order_type", {
    enum: ["dine_in", "take_away", "online", "booking"],
  }).notNull(),
  tableNumber: text("table_number"), // nullable
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  status: text("status", {
    enum: ["pending", "preparing", "ready", "completed", "cancelled"],
  })
    .default("pending")
    .notNull(),
  totalAmount: integer("total_amount").notNull(),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id), // null jika online
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// ============================================
// ORDER ITEMS — Detail pesanan
// ============================================
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  menuItemName: text("menu_item_name").notNull(), // snapshot nama
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(), // snapshot harga
  subtotal: integer("subtotal").notNull(),
  kitchenStatus: text("kitchen_status", {
    enum: ["pending", "preparing", "ready", "served"],
  })
    .default("pending")
    .notNull(),
  isAdditional: integer("is_additional", { mode: "boolean" })
    .default(false)
    .notNull(),
});

//=============no WA dan profile

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

//---
export const tables = sqliteTable("tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableNumber: text("table_number").notNull().unique(),
  status: text("status", { enum: ["available", "occupied", "booked"] })
    .default("available")
    .notNull(),
  bookingPrice: integer("booking_price").default(0).notNull(),
  isBookable: integer("is_bookable", { mode: "boolean" })
    .default(true)
    .notNull(), // <-- TAMBAHKAN
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================
// INVENTORY — Bahan & Stok UMKM
// ============================================
export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull(),
  stock: real("stock").default(0).notNull(),
  minimumStock: real("minimum_stock").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseNumber: text("purchase_number").notNull().unique(),
  supplierName: text("supplier_name"),
  invoiceNumber: text("invoice_number"),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }).notNull(),
  status: text("status").default("received").notNull(),
  paymentStatus: text("payment_status").default("unpaid").notNull(),
  notes: text("notes"),
  totalAmount: integer("total_amount").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const purchaseItems = sqliteTable("purchase_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => inventoryItems.id, { onDelete: "set null" }),
  itemName: text("item_name").notNull(),
  unit: text("unit").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
