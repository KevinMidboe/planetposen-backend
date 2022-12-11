import establishedDatabase from "./database";

class ProductRepository {
  database: typeof establishedDatabase;

  constructor(database = establishedDatabase) {
    this.database = database || establishedDatabase;
  }

  async add(
    name = "foo",
    description = "foo",
    image = "/static/no-product.png",
    subtext = "foo",
    primary_color = "foo"
  ) {
    const query = `
  INSERT INTO
  product (name, description, image, subtext, primary_color)
  VALUES ($1, $2, $3, $4, $5)
    `;

    await this.database.update(query, [
      name,
      description,
      image,
      subtext,
      primary_color,
    ]);

    const productIdQuery = `SELECT currval('product_product_no_seq')`;
    const productCurrVal = await this.database.get(productIdQuery, []);
    return productCurrVal.currval;
  }

  getAllProducts() {
    const query = `
  SELECT product.*, variations
  FROM product
  JOIN (
    SELECT product_no, count(size) AS variations
    FROM product_sku
    GROUP BY product_no
  ) AS product_sku
  ON product.product_no = product_sku.product_no`;

    return this.database.all(query, []);
  }

  async get(productId) {
    const productQuery = `SELECT * FROM product WHERE product_no = $1`;
    const product = await this.database.get(productQuery, [productId]);

    const skuQuery = `
SELECT sku_id, size, price, stock, default_price, updated, created
FROM product_sku
WHERE product_no = $1
ORDER BY created`;

    const productSkus = await this.database.all(skuQuery, [productId]);
    return Promise.resolve({
      ...product,
      variations: productSkus,
    });
  }

  async addSku(
    productId,
    price = 10,
    size = "",
    stock = 0,
    defaultPrice = false
  ) {
    const query = `
INSERT INTO
product_sku (product_no, price, size, stock, default_price)
VALUES ($1, $2, $3, $4, $5)
`;

    return this.database.update(query, [
      productId,
      price,
      size,
      stock,
      defaultPrice,
    ]);
  }

  getSkus(productId) {
    const q = `SELECT sku_id, product_no, price, size, stock, default_price, created, updated
    FROM product_sku
    WHERE product_no = $1
    ORDER BY created`;

    return this.database.all(q, [productId]);
  }

  async getSkuStock(skuId) {
    const query = "SELECT stock FROM product_sku WHERE sku_id = $1";
    const stockResponse = await this.database.get(query, [skuId]);
    return stockResponse?.stock || null;
  }

  // helper
  async hasQuantityOfSkuInStock(skuId, quantity) {
    const stock = await this.getSkuStock(skuId);
    if (!stock) return false;

    // if requested quantity is less or equal to current stock
    return quantity <= stock;
  }

  updateProduct(product) {
    const {
      product_no,
      name,
      description,
      image,
      subtext,
      primary_color,
      // new Date
    } = product;
    const query = `
UPDATE product
SET name = $1, description = $2, image = $3, subtext = $4, primary_color = $5, updated = to_timestamp($6 / 1000.0)
WHERE product_no = $7
`;

    return this.database.update(query, [
      name,
      description,
      image,
      subtext,
      primary_color,
      new Date().getTime(),
      product_no,
    ]);
  }

  updateSku(productId, skuId, stock = 0, size = 0, price = 10) {
    const query = `
UPDATE product_sku
SET
  price = $1,
  size = $2,
  stock = $3,
  updated = to_timestamp($4 / 1000.0)
WHERE product_no = $5 and sku_id = $6`;

    console.log("update sql:", query, [
      price,
      size,
      stock,
      new Date().getTime(),
      productId,
      skuId,
    ]);

    return this.database.update(query, [
      price,
      size,
      stock,
      new Date().getTime(),
      productId,
      skuId,
    ]);
  }

  async setSkuDefaultPrice(productId, skuId) {
    const resetOld = `
UPDATE product_sku
SET default_price = false, updated = to_timestamp($1 / 1000.0)
WHERE product_no = $2 and default_price = true`;
    const setNew = `
UPDATE product_sku
SET default_price = true, updated = to_timestamp($1 / 1000.0)
WHERE product_no = $2 AND sku_id = $3
`;

    await this.database.update(resetOld, [new Date().getTime(), productId]);
    await this.database.update(setNew, [
      new Date().getTime(),
      productId,
      skuId,
    ]);
  }

  getDefaultPrice(productId, skuId) {
    const query = `
SELECT *
FROM product_sku
WHERE default_price = true and product_no = $1 and sku_id = $2`;

    return this.database.query(query, [productId, skuId]);
  }

  deleteSku(productId, skuId) {
    const query = `DELETE from product_sku WHERE product_no = $1 AND sku_id = $2`;
    return this.database.update(query, [productId, skuId]);
  }
}

export default ProductRepository;
