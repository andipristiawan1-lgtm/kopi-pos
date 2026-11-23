import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
    enum: ["dine_in", "take_away", "online"],
  }).notNull(),
  tableNumber: text("table_number"), // nullable
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  status: text("status", {
    enum: ["pending", "preparing", "completed", "cancelled"],
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
});

//=============no WA dan profile

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
