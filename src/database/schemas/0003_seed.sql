CREATE TABLE IF NOT EXISTS seed (
  seed_id        serial PRIMARY KEY,
  filename       text,
  run_date       timestamp DEFAULT CURRENT_TIMESTAMP
);