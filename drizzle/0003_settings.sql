CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Masukkan nomor WA default (bisa diubah nanti lewat UI)
INSERT INTO settings (key, value) VALUES ('wa_admin', '6281234567890');