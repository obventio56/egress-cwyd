import { PostgresConnection } from "./databaseConnections/postgres";
import { getDescription } from "./descriptions";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  const db = new PostgresConnection({
    user: process.env.PG_USER as string,
    host: process.env.PG_HOST as string,
    database: process.env.PG_DATABASE as string,
    password: process.env.PG_PASSWORD as string,
    port: parseInt(process.env.PG_PORT as string, 10),
  });

  await db.connect();
  await getDescription(db, "users");
  await db.close();
})();
