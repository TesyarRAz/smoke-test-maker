import { spawn } from 'child_process';
import type { HurlFile } from '../types/hurl.js';
import type { HttpResponseData } from '../types/output.js';

export interface ExecutionOptions {
  stopOnFailure: boolean;
  strict: boolean;
  outputDir: string;
  variables: Record<string, string>;
  inputFile: string;
}

export interface EntryResult {
  index: number;
  success: boolean;
  response: HttpResponseData | null;
  requestHeaders?: { name: string; value: string }[];
  error?: string;
  duration: number;
  capturedVars: Record<string, string>;
}

export async function executeHurlFile(hurlFile: HurlFile, options: ExecutionOptions): Promise<EntryResult[]> {
  const results: EntryResult[] = [];
  // Accumulator for variables to pass into hurl for subsequent entries
  // Start with the initial options.variables and extend with captures from each entry
  let accumulatedVariables: Record<string, string> = { ...options.variables };
  
  for (let i = 0; i < hurlFile.entries.length; i++) {
    const entryNum = i + 1;
    const args = ['--json', '--very-verbose', '--from-entry', String(entryNum), '--to-entry', String(entryNum)];

    // Pass in all accumulated variables (initial + captures from previous entries)
    for (const [key, value] of Object.entries(accumulatedVariables)) {
      args.push('--variable', `${key}=${value}`);
    }

    args.push(options.inputFile);

    const { stdout, stderr, code, duration: execDuration } = await runHurl(args);
    
    let success = false;
    let status = 200;
    let headers: Record<string, string> = {};
    let body = '';
    let capturedVars: Record<string, string> = {};
    let entryDuration = execDuration;
    let requestHeaders: { name: string; value: string }[] = [];
    
    try {
      const hurlOutput = JSON.parse(stdout);
      
      for (const entryData of hurlOutput.entries || []) {
        success = (entryData.asserts || []).every((a: any) => a.success);
        
        const call = entryData.calls?.[0];
        const resp = call?.response;
        const req = call?.request;
        
        status = resp?.status || 200;
        entryDuration = entryData.time || execDuration;
        
        if (req?.headers && Array.isArray(req.headers)) {
          requestHeaders = req.headers;
        }
        
        if (resp?.headers && Array.isArray(resp.headers)) {
          for (const h of resp.headers) {
            headers[h.name] = h.value;
          }
        }
        
        const bodyMatch = stderr.match(/\* Response body:\r?\n([\s\S]*?)(?=\r?\n\* [A-Z])/);
        if (bodyMatch) {
          body = bodyMatch[1].replace(/^\* /gm, '').trim();
        }
        
        for (const cap of entryData.captures || []) {
          if (cap.name && cap.value !== undefined) {
            capturedVars[cap.name] = String(cap.value);
          }
        }
        
        try {
          const parsed = JSON.parse(body);
          body = JSON.stringify(parsed, null, 2);
        } catch {
          // Keep raw
        }
      }
    } catch {
      success = false;
      body = stdout;
    }

    // Merge any captured variables from this entry into the accumulator for subsequent iterations
    if (capturedVars && Object.keys(capturedVars).length > 0) {
      accumulatedVariables = { ...accumulatedVariables, ...capturedVars };
    }

    results.push({
      index: entryNum,
      success,
      response: { status, headers, body, duration: entryDuration },
      requestHeaders,
      error: success ? undefined : stderr,
      duration: entryDuration,
      capturedVars
    });
  }

  return results;
}

async function runHurl(args: string[]): Promise<{ stdout: string; stderr: string; code: number; duration: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const proc = spawn('hurl', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0, duration: Date.now() - startTime });
    });

    proc.on('error', (err) => {
      resolve({ stdout: '', stderr: err.message, code: 1, duration: Date.now() - startTime });
    });
  });
}
