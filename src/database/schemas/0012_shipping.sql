CREATE TABLE IF NOT EXISTS shipment_courier (
  shipment_courier_id serial PRIMARY KEY,
  name                text,
  website             text,
  has_api             boolean,
  created             timestamp DEFAULT CURRENT_TIMESTAMP,
  updated             timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment (
  shipment_id     serial PRIMARY KEY,
  order_id        text REFERENCES orders ON DELETE CASCADE,
  courier_id      int DEFAULT 0,
  tracking_code   text,
  tracking_link   text,
  user_notified   boolean DEFAULT FALSE,
  created         timestamp DEFAULT CURRENT_TIMESTAMP,
  updated         timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_event (
  shipment_event_id   serial PRIMARY KEY,
  shipment_id         serial REFERENCES shipment ON DELETE CASCADE,
  description         text,
  status              text,
  location            text,
  event_time          timestamp,
  api_payload         json,
  created             timestamp DEFAULT CURRENT_TIMESTAMP,
  updated             timestamp DEFAULT CURRENT_TIMESTAMP
);
