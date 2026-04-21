import { spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { HurlFile } from '../types/hurl.js';
import type { HttpResponseData } from '../types/output.js';

export interface ExecutionOptions {
  stopOnFailure: boolean;
  outputDir: string;
  variables: Record<string, string>;
  inputFile: string;
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
  
  // Run hurl for each entry separately
  for (let i = 0; i < hurlFile.entries.length; i++) {
    const entryNum = i + 1;
    const args = [
      '--from-entry', String(entryNum),
      '--to-entry', String(entryNum)
    ];

    for (const [key, value] of Object.entries(options.variables)) {
      args.push('--variable', `${key}=${value}`);
    }

    args.push(options.inputFile);

    const { stdout, stderr, code, duration } = await runHurl(args);
    
    // Parse response from stdout
    // stdout contains the response body (JSON or text)
    // stderr contains the verbose output with status/headers
    
    let success = code === 0;
    let status = 200;
    let headers: Record<string, string> = {};
    let body = stdout.trim();
    
    // Try to parse JSON body for pretty printing
    try {
      const parsed = JSON.parse(body);
      body = JSON.stringify(parsed, null, 2);
    } catch {
      // Keep raw body if not JSON
    }
    
    // Extract status from stderr (verbose output)
    const statusMatch = stderr.match(/< HTTP\/[23] (\d{3})/);
    if (statusMatch) {
      status = parseInt(statusMatch[1], 10);
    }
    
    // Parse headers from stderr
    const headerMatches = stderr.matchAll(/< (\w+): (.+)/g);
    for (const match of headerMatches) {
      headers[match[1]] = match[2];
    }

    results.push({
      index: entryNum,
      success,
      response: {
        status,
        headers,
        body,
        duration
      },
      error: success ? undefined : stderr,
      duration,
      capturedVars: {}
    });
  }

  return results;
}

async function runHurl(args: string[]): Promise<{ stdout: string; stderr: string; code: number; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
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
      resolve({
        stdout,
        stderr,
        code: code || 0,
        duration: Date.now() - startTime
      });
    });

    proc.on('error', (err) => {
      resolve({
        stdout: '',
        stderr: err.message,
        code: 1,
        duration: Date.now() - startTime
      });
    });
  });
}
