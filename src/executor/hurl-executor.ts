import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createWriteStream } from 'fs';
import type { HurlFile } from '../types/hurl.js';
import type { HttpResponseData } from '../types/output.js';
import { resolveVariables } from '../resolver/variable-resolver.js';

export interface ExecutionOptions {
  stopOnFailure: boolean;
  outputDir: string;
  variables: Record<string, string>;
}

export interface EntryResult {
  index: number;
  success: boolean;
  response: HttpResponseData | null;
  error?: string;
  duration: number;
  capturedVars: Record<string, string>;
}

export async function executeHurlFile(hurlFile: HurlFile, options: ExecutionOptions): Promise<EntryResult[]> {
  const results: EntryResult[] = [];
  const variables = { ...options.variables };

  for (const entry of hurlFile.entries) {
    const startTime = Date.now();
    
    try {
      const result = await executeEntry(entry, variables, options);
      results.push(result);
      
      Object.assign(variables, result.capturedVars);
      
      if (!result.success && options.stopOnFailure) {
        console.error(`Stopping on failure at entry ${entry.index}`);
        break;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        index: entry.index,
        success: false,
        response: null,
        error: String(error),
        duration,
        capturedVars: {}
      });
      
      if (options.stopOnFailure) {
        console.error(`Stopping on error at entry ${entry.index}: ${error}`);
        break;
      }
    }
  }

  return results;
}

async function executeEntry(
  entry: { index: number; request: { method: string; url: string; headers?: { name: string; value: string }[]; body?: string } },
  variables: Record<string, string>,
  options: ExecutionOptions
): Promise<EntryResult> {
  const startTime = Date.now();
  
  const url = resolveVariables(entry.request.url, variables);
  const headers: string[] = [];
  
  if (entry.request.headers) {
    for (const h of entry.request.headers) {
      const name = resolveVariables(h.name, variables);
      const value = resolveVariables(h.value, variables);
      headers.push('-H', `${name}: ${value}`);
    }
  }
  
  const hurlContent = buildHurlContent(entry, url);
  const tempFile = `/tmp/smoke-test-${Date.now()}.hurl`;
  writeFileSync(tempFile, hurlContent);
  
  const args = ['--json', '--test'];
  
  for (const [key, value] of Object.entries(variables)) {
    args.push('--variable', `${key}=${value}`);
  }
  
  args.push(tempFile);
  
  return new Promise((resolve) => {
    const proc = spawn('hurl', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      const response: HttpResponseData = {
        status: success ? 200 : 500,
        headers: {},
        body: stdout,
        duration
      };
      
      const capturedVars: Record<string, string> = {};
      
      resolve({
        index: entry.index,
        success,
        response,
        error: success ? undefined : stderr,
        duration,
        capturedVars
      });
    });
    
    proc.on('error', (err) => {
      const duration = Date.now() - startTime;
      resolve({
        index: entry.index,
        success: false,
        response: null,
        error: err.message,
        duration,
        capturedVars: {}
      });
    });
  });
}

function buildHurlContent(entry: { request: { method: string; url: string; headers?: { name: string; value: string }[]; body?: string } }, url: string): string {
  let content = `${entry.request.method} ${url}\n`;
  
  if (entry.request.headers) {
    for (const h of entry.request.headers) {
      content += `${h.name}: ${h.value}\n`;
    }
  }
  
  if (entry.request.body) {
    content += `\n${entry.request.body}\n`;
  }
  
  return content;
}