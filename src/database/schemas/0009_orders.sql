CREATE TABLE IF NOT EXISTS orders (
  order_id        varchar(36) PRIMARY KEY DEFAULT unique_order_id(),
  customer_no     varchar(36) REFERENCES customer ON DELETE SET NULL,
  status          text DEFAULT 'INITIATED',
  created         timestamp DEFAULT CURRENT_TIMESTAMP,
  updated         timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders_lineitem (
  orders_lineitem_id     serial PRIMARY KEY,
  order_id               varchar(36) REFERENCES orders,
  product_no             integer REFERENCES product ON DELETE SET NULL,
  product_sku_no         integer REFERENCES product_sku ON DELETE SET NULL,
  price                  integer,
  quantity               real,
  created                timestamp DEFAULT CURRENT_TIMESTAMP,
  updated                timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_orderid_genid
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE PROCEDURE unique_order_id();

CREATE OR REPLACE VIEW orders_detailed AS
  SELECT
    orders.order_id as order_id, orders.status as order_status, orders.created as order_created, orders.updated as order_updated,
    customer.customer_no, customer.email, customer.first_name, customer.last_name, customer.street_address, customer.zip_code, customer.city,
    shipping.shipping_id, shipping.shipping_company, shipping.tracking_code, shipping.tracking_link, shipping.user_notified, shipping.created as shipping_created, shipping.updated as shipping_updated
  FROM orders
  INNER JOIN customer
  ON orders.customer_no = customer.customer_no
  JOIN shipping
  ON orders.order_id = shipping.order_id;