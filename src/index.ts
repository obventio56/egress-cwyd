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
    "Who are the api_customusers with the most freewrite and peronal tutor tokens used? Please include the user's email, whether they're subscribed (using subscribed_until), and the number of tokens they've used. Order by tokens used descending with nulls last.";
  const relevantTables = await evaluatePrompt(indexDb, prompt);

  const queryText = generateQuery(prompt, relevantTables, "postgres");

  const query = await chatAPI(queryText, "gpt-4");

  console.log(query);
  const result = await db.query(query);
  console.log(result);

  await db.close();
})();
