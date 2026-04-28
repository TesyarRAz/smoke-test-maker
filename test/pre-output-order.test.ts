import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { HurlEntry, CustomComment, HurlFile } from '../src/types/hurl.js';
import type { EntryResult } from '../src/executor/hurl-executor.js';
import type { ProcessResult, DatabaseResult } from '../src/processor/comment-processor.js';
import type { CliOptions } from '../src/index.js';

vi.mock('../src/executor/hurl-executor.js', () => ({
  executeHurlFile: vi.fn(),
}));

vi.mock('../src/processor/comment-processor.js', () => ({
  processCustomComments: vi.fn(),
  getScreenshotActions: vi.fn(() => []),
}));

vi.mock('../src/generator/output-generator.js', () => ({
  generateOutput: vi.fn(),
  writeOutputFile: vi.fn(),
  filterHeaders: vi.fn((headers) => headers),
}));

vi.mock('../src/generator/html-generator.js', () => ({
  generateHtml: vi.fn(() => '<html></html>'),
  htmlToPng: vi.fn(),
}));

vi.mock('../src/handler/skip-handler.js', () => ({
  shouldSkipOutput: vi.fn(() => false),
  getSkippedEntries: vi.fn(() => []),
}));

import { executeHurlFile } from '../src/executor/hurl-executor.js';
import { processCustomComments } from '../src/processor/comment-processor.js';
import { processResults } from '../src/index.js';

describe('Pre-output execution order (TDD RED phase)', () => {
  let callOrder: string[] = [];
  let mockEntry: HurlEntry;
  let mockHurlFile: HurlFile;
  let mockOptions: CliOptions;

  beforeEach(() => {
    callOrder = [];
    vi.clearAllMocks();

    mockEntry = {
      index: 1,
      request: {
        method: 'GET',
        url: 'http://example.com/api',
      },
      customComments: [
        {
          action: 'pre-output',
          dbType: 'testdb',
          dsnVariable: '{{TEST_DB}}',
          query: 'SELECT 1',
        } as CustomComment,
        {
          action: 'post-output',
          dbType: 'testdb',
          dsnVariable: '{{TEST_DB}}',
          query: 'SELECT 2',
        } as CustomComment,
      ],
      rawContent: '',
    };

    mockHurlFile = {
      filename: 'test.hurl',
      entries: [mockEntry],
      variables: { TEST_DB: 'test-dsn', initialVar: 'initial' },
    };

    mockOptions = {
      inputFile: 'test.hurl',
      outputDir: './output',
      variables: mockHurlFile.variables,
      stopOnFailure: false,
      strict: false,
    };

    (executeHurlFile as vi.Mock).mockImplementation(async () => {
      callOrder.push('executeHurlFile');
      return [
        {
          index: 1,
          success: true,
          response: { status: 200, headers: {}, body: '', duration: 100 },
          requestHeaders: [],
          capturedVars: { capturedVar: 'captured-value' },
        } as EntryResult,
      ];
    });

    (processCustomComments as vi.Mock).mockImplementation(async (entry: HurlEntry) => {
      const action = entry.customComments?.[0]?.action || 'unknown';
      callOrder.push(`processCustomComments-${action}`);
      return { success: true, results: [] as DatabaseResult[] } as ProcessResult;
    });
  });

  test('pre-output comments are processed BEFORE executeHurlFile (RED)', async () => {
    await processResults(mockHurlFile, mockOptions);

    const preOutputIndex = callOrder.indexOf('processCustomComments-pre-output');
    const executeIndex = callOrder.indexOf('executeHurlFile');

    expect(preOutputIndex).toBeLessThan(executeIndex);
  });

  test('post-output comments are processed AFTER executeHurlFile (RED)', async () => {
    await processResults(mockHurlFile, mockOptions);

    const executeIndex = callOrder.indexOf('executeHurlFile');
    const postOutputIndex = callOrder.indexOf('processCustomComments-post-output');

    expect(postOutputIndex).toBeGreaterThan(executeIndex);
  });

  test('pre-output uses accumulatedVars only (no current captures) (RED)', async () => {
    const passedVariablesPerCall: Record<string, Record<string, string>> = {};

    (processCustomComments as vi.Mock).mockImplementation(async (entry: HurlEntry, variables: Record<string, string>) => {
      const action = entry.customComments?.[0]?.action || 'unknown';
      passedVariablesPerCall[action] = { ...variables };
      callOrder.push(`processCustomComments-${action}`);
      return { success: true, results: [] as DatabaseResult[] } as ProcessResult;
    });

    await processResults(mockHurlFile, mockOptions);

    const preOutputVars = passedVariablesPerCall['pre-output'];
    expect(preOutputVars).not.toHaveProperty('capturedVar');
    expect(preOutputVars).toHaveProperty('initialVar', 'initial');
  });
});
