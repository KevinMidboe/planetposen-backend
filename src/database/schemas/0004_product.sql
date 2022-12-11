CREATE TABLE IF NOT EXISTS product (
  product_no    serial PRIMARY KEY,
  name          text,
  description   text,
  image         text,
  subtext       text,
  primary_color text,
  created       timestamp DEFAULT CURRENT_TIMESTAMP,
  updated       timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_sku (
  sku_id         serial PRIMARY KEY,
  product_no     integer REFERENCES product,
  price          integer,
  size           text,
  stock          real,
  default_price  boolean DEFAULT FALSE,
  created        timestamp DEFAULT CURRENT_TIMESTAMP,
  updated        timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW product_info AS
  SELECT product.product_no, product_sku.sku_id, name, image, description, subtext, primary_color, price, size, stock, default_price
  FROM product
  INNER JOIN product_sku
  ON product.product_no = product_sku.product_no;

CREATE OR REPLACE VIEW available_products AS
  SELECT *
  FROM product_info
  WHERE stock > 0;
