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
      INSERT INTO customer (customer_no, email, first_name, last_name, street_address, zip_code, city)
      VALUES (NULL, $1, $2, $3, $4, $5, $6)
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
