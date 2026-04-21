import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { CaseOutput, HttpResponseData, DatabaseResult } from '../types/output.js';

export interface OutputOptions {
  outputDir: string;
  caseName?: string;
}

export function generateOutput(
  entryIndex: number,
  success: boolean,
  response: HttpResponseData | null,
  databases: DatabaseResult[],
  options: OutputOptions
): CaseOutput {
  return {
    name: options.caseName || `case${entryIndex}`,
    entryIndex,
    status: success ? 'pass' : 'fail',
    response: response || {
      status: 0,
      headers: {},
      body: '',
      duration: 0
    },
    duration: response?.duration || 0,
    databases
  };
}

export async function writeOutputFile(
  output: CaseOutput,
  options: OutputOptions
): Promise<string> {
  const dir = options.outputDir || './output';
  
  try {
    mkdirSync(dir, { recursive: true });
  } catch {
    // Directory may already exist
  }

  let filename = `${output.name}.json`;
  
  const filepath = join(dir, filename);
  
  try {
    mkdirSync(dirname(filepath), { recursive: true });
  } catch {
    // Directory may already exist
  }
  
  writeFileSync(filepath, JSON.stringify(output, null, 2));
  
  return filepath;
}

export async function writeAllOutputs(
  outputs: CaseOutput[],
  options: OutputOptions
): Promise<string[]> {
  const files: string[] = [];
  
  for (const output of outputs) {
    const filepath = await writeOutputFile(output, options);
    files.push(filepath);
  }
  
  return files;
}
