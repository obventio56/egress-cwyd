import { Client, QueryResult } from "pg";
import { DatabaseConfig, IDatabase } from "./interface";

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
      return {};
    } catch (err) {
      console.error("Failed to execute query:", err);
      throw err;
    }
  }

  public async close(): Promise<void> {
    await this.client.end();
  }
}

export { PostgresConnection };
