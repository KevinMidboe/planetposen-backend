CREATE TABLE IF NOT EXISTS product (
  product_no    serial PRIMARY KEY,
  name          text,
  description   text,
  subtext       text,
  primary_color text,
  created       timestamp DEFAULT CURRENT_TIMESTAMP,
  updated       timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS image (
  image_id        serial PRIMARY KEY,
  product_no      integer REFERENCES product,
  url             text,
  default_image   boolean DEFAULT FALSE,
  created         timestamp DEFAULT CURRENT_TIMESTAMP,
  updated         timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_sku (
  sku_id         serial PRIMARY KEY,
  product_no     integer REFERENCES product,
  price          integer,
  size           text,
  stock          real,
  default_price  boolean DEFAULT FALSE,
  unlisted       boolean DEFAULT FALSE,
  created        timestamp DEFAULT CURRENT_TIMESTAMP,
  updated        timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW product_info AS
  SELECT product.product_no, product_sku.sku_id, name, image.url as image, description, subtext, primary_color, price, size, stock, default_price
  FROM product
  INNER JOIN product_sku
  ON product.product_no = product_sku.product_no
  LEFT JOIN image
  ON product.product_no = image.product_no
  WHERE default_image = TRUE AND product_sku.unlisted != FALSE;

CREATE OR REPLACE VIEW available_products AS
  SELECT *
  FROM product_info
  WHERE stock > 0;
