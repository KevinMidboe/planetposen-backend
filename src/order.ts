import logger from "./logger";
import establishedDatabase from "./database";
import ShippingRepository from "./shipping";
import { ORDER_STATUS_CODES } from "./enums/order";
import type { IOrder } from "./interfaces/IOrder";
import type { IProduct } from "./interfaces/IProduct";

const shippingRepository = new ShippingRepository();

class MissingOrderError extends Error {
  statusCode: number;

  constructor() {
    const message = "Requested order not found.";
    super(message);

    this.name = "MissingOrderError";
    this.statusCode = 404;
  }
}

class PaymentType {
  database: typeof establishedDatabase;

  constructor(database) {
    this.database = database || establishedDatabase;
  }

  getId(name) {
    const query = `SELECT payment_id FROM payment_types WHERE name = $1`;
    return this.database.get(query, [name]).then((resp) => resp["payment_id"]);
  }
}

class OrderRepository {
  database: typeof establishedDatabase;

  constructor(database = establishedDatabase) {
    this.database = database || establishedDatabase;
  }

  async newOrder(customer_no: string) {
    const query = `
      INSERT INTO orders (order_id, customer_no) VALUES (NULL, $1)
      RETURNING order_id`;

    logger.info("Creating order with customer", { customer_no });
    return await this.database.get(query, [customer_no]);
  }

  addOrderLineItem(
    order_id,
    product_no: number,
    sku_id: number,
    price: number,
    quantity: number
  ) {
    const query = `
      INSERT INTO orders_lineitem (order_id, product_no, product_sku_no, price, quantity)
      VALUES ($1, $2, $3, $4, $5)`;

    logger.info("Adding lineitem to order", {
      order_id,
      product_no,
      sku_id,
      price,
      quantity,
    });
    return this.database.get(query, [
      order_id,
      product_no,
      sku_id,
      price,
      quantity,
    ]);
  }

  getExistingOrdersOnProduct(product) {
    const query = `
      SELECT order_id, product_no, end_time, start_time
      FROM orders
      WHERE product_no = $1
      AND NOT status = ''
      AND end_time > now()`;

    return this.database.all(query, [product.product_no]);
  }

  getConflictingProductOrders(order) {
    const query = `
      SELECT order_id, product_no, end_time, start_time, status, created, updated
      FROM orders
      WHERE product_no = $1
      AND NOT status = ''
      AND NOT order_id = $2 
      AND NOT status = $3
      AND NOT status = $4
      AND NOT status = $5`;

    return {
      order,
      conflicting: this.database.all(query, [
        order.product_no,
        order.order_id,
        ORDER_STATUS_CODES.INITIATED,
        ORDER_STATUS_CODES.COMPLETED,
        ORDER_STATUS_CODES.CANCELLED,
      ]),
    };
  }

  getAll() {
    const query = `
      SELECT orders.created, orders.order_id, customer.first_name, customer.last_name, customer.email, status, orders_lines.order_sum
      FROM orders
      INNER JOIN customer
      ON customer.customer_no = orders.customer_no
      LEFT JOIN (
        SELECT order_id, SUM(quantity * orders_lineitem.price) as order_sum
        FROM orders_lineitem
        INNER JOIN product_sku
        ON orders_lineitem.product_sku_no = product_sku.sku_id
        GROUP BY order_id
      ) AS orders_lines
      ON orders.order_id = orders_lines.order_id
      ORDER BY orders.updated DESC;`;

    return this.database.all(query, []);
  }

  async getOrderDetailed(orderId) {
    const customerQuery = `
      SELECT customer.*
      FROM orders
      INNER JOIN (
        SELECT customer_no, email, first_name, last_name,  street_address, zip_code, city
        FROM customer
      ) AS customer
      ON orders.customer_no = customer.customer_no
      WHERE order_id = $1`;

    const paymentQuery = `
      SELECT 'stripe' as type, stripe_transaction_id, created, updated, stripe_status, amount, amount_received, amount_captured, amount_refunded
      FROM stripe_payments
      WHERE order_id = $1`;

    const orderQuery = `
      SELECT order_id as orderId, created, updated, status
      FROM orders
      WHERE order_id = $1`;

    const lineItemsQuery = `
      SELECT product.name, orders_lineitem.quantity, image.url as image, orders_lineitem.price, product_sku.sku_id, product_sku.size
      FROM orders_lineitem
      INNER JOIN product
      ON orders_lineitem.product_no = product.product_no
      INNER JOIN product_sku
      ON orders_lineitem.product_sku_no = product_sku.sku_id
      LEFT JOIN image
      ON product.product_no = image.product_no
      WHERE orders_lineitem.order_id = $1 AND image.default_image = TRUE`;

    const [order, customer, shipping, lineItems, payment] = await Promise.all([
      this.database.get(orderQuery, [orderId]),
      this.database.get(customerQuery, [orderId]),
      shippingRepository.getByOrderId(orderId),
      this.database.all(lineItemsQuery, [orderId]),
      this.database.get(paymentQuery, [orderId]),
    ]);

    return {
      ...order,
      customer,
      shipping,
      payment,
      lineItems,
    };
  }

