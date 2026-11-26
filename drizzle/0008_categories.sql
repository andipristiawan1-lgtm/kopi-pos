CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);

-- Masukkan kategori default yang sudah ada
INSERT OR IGNORE INTO categories (name, created_at) VALUES 
('kopi', strftime('%s', 'now')),
('non-kopi', strftime('%s', 'now')),
('makanan', strftime('%s', 'now'));