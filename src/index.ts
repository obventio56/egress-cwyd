import dotenv from "dotenv";
import { PostgresConnection } from "./databaseConnections/postgres/postgres.js";
import {
  evaluatePrompt,
  createIndexForTable,
  buildIndex,
} from "./dataIndex.js";
import { initSqlite } from "./sqlite.js";
import { chatAPI } from "./openAI.js";
import { generateQuery } from "./prompts.js";

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

  const indexDb = await initSqlite(false);
  // const tables: any = await db.getTables();
  // await buildIndex(indexDb, db, tables);

  const prompt =
    "Which movies made the most money in rentals per minute of screen time? Please include the total number of rentals, cost per rental, and the length of the movie for each film you return.";
  const relevantTables = await evaluatePrompt(indexDb, prompt);

  const query = await chatAPI(
    generateQuery(prompt, relevantTables, "postgres"),
    "gpt-4"
  );

  console.log(query);
  const result = await db.query(query);
  console.log(result);

  await db.close();
})();
