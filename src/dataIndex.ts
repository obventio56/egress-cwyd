import { IDatabase } from "./databaseConnections/interface.js";
import { kMeans } from "./kmeans.js";
import { chatAPI, embeddingsAPI } from "./openAI.js";
import { generateExamplePrompts } from "./prompts.js";
import { findKNN, getTablesInRowIdArray, insertEmbeddings } from "./sqlite.js";

export const evaluatePrompt = async (indexDb: any, prompt: any) => {
  const embeddings = await embeddingsAPI(prompt);
  const knnWithDistance = await findKNN(indexDb, embeddings[0].embedding);
  const filteredKMeans = kMeans(knnWithDistance, 2);

  const relevantTables = getTablesInRowIdArray(
    indexDb,
    filteredKMeans.map((k: any) => k.rowid),
    5
  );

  const parsedRelevantTables = relevantTables.map((rt: any) => ({
    tableDescription: rt.table_description,
    relevanceCount: rt.count,
  }));

  return parsedRelevantTables;
};

export const createIndexForTable = async (
  indexDb: any,
  db: IDatabase,
  tableName: string,
  tableSchema: string
) => {
  // Gather info: schema + 3 examples
  const tableDescription = await db.getTableDescription(tableName, tableSchema);

  // Wrap in prompt
  const prompt = generateExamplePrompts(tableDescription, 20);

  // Send to open AI
  const examplePromptRes = await chatAPI(prompt);
  const examplePrompts = JSON.parse(examplePromptRes);

  // Get embeddings
  const embeddings = await embeddingsAPI(examplePrompts);

  const embeddingsWithText = embeddings.map((e: any, i: number) => ({
    embedding: e.embedding,
    text: examplePrompts[i],
  }));

  // Insert into sqlite
  await insertEmbeddings(
    indexDb,
    tableName,
    "public",
    tableDescription,
    embeddingsWithText
  );
};

export const buildIndex = async (
  indexDb: any,
  db: IDatabase,
  tables: any[]
) => {
  let failedTables = [];
  const allowedRetries = 1;
  let retryCount = 0;

  let idx = 0;
  while (idx < tables.length) {
    const table = tables[idx];

    // Allow status monitoring
    const percentageDone = (idx / tables.length) * 100;
    process.stdout.write(
      `\r${percentageDone.toFixed(2)}% done -- working on ${
        table.table_name
      }\x1B[K`
    );

    // Attempt to create index for table
    try {
      await createIndexForTable(
        indexDb,
        db,
        table.table_name,
        table.table_schema
      );
    } catch (err) {
      // If it fails, retry, within allowed retry count. Sometimes OpenAI doesn't return the proper json or there is some other fluke.
      if (retryCount < allowedRetries) {
        retryCount += 1;
        console.error(
          `Error creating index for ${table.table_name} -- retrying...`
        );
        continue;
      }

      // If retry count exceeded, log error and move on
      console.error(
        `Exceeded retry attempt limit for ${table.table_name}:`,
        err
      );
      failedTables.push(table);
    }

    // Reset retry count and move to next table
    retryCount = 0;
    idx += 1;
  }

  console.log("Index complete with failed tables: ", failedTables);
};
