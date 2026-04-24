import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { HttpResponseData, DatabaseResult } from '../types/output.js';

export interface ScreenshotData {
  httpResponse: HttpResponseData | null;
  databases: DatabaseResult[];
  requestBody?: string;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: { name: string; value: string }[];
}

export interface HtmlGeneratorOptions {
  outputDir: string;
  caseName: string;
  displayMode?: 'vertical' | 'horizontal' | 'grid';
  displayWidth?: string;
}

export function generateHtml(data: ScreenshotData[], options: { displayMode?: 'vertical' | 'horizontal' | 'grid'; displayWidth?: string } = {}): string {
  const { displayMode = 'vertical', displayWidth = '1400px' } = options;
  const items = data.filter(d => d.httpResponse || d.databases.length > 0);
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Smoke Test Results</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; background: #ef2028; min-height: 100vh; }
    .container { max-width: ${displayWidth}; margin: 0 auto; }
    .header { background: white; padding: 24px; margin-bottom: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header h1 { font-size: 28px; color: #333; margin-bottom: 8px; }
    .header p { color: #666; font-size: 14px; }
    .section-title { font-size: 18px; font-weight: 600; color: white; margin: 24px 0 16px; padding: 12px 16px; background: rgba(0,0,0,0.2); border-radius: 8px; }
    .http-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; }
    .http-header { background: #f8f9fa; padding: 16px 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; }
    .http-method { font-weight: 700; font-size: 14px; padding: 4px 12px; border-radius: 4px; }
    .method-get { background: #61affe; color: white; }
    .method-post { background: #49cc90; color: white; }
    .method-put { background: #fca130; color: white; }
    .method-delete { background: #f93e3e; color: white; }
    .http-url { font-family: monospace; font-size: 13px; color: #333; }
    .http-status { font-weight: 600; font-size: 14px; padding: 4px 12px; border-radius: 4px; }
    .status-2xx { background: #d4edda; color: #155724; }
    .status-4xx { background: #fff3cd; color: #856404; }
    .status-5xx { background: #f8d7da; color: #721c24; }
    .http-body { padding: 20px; }
    .info-section { margin-bottom: 20px; }
    .info-section:last-child { margin-bottom: 0; }
    .info-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .info-value { background: #f8f9fa; padding: 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; }
    .cookies-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .cookies-table th { background: #e9ecef; padding: 8px; text-align: left; font-weight: 600; }
    .cookies-table td { padding: 8px; border-bottom: 1px solid #dee2e6; font-family: monospace; }
    .db-card { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 16px; overflow: hidden; }
    .db-header { background: #e7f3ff; padding: 12px 20px; border-bottom: 1px solid #b8daff; display: flex; justify-content: space-between; align-items: center; }
    .db-type { font-weight: 600; color: #004085; }
    .db-action { background: #17a2b8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .db-body { padding: 16px 20px; }
    .db-query { background: #f8f9fa; padding: 10px 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 12px; margin-bottom: 12px; border-left: 3px solid #17a2b8; }
    .db-results table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .db-results th { background: #f8f9fa; padding: 10px; text-align: left; font-weight: 600; color: #495057; border-bottom: 2px solid #dee2e6; }
    .db-results td { padding: 10px; border-bottom: 1px solid #dee2e6; }
    .db-results tr:hover { background: #f8f9fa; }
    .card-number { display: inline-block; background: #ef2028; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 12px; }
    .tabs-container { border-top: 1px solid #e9ecef; }
    .tabs-nav { display: flex; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
    .tab-btn { padding: 12px 16px; border: none; background: none; cursor: pointer; font-size: 12px; font-weight: 600; color: #666; border-bottom: 2px solid transparent; }
    .tab-btn:hover { color: #333; }
    .tab-btn.active { color: #ef2028; border-bottom-color: #ef2028; }
    .tab-content { display: none; padding: 16px 20px; }
    .tab-content.active { display: block; }
    /* Display Mode: vertical - label above value */
    .display-vertical .form-row { display: flex; flex-direction: column; margin-bottom: 12px; }
    .display-vertical .form-label { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; }
    .display-vertical .form-value { background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    /* Display Mode: horizontal - label | value in rows */
    .display-horizontal .form-row { display: flex; flex-direction: row; margin-bottom: 12px; align-items: center; gap: 12px; }
    .display-horizontal .form-label { font-size: 12px; font-weight: 600; color: #666; min-width: 120px; }
    .display-horizontal .form-value { background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 12px; flex: 1; }
    /* Display Mode: grid - cards layout */
    .display-grid .db-results { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
    .display-grid .db-results table { display: none; }
    .display-grid .form-card { background: #f8f9fa; padding: 12px; border-radius: 6px; }
    .display-grid .form-label { font-size: 12px; font-weight: 600; color: #666; margin-bottom: 4px; }
    .display-grid .form-value { font-family: monospace; font-size: 12px; }
    /* Scrollable table */
    .scrollable-table { max-height: 300px; overflow-y: auto; }
    /* JSON Syntax Highlighting */
    .json-response { background: #f8f9fa; padding: 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 12px; overflow-x: auto; white-space: pre; word-break: break-all; line-height: 1.6; }
    .json-key { color: #0066cc; }
    .json-string { color: #22863a; }
    .json-number { color: #e36209; }
    .json-boolean { color: #6f42c1; }
    .json-null { color: #6a737d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Smoke Test Results</h1>
      <p>Generated: ${new Date().toISOString()}</p>
    </div>
`;

  let cardNum = 1;

  // Database outputs (pre-output)
  for (const d of items) {
    for (const db of d.databases.filter(db => db.action === 'pre-output')) {
      html += generateDbCard(db, cardNum++, displayMode);
    }
  }

  // HTTP responses
  for (const d of items) {
    if (d.httpResponse) {
      html += generateHttpCard(
        d.httpResponse,
        d.requestBody,
        cardNum++,
        d.requestUrl || '',
        d.requestMethod || 'GET',
        d.requestHeaders
      );
    }
  }

  // Database outputs (post-output)
  for (const d of items) {
    for (const db of d.databases.filter(db => db.action === 'post-output')) {
      html += generateDbCard(db, cardNum++, displayMode);
    }
  }

  html += `
  </div>
  <script>
    function showTab(cardId, tabName) {
      const container = document.getElementById(cardId);
      container.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      container.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
      container.querySelector('.tab-content[data-tab="' + tabName + '"]').classList.add('active');
    }
  </script>
</body>
</html>`;

  return html;
}

function generateHttpCard(resp: HttpResponseData, reqBody: string | undefined, cardNum: number, url: string, method: string, reqHeaders?: { name: string; value: string }[]): string {
  let responseBody = '';
  if (resp.body && typeof resp.body === 'object') {
    responseBody = `<div class="info-section">
      <div class="info-label">Response Body</div>
      <div class="info-value"><pre class="json-response">${syntaxHighlightJson(JSON.stringify(resp.body, null, 2))}</pre></div>
    </div>`;
  } else if (resp.body && typeof resp.body === 'string' && resp.body.trim()) {
    responseBody = `<div class="info-section">
      <div class="info-label">Response Body</div>
      <div class="info-value">${escapeHtml(resp.body)}</div>
    </div>`;
  } else {
    responseBody = `<p style="color:#666;font-size:12px;">No response body</p>`;
  }

  let reqHeadersHtml = '';
  if (reqHeaders && reqHeaders.length > 0) {
    reqHeadersHtml = `<table class="cookies-table">
      <thead><tr><th>Name</th><th>Value</th></tr></thead>
      <tbody>${reqHeaders.map(h => `<tr><td>${escapeHtml(h.name)}</td><td>${escapeHtml(h.value)}</td></tr>`).join('')}</tbody>
    </table>`;
  }

  let reqBodyHtml = '';
  if (reqBody) {
    try {
      const parsed = JSON.parse(reqBody);
      reqBodyHtml = `<div class="info-section">
        <div class="info-label">Request Body</div>
        <div class="info-value"><pre class="json-response">${syntaxHighlightJson(JSON.stringify(parsed, null, 2))}</pre></div>
      </div>`;
    } catch {
      reqBodyHtml = `<div class="info-section">
        <div class="info-label">Request Body</div>
        <div class="info-value">${escapeHtml(reqBody)}</div>
      </div>`;
    }
  }

  let respHeadersHtml = '';
  const headers = resp.headers || {};
  const filteredHeaders = Object.entries(headers);
  if (filteredHeaders.length > 0) {
    respHeadersHtml = `<table class="cookies-table">
      <thead><tr><th>Name</th><th>Value</th></tr></thead>
      <tbody>${filteredHeaders.map(([name, value]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}</tbody>
    </table>`;
  } else {
    respHeadersHtml = '<p style="color:#666;font-size:12px;">No response headers</p>';
  }

  const statusClass = resp.status < 300 ? 'status-2xx' : resp.status < 400 ? 'status-4xx' : 'status-5xx';
  const uniqueId = 'card-' + cardNum;

  return `
    <div class="section-title"><span class="card-number">${cardNum}</span>HTTP Request & Response</div>
    <div class="http-card">
      <div class="http-header">
        <div>
          <span class="http-method method-${method.toLowerCase()}">${method}</span>
          <span class="http-url">${escapeHtml(url)}</span>
        </div>
        <span class="http-status ${statusClass}">${resp.status}</span>
      </div>
      <div class="http-body">
        ${reqHeaders && reqHeaders.length > 0 ? `<div class="info-section">
          <div class="info-label">Request Headers</div>
          <div class="info-value"><table class="cookies-table">
            <thead><tr><th>Name</th><th>Value</th></tr></thead>
            <tbody>${reqHeaders.map(h => `<tr><td>${escapeHtml(h.name)}</td><td>${escapeHtml(h.value)}</td></tr>`).join('')}</tbody>
          </table></div>
        </div>` : `<div class="info-section">
          <div class="info-label">Request Headers</div>
          <div class="info-value"><p style="color:#666;font-size:12px;">No request headers</p></div>
        </div>`}
        ${reqBodyHtml}
        ${responseBody}
      </div>
      <div class="tabs-container" id="${uniqueId}">
        <div class="tabs-nav">
          <button class="tab-btn active" data-tab="resp-headers" onclick="showTab('${uniqueId}', 'resp-headers')">Response Headers</button>
          <button class="tab-btn" data-tab="duration" onclick="showTab('${uniqueId}', 'duration')">Duration</button>
        </div>
        <div class="tab-content active" data-tab="resp-headers">${respHeadersHtml}</div>
        <div class="tab-content" data-tab="duration">
          <div class="info-section">
            <div class="info-label">Duration</div>
            <div class="info-value">${resp.duration}ms</div>
          </div>
        </div>
      </div>
    </div>`;
}

function generateDbCard(db: DatabaseResult, cardNum: number, displayMode: 'vertical' | 'horizontal' | 'grid' = 'vertical'): string {
  const actionClass = db.action === 'pre-output' ? 'pre-output' : 'post-output';
  
  let resultsHtml = '';
  if (db.result.rows && db.result.rows.length > 0) {
    const fields = db.result.fields || [];
    const fieldNames = fields.map(f => f.name);
    const rowCount = db.result.rows.length;
    
    if (rowCount === 1) {
      // Render as FORM (horizontal layout - label | value in one row)
      const row = db.result.rows[0];
      resultsHtml = `<div class="db-results display-horizontal">
        ${fieldNames.map(f => `
          <div class="form-row">
            <div class="form-label">${escapeHtml(f)}</div>
            <div class="form-value">${escapeHtml(String(row[f] ?? ''))}</div>
          </div>
        `).join('')}
      </div>`;
    } else if (rowCount > 1) {
      // Render as SCROLLABLE TABLE
      resultsHtml = `<div class="db-results scrollable-table">
        <table>
          <thead><tr>${fieldNames.map(f => `<th>${escapeHtml(f)}</th>`).join('')}</tr></thead>
          <tbody>${db.result.rows.slice(0, 10).map(row => 
            `<tr>${fieldNames.map(f => `<td>${escapeHtml(String(row[f] ?? ''))}</td>`).join('')}</tr>`
          ).join('')}</tbody>
        </table>
      </div>`;
    }
  } else {
    resultsHtml = '<p style="color:#666;font-size:12px;">No results</p>';
  }

  return `
    <div class="section-title"><span class="card-number">${cardNum}</span>Database - ${db.type}</div>
    <div class="db-card ${actionClass}">
      <div class="db-header">
        <span class="db-type">${db.type}</span>
        <span class="db-action">${db.action}</span>
      </div>
      <div class="db-body">
        <div class="db-query">${escapeHtml(db.query)}</div>
        ${resultsHtml}
      </div>
    </div>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function syntaxHighlightJson(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
}

export async function htmlToPng(html: string, options: HtmlGeneratorOptions): Promise<string> {
  try { mkdirSync(options.outputDir, { recursive: true }); } catch {}
  
  const htmlPath = join(options.outputDir, options.caseName + '_screenshot.html');
  writeFileSync(htmlPath, html);
  console.log('Generated HTML: ' + htmlPath);
  
  const pngPath = join(options.outputDir, options.caseName + '_screenshot.png');
  
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.screenshot({
    path: pngPath,
    fullPage: true,
    type: 'png'
  });
  
  await browser.close();
  console.log('Generated PNG: ' + pngPath);
  
  return pngPath;
}
