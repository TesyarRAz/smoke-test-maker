import type { DatabaseType, DatabaseConnection } from '../types/database.js';
import { PostgresConnector } from './postgres.js';
import { MysqlConnector } from './mysql.js';
import { MongodbConnector } from './mongodb.js';
import { TestDbConnector } from './testdb.js';

export function createConnector(type: DatabaseType): DatabaseConnection {
  switch (type) {
    case 'postgres':
    case 'postgresdb':
      return new PostgresConnector();
    case 'mysql':
      return new MysqlConnector();
    case 'mongodb':
      return new TestDbConnector();
    case 'testdb':
      return new TestDbConnector();
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}

export { PostgresConnector, MysqlConnector,MongodbConnector, TestDbConnector };
export type { DatabaseConnection } from '../types/database.js';
