-- 1. Tambah kolom di tabel orders
ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN unique_code INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN is_paid INTEGER DEFAULT 0 NOT NULL;

-- 2. Tambah pengaturan pembayaran di tabel settings
INSERT OR IGNORE INTO settings (key, value) VALUES 
('bank_name', 'BCA'),
('bank_account', '1234567890'),
('bank_owner', 'Warung Kopi'),
('ewallet_name', 'GoPay'),
('ewallet_number', '08123456789'),
('qris_url', '');