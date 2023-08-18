interface IDatabase {
  connect(): Promise<void>;
  query(queryString: string): Promise<Record<string, any>>;
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
