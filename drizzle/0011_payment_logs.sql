CREATE TABLE IF NOT EXISTS payment_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dedup_key TEXT NOT NULL UNIQUE,
  source_app TEXT,
  app_name TEXT,
  notification_title TEXT,
  raw_message TEXT NOT NULL,
  extracted_amount INTEGER,
  notification_time INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  matched_order_id INTEGER,
  received_at INTEGER NOT NULL,
  processed_at INTEGER,
  FOREIGN KEY (matched_order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_amount ON payment_logs(extracted_amount);
CREATE INDEX IF NOT EXISTS idx_payment_logs_received ON payment_logs(received_at);

INSERT OR IGNORE INTO settings (key, value)
VALUES ('payment_webhook_secret', 'S3mu4M3n94ku1QMT4mV4n');
