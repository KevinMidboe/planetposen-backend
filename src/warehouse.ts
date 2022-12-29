import establishedDatabase from "./database";
import type { IProductWithSkus } from "./interfaces/IProduct";
import ProductRepository from "./product";

const productRepository = new ProductRepository();

// interface IProductSku {
//   id: string
//   size: string
//   stock: number
//   price: number
//   created?: string
//   updated?: string
// }

// interface IProductWithSku extends IProduct {
//   sku: IProductSku
// }

class WarehouseRepository {
  database: any;

  constructor(database = null) {
    this.database = database || establishedDatabase;
  }

  getAllProductIds() {
    return this.database.get("SELECT product_no FROM product");
  }

  async getProduct(productId): Promise<IProductWithSkus> {
    return productRepository.get(productId);
  }

  async getProductAudit(productId) {
    const query = `
      SELECT table_name, row_data, changed_fields
      FROM audit.logged_actions
      WHERE table_name = 'product'
      ORDER BY action_tstamp_stm DESC`;

    // TODO need to filter by product_id

    return this.database.all(query, []);
  }

  all(): Promise<IProductWithSkus[]> {
    const query = `
      SELECT product.*, image.url as image, variation_count, sum_stock
      FROM product
      LEFT JOIN (
        SELECT product_no, count(size) AS variation_count, sum(stock) as sum_stock
        FROM product_sku
        GROUP BY product_no
      ) AS product_sku
      ON product.product_no = product_sku.product_no
      LEFT JOIN image
      ON product.product_no = image.product_no
      WHERE default_image = TRUE
      ORDER BY product.updated DESC`;

    return this.database.all(query);
  }

  getAvailableProducts() {
    const query = `SELECT * from available_products`;
    return this.database.all(query);
  }

  checkSkuStock(skuId) {
    const query = "SELECT stock FROM product_sku WHERE sku_id = $1";

    return this.database.get(query, [skuId]);
  }

  createWarehouseProduct(skuId, stock) {
    const query = `
      INSERT INTO
      warehouse (product_sku_id, stock)
      VALUES ($1, $2)`;

    return this.database.update(query, [skuId, stock]);
  }

  updateWarehouseProductSkuStock(skuId, stock) {
    const query = `
      UPDATE warehouse
      SET stock = $1, updated = to_timestamp($2 / 1000.0)
      WHERE product_sku_id = $3`;

    return this.database.update(query, [stock, new Date(), skuId]);
  }

  updateWarehouseProductSkuStatus(skuId, status) {
    const sqlStatus = status ? "TRUE" : "FALSE";

    const query = `
      UPDATE warehouse
      SET enabled = $1, updated = to_timestamp($2 / 1000.0)
      WHERE product_sku_id = $3`;

    return this.database.query(query, [sqlStatus, new Date(), skuId]);
  }

  disableWarehouseProductSku(skuId) {
    return this.updateWarehouseProductSkuStatus(skuId, false);
  }

  enableWarehouseProductSku(skuId) {
    return this.updateWarehouseProductSkuStatus(skuId, true);
  }
}

export default WarehouseRepository;
