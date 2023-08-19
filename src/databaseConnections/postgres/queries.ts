import { table } from "console";

export const schemaQuery = (table: string, schema: string) => `
SELECT 
    column_name, 
    data_type, 
    character_maximum_length, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = '${table}' AND table_schema = '${schema}';
`;

export const primaryKeyQuery = (table: string, schema: string) => `
SELECT 
    conname AS constraint_name, 
    pg_attribute.attname AS column_name
FROM pg_constraint 
INNER JOIN pg_class ON conrelid=pg_class.oid 
INNER JOIN pg_attribute ON pg_attribute.attrelid = pg_class.oid 
AND pg_attribute.attnum = ANY(pg_constraint.conkey)
WHERE pg_class.relname = '${table}' 
AND contype = 'p';
`;

export const foreignKeyQuery = (table: string, schema: string) => `
SELECT
    conname AS constraint_name,
    a.attname AS column_name,
    af.attname AS referenced_column,
    c.confrelid::regclass
FROM
    pg_attribute AS a
JOIN
    pg_constraint AS c ON a.attnum = ANY(c.conkey)
JOIN
    pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE
    a.attrelid = '${table}'::regclass
AND
    c.confrelid > 0;

`;

export const randomSampleQuery = (table: string, schema: string, n: number) => `
SELECT * 
FROM ${schema}.${table} 
ORDER BY RANDOM() 
LIMIT ${n};
`;

export const countRows = (table: string, schema: string) => `
SELECT COUNT(*) as count
FROM ${schema}.${table};
`;

const metadataQueries: Record<string, Function> = {
  "schema definition": schemaQuery,
  "primary key constraints": primaryKeyQuery,
  "foreign key constraints": foreignKeyQuery,
};

export { metadataQueries };
