import type { CustomComment, HurlEntry } from '../types/hurl.js';
import type { DatabaseResult } from '../types/output.js';
import { createConnector } from '../connectors/index.js';
import { resolveDsn, resolveQuery } from '../resolver/variable-resolver.js';

export interface ProcessResult {
  success: boolean;
  results: DatabaseResult[];
  error?: string;
}

export async function processCustomComments(
  entry: HurlEntry,
  variables: Record<string, string>
): Promise<ProcessResult> {
  const results: DatabaseResult[] = [];
  
  if (!entry.customComments || entry.customComments.length === 0) {
    return { success: true, results };
  }

  let order = 1;

  for (const comment of entry.customComments) {
    try {
      const dsn = resolveDsn(comment.dsnVariable, variables);
      const query = resolveQuery(comment.query, variables);
      
      const connector = createConnector(comment.dbType);
      await connector.connect();
      
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
      
      await connector.disconnect();
      
      results.push({
        order: order++,
        type: comment.dbType,
        action: comment.action as 'output' | 'screenshot' | 'pre-output' | 'post-output',
        query,
        result: queryResult
      });
    } catch (error) {
      return {
        success: false,
        results,
        error: `Failed to process ${comment.dbType} query: ${error}`
      };
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
