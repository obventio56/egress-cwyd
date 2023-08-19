import yaml from "js-yaml";

export const generateExamplePrompts = (tableDescription: string, n: number) => [
  {
    role: "system",
    content: `
    You are an expert data engineer and analyst. You are helping me build a tool that converts requests in natural language to SQL queries.
    An important step in this process is to determine which tables in our database are relevant to the request.
    I am going to provide you with some information about a table in our database and you are going to help me come up with example prompts that might request information from this table. 
    `,
  },
  {
    role: "user",
    content: `
      Here is some information about a table:
      ${tableDescription}

      Please use this information to come up with ${n} example prompts that a end user might ask that would require querying this table to answer. 
      Each prompt should be two to three sentences long.

      Be creative and try to come up with a variety of different types of prompts. Include prompts that require aggregation, filtering, and sorting. 
      
      Write with the language and style of a non-technical business user who does not know anything about sql. 

      Please respond with a JSON array of strings, each string being a prompt. Reply with just the array. Do not put the array inside an object as a property. Do not wrap your response in a code block. Do not include any additional information in your response.
      `,
  },
];

const tableDataSubPrompt = (tableInfo: any) => `
${tableInfo.tableDescription}

relevantCount: ${tableInfo.relevanceCount}

`;

export const generateQuery = (
  prompt: string,
  tableData: any[],
  sqlDialect: string
) => [
  {
    role: "system",
    content: `
    You are an expert data engineer and analyst. Your job is to help me write ${sqlDialect} sql to query my database. I will provide you with a prompt as well as information 
    about relevant tables and you should respond with the sql query that best satisfies the prompt.`,
  },
  {
    role: "user",
    content: `
      Here is the prompt:
      ${prompt} 

      Here is information about relevant tables:
      ${tableData.map((td) => tableDataSubPrompt(td)).join("")}

      The relevanceCount of each table is my best guess about how likely it is that the table will be necessary for the query. 

      Not all tables must be used for the query. It is part of your job to determine which tables are necessary and which are not. You should use as few tables as possible while still answering the query.

      Only use columns that you are certain exist. If a user asks for a column but it is not present in one of the relevant tables or can be calculated, do not include it.

      Please use this information to write a ${sqlDialect} sql query that best satisfies the prompt. Please respond with just the query. Do not wrap your response in a code block. Do not include any additional information in your response.
      `,
  },
];

//Include prompts where this table is not the primary table of interest but rather joined in or secondary in some other way. You can use foreign key constraints to guide you as to what other tables might be related to this one.
