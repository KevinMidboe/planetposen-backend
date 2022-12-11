import Configuration from "../config/configuration";
import PostgresDatabase from "./postgres";

const configuration = Configuration.getInstance();

const user = configuration.get("database", "user");
const password = configuration.get("database", "password");
const host = configuration.get("database", "host");
const dbName = configuration.get("database", "database");

const postgresDB = new PostgresDatabase(user, password, host, dbName);

postgresDB.connect();

export default postgresDB;
