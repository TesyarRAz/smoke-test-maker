import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';
import { resolve, dirname, join } from 'path';
import { existsSync } from 'fs';

export interface CliOptions {
  inputFile: string;
  envFile?: string;
  outputDir: string;
  stopOnFailure: boolean;
  strict: boolean;
  variables: Record<string, string>;
}

let cliOptions: CliOptions;

export function parseCliArgs(args: string[]): CliOptions {
  const program = new Command();

  program
    .name('smoke-test-maker')
    .description('CLI tool to generate smoke tests from .hurl files with DB query integration')
    .version('1.0.0')
    .argument('<input>', 'Path to .hurl file')
    .option('-e, --env <path>', 'Path to .env file')
    .option('-o, --output-dir <path>', 'Output directory', './output')
    .option('-s, --stop-on-failure', 'Stop execution on first failure', false)
    .option('--strict', 'Exit with error if any case fails', false)
    .option('-v, --variable <key=value>', 'Set variable (can be repeated)', (val: string, prev: string[]) => {
      if (!prev) prev = [];
      prev.push(val);
      return prev;
    }, [] as string[]);

  program.parse(args);

  const inputFile = program.args[0];
  const opts = program.opts();
  
  if (!inputFile) {
    program.error('Input file is required');
  }

  const variables: Record<string, string> = {};
      
  if (opts.variable) {
    for (const v of opts.variable) {
      const [key, ...valueParts] = v.split('=');
      if (key && valueParts.length > 0) {
        variables[key] = valueParts.join('=');
      }
    }
  }

  // Auto-load .env from same folder as hurl file if not explicitly provided
  let envPath: string | null = null;
  if (opts.env) {
    envPath = resolve(process.cwd(), opts.env);
  } else {
    // Try .env in same folder as input file  
    const autoEnvPath = join(dirname(inputFile), '.env');
    if (existsSync(autoEnvPath)) {
      envPath = autoEnvPath;
    }
  }

  if (envPath) {
    try {
      const envConfig = parse(readFileSync(envPath));
      for (const [key, value] of Object.entries(envConfig)) {
        variables[key] = value;
      }
      console.log('Loaded .env from:', envPath);
    } catch (err) {
      console.warn(`Warning: Could not load .env file: ${err}`);
    }
  }

  // Derive the default output directory from the input file location
  const defaultOutputDir = join(dirname(inputFile), 'output');

  cliOptions = {
    inputFile,
    envFile: opts.env,
    // Use user-provided outputDir when supplied, otherwise derive from input file
    outputDir: (opts.outputDir ?? defaultOutputDir),
    stopOnFailure: opts.stopOnFailure || false,
    strict: opts.strict || false,
    variables
  };

  return cliOptions;
}

export function getCliOptions(): CliOptions {
  if (!cliOptions) {
    return parseCliArgs(process.argv);
  }
  return cliOptions;
}
