const tableDescriptionPrompt = (
  metadata: Record<any, any>,
  exampleRows: any[]
) => [
  {
    role: "system",
    content: `You are an expert data engineer and analyst helping me document tables in my database so that it's easy for all team members to understand what data a table contains, its relationship to other tables, and the context of what it means in our organization.`,
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

      Please use this information to write a paragraph documenting the table. Your response should start with a high-level description of the table 
      and its relationship to other tables. Do your best to infer what the table means in the context of our organization but only include information
      that you are fairly confident about. Then provide a summary of the columns in the table and the data they contain as well as primary 
      and foreign key constraints. 
      
      Please respond with just this description and nothing else. Do not include any preamble or introduction. 
      `,
  },
];

export { tableDescriptionPrompt };