  async getOrder(orderId): Promise<IOrder> {
    const orderQuery = `
      SELECT order_id, customer_no, created, updated, status
      FROM orders
      WHERE order_id = $1`;

    const lineItemsQuery = `
      SELECT product.name, image.url as image, orders_lineitem.quantity, product_sku.sku_id, product_sku.price, product_sku.size
      FROM orders_lineitem
      INNER JOIN product
      ON orders_lineitem.product_no = product.product_no
      INNER JOIN product_sku
      ON orders_lineitem.product_sku_no = product_sku.sku_id
      LEFT JOIN image
      ON product.product_no = image.product_no
      WHERE orders_lineitem.order_id = $1 AND image.default_image = TRUE`;

    const [order, lineItems] = await Promise.all([
      this.database.get(orderQuery, [orderId]),
      this.database.all(lineItemsQuery, [orderId]),
    ]);

    return {
      ...order,
      lineItems,
    };

    // return this.database.get(query, [orderId]).then((row) => {
    //   if (row) {
    //     return row;
    //   }

    //   throw new MissingOrderError();
    // });
  }

  getOrderWithProduct(orderId) {
    const query = `
      SELECT order_id, product.price, product.product_no, product.name
      FROM orders
      INNER JOIN products as product
      ON (orders.product_no = product.product_no)
      WHERE orders.order_id = $1
    `;

    return this.database.get(query, [orderId]);
  }

  rejectOrder(orderId) {
    const timestamp = new Date();
    const query = `
      UPDATE orders
      SET status = $1, updated = $2
      WHERE order_id = $3
    `;

    return this.database.update(query, [
      ORDER_STATUS_CODES.REJECTED,
      timestamp,
      orderId,
    ]);
  }

  refundOrder(orderId: string) {
    const timestamp = new Date();
    const query = `
      UPDATE orders
      SET status = $1, updated = $2
      WHERE order_id = $3
    `;

    return this.database.update(query, [
      ORDER_STATUS_CODES.REFUNDED,
      timestamp,
      orderId,
    ]);
  }

  rejectByVippsTimeout(orderId) {
    const timestamp = new Date();
    const query = `
      UPDATE orders
      SET status = $1, end_time = $2, updated = $3
      WHERE order_id = $4
    `;

    return this.database.update(query, [
      ORDER_STATUS_CODES.TIMED_OUT_REJECT,
      timestamp,
      timestamp,
      orderId,
    ]);
  }

  getExtendedOrders(orderId) {
    const query = `
      SELECT status, orders.end_time, start_time, vp.vipps_status, vp.amount, vp.hours, vp.captured, vp.refunded, vp.parent_order_id, vp.order_id
      FROM orders
      INNER JOIN vipps_payments as vp 
      ON (orders.order_id = vp.order_id OR orders.order_id = vp.parent_order_id)
      WHERE (vp.order_id = $1 or vp.parent_order_id = $2)
    `;

    return this.database.all(query, [orderId, orderId]);
  }

  getOrderStatus(orderId: string) {
    const query = `SELECT status
      FROM orders
      WHERE orders.order_id = $1`;

    return this.database.get(query, [orderId]).then((row) => {
      if (row) return row;

      return null;
    });
  }

  cancelOrder(orderId: string) {
    const timestamp = new Date();
    const query = `UPDATE orders
      SET status = $1, updated = $2
      WHERE order_id = $3`;

    return this.database.update(query, [
      ORDER_STATUS_CODES.CANCELLED,
      timestamp,
      orderId,
    ]);
  }

  async confirmOrder(orderId: string) {
    const order = await this.getOrder(orderId);

    const orderSkuQuantity = order.lineItems.map((lineItem) => {
      return {
        sku_id: lineItem.sku_id,
        quantity: lineItem.quantity,
      };
    });

    await Promise.all(
      orderSkuQuantity.map((el) =>
        this.reduceSkuInStock(el.sku_id, el.quantity)
      )
    );

    const timestamp = new Date();
    const query = `
      UPDATE orders
      SET status = $1, updated = $2
      WHERE order_id = $3`;

    return this.database.update(query, [
      ORDER_STATUS_CODES.CONFIRMED,
      timestamp,
      orderId,
    ]);
  }

  reduceSkuInStock(sku_id: number, quantity: number) {
    const query = `UPDATE product_sku
      SET stock = stock - $2
      WHERE sku_id = $1`;

    return this.database.update(query, [sku_id, quantity]);
  }

  increaseSkuInStock(sku_id: number, quantity: number) {
    const query = `UPDATE product_sku
      SET stock = stock + $2
      WHERE sku_id = $1`;

    return this.database.update(query, [sku_id, quantity]);
  }

  updateEndTime(orderId, endTime) {
    const timestamp = new Date();
    const query = `UPDATE orders
      SET status = $1, updated = $2, end_time = $3
      WHERE order_id = $4`;

    return this.database.update(query, [
      ORDER_STATUS_CODES.CONFIRMED,
      timestamp,
      endTime,
      orderId,
    ]);
  }

  updateStartTime(orderId, startTime) {
    const timestamp = new Date();
    const query = `
      UPDATE orders
      SET status = $1, updated = $2, start_time = $3
      WHERE order_id = $4`;

    return this.database.update(query, [
      ORDER_STATUS_CODES.CONFIRMED,
      timestamp,
      startTime,
      orderId,
    ]);
  }
}

export default OrderRepository;
