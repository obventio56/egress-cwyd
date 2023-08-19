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
    ...rt,
    metadata: JSON.parse(rt.metadata),
    row_examples: JSON.parse(rt.row_examples),
  }));

  console.log(parsedRelevantTables.length);

  return parsedRelevantTables;
};

export const createIndexForTable = async (
  indexDb: any,
  db: IDatabase,
  tableName: string,
  tableSchema: string
) => {
  // Gather info: schema + 3 examples
  const metadata = await db.getTableMetadata(tableName, tableSchema);
  const examples = await db.getRandomSample(tableName, tableSchema, 3);

  // Wrap in prompt
  const prompt = generateExamplePrompts(metadata, examples, 20);

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
    metadata,
    examples,
    embeddingsWithText
  );
};

export const buildIndex = async (
  indexDb: any,
  db: IDatabase,
  tables: any[]
) => {
  let processedTables = 0;

  for (const table of tables) {
    // Allow status monitoring
    const percentageDone = (processedTables / tables.length) * 100;
    process.stdout.write(
      `\r${percentageDone.toFixed(2)}% done -- working on ${
        table.table_name
      }\x1B[K`
    );

    await createIndexForTable(
      indexDb,
      db,
      table.table_name,
      table.table_schema
    );
    processedTables += 1;
  }
};
