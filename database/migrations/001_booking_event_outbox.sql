-- Apply once to an existing smart_service_db.
USE smart_service_db;

CREATE TABLE IF NOT EXISTS outbox_events (
  id CHAR(36) PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id INT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  publish_attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  INDEX idx_outbox_pending (published_at, created_at)
);

CREATE TABLE IF NOT EXISTS event_inbox (
  event_id CHAR(36) PRIMARY KEY,
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
