CREATE TABLE IF NOT EXISTS cart (
  cart_id           serial PRIMARY KEY,
  planet_id         text,
  created           timestamp DEFAULT CURRENT_TIMESTAMP,
  updated           timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cart_lineitem (
  lineitem_id       serial PRIMARY KEY,
  cart_id           integer REFERENCES cart ON DELETE CASCADE,
  product_no        integer REFERENCES product ON DELETE CASCADE,
  product_sku_no    integer REFERENCES product_sku ON DELETE CASCADE,
  quantity          real
);

CREATE OR REPLACE VIEW cart_detailed AS
  SELECT cart.planet_id, cart.cart_id,
  cart_lineitem.lineitem_id, cart_lineitem.quantity,
  product_sku.sku_id, product_sku.size, product_sku.price,
  -- product.product_no, product.name, product.description, product.subtext, product.image, product.primary_color
  product.product_no, product.name, product.description, product.subtext, product.primary_color, image.url as image
  FROM cart
  INNER JOIN cart_lineitem
  ON cart.cart_id = cart_lineitem.cart_id
  INNER JOIN product_sku
  ON cart_lineitem.product_sku_no = product_sku.sku_id
  INNER JOIN product
  ON product.product_no = cart_lineitem.product_no
  LEFT JOIN image
  ON product.product_no = image.product_no
  WHERE image.default_image = TRUE;

