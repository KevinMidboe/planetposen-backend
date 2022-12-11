CREATE TABLE IF NOT EXISTS stripe_payments (
  order_id                     varchar(127) PRIMARY KEY,
  created                      timestamp DEFAULT CURRENT_TIMESTAMP,
  updated                      timestamp DEFAULT CURRENT_TIMESTAMP,
  -- transaction_text             text,
  -- merchant_serial_number       text,
  -- payment_payload              json,
  stripe_initiation_response   json,
  stripe_transaction_id        text,
  stripe_status                text DEFAULT 'CREATED',
  -- stripe_failed_payment_status text,
  -- stripe_failed_payment
  -- stripe_confirmation_response json,
  -- stripe_payment_method_type   text DEFAULT NULL,
  amount                       int DEFAULT 0,
  amount_received              int DEFAULT 0,
  amount_captured              int DEFAULT 0,
  amount_refunded              int DEFAULT 0
);
