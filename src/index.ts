import { Command } from 'commander';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { parse } from 'dotenv';
import { resolve, dirname, join, basename } from 'path';
import { existsSync } from 'fs';
import { parseHurlFile } from './parser/hurl-parser.js';
import { executeHurlFile, type ExecutionOptions, type EntryResult } from './executor/hurl-executor.js';
import { generateOutput, writeOutputFile, filterHeaders } from './generator/output-generator.js';
import { generateGraphml, generateFlowHtml } from './generator/graphml-generator.js';
import { processCustomComments, getScreenshotActions, disconnectAll } from './processor/comment-processor.js';
import { shouldSkipOutput, getSkippedEntries } from './handler/skip-handler.js';
import { generateHtml, htmlToPng, type ScreenshotData } from './generator/html-generator.js';
import type { CaseOutput, HttpResponseData, DatabaseResult, ExecutionResult } from './types/output.js';
import type { HurlFile } from './types/hurl.js';

interface CliOptions {
  inputFile: string;
  envFile?: string;
  outputDir: string;
  stopOnFailure: boolean;
  strict: boolean;
  variables: Record<string, string>;
  veryVerbose?: boolean;
  displayMode?: string;
  displayWidth?: number;
}

async function run() {
  const program = new Command();

  program
    .name('smoke-test-maker')
    .description('CLI tool to generate smoke tests from .hurl files with DB query integration')
    .version('1.0.0')
    .argument('<input>', 'Path to .hurl file')
    .option('-e, --env <path>', 'Path to .env file')
    .option('-o, --output-dir <path>', 'Output directory')
    .option('-s, --stop-on-failure', 'Stop execution on first failure', false)
    .option('--strict', 'Exit with error if any case fails', false)
    .option('-v, --variable <key=value>', 'Set variable (can be repeated)', (val: string, prev: string[]) => {
      if (!prev) prev = [];
      prev.push(val);
      return prev;
    }, [] as string[])
 .option('-d, --very-verbose', 'Print detailed debug information including DB connections', false)
 .option('--display-mode <mode>', 'Display mode: vertical, horizontal, or grid', 'vertical')
 .option('--display-width <width>', 'Display width in px', (val) => parseInt(val, 10), 1400)
    .option('--graphml', 'Generate GraphML flow diagram and PNG image', false)

program.parse(process.argv);

const graphmlOpts = program.opts();

// Handle --graphml flag: Generate GraphML + HTML flow diagram + PNG screenshot
if (graphmlOpts.graphml) {
  const inputFile = program.args[0];
  if (!inputFile) {
    program.error('Input file is required');
  }
  
  const hurlFile: HurlFile = parseHurlFile(inputFile);
  const defaultOutputDir = join(dirname(inputFile), 'output');
  const outputDir = graphmlOpts.outputDir ?? defaultOutputDir;
  const caseName = basename(inputFile).replace(/\.hurl$/, '');
  
  mkdirSync(outputDir, { recursive: true });
  
  const graphml = generateGraphml(hurlFile.entries);
  const graphmlName = caseName + '.graphml';
  const graphmlPath = join(outputDir, graphmlName);
  writeFileSync(graphmlPath, graphml);
  console.log(`GraphML generated: ${graphmlPath}`);
  
  const flowHtml = generateFlowHtml(hurlFile.entries);
  const flowHtmlPath = join(outputDir, caseName + '_flow.html');
  writeFileSync(flowHtmlPath, flowHtml);
  console.log(`Flow HTML generated: ${flowHtmlPath}`);

  const pngPath = join(outputDir, caseName + '_flow.png');
  
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 4096, height: 2048 });
  await page.setContent(flowHtml, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: pngPath, fullPage: true, type: 'png' });
  await browser.close();
  console.log(`Flow PNG generated: ${pngPath}`);
  
  process.exit(0);
}

// Forward CLI options to HTML generator if available
const cliOptions: any = {
  displayMode: (program as any).displayMode ?? 'vertical',
  displayWidth: (program as any).displayWidth ?? 1400
};
const htmlGen: any = (globalThis as any).htmlGenerator;
if (typeof htmlGen === 'function') {
  try {
    htmlGen(cliOptions);
  } catch {
    // ignore if html generator couldn't be invoked
  }
}

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

  const defaultOutputDir = join(dirname(inputFile), 'output');
  const options: CliOptions = {
    inputFile,
    envFile: opts.env,
    outputDir: (opts.outputDir ?? defaultOutputDir),
    stopOnFailure: (opts.stopOnFailure ?? false),
    strict: (opts.strict ?? false),
    variables,
    veryVerbose: (opts as any).veryVerbose ?? false
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
      inputFile: inputFile,
      strict: options.strict
    };
    
    const results: EntryResult[] = await executeHurlFile(hurlFile, execOptions);
    console.log(`Executed ${results.length} entries`);

    // Step 3: Process results and write output files
    const outputs: CaseOutput[] = [];
    const skippedEntries: number[] = getSkippedEntries(hurlFile.entries);
    const accumulatedData: ScreenshotData[] = [];
    let entryData: ScreenshotData | null = null;

    console.log('Processing outputs...');
    let accumulatedVars = { ...options.variables };
    
    for (const result of results) {
      const entry = hurlFile.entries.find(e => e.index === result.index);
      if (!entry) continue;

      const databases: DatabaseResult[] = [];
      const mergedVariables = { ...accumulatedVars, ...result.capturedVars };
      if (entry.customComments && entry.customComments.length > 0) {
        try {
          const dbResult = await processCustomComments(entry, mergedVariables, options.veryVerbose);
          if (!dbResult.success) {
            throw new Error(dbResult.error);
          }
          databases.push(...dbResult.results);
        } catch (error) {
          console.error(`Error: ${error instanceof Error ? error.message : error}`);
          process.exit(1);
        }
      }

      entryData = {
        httpResponse: result.response ? {
          ...result.response,
          headers: filterHeaders(result.response.headers || {}, entry.showHeaders)
        } : null,
        databases,
        requestBody: entry.request?.body,
        requestUrl: entry.request?.url,
        requestMethod: entry.request?.method,
        requestHeaders: result.requestHeaders,
        title: entry.title
      };
      accumulatedData.push(entryData);

      if (result.capturedVars && Object.keys(result.capturedVars).length > 0) {
        accumulatedVars = { ...accumulatedVars, ...result.capturedVars };
      }

      const screenshotActions = getScreenshotActions(databases);
      if ((screenshotActions.length > 0 || entry.showScreenshot) && !entry.skip) {
        const caseName = entry.showScreenshot 
          ? `case${entry.index}_screenshot`
          : `case${entry.index}_screenshot_${screenshotActions.filter(a => a.action === 'screenshot' || a.action === 'pre-output' || a.action === 'post-output').length}`;
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
          { outputDir: options.outputDir, caseName, title: entry.title, showHeaders: entry.showHeaders, requestHeaders: result.requestHeaders }
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
    
    // Strict mode: print errors to stderr and exit with error
    if (options.strict && hasFailures) {
      const failedResults = results.filter(r => !r.success);
      for (const r of failedResults) {
        if (r.error) {
          console.error(`\n=== Entry ${r.index} Error ===`);
          console.error(r.error);
        }
      }
      process.exit(1);
    }
    
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
  await disconnectAll();
  process.exit(exitCode);
}

run();
