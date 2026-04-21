import type { DatabaseConnection, QueryResult } from '../types/database.js';

export class TestDbConnector implements DatabaseConnection {
  type = 'testdb' as const;
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.connected) {
      throw new Error('Not connected to testdb');
    }

    return this.generateMockData(sql);
  }

  private generateMockData(sql: string): QueryResult {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('select') && lowerSql.includes('from')) {
      const tableMatch = lowerSql.match(/from\s+(\w+)/);
      const tableName = tableMatch?.[1] || 'unknown';
      
      return {
        rows: [
          this.generateRowForTable(tableName),
          this.generateRowForTable(tableName),
        ],
        fields: this.getFieldsForTable(tableName),
      };
    }
    
    if (lowerSql.includes('insert')) {
      return { affectedRows: 1, insertedId: 'mock-12345' };
    }
    
    if (lowerSql.includes('update') || lowerSql.includes('delete')) {
      return { affectedRows: 1 };
    }

    return { rows: [], fields: [] };
  }

  private generateRowForTable(tableName: string): Record<string, unknown> {
    const mockDataMap: Record<string, Record<string, unknown>> = {
      users: { id: 1, name: 'Alice', email: 'alice@example.com' },
      products: { id: 1, name: 'Test Product', price: 99.99 },
      orders: { id: 1, user_id: 1, total: 99.99, status: 'pending' },
    };
    
    return mockDataMap[tableName] || { id: 1, name: 'Sample', value: 'test' };
  }

  private getFieldsForTable(tableName: string): { name: string; type: string }[] {
    const fieldMap: Record<string, { name: string; type: string }[]> = {
      users: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'varchar' },
        { name: 'email', type: 'varchar' },
      ],
      products: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'varchar' },
        { name: 'price', type: 'decimal' },
      ],
    };
    
    return fieldMap[tableName] || [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'varchar' },
    ];
  }
}
