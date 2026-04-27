import type { DatabaseType, QueryResult } from './database.js';

export interface HttpResponseData {
  status: number;
  headers: Record<string, string>;
  body: string | Record<string, unknown>;
  duration: number;
}

export interface DatabaseResult {
  order: number;
  type: DatabaseType;
  action: 'output' | 'screenshot' | 'pre-output' | 'post-output';
  query: string;
  result: QueryResult;
}

export interface CaseOutput {
  name: string;
  entryIndex: number;
  title?: string;
  status: 'pass' | 'fail';
  response: HttpResponseData;
  requestHeaders?: { name: string; value: string }[];
  duration: number;
  databases: DatabaseResult[];
}

export interface ExecutionResult {
  entries: CaseOutput[];
  skippedEntries: number[];
  totalDuration: number;
  success: boolean;
  error?: string;
}
