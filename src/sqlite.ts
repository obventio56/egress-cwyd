import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import * as sqlite_vss from "sqlite-vss";

const sqliteFilePath: string = path.join(path.resolve(), "databaseIndex.db");

export const initSqlite = async () => {
  // Delete the database file if it exists

  if (fs.existsSync(sqliteFilePath)) {
    fs.unlinkSync(sqliteFilePath);
    console.log("Existing database file deleted.");
  }
  // Connect to SQLite database

  const db = new Database(sqliteFilePath);
  sqlite_vss.load(db);

  db.exec(`
  -- Create the tables table
  CREATE TABLE tables (
      table_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      table_schema TEXT NOT NULL,
      metadata TEXT,
      row_examples TEXT
  );
  
  -- Create the prompt_embeddings virtual table using sqlite-vss
  CREATE VIRTUAL TABLE prompt_embeddings USING vss0(
      embedding(1536)
  );
  
  -- Create the table_prompt_embeddings table with the added prompt_text column
  CREATE TABLE table_prompt_embeddings (
      table_prompt_embeddings_id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      rowid INTEGER,
      prompt_text TEXT,
      FOREIGN KEY(table_id) REFERENCES tables(table_id)
      
  );
    `);
  return db;
};

export const insertEmbeddings = (
  db: any,
  tableName: string,
  tableSchema: string,
  metadata: Record<string, any>,
  rowExamples: any[],
  embeddings: any[]
) => {
  const insertIntoTables = db.prepare(
    `INSERT INTO tables (table_name, table_schema, metadata, row_examples) VALUES (?, ?, ?, ?)`
  );
  const insertIntoPromptEmbeddings = db.prepare(
    `INSERT INTO prompt_embeddings (rowid, embedding) VALUES (?, ?)`
  );
  const insertIntoTablePromptEmbeddings = db.prepare(
    `INSERT INTO table_prompt_embeddings (table_id, rowid, prompt_text) VALUES (?, ?, ?)`
  );

  let { count: currentEmbeddingCount } = db
    .prepare("select count(*) as count from prompt_embeddings")
    .get();

  // Transaction start
  const transaction = db.transaction((tableData: any, embeddings: any) => {
    const tableID = insertIntoTables.run(
      tableData.tableName,
      tableData.tableSchema,
      JSON.stringify(tableData.metadata),
      JSON.stringify(tableData.rowExamples)
    ).lastInsertRowid;

    for (const prompt of embeddings) {
      const rowID = insertIntoPromptEmbeddings.run(
        currentEmbeddingCount,
        JSON.stringify(prompt.embedding)
      ).lastInsertRowid;
      currentEmbeddingCount += 1;

      insertIntoTablePromptEmbeddings.run(tableID, rowID, prompt.text);
    }
  });

  // Execute transaction
  try {
    transaction({ tableName, tableSchema, metadata, rowExamples }, embeddings);
  } catch (err) {
    console.error("Transaction failed:", err);
  }
};
