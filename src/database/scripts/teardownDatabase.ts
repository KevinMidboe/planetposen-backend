import fs from "fs";
import path from "path";

if (global.__base == undefined)
  global.__base = path.join(__dirname, "../../../src/");

import db from "../index";

const allTableNames = () => {
  const sql = `
    SELECT tablename
    FROM pg_catalog.pg_tables
    WHERE schemaname != 'pg_catalog' AND
    schemaname != 'information_schema'
  `;

  return db
    .all(sql, [])
    .then((rows) => rows.map((row) => row.tablename).reverse());
};

const teardown = (tableNames) => {
  if (tableNames.length) {
    console.log(`Tearing down tables:`);
    console.log(` - ${tableNames.join("\n - ")}`);

    const sql = `DROP TABLE IF EXISTS ${tableNames.join(",")} CASCADE`;
    return db.query(sql, null);
  } else {
    console.log("No tables left to drop.");
    return Promise.resolve();
  }
};

const handleExit = (error = undefined) => {
  if (error != undefined) {
    console.log(`🚫 Exited with error: ${error}`);
    process.exit(1);
  }

  console.log("✅ Exited teardown successfully!");
  process.exit(0);
};

db.connect()
  .then(() => allTableNames())
  .then((tableNames) => teardown(tableNames))
  .catch(console.log)
  .finally(handleExit);

module.exports = db;
