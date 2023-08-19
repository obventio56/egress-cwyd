import pg from "pg";
import yaml from "js-yaml";
import { DatabaseConfig, IDatabase } from "../interface.js";
import {
  countRows,
  metadataQueries,
  randomSampleQuery,
  schemaQuery,
} from "./queries.js";
import { truncateExampleColumns } from "../../utils.js";
const { Client } = pg;

class PostgresConnection implements IDatabase {
  private client: pg.Client;

  constructor(config: DatabaseConfig) {
    this.client = new Client({ ...config, ssl: { rejectUnauthorized: false } });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err) {
      console.error("Failed to connect to the database:", err);
      throw err;
    }
  }

  public async query(queryString: string): Promise<Record<string, any>> {
    try {
      const result = await this.client.query(queryString);
      return result.rows;
    } catch (err) {
      console.error("Failed to execute query:", err);
      throw err;
    }
  }

  public async getTables(): Promise<Record<string, any>> {
    const query = `
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema') 
      AND table_type = 'BASE TABLE' 
      ORDER BY table_schema, table_name;
    `;
    return await this.query(query);
  }

  public async getTableMetadata(table: string, schema: string) {
    let metadata = {};

    for (const key in metadataQueries) {
      const result = await this.query(metadataQueries[key](table, schema));
      metadata = { ...metadata, [key]: result };
    }

    return metadata;
  }

  public async getRandomSample(table: string, schema: string, n: number) {
    const result = await this.query(randomSampleQuery(table, schema, n));
    return result as any[];
  }

  public async getTableDescription(table: string, schema: string) {
    const numberOfRows = await this.query(countRows(table, schema));

    // Get schema information as an object
    const schemaInformation = await this.query(schemaQuery(table, schema));
    const schemaObject = Object.fromEntries(
      schemaInformation.map((row: any) => {
        const columnName = row.column_name;
        const schemaInfo = {
          ...row,
        };
        delete schemaInfo.column_name;

        return [columnName, schemaInfo];
      })
    );

    const exampleRows: any = await this.query(
      randomSampleQuery(table, schema, 2)
    );
    // Ensure columns in example rows are too long and could break token limits
    const truncatedExamples = truncateExampleColumns(exampleRows);

    return `A table named ${table} exists in the ${schema} schema. It has a total of ${
      numberOfRows[0].count
    } rows.

The ${table} table has the following schema:
  ${yaml.dump(schemaObject)}

A few example rows from the ${table} table are:
  ${yaml.dump(truncatedExamples)}`;
  }

  public async close(): Promise<void> {
    await this.client.end();
  }
}

export { PostgresConnection };
