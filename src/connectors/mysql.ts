import mysql from 'mysql2/promise';
import type { DatabaseConnection, QueryResult } from '../types/database.js';

export class MysqlConnector implements DatabaseConnection {
  type = 'mysql' as const;
  private connection: mysql.Connection | null = null;
  private connected = false;

  async connect(connectionString?: string): Promise<void> {
    const dsn = connectionString || process.env.MYSQL_URL || 'mysql://root:password@localhost:3306/mysql';
    this.connection = await mysql.createConnection({
      uri: dsn
    });
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      this.connected = false;
    }
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.connection || !this.connected) {
      throw new Error('Not connected to database');
    }

    try {
      const [rows, fields] = await this.connection.query(sql);
      
      if (Array.isArray(rows)) {
        return {
          rows: rows as Record<string, unknown>[],
          fields: fields.map(f => ({ name: f.name, type: String(f.type) })),
          affectedRows: (rows as Record<string, unknown>[]).length
        };
      }
      
      return {
        rows: [],
        fields: fields.map(f => ({ name: f.name, type: String(f.type) })),
        affectedRows: (this.connection as unknown as { affectedRows: number }).affectedRows
      };
    } catch (error) {
      throw new Error(`MySQL query error: ${error}`);
    }
  }
}

export function createMysqlConnector(): MysqlConnector {
  return new MysqlConnector();
}
