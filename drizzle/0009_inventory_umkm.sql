CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock REAL NOT NULL DEFAULT 0,
  minimum_stock REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_name_unique ON inventory_items(name);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT,
  invoice_number TEXT,
  purchase_date INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  item_id INTEGER,
  item_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL
);
