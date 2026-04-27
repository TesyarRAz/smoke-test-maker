import { readFileSync } from 'fs';
import type { HurlFile, HurlEntry, CustomComment, HttpMethod, HurlHeader, HurlCapture, HurlAssert, HurlOptions } from '../types/hurl.js';

const METHOD_REGEX = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(.+)$/i;
const SECTION_REGEX = /^\[(Captures|Asserts|Options)\]$/i;
const HTTP_STATUS_REGEX = /^HTTP\s+\d+$/i;
const CUSTOM_COMMENT_REGEX = /(?:#|>)\s*(output|screenshot|pre-output|post-output):(postgres|postgresdb|mysql|mongodb|testdb):(\{[^}]+\}|[^|]+)(\|(.+))?$/;
const SCREENSHOT_ONLY_REGEX = /^#\s*screenshot$/i;
const SKIP_REGEX = /^#\s*skip$/i;
const TITLE_REGEX = /^#\s*title:(.+)$/i;
const HEADER_REGEX = /^([^:]+):\s*(.+)$/;
const SHOW_HEADER_REGEX = /^#\s*show-header:\s*(.+)$/i;

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
  let inBody = false;
  let bodyLines: string[] = [];
  let pendingScreenshot = false;
  let pendingTitle = '';

  for (const line of lines) {
    lineNum++;
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('>')) {
      if (SKIP_REGEX.test(trimmed)) {
        if (inResponse) {
          postCommentLines.push(trimmed);
        } else {
          commentLines.push(trimmed);
        }
      } else if (TITLE_REGEX.test(trimmed)) {
        const match = trimmed.match(TITLE_REGEX);
        if (match) {
          pendingTitle = match[1].trim();
        }
      } else if (CUSTOM_COMMENT_REGEX.test(line)) {
        if (inResponse) {
          postCommentLines.push(line);
        } else {
          commentLines.push(line);
        }
      } else if (SHOW_HEADER_REGEX.test(trimmed)) {
        if (inResponse) {
          postCommentLines.push(trimmed);
        } else if (currentEntry) {
          currentEntry.rawContent = (currentEntry.rawContent ? currentEntry.rawContent + '\n' : '') + trimmed;
        } else {
          commentLines.push(trimmed);
        }
      } else if (SCREENSHOT_ONLY_REGEX.test(trimmed)) {
        if (currentEntry) {
          (currentEntry as any).showScreenshot = true;
        } else {
          pendingScreenshot = true;
        }
      } else if (trimmed.startsWith('#') || trimmed.startsWith('>')) {
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
        currentEntry = null;
      }

      const method = methodMatch[1].toUpperCase() as HttpMethod;
      const url = methodMatch[2].trim();

      currentEntry = {
        index: entries.length + 1,
        request: { method, url },
        rawContent: commentLines.join('\n') + (postCommentLines.length > 0 ? '\n' + postCommentLines.join('\n') : '')
      };
      if (pendingScreenshot) {
        (currentEntry as any).showScreenshot = true;
        pendingScreenshot = false;
      }
      if (pendingTitle) {
        (currentEntry as any).title = pendingTitle;
        pendingTitle = '';
      }
      commentLines = [];
      postCommentLines = [];
      inResponse = false;
      currentSection = null;
      inBody = false;
      bodyLines = [];
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
      if (!currentSection && !inBody && trimmed === '{' && currentEntry.request.body === undefined) {
        inBody = true;
        bodyLines.push(trimmed);
      } else if (inBody) {
        bodyLines.push(trimmed);
        if (trimmed === '}') {
          currentEntry.request.body = bodyLines.join('\n');
          inBody = false;
          bodyLines = [];
        }
      } else {
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
  }

  if (currentEntry) {
    // Preserve rawContent if already set (from METHOD line processing), only append postCommentLines
    if (currentEntry.rawContent) {
      currentEntry.rawContent += (postCommentLines.length > 0 ? '\n' + postCommentLines.join('\n') : '');
    } else {
      currentEntry.rawContent = commentLines.join('\n') + (postCommentLines.length > 0 ? '\n' + postCommentLines.join('\n') : '');
    }
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
    const showHeaders: string[] = [];
    const lines = entry.rawContent.split('\n');

    for (const line of lines) {
      const match = line.match(CUSTOM_COMMENT_REGEX);
      if (match) {
        customComments.push({
          action: match[1] as 'output' | 'screenshot',
          dbType: match[2] as 'postgres' | 'postgresdb' | 'mysql' | 'mongodb',
          dsnVariable: match[3],
          query: match[5]
        });
      }

      const screenshotMatch = line.match(SCREENSHOT_ONLY_REGEX);
      if (screenshotMatch) {
        entry.showScreenshot = true;
      }

      // Handle show-header directives
      const showHeaderMatch = line.match(SHOW_HEADER_REGEX);
      if (showHeaderMatch) {
        const raw = showHeaderMatch[1];
        const headers = raw.split(',').map(s => s.trim()).filter(Boolean);
        showHeaders.push(...headers);
      }
    }

    if (customComments.length > 0) {
      entry.customComments = customComments;
    }
    if (showHeaders.length > 0) {
      entry.showHeaders = showHeaders;
    }
  }
}

function processSkipMarkers(entries: HurlEntry[]): void {
  for (const entry of entries) {
    const lines = entry.rawContent.split('\n');
    entry.skip = lines.some(line => SKIP_REGEX.test(line.trim()));
    const titleLine = lines.find(line => TITLE_REGEX.test(line.trim()));
    if (titleLine && !entry.title) {
      const match = titleLine.match(TITLE_REGEX);
      if (match) {
        entry.title = match[1].trim();
      }
    }
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