import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";

if (global.__base == undefined)
  global.__base = path.join(__dirname, "../../../src/");

import db from "../index";

const paymentTypes = `paymentTypes.sql`;
const products = `products.sql`;
const orders = `orders.sql`;
const vipps_payment = `vipps_payments.sql`;
const seed = `seed.sql`;

const schemas = [paymentTypes, products, orders, vipps_payment, seed];

const handleExit = (error = undefined) => {
  if (error != undefined) {
    console.log(`🚫 Exited with error: ${error}`);
    process.exit(1);
  }

  console.log("✅ Exited setup successfully!");
  process.exit(0);
};

const readSchemaFiles = () => {
  const schemaFolder = path.join(__base, "database/schemas");
  console.log("Reading schemas from folder:", schemaFolder);

  return fsPromises.readdir(schemaFolder).then((files) =>
    files.map((filename) => {
      const filePath = path.join(schemaFolder, filename);
      return fs.readFileSync(filePath, "utf-8");
    })
  );
};

async function processQuery(schemas) {
  const schema = schemas.pop();

  const re = /(^CREATE TABLE IF NOT EXISTS )(?<tb_name>\w*)/;
  const match = schema.match(re);

  const tableName = match?.groups["tb_name"];
  if (tableName) console.log("✏️  Applying schema:", tableName);
  else console.log("🧙‍♂️ applying something else");
  await db.query(schema, null);

  if (schemas.length > 0) {
    await processQuery(schemas);
  }
}

const applyAll = (schemas) => {
  schemas = schemas.reverse();
  return processQuery(schemas);
};

/**
 * Runner
 */
readSchemaFiles()
  .then((schemas) => applyAll(schemas))
  .catch((err) => handleExit(err))
  .then((_) => process.exit(0));

// db.connect()
//   .then(client => setup(client, schemas))
