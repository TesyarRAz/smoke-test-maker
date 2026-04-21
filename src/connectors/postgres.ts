import { Pool } from 'pg';
import type { DatabaseConnection, QueryResult } from '../types/database.js';

export class PostgresConnector implements DatabaseConnection {
  type = 'postgresdb' as const;
  private pool: Pool | null = null;
  private connected = false;

  async connect(): Promise<void> {
    this.pool = new Pool({
      connectionString: 'postgres://mock:mock@localhost:5432/mock',
      ssl: false
    });
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
    }
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.pool || !this.connected) {
      throw new Error('Not connected to database');
    }

    try {
      const result = await this.pool.query(sql);
      return {
        rows: result.rows,
        fields: result.fields.map(f => ({ name: f.name, type: f.dataTypeID.toString() })),
        affectedRows: result.rowCount
      };
    } catch (error) {
      throw new Error(`PostgreSQL query error: ${error}`);
    }
  }
}

export function createPostgresConnector(): PostgresConnector {
  return new PostgresConnector();
}
