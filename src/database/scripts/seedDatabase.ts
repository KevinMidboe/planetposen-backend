import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";

if (global.__base == undefined)
  global.__base = path.join(__dirname, "../../../src/");

import db from "../index";

interface ISeedData {
  model: string;
  pk: string;
  fields: {
    [key: string]: string | number | boolean;
  };
}

class SeedStep {
  filepath: string;
  filename: string;
  data: Array<ISeedData>;

  constructor(filepath) {
    this.filepath = filepath;
    this.filename = filepath.split("/").pop();

    this.data = [];
  }

  readData() {
    this.data = JSON.parse(fs.readFileSync(this.filepath, "utf-8"));
    this.data = this.data.reverse();
  }

  get isApplied() {
    const query = `SELECT * FROM seed WHERE filename = $1`;
    return db
      .query(query, [this.filename])
      .then((resp) => (resp == 1 ? true : false));
  }

  commitStepToDb() {
    const query = `INSERT INTO seed (filename) VALUES ($1)`;
    return db.query(query, [this.filename]);
  }

  async executeSeedDatas() {
    const seedData = this.data.pop();

    const { model, pk, fields } = seedData;
    const columns = Object.keys(fields);
    const values = Object.values(fields);
    const parameterKeys = Array.from(
      { length: values.length },
      (v, k) => `$${k + 1}`
    );

    const query = `INSERT INTO ${model}
      (${columns.join(",")})
      VALUES
      (${parameterKeys.join(",")})`;

    await db.query(query, values);

    if (this.data.length > 0) {
      await this.executeSeedDatas();
    }
  }

  async applySeedData() {
    if (await this.isApplied) {
      console.log(`⚠️  Step: ${this.filename}, already applied.`);
      return;
    }
    console.log(`Seeding ${this.filename}:`);

    const tables = Array.from(new Set(this.data.map((el) => el.model)));
    const steps = this.data.length;
    await this.executeSeedDatas();
    await this.commitStepToDb();
    console.log(
      `🌱 ${steps} object(s) applied to table(s): ${tables.join(", ")}.`
    );
  }
}

/**
 * UTILS
 */
const readSeedFiles = () => {
  const seedFolder = path.join(__base, "database/seeds/");
  console.log(`Reading seeds from folder: ${seedFolder}\n`);

  return fsPromises.readdir(seedFolder).then((files) => {
    let lastFileRead: string;
    try {
      return files.reverse().map((filePath) => {
        lastFileRead = filePath;
        const seedStep = new SeedStep(path.join(seedFolder, filePath));
        seedStep.readData();
        return seedStep;
      });
    } catch (error) {
      console.log(
        `Unexpected error while reading seed files. File: ${lastFileRead} causing error`
      );
      throw error;
    }
  });
};

async function runAllSteps(seedSteps) {
  const seedStep = seedSteps.pop();
  await seedStep.applySeedData();

  if (seedSteps.length > 0) await runAllSteps(seedSteps);
  return Promise.resolve();
}

/**
 * Runner
 */
readSeedFiles()
  .then(async (seedSteps) => await runAllSteps(seedSteps))
  .catch((error) => console.error(error))
  .finally(() => process.exit(0));
