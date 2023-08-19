import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
import { encoding_for_model } from "tiktoken";

dotenv.config();

const OPEN_AI_API_URL = "https://api.openai.com";
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY; // Replace with your OpenAI API key

const modelTokenLimits: Record<string, any> = {
  "gpt-3.5-turbo": 4096,
  "gpt-4": 8192,
  "text-embedding-ada-002": 8191,
};

const guardTokenLimit = (model: any, prompt: string) => {
  const enc = encoding_for_model(model);
  const promptTokenLength = enc.encode(prompt).length;

  console.log("tokens used", promptTokenLength, "of", modelTokenLimits[model]);

  if (promptTokenLength > modelTokenLimits[model]) {
    throw new Error(
      `Prompt length (${promptTokenLength}) exceeds maximum for model ${model} (${modelTokenLimits[model]}).`
    );
  }
};

async function chatAPI(messages: any[], model: string = "gpt-3.5-turbo") {
  // Ensure prompt length is within model limits
  guardTokenLimit(model, JSON.stringify(messages));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPEN_AI_API_KEY}`,
  };

  const payload = {
    model,
    messages,
  };

  try {
    const response: AxiosResponse<any> = await axios.post(
      `${OPEN_AI_API_URL}/v1/chat/completions`,
      payload,
      { headers }
    );
    const assistantMessage = response.data.choices[0]?.message.content;
    return assistantMessage || "No response from API.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("API call failed");
  }
}

async function embeddingsAPI(
  input: string,
  model: string = "text-embedding-ada-002"
) {
  // Ensure prompt length is within model limits
  guardTokenLimit(model, JSON.stringify(input));

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${OPEN_AI_API_KEY}`,
  };

  const payload = {
    model,
    input,
  };

  try {
    const response: AxiosResponse<any> = await axios.post(
      `${OPEN_AI_API_URL}/v1/embeddings`,
      payload,
      { headers }
    );
    const assistantMessage = response.data.data;
    return assistantMessage || "No response from API.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("API call failed");
  }
}

export { chatAPI, embeddingsAPI };
