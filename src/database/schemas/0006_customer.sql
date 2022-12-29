CREATE TABLE IF NOT EXISTS customer (
  customer_no    varchar(36) PRIMARY KEY DEFAULT unique_customer_no(),
  email          text,
  first_name     text,
  last_name      text,
  street_address text,
  zip_code       real,
  city           text,
  created        timestamp DEFAULT CURRENT_TIMESTAMP,
  updated        timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_customerno_genid
BEFORE INSERT ON customer
FOR EACH ROW EXECUTE PROCEDURE unique_customer_no();