import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import * as sqlite_vss from "sqlite-vss";

const sqliteFilePath: string = path.join(path.resolve(), "databaseIndex.db");

export const initSqlite = async (rebuild = false) => {
  // Delete the database file if rebuilding and it exists
  if (rebuild && fs.existsSync(sqliteFilePath)) {
    fs.unlinkSync(sqliteFilePath);
    console.log("Existing database file deleted.");
  }
  // Connect to SQLite database

  const db = new Database(sqliteFilePath);
  sqlite_vss.load(db);

  // Add tables if fresh db
  if (rebuild) {
    db.exec(`
    -- Create the tables table
    CREATE TABLE tables (
        table_id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        table_schema TEXT NOT NULL,
        table_description TEXT
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
  }

  return db;
};

export const insertEmbeddings = (
  db: any,
  tableName: string,
  tableSchema: string,
  tableDescription: string,
  embeddings: any[]
) => {
  const insertIntoTables = db.prepare(
    `INSERT INTO tables (table_name, table_schema, table_description) VALUES (?, ?, ?)`
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
      tableData.tableDescription
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
    transaction({ tableName, tableSchema, tableDescription }, embeddings);
  } catch (err) {
    console.error("Transaction failed:", err);
  }
};

export const findKNN = (db: any, embedding: any[]) => {
  const selectKNN = db.prepare(
    `select rowid, distance from prompt_embeddings where vss_search(embedding, ?) limit 200;`
  );
  return selectKNN.all(JSON.stringify(embedding));
};

export const getTablesInRowIdArray = (
  db: any,
  rowIdsArray: number[],
  limit: number = 5
) => {
  // Prepare the SELECT statement
  const selectStmt = db.prepare(`
      SELECT t.table_name, t.table_schema, t.table_description, COUNT(tpe.rowid) as count
      FROM table_prompt_embeddings AS tpe
      JOIN tables AS t ON tpe.table_id = t.table_id
      WHERE tpe.rowid IN (${rowIdsArray.map(() => "?").join(", ")})
      GROUP BY t.table_name, t.table_schema, t.table_description
      ORDER BY count DESC
      LIMIT ${limit};
  `);

  // Fetch rows
  const rows = selectStmt.all(...rowIdsArray);
  return rows;
};
