import { IDatabase } from "./databaseConnections/interface";
import { chatAPI } from "./openAI";
import { tableDescriptionPrompt } from "./prompts";

const getDescription = async (db: IDatabase, tableName: string) => {
  // Gather info: schema + 3 examples
  const metadata = await db.getTableMetadata(tableName, "public");
  const examples = await db.getRandomSample(tableName, "public", 5);

  // Wrap in prompt
  const prompt = tableDescriptionPrompt(metadata, examples);

  // Send to open AI
  const description = await chatAPI(prompt);

  // Return description
  console.log(description);
  return "";
};

export { getDescription };
