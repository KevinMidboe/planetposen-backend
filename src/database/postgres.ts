import logger from "../logger";
import fs from "fs";
import path from "path";
import { Pool } from "pg";

class PostgresDatabase {
  user: string;
  password: string;
  host: string;
  database: string;

  pool: any;

  constructor(user, password = "", host, database) {
    this.user = user;
    this.password = password;
    this.host = host;
    this.database = database;

    this.pool = new Pool({
      user,
      password,
      host,
      database,
      port: 5432,
      application_name: "Node-Postgres - Application <planetposen-backend>",
    });

    // save queries to postgres in local list
    // should prevent this from overflowing.
  }

  connect() {
    return this.pool.connect();
  }

  /**
   * Run a SQL query against the database and retrieve one row.
   * @param {String} sql SQL query
   * @param {Array} values in the SQL query
   * @returns {Promise}
   */
  query(sql, values) {
    const start = Date.now();

    return this.pool
      .query(sql, values)
      .then((res) => {
        const duration = Date.now() - start;
        logger.debug("Executed query", {
          sql,
          values,
          duration,
          rows: res.rowCount,
        });

        return res.rowCount;
      })
      .catch((err) => {
        logger.error("DB query error:", err);
        // TODO log db error
        throw err;
      });
  }

  /**
   * Update w/ query and return true or false if update was successful.
   * @param {String} sql SQL query
   * @param {Array} values in the SQL query
   * @returns {Promise}
   */
  update(sql, values) {
    const start = Date.now();

    return this.pool
      .query(sql, values)
      .then((res) => {
        const duration = Date.now() - start;
        logger.debug("Executed update query", {
          sql,
          values,
          duration,
          rows: res.rowCount,
        });

        if (res.rowCount > 0) {
          return true;
        }
        return false;
      })
      .catch((err) => {
        logger.error("DB update error:", err);
        // TODO log db error
        throw err;
      });
  }

  /**
   * Run a SQL query against the database and retrieve all the rows.
   * @param {String} sql SQL query
   * @param {Array} values in the SQL query
   * @returns {Promise}
   */
  all(sql, values) {
    const start = Date.now();

    return this.pool
      .query(sql, values)
      .then((res) => {
        const duration = Date.now() - start;
        logger.debug("Executed all query", {
          sql,
          values,
          duration,
          rows: res.rows.length,
        });

        return res.rows;
      })
      .catch((err) => {
        // TODO log db error
        logger.error("DB all error:", err);
        throw err;
      });
  }

  /**
   * Run a SQL query against the database and retrieve one row.
   * @param {String} sql SQL query
   * @param {Array} values in the SQL query
   * @returns {Promise}
   */
  get(sql, values) {
    const start = Date.now();

    return this.pool
      .query(sql, values)
      .then((res) => {
        const duration = Date.now() - start;
        logger.debug("Executed get query", {
          sql,
          values,
          duration,
          rows: res.rows.length,
        });
        return res.rows[0];
      })
      .catch((err) => {
        // TODO log db error
        logger.error("DB get error:", err);
        throw err;
      });
  }
}

export default PostgresDatabase;
