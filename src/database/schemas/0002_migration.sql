CREATE TABLE IF NOT EXISTS migration (
  migration_id   serial PRIMARY KEY,
  filename       text,
  run_date       timestamp DEFAULT CURRENT_TIMESTAMP
);