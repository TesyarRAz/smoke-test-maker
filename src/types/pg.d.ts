declare module 'pg' {
  export class Pool {
    constructor(config?: { connectionString?: string; ssl?: boolean });
    query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; fields: { name: string; dataTypeID: number }[]; rowCount: number }>;
    end(): Promise<void>;
  }
}

declare module 'mysql2/promise' {
  export interface FieldInfo {
    name: string;
    type: number;
  }
  
  export function createConnection(config: { uri: string }): Connection;
  
  export interface Connection {
    query(sql: string): Promise<[unknown[], FieldInfo[]]>;
    end(): Promise<void>;
  }
}
