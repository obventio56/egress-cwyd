interface IDatabase {
  connect(): Promise<void>;
  query(queryString: string): Promise<Record<string, any>>;
  getTableMetadata(table: string, schema: string): Promise<Record<string, any>>;
  getRandomSample(table: string, schema: string, n: number): Promise<any[]>;
  getTableDescription(table: string, schema: string): Promise<string>;
  close(): Promise<void>;
}

interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export { IDatabase, DatabaseConfig };
