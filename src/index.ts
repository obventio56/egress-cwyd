import dotenv from "dotenv";
import { PostgresConnection } from "./databaseConnections/postgres/postgres.js";
import { getDescription } from "./descriptions.js";
import { initSqlite } from "./sqlite.js";

dotenv.config();

(async () => {
  const indexDb = await initSqlite();

  const db = new PostgresConnection({
    user: process.env.PG_USER as string,
    host: process.env.PG_HOST as string,
    database: process.env.PG_DATABASE as string,
    password: process.env.PG_PASSWORD as string,
    port: parseInt(process.env.PG_PORT as string, 10),
  });

  await db.connect();
  await getDescription(indexDb, db, "actor");
  await db.close();
})();
