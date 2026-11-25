ALTER TABLE order_items ADD COLUMN kitchen_status TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE order_items ADD COLUMN is_additional INTEGER NOT NULL DEFAULT 0;
