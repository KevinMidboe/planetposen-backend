import establishedDatabase from "../database";
import ProductRepository from "../product";
import type { IProduct } from "../interfaces/IProduct";
import type IDeliveryAddress from "../interfaces/IDeliveryAddress";

const productRepository = new ProductRepository();

class Cart {
  planet_id: string;
  database: any;

  constructor(planet_id: string) {
    this.planet_id = planet_id;
    this.database = establishedDatabase;
  }

  async get(): Promise<Array<object>> {
    const query =
      "SELECT * FROM cart_detailed WHERE planet_id = $1 ORDER BY lineitem_id";
    return this.database.all(query, [this.planet_id]);
  }

  async getLineItem(product_sku_no: number) {
    const query = `
      SELECT product_no, quantity
      FROM cart_lineitem
      WHERE product_sku_no = $2
      AND cart_id = (
        SELECT cart_id
        FROM cart
        WHERE planet_id = $1
      )
    `;

    return this.database.get(query, [this.planet_id, product_sku_no]);
  }

  async exists() {
    const query = `
      SELECT cart_id
      FROM cart
      WHERE planet_id = $1
    `;

    const exists = await this.database.get(query, [this.planet_id]);
    return exists !== undefined;
  }

  create() {
    const query = `
      INSERT INTO cart (planet_id) values ($1) ON CONFLICT DO NOTHING
    `;

    return this.database.update(query, [this.planet_id]);
  }

  async add(product_no: number, product_sku_no: number, quantity: number) {
    if ((await this.exists()) === false) {
      await this.create();
    }

    const existingLineItem = await this.getLineItem(product_sku_no);

    let query = `
      INSERT INTO cart_lineitem (cart_id, product_no, product_sku_no, quantity) values (
        (
          SELECT cart_id
          FROM cart
          WHERE planet_id = $1
        ),
        $2,
        $3,
        $4
      )
    `;

    if (existingLineItem) {
      quantity = quantity + existingLineItem.quantity;
      query = `
        UPDATE cart_lineitem
        SET quantity = $4
        WHERE product_no = $2
        AND product_sku_no = $3
        AND cart_id = (
          SELECT cart_id
          FROM cart
          WHERE planet_id = $1
        )
      `;
    }

    return this.database.update(query, [
      this.planet_id,
      product_no,
      product_sku_no,
      quantity,
    ]);
  }

  remove(lineitem_id: number) {
    // TODO should match w/ cart.planet_id
    const query = `
      DELETE FROM cart_lineitem
      WHERE lineitem_id = $1
    `;

    return this.database.update(query, [lineitem_id]);
  }

  decrement(lineitem_id: number) {
    // TODO should match w/ cart.planet_id
    const query = `
      UPDATE cart_lineitem
      SET quantity = quantity - 1
      WHERE lineitem_id = $1
    `;

    return this.database.update(query, [lineitem_id]);
  }

  async increment(lineitem_id: number) {
    const inStockQuery = `
      SELECT product_sku.stock >= cart_lineitem.quantity + 1 as in_stock
      FROM product_sku
      INNER JOIN cart_lineitem
      ON cart_lineitem.product_sku_no = product_sku.sku_id
      WHERE cart_lineitem.lineitem_id = $1;`;
    const inStockResponse = await this.database.get(inStockQuery, [
      lineitem_id,
    ]);
    if (!inStockResponse?.in_stock || inStockResponse?.in_stock === false) {
      throw Error("Unable to add product, no more left in stock");
    }

    // if (!productRepository.hasQuantityOfSkuInStock(lineitem_id)) {
    //   throw new SkuQuantityNotInStockError("");
    // }
    // TODO should match w/ cart.planet_id
    const query = `
      UPDATE cart_lineitem
      SET quantity = quantity + 1
      WHERE lineitem_id = $1
    `;

    return this.database.update(query, [lineitem_id]);
  }

  // addItem(item: IProduct) {
  //   this.products.push(item);
  // }

  removeItem(item: IProduct) {}

  destroy() {
    const query = `DELETE FROM cart WHERE planet_id = $1`;
    this.database.update(query, [this.planet_id]);
  }
}

export default Cart;
