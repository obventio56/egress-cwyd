import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
dotenv.config();

const OPEN_AI_API_URL = "https://api.openai.com";
const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY; // Replace with your OpenAI API key

async function chatAPI(messages: any[], model: string = "gpt-3.5-turbo") {
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
