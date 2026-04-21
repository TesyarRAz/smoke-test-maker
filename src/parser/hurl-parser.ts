import { readFileSync } from 'fs';
import type { HurlFile, HurlEntry, CustomComment, HttpMethod, HurlHeader, HurlCapture, HurlAssert, HurlOptions } from '../types/hurl.js';

const METHOD_REGEX = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/i;
const SECTION_REGEX = /^\[(Captures|Asserts|Options)\]$/i;
const HTTP_STATUS_REGEX = /^HTTP\s+\d+$/i;
const CUSTOM_COMMENT_REGEX = /#\s*(output|screenshot|pre-output|post-output):(postgresdb|mysql|mongodb|testdb):(\{[^}]+\}|[^|]+)\|(.+)$/;
const SKIP_REGEX = /^#\s*skip$/i;
const HEADER_REGEX = /^([^:]+):\s*(.+)$/;

export function parseHurlFile(filepath: string): HurlFile {
  const content = readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  
  const entries: HurlEntry[] = [];
  let currentEntry: HurlEntry | null = null;
  let currentSection: string | null = null;
  let commentLines: string[] = [];
  let postCommentLines: string[] = [];
  let inResponse = false;
  let lineNum = 0;

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      if (SKIP_REGEX.test(trimmed)) {
        if (inResponse) {
          postCommentLines.push(trimmed);
        } else {
          commentLines.push(trimmed);
        }
      } else if (CUSTOM_COMMENT_REGEX.test(trimmed)) {
        if (inResponse) {
          postCommentLines.push(trimmed);
        } else {
          commentLines.push(trimmed);
        }
      }
      continue;
    }

    if (HTTP_STATUS_REGEX.test(trimmed)) {
      inResponse = true;
      continue;
    }

    const methodMatch = trimmed.match(METHOD_REGEX);
    if (methodMatch) {
      if (currentEntry) {
        entries.push(currentEntry);
      }

      const method = methodMatch[1].toUpperCase() as HttpMethod;
      const url = methodMatch[2].trim();

      currentEntry = {
        index: entries.length + 1,
        request: { method, url },
        rawContent: commentLines.join('\n')
      };
      commentLines = [];
      postCommentLines = [];
      inResponse = false;
      currentSection = null;
      continue;
    }

    const sectionMatch = trimmed.match(SECTION_REGEX);
    if (sectionMatch && currentEntry) {
      currentSection = sectionMatch[1];
      if (currentSection === 'Captures') {
        currentEntry.captures = [];
      } else if (currentSection === 'Asserts') {
        currentEntry.asserts = [];
      } else if (currentSection === 'Options') {
        currentEntry.options = {};
      }
      continue;
    }

    if (currentEntry && trimmed) {
      if (currentSection === 'Captures' && trimmed.includes(':')) {
        const [name, query] = trimmed.split(':').map(s => s.trim());
        currentEntry.captures!.push({ name, query });
      } else if (currentSection === 'Asserts') {
        currentEntry.asserts!.push({ query: trimmed, predicate: 'exists' });
      } else if (currentSection === 'Options' && trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map(s => s.trim());
        (currentEntry.options as Record<string, unknown>)[key] = value;
      } else if (!currentSection && trimmed.includes(':')) {
        const headerMatch = trimmed.match(HEADER_REGEX);
        if (headerMatch && currentEntry) {
          if (!currentEntry.request.headers) {
            currentEntry.request.headers = [];
          }
          currentEntry.request.headers.push({
            name: headerMatch[1].trim(),
            value: headerMatch[2].trim()
          });
        }
      } else if (!currentSection && currentEntry.request.body === undefined) {
        currentEntry.request.body = trimmed;
      }
    }
  }

  if (currentEntry) {
    currentEntry.rawContent = (commentLines.join('\n') + (postCommentLines.length > 0 ? '\n' + postCommentLines.join('\n') : ''));
    entries.push(currentEntry);
  }

  processCustomComments(entries);
  processSkipMarkers(entries);

  return {
    filename: filepath,
    entries,
    variables: {}
  };
}

function processCustomComments(entries: HurlEntry[]): void {
  for (const entry of entries) {
    const customComments: CustomComment[] = [];
    const lines = entry.rawContent.split('\n');

    for (const line of lines) {
      const match = line.match(CUSTOM_COMMENT_REGEX);
      if (match) {
        customComments.push({
          action: match[1] as 'output' | 'screenshot',
          dbType: match[2] as 'postgresdb' | 'mysql' | 'mongodb',
          dsnVariable: match[3],
          query: match[4]
        });
      }
    }

    if (customComments.length > 0) {
      entry.customComments = customComments;
    }
  }
}

function processSkipMarkers(entries: HurlEntry[]): void {
  for (const entry of entries) {
    const lines = entry.rawContent.split('\n');
    entry.skip = lines.some(line => SKIP_REGEX.test(line.trim()));
  }
}

export function extractVariables(hurlFile: HurlFile, initialVars: Record<string, string> = {}): Record<string, string> {
  const vars = { ...initialVars };

  for (const entry of hurlFile.entries) {
    if (entry.captures) {
      for (const cap of entry.captures) {
        vars[cap.name] = '';
      }
    }
  }

  return vars;
}