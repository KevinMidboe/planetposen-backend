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
      subtext,
      primary_color,
    ]);

    const productIdQuery = `SELECT currval('product_product_no_seq')`;
    const productCurrVal = await this.database.get(productIdQuery, []);
    return productCurrVal.currval;
  }

  getAllProducts() {
    const query = `
      SELECT product.*, image.url as image, variations
      FROM product
      JOIN (
        SELECT product_no, count(size) AS variations
        FROM product_sku
        WHERE unlisted = FALSE
        GROUP BY product_no
      ) AS product_sku
      ON product.product_no = product_sku.product_no
      LEFT JOIN image
      ON product.product_no = image.product_no
      WHERE default_image = TRUE
      ORDER BY product.updated DESC`;

    return this.database.all(query, []);
  }

  async get(productId) {
    const productQuery = `SELECT * FROM product WHERE product_no = $1`;
    const product = await this.database.get(productQuery, [productId]);

    const skuQuery = `
      SELECT sku_id, size, price, stock, default_price, updated, created
      FROM product_sku
      WHERE product_no = $1 AND unlisted = FALSE
      ORDER BY created`;
    const imageQuery = `
      SELECT image_id, url, default_image
      FROM image
      WHERE product_no = $1
      ORDER BY default_image DESC`;

    const product = await this.database.get(productQuery, [product_no]);
    const productSkus = await this.database.all(skuQuery, [product_no]);
    const images = await this.database.all(imageQuery, [product_no]);

    return Promise.resolve({
      ...product,
      variations: productSkus,
      images,
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

  getSkus(product_no) {
    const q = `SELECT sku_id, product_no, price, size, stock, default_price, created, updated
      FROM product_sku
      WHERE product_no = $1 AND unlisted = FALSE
      ORDER BY created`;

    return this.database.all(q, [product_no]);
  }

  async getSkuStock(sku_id) {
    const query = "SELECT stock FROM product_sku WHERE sku_id = $1";
    const stockResponse = await this.database.get(query, [sku_id]);
    return stockResponse?.stock || null;
  }

  // helper
  async hasQuantityOfSkuInStock(sku_id, quantity) {
    const stock = await this.getSkuStock(sku_id);
    if (!stock) return false;

    // if requested quantity is less or equal to current stock
    return quantity <= stock;
  }

  updateProduct(
    product_no: string,
    name: string,
    description: string,
    subtext: string,
    primary_color: string
  ) {
    const query = `
      UPDATE product
      SET name = $1, description = $2, subtext = $3, primary_color = $4, updated = to_timestamp($5 / 1000.0)
      WHERE product_no = $6`;

    return this.database.update(query, [
      name,
      description,
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

  getDefaultPrice(product_no, sku_id) {
    const query = `
      SELECT *
      FROM product_sku
      WHERE default_price = true and product_no = $1 and sku_id = $2`;

    return this.database.query(query, [product_no, sku_id]);
  }

  deleteSku(product_no, sku_id) {
    const query = `
      UPDATE product_sku
      SET unlisted = TRUE
      WHERE product_no = $1 AND sku_id = $2`;

    return this.database.update(query, [product_no, sku_id]);
  }

  addImage(product_no, url: string) {
    const query = `
      INSERT INTO image (product_no, url)
      VALUES ($1, $2)
      RETURNING image_id`;

    return this.database.get(query, [product_no, url]);
  }

  getImages(product_no) {
    const query = `
      SELECT image_id, url, default_image
      FROM image
      WHERE product_no = $1
      ORDER BY created`;

    return this.database.all(query, [product_no]);
  }

  async setDefaultImage(product_no, image_id) {
    const resetDefaultImageQuery = `
      UPDATE image
      SET default_image = false, updated = to_timestamp($1 / 1000.0)
      WHERE product_no = $2 and default_image = true`;

    const setNewDefaultImageQuery = `
      UPDATE image
      SET default_image = true, updated = to_timestamp($1 / 1000.0)
      WHERE product_no = $2 AND image_id = $3`;

    await this.database.update(resetDefaultImageQuery, [
      new Date().getTime(),
      product_no,
    ]);
    await this.database.update(setNewDefaultImageQuery, [
      new Date().getTime(),
      product_no,
      image_id,
    ]);
  }

  async deleteImage(product_no, image_id) {
    const isDefaultImageQuery = `
      SELECT default_image
      FROM image
      WHERE product_no = $1 AND image_id = $2`;

    const isDefaultImage = await this.database.get(isDefaultImageQuery, [
      product_no,
      image_id,
    ]);
    if (isDefaultImage) {
      const images = await this.getImages(product_no);
      const imagesWithoutAboutToDelete = images.filter(
        (image) => image.image_id !== image_id
      );
      if (imagesWithoutAboutToDelete.length > 0) {
        await this.setDefaultImage(
          product_no,
          imagesWithoutAboutToDelete[0].image_id
        );
      }
    }

    const query = `
      DELETE FROM image
      WHERE product_no = $1 AND image_id = $2`;

    return this.database.update(query, [product_no, image_id]);
  }
}

export default ProductRepository;
