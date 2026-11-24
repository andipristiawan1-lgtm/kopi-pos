-- Tabel Meja
CREATE TABLE IF NOT EXISTS tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'available' NOT NULL, -- 'available', 'occupied', 'booked'
  created_at INTEGER NOT NULL
);

-- Masukkan data awal (Meja 1 s/d 5)
INSERT INTO tables (table_number, status, created_at) VALUES 
('1', 'available', strftime('%s', 'now')),
('2', 'available', strftime('%s', 'now')),
('3', 'available', strftime('%s', 'now')),
('4', 'available', strftime('%s', 'now')),
('5', 'available', strftime('%s', 'now'));