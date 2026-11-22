-- Password: "owner123" (hash bcrypt)
INSERT INTO users (email, name, role, password_hash, is_active, created_at)
VALUES (
  'owner@warungkopi.id',
  'Owner Warung',
  'owner',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  1,
  strftime('%s', 'now')
);

INSERT INTO menu_items (name, description, price, category, is_available, created_at) VALUES
  ('Kopi Hitam', 'Kopi robusta seduh manual', 10000, 'kopi', 1, strftime('%s', 'now')),
  ('Kopi Susu', 'Espresso + susu kental manis', 15000, 'kopi', 1, strftime('%s', 'now')),
  ('Cappuccino', 'Espresso + steamed milk + foam', 20000, 'kopi', 1, strftime('%s', 'now')),
  ('Matcha Latte', 'Matcha premium + susu', 22000, 'non-kopi', 1, strftime('%s', 'now')),
  ('Roti Bakar', 'Roti bakar coklat keju', 15000, 'makanan', 1, strftime('%s', 'now'));