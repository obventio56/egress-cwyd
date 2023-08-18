import { IDatabase } from "./databaseConnections/interface.js";
import { chatAPI, embeddingsAPI } from "./openAI.js";
import { generateExamplePrompts } from "./prompts.js";
import { insertEmbeddings } from "./sqlite.js";

const getDescription = async (
  indexDb: any,
  db: IDatabase,
  tableName: string
) => {
  // Gather info: schema + 3 examples
  const metadata = await db.getTableMetadata(tableName, "public");
  const examples = await db.getRandomSample(tableName, "public", 5);

  // Wrap in prompt
  const prompt = generateExamplePrompts(metadata, examples, 3);

  // Send to open AI
  const examplePromptRes = await chatAPI(prompt);
  const examplePrompts = JSON.parse(examplePromptRes);

  // Get embeddings
  const embeddings = await embeddingsAPI(examplePrompts);

  const embeddingsWithText = embeddings.map((e: any, i: number) => ({
    embedding: e.embedding,
    text: examplePrompts[i],
  }));

  console.log(embeddingsWithText);
  
  // Insert into sqlite
  await insertEmbeddings(
    indexDb,
    tableName,
    "public",
    metadata,
    examples,
    embeddingsWithText
  );

  // Return description
  return "";
};

export { getDescription };
