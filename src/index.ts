import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parse } from 'dotenv';
import { resolve } from 'path';
import { parseHurlFile } from './parser/hurl-parser.js';
import { executeHurlFile, type ExecutionOptions, type EntryResult } from './executor/hurl-executor.js';
import { generateOutput, writeOutputFile } from './generator/output-generator.js';
import { processCustomComments, getScreenshotActions } from './processor/comment-processor.js';
import { shouldSkipOutput, getSkippedEntries } from './handler/skip-handler.js';
import { generateHtml, htmlToPng, type ScreenshotData } from './generator/html-generator.js';
import type { CaseOutput, HttpResponseData, DatabaseResult, ExecutionResult } from './types/output.js';
import type { HurlFile } from './types/hurl.js';

interface CliOptions {
  inputFile: string;
  envFile?: string;
  outputDir: string;
  stopOnFailure: boolean;
  variables: Record<string, string>;
}

async function run() {
  const program = new Command();

  program
    .name('smoke-test-maker')
    .description('CLI tool to generate smoke tests from .hurl files with DB query integration')
    .version('1.0.0')
    .argument('<input>', 'Path to .hurl file')
    .option('-e, --env <path>', 'Path to .env file')
    .option('-o, --output-dir <path>', 'Output directory', './output')
    .option('-s, --stop-on-failure', 'Stop execution on first failure', false)
    .option('-v, --variable <key=value>', 'Set variable (can be repeated)', (val: string, prev: string[]) => {
      if (!prev) prev = [];
      prev.push(val);
      return prev;
    }, [] as string[]);

  program.parse(process.argv);

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

  if (opts.env) {
    const envPath = resolve(process.cwd(), opts.env);
    try {
      const envConfig = parse(readFileSync(envPath));
      for (const [key, value] of Object.entries(envConfig)) {
        variables[key] = value;
      }
    } catch (err) {
      console.warn(`Warning: Could not load .env file: ${err}`);
    }
  }

  const options: CliOptions = {
    inputFile,
    envFile: opts.env,
    outputDir: opts.outputDir || './output',
    stopOnFailure: opts.stopOnFailure || false,
    variables
  };

  const startTime = Date.now();
  let success = true;
  let error: string | undefined;

  try {
    // Step 1: Parse hurl file
    console.log('Parsing hurl file:', options.inputFile);
    const hurlFile: HurlFile = parseHurlFile(options.inputFile);
    console.log(`Found ${hurlFile.entries.length} entries`);

    // Step 2: Execute entries
    console.log('Executing entries...');
    const execOptions: ExecutionOptions = {
      stopOnFailure: options.stopOnFailure,
      outputDir: options.outputDir,
      variables: options.variables,
      inputFile: inputFile
    };
    
    const results: EntryResult[] = await executeHurlFile(hurlFile, execOptions);
    console.log(`Executed ${results.length} entries`);

    // Step 3: Process results and write output files
    const outputs: CaseOutput[] = [];
    const skippedEntries: number[] = getSkippedEntries(hurlFile.entries);
    const accumulatedData: ScreenshotData[] = [];
    let entryData: ScreenshotData | null = null;

    console.log('Processing outputs...');
    for (const result of results) {
      const entry = hurlFile.entries.find(e => e.index === result.index);
      if (!entry) continue;

      const databases: DatabaseResult[] = [];
      const mergedVariables = { ...options.variables, ...result.capturedVars };
      if (entry.customComments && entry.customComments.length > 0) {
        const dbResult = await processCustomComments(entry, mergedVariables);
        if (!dbResult.success) {
          console.error(`DB query failed for entry ${entry.index}: ${dbResult.error}`);
          databases.push(...dbResult.results);
        } else {
          databases.push(...dbResult.results);
        }
      }

      entryData = {
        httpResponse: result.response,
        databases,
        requestBody: entry.request?.body,
        requestUrl: entry.request?.url,
        requestMethod: entry.request?.method
      };
      accumulatedData.push(entryData);

      const screenshotActions = getScreenshotActions(databases);
      if (screenshotActions.length > 0) {
        const caseName = `case${entry.index}_screenshot_${screenshotActions.filter(a => a.action === 'screenshot' || a.action === 'pre-output' || a.action === 'post-output').length}`;
        // Only include current entry data, not all accumulated
        const html = generateHtml([entryData]);
        const pngPath = await htmlToPng(html, { outputDir: options.outputDir, caseName });
        console.log(`Generated screenshot: ${pngPath}`);
      }

      if (!shouldSkipOutput(entry)) {
        const caseName = `case${entry.index}`;
        const output = generateOutput(
          entry.index,
          result.success,
          result.response,
          databases,
          { outputDir: options.outputDir, caseName }
        );
        
        const filepath = await writeOutputFile(output, { outputDir: options.outputDir });
        console.log(`Wrote output: ${filepath}`);
        outputs.push(output);
      }
    }

    const totalDuration = Date.now() - startTime;

    // Print summary
    console.log('\n--- Summary ---');
    console.log(`Total entries: ${results.length}`);
    console.log(`Successful: ${results.filter(r => r.success).length}`);
    console.log(`Failed: ${results.filter(r => !r.success).length}`);
    console.log(`Skipped: ${skippedEntries.length}`);
    console.log(`Output files: ${outputs.length}`);
    console.log(`Duration: ${totalDuration}ms`);

    // Set exit code based on results
    const hasFailures = results.some(r => !r.success);
    if (hasFailures) {
      console.error('\n=== Failed Entries ===');
      for (const r of results) {
        if (!r.success) {
          console.error(`\nEntry ${r.index} FAILED:`);
          if (r.error) {
            // Print last 10 lines of error
            const errLines = r.error.split('\n').slice(-10);
            for (const line of errLines) {
              console.error('  ' + line);
            }
          }
        }
      }
      success = false;
    }

  } catch (err) {
    error = String(err);
    console.error('Error:', error);
    success = false;
  }

  const exitCode = success ? 0 : 1;
  process.exit(exitCode);
}

run();
