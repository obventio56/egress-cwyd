import { Client, QueryResult } from "pg";
import { DatabaseConfig, IDatabase } from "../interface";
import { metadataQueries, randomSampleQuery } from "./queries";

class PostgresConnection implements IDatabase {
  private client: Client;

  constructor(config: DatabaseConfig) {
    this.client = new Client(config);
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

  public async close(): Promise<void> {
    await this.client.end();
  }
}

export { PostgresConnection };
