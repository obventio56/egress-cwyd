const generateExamplePrompts = (
  metadata: Record<any, any>,
  exampleRows: any[],
  n: number
) => [
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
      I have the result of a few meta-data queries describing the table's structure, primary keys, and foreign key relations among other things. 
      I also have several example rows selected at random from the table. 

      Meta-data results:

      ${JSON.stringify(metadata)}

      Example rows:

      ${JSON.stringify(exampleRows)}

      Please use this information to come up with ${n} example prompts that a end user might ask that would require querying this table to answer. 
      Each prompt should be two to three sentences long.

      Be creative and try to come up with a variety of different types of prompts. Include prompts that require aggregation, filtering, and sorting. 
      Include prompts where this table is not the primary table of interest but rather joined in or secondary in some other way. You can use foreign key constraints to guide you as to what other tables might be related to this one.

      Write with the language and style of a non-technical business user who does not know anything about sql. Do not include any references to 
      primary or foreign keys. 

      Please respond with a JSON array of strings, each string being a prompt. Do not wrap your response in a code block. Do not include any additional information in your response.
      `,
  },
];

export { generateExamplePrompts };
