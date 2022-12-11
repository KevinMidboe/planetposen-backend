import establishedDatabase from "./database";
import ICustomer from "./interfaces/ICustomer";
import logger from "./logger";

class CustomerRepository {
  database: typeof establishedDatabase;

  constructor(database = establishedDatabase) {
    this.database = database || establishedDatabase;
  }

  newCustomer(customer: ICustomer) {
    const query = `
      INSERT INTO customer (email, first_name, last_name, street_address, zip_code, city)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING customer_no
    `;

    const {
      email,
      first_name,
      last_name,
      street_address,
      zip_code,
      city,
    } = customer;
    logger.info("Creating customer", { customer });

    return this.database.get(query, [
      email,
      first_name,
      last_name,
      street_address,
      zip_code,
      city,
    ]);
  }

  getCustomer(customer_no) {
    const query = `
    SELECT email, first_name, last_name, street_address, zip_code, city
    FROM customer
    WHERE customer_no = $1`;

    return this.database.get(query, [customer_no]);
  }
}

export default CustomerRepository;

// ```
// SELECT products.*
// FROM products
// INNER JOIN orders_lineitem
// ON products.product_no = orders_lineitem.product_no
// WHERE order_id = 'fb9a5910-0dcf-4c65-9c25-3fb3eb883ce5';

// SELECT orders.*
// FROM orders
// WHERE order_id = 'fb9a5910-0dcf-4c65-9c25-3fb3eb883ce5';

// SELECT customer.*
// FROM customer
// INNER JOIN orders
// ON customer.customer_no = orders.customer_no
// WHERE order_id = 'fb9a5910-0dcf-4c65-9c25-3fb3eb883ce5';
// ```;
