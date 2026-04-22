export type DatabaseType = 'postgresdb' | 'mysql' | 'mongodb' | 'testdb';

export interface DatabaseConfig {
  type: DatabaseType;
  dsn: string;
}

export interface PostgresConfig extends DatabaseConfig {
  type: 'postgresdb';
  dsn: string;
}

export interface MysqlConfig extends DatabaseConfig {
  type: 'mysql';
  dsn: string;
}

export interface MongodbConfig extends DatabaseConfig {
  type: 'mongodb';
  dsn: string;
}

export interface QueryResult {
  rows?: Record<string, unknown>[];
  fields?: { name: string; type: string }[];
  affectedRows?: number;
  insertedId?: string;
}

export interface DatabaseConnection {
  type: DatabaseType;
  connect(connectionString?: string): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string): Promise<QueryResult>;
}
