-- 1. Tambah pengaturan global untuk booking
INSERT OR IGNORE INTO settings (key, value) VALUES 
('is_booking_enabled', '1'),           -- 1 = Nyala, 0 = Mati
('booking_time_limit', '60'),          -- Batas waktu booking dalam menit
('booking_warning_minutes', '15');     -- Peringatan sebelum waktu habis

-- 2. Tambah kolom is_bookable di tabel tables (default 1 = bisa dibooking)
ALTER TABLE tables ADD COLUMN is_bookable INTEGER DEFAULT 1 NOT NULL;