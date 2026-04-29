import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HurlEntry, CustomComment, HurlFile } from '../src/types/hurl';
import type { EntryResult } from '../src/executor/hurl-executor';
import type { ProcessResult, DatabaseResult } from '../src/processor/comment-processor';
import type { CliOptions } from '../src/index';

vi.mock('../src/executor/hurl-executor.js', () => ({
  executeHurlFile: vi.fn(),
}));

vi.mock('../src/processor/comment-processor.js', () => ({
  processCustomComments: vi.fn(),
  getScreenshotActions: vi.fn(() => []),
  disconnectAll: vi.fn(),
  filterCommentsByAction: vi.fn((comments, action) => comments.filter((c: any) => c.action === action)),
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
import { processCustomComments, getScreenshotActions } from '../src/processor/comment-processor.js';
import { generateOutput, writeOutputFile } from '../src/generator/output-generator.js';
import { generateHtml, htmlToPng } from '../src/generator/html-generator.js';
import { processResults } from '../src/index.js';

describe('Screenshot and Output Generation with Entry-by-Entry Flow', () => {
  let mockEntry: HurlEntry;
  let mockHurlFile: HurlFile;
  let mockOptions: CliOptions;
  let mockPreOutputDbResult: DatabaseResult;
  let mockPostOutputDbResult: DatabaseResult;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPreOutputDbResult = {
      type: 'postgres',
      name: 'pre-output-db',
      action: 'pre-output',
      query: 'SELECT * FROM users',
      result: {
        fields: [{ name: 'id' }, { name: 'name' }],
        rows: [{ id: 1, name: 'John' }],
      },
    };

    mockPostOutputDbResult = {
      type: 'postgres',
      name: 'post-output-db',
      action: 'post-output',
      query: 'SELECT * FROM orders',
      result: {
        fields: [{ name: 'order_id' }, { name: 'total' }],
        rows: [{ order_id: 100, total: 50.00 }],
      },
    };

    mockEntry = {
      index: 1,
      request: {
        method: 'GET',
        url: 'http://example.com/api',
      },
      customComments: [
        {
          action: 'pre-output',
          dbType: 'postgres',
          dsnVariable: '{{TEST_DB}}',
          query: 'SELECT * FROM users',
        } as CustomComment,
        {
          action: 'post-output',
          dbType: 'postgres',
          dsnVariable: '{{TEST_DB}}',
          query: 'SELECT * FROM orders',
        } as CustomComment,
      ],
      rawContent: '',
    };

    mockHurlFile = {
      filename: 'test.hurl',
      entries: [mockEntry],
      variables: { TEST_DB: 'test-dsn' },
    };

    mockOptions = {
      inputFile: 'test.hurl',
      outputDir: './output',
      variables: mockHurlFile.variables,
      stopOnFailure: false,
      strict: false,
    };

    (executeHurlFile as any).mockImplementation(async () => {
      return [
        {
          index: 1,
          success: true,
          response: { status: 200, headers: {}, body: '{"success": true}', duration: 100 },
          requestHeaders: [],
          capturedVars: {},
        } as EntryResult,
      ];
    });

    (processCustomComments as any).mockImplementation(async (entry: HurlEntry) => {
      const action = entry.customComments?.[0]?.action;
      if (action === 'pre-output') {
        return { success: true, results: [mockPreOutputDbResult] } as ProcessResult;
      } else if (action === 'post-output') {
        return { success: true, results: [mockPostOutputDbResult] } as ProcessResult;
      }
      return { success: true, results: [] } as ProcessResult;
    });

    (getScreenshotActions as any).mockReturnValue([
      { action: 'pre-output', query: 'SELECT * FROM users' },
      { action: 'post-output', query: 'SELECT * FROM orders' },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('screenshot generates with DB data from both pre-output and post-output', async () => {
    await processResults(mockHurlFile, mockOptions);

    expect(getScreenshotActions).toHaveBeenCalled();
    const calledWithDatabases = (getScreenshotActions as any).mock.calls[0][0];
    expect(calledWithDatabases).toBeDefined();
    expect(calledWithDatabases.length).toBe(2);
    expect(calledWithDatabases[0].action).toBe('pre-output');
    expect(calledWithDatabases[1].action).toBe('post-output');
  });

  test('generateHtml receives entryData with both pre-output and post-output results', async () => {
    await processResults(mockHurlFile, mockOptions);

    expect(generateHtml).toHaveBeenCalled();
    
    const generateHtmlCalls = (generateHtml as any).mock.calls;
    expect(generateHtmlCalls.length).toBeGreaterThan(0);
    
    const entryDataArray = generateHtmlCalls[0][0];
    expect(entryDataArray).toBeDefined();
    expect(Array.isArray(entryDataArray)).toBe(true);
    
    if (entryDataArray.length > 0) {
      const entryData = entryDataArray[0];
      expect(entryData.databases).toBeDefined();
      expect(entryData.databases.length).toBe(2);
      expect(entryData.databases[0].action).toBe('pre-output');
      expect(entryData.databases[1].action).toBe('post-output');
    }
  });

  test('output JSON preserves order: pre-output results before post-output results', async () => {
    await processResults(mockHurlFile, mockOptions);

    expect(generateOutput).toHaveBeenCalled();
    
    const generateOutputCalls = (generateOutput as any).mock.calls;
    expect(generateOutputCalls.length).toBeGreaterThan(0);
    
    const databases = generateOutputCalls[0][3];
    
    expect(databases).toBeDefined();
    expect(databases.length).toBe(2);
    
    expect(databases[0].action).toBe('pre-output');
    expect(databases[1].action).toBe('post-output');
  });
});
