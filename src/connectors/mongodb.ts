import { MongoClient } from 'mongodb';
import type { DatabaseConnection, QueryResult } from '../types/database.js';

export class MongodbConnector implements DatabaseConnection {
  type = 'mongodb' as const;
  private client: MongoClient | null = null;
  private connected = false;

  async connect(): Promise<void> {
    this.client = new MongoClient('mongodb://mock:mock@localhost:27017/mock');
    await this.client.connect();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.connected = false;
    }
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.client || !this.connected) {
      throw new Error('Not connected to database');
    }

    throw new Error('MongoDB uses JSON-like queries, not SQL. Please use db.collection.find() or aggregate() format.');
  }

  async executeCommand(command: Record<string, unknown>): Promise<QueryResult> {
    if (!this.client || !this.connected) {
      throw new Error('Not connected to database');
    }

    const db = this.client.db();
    const result = await db.command(command);
    
    return {
      rows: [result as Record<string, unknown>],
      fields: Object.keys(result).map(name => ({ name, type: 'unknown' }))
    };
  }
}

export function createMongodbConnector(): MongodbConnector {
  return new MongodbConnector();
}
