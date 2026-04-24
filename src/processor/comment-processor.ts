import type { CustomComment, HurlEntry } from '../types/hurl.js';
import type { DatabaseResult } from '../types/output.js';
import type { DatabaseConnection } from '../types/database.js';
import { createConnector } from '../connectors/index.js';
import { resolveDsn, resolveQuery } from '../resolver/variable-resolver.js';

const connectorCache = new Map<string, DatabaseConnection>();

export interface ProcessResult {
  success: boolean;
  results: DatabaseResult[];
  error?: string;
}

export async function processCustomComments(
  entry: HurlEntry,
  variables: Record<string, string>,
  veryVerbose?: boolean
): Promise<ProcessResult> {
  const results: DatabaseResult[] = [];
  
  if (!entry.customComments || entry.customComments.length === 0) {
    return { success: true, results };
  }

  let order = 1;

  for (const comment of entry.customComments) {
    try {
      const dsn = resolveDsn(comment.dsnVariable, variables);
      
      // Handle screenshot without query - just capture, skip DB execution
      if (comment.action === 'screenshot' && !comment.query) {
        results.push({
          order: order++,
          type: comment.dbType,
          action: 'screenshot',
          query: '',
          result: { rows: [], fields: [] }
        });
        continue;
      }
      
      const query = resolveQuery(comment.query!, variables);
      
      let connector = connectorCache.get(dsn);
      if (!connector) {
        connector = createConnector(comment.dbType);
        await connector.connect(dsn);
        if (veryVerbose) {
          console.log(`[DB] Establishing connection to ${dsn}...`);
          console.log(`[DB] Connected to ${comment.dbType}`);
        }
        connectorCache.set(dsn, connector);
      }
      
      let queryResult;
      if (comment.dbType === 'mongodb') {
        const mongodbConnector = connector as ReturnType<typeof createConnector> & { executeCommand?: (cmd: Record<string, unknown>) => Promise<{ rows: Record<string, unknown>[]; fields: { name: string; type: string }[] }> };
        if (mongodbConnector.executeCommand) {
          queryResult = await mongodbConnector.executeCommand(JSON.parse(query));
        } else {
          throw new Error('MongoDB connector does not support executeCommand');
        }
      } else {
        queryResult = await connector.query(query);
      }
      
      results.push({
        order: order++,
        type: comment.dbType,
        action: comment.action as 'output' | 'screenshot' | 'pre-output' | 'post-output',
        query,
        result: queryResult
      });
    } catch (error) {
      throw new Error(`DB connection error (${comment.dbType}): ${error instanceof Error ? error.message : error}`);
    }
  }

  return { success: true, results };
}

export function getPreOutputResults(results: DatabaseResult[]): DatabaseResult[] {
  return results.filter(r => r.action === 'pre-output');
}

export function getPostOutputResults(results: DatabaseResult[]): DatabaseResult[] {
  return results.filter(r => r.action === 'post-output');
}

export function getScreenshotActions(results: DatabaseResult[]): DatabaseResult[] {
  return results.filter(r => 
    r.action === 'screenshot' || 
    r.action === 'pre-output' || 
    r.action === 'post-output'
  );
}

export async function disconnectAll(): Promise<void> {
  for (const [, connector] of connectorCache) {
    await connector.disconnect();
  }
  connectorCache.clear();
}
