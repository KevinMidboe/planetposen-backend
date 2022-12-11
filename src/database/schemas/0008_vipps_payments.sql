CREATE TABLE IF NOT EXISTS vipps_payments (
  order_id                    varchar(127) PRIMARY KEY,
  parent_order_id             varchar(127),
  created                     timestamp DEFAULT CURRENT_TIMESTAMP,
  updated                     timestamp DEFAULT CURRENT_TIMESTAMP,
  transaction_text            text,
  merchant_serial_number      text,
  payment_payload             json,
  vipps_initiation_response   json,
  vipps_transaction_id        text,
  vipps_status                text DEFAULT 'NOT_STARTED',
  vipps_confirmation_response json,
  end_time                    timestamp,
  hours                       float DEFAULT 0,
  amount                      int DEFAULT 0,
  captured                    int DEFAULT 0,
  refunded                    int DEFAULT 0
);
