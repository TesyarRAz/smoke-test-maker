import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { HttpResponseData, DatabaseResult } from '../types/output.js';

export interface ScreenshotData {
  httpResponse: HttpResponseData | null;
  databases: DatabaseResult[];
  requestBody?: string;
}

export interface HtmlGeneratorOptions {
  outputDir: string;
  caseName: string;
}

export function generateHtml(data: ScreenshotData[]): string {
  const items = data.filter(d => d.httpResponse || d.databases.length > 0);
  
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Smoke Test Results</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; }
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
    .info-value { background: #f8f9fa; padding: 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }
    
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
    
    .card-number { display: inline-block; background: #007bff; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 12px; }
    .pre-output { border-left: 4px solid #28a745; }
    .post-output { border-left: 4px solid #ffc107; }
    .db-card.pre-output .db-action { background: #28a745; }
    .db-card.post-output .db-action { background: #ffc107; color: #333; }
    
    .tabs-nav { display: flex; gap: 4px; margin-bottom: 12px; flex-wrap: wrap; }
    .tab-btn { padding: 8px 16px; border: none; background: #e9ecef; cursor: pointer; font-size: 12px; font-weight: 500; color: #495057; border-radius: 4px 4px 0 0; }
    .tab-btn:hover { background: #dee2e6; }
    .tab-btn.active { background: #007bff; color: white; }
    .tab-content { display: none; padding: 12px; background: #f8f9fa; border-radius: 0 0 4px 4px; }
    .tab-content.active { display: block; }
  </style>
  <script>
  function showTab(carouselId, tabId) {
    var container = document.getElementById(carouselId);
    if (!container) return;
    container.querySelectorAll('.tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
    container.querySelectorAll('.tab-content').forEach(function(tab) { tab.classList.remove('active'); });
    container.querySelector('.tab-btn[data-tab="' + tabId + '"]').classList.add('active');
    container.querySelector('.tab-content[data-tab="' + tabId + '"]').classList.add('active');
  }
  </script>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Smoke Test Results</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>`;

  let cardNum = 1;
  for (const d of items) {
    // Split databases into pre-output and post-output
    const preOutputs = d.databases.filter(db => db.action === 'pre-output' || db.action === 'output');
    const postOutputs = d.databases.filter(db => db.action === 'post-output');
    
    // 1. PRE-OUTPUT first
    for (const db of preOutputs) {
      const rows = db.result?.rows || [];
      let tableHtml = '';
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        tableHtml = `
        <div class="db-results">
          <table>
            <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>`;
      }
      
      html += `
    <div class="section-title"><span class="card-number">${cardNum++}</span>Database - ${db.type}</div>
    <div class="db-card pre-output">
      <div class="db-header">
        <span class="db-type">${db.type}</span>
        <span class="db-action">${db.action}</span>
      </div>
      <div class="db-body">
        <div class="db-query">${escapeHtml(db.query)}</div>
        ${tableHtml || '<p style="color:#666;font-size:12px;">No results</p>'}
      </div>
    </div>`;
    }
    
    // 2. HTTP REQUEST/RESPONSE with tabs
    if (d.httpResponse) {
      const resp = d.httpResponse;
      let parsed: any = null;
      try { parsed = typeof resp.body === "string" ? JSON.parse(resp.body) : resp.body; } catch {}
      
      let respCookiesHtml = '';
      let reqBodyHtml = '';
      let reqHeadersHtml = '';
      if (d.requestBody) {
        let bodyContent = d.requestBody;
        try { bodyContent = JSON.stringify(JSON.parse(d.requestBody), null, 2); } catch {}
        reqBodyHtml = `
          <div class="info-section">
            <div class="info-label">Request Body</div>
            <div class="info-value">${escapeHtml(bodyContent)}</div>
          </div>`;
      }
      if (parsed?.entries?.[0]?.request?.headers?.length > 0) {
        reqHeadersHtml = `
        <div class="info-section">
          <div class="info-label">Request Headers</div>
          <table class="cookies-table">
            <thead><tr><th>Name</th><th>Value</th></tr></thead>
            <tbody>${parsed.entries[0].request.headers.map((h: any) => `<tr><td>${h.name}</td><td>${h.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>`;
      }
      
      // Response cookies
      if (parsed?.cookies?.length > 0) {
        respCookiesHtml = `
        <div class="info-section">
          <div class="info-label">Cookies</div>
          <table class="cookies-table">
            <thead><tr><th>Name</th><th>Value</th></tr></thead>
            <tbody>${parsed.cookies.map((c: any) => `<tr><td>${c.name || ''}</td><td>${c.value || ''}</td></tr>`).join('')}</tbody>
          </table>
        </div>`;
      }
      
      // Response headers
      let respHeadersHtml = '';
      if (parsed?.entries?.[0]?.response?.headers?.length > 0) {
        const headers = parsed.entries[0].response.headers;
        respHeadersHtml = `
        <div class="info-section">
          <div class="info-label">Response Headers</div>
          <table class="cookies-table">
            <thead><tr><th>Name</th><th>Value</th></tr></thead>
            <tbody>${headers.map((h: any) => `<tr><td>${h.name}</td><td>${h.value}</td></tr>`).join('')}</tbody>
          </table>
        </div>`;
      }
      
      // Response body - extract actual body content (exclude metadata already shown)
      let responseBody = '';
      const respObj = parsed?.entries?.[0]?.response;
      if (respObj) {
        const metaFields = ['certificate', 'cookies', 'headers', 'http_version', 'status', 'timings'];
        const bodyData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(respObj)) {
          if (!metaFields.includes(key)) {
            bodyData[key] = value;
          }
        }
        if (Object.keys(bodyData).length > 0) {
          responseBody = `
          <div class="info-section">
            <div class="info-label">Response Body</div>
            <div class="info-value">${escapeHtml(JSON.stringify(bodyData, null, 2))}</div>
          </div>`;
        }
      }
      
      const statusClass = resp.status < 300 ? 'status-2xx' : resp.status < 400 ? 'status-4xx' : 'status-5xx';
      const method = parsed?.entries?.[0]?.calls?.[0]?.request?.method || 'GET';
      const uniqueId = 'card-' + cardNum;
      
      html += `
    <div class="section-title"><span class="card-number">${cardNum++}</span>HTTP Request & Response</div>
    <div class="http-card">
      <div class="http-header">
        <div>
          <span class="http-method method-${method.toLowerCase()}">${method}</span>
          <span class="http-url">${parsed?.entries?.[0]?.calls?.[0]?.request?.url || 'N/A'}</span>
        </div>
        <span class="http-status ${statusClass}">${resp.status}</span>
      </div>
      <div class="http-body">
        ${reqBodyHtml || ''}
        ${responseBody || '<p style="color:#666;font-size:12px;">Response body not captured</p>'}
      </div>
      <div class="tabs-container" id="${uniqueId}">
        <div class="tabs-nav">
          <button class="tab-btn active" data-tab="req-headers" onclick="showTab('${uniqueId}', 'req-headers')">Request Headers</button>
          <button class="tab-btn" data-tab="resp-headers" onclick="showTab('${uniqueId}', 'resp-headers')">Response Headers</button>
          <button class="tab-btn" data-tab="cookies" onclick="showTab('${uniqueId}', 'cookies')">Cookies</button>
          <button class="tab-btn" data-tab="duration" onclick="showTab('${uniqueId}', 'duration')">Duration</button>
        </div>
        <div class="tab-content active" data-tab="req-headers">${reqHeadersHtml || '<p style="color:#666;font-size:12px;">No request headers</p>'}</div>
        <div class="tab-content" data-tab="resp-headers">${respHeadersHtml || '<p style="color:#666;font-size:12px;">No response headers</p>'}</div>
        <div class="tab-content" data-tab="cookies">${respCookiesHtml || '<p style="color:#666;font-size:12px;">No cookies</p>'}</div>
        <div class="tab-content" data-tab="duration">
          <div class="info-section">
            <div class="info-label">Duration</div>
            <div class="info-value">${resp.duration}ms</div>
          </div>
        </div>
      </div>
    </div>`;
    }
    
    for (const db of postOutputs) {
      const rows = db.result?.rows || [];
      let tableHtml = '';
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        tableHtml = `
        <div class="db-results">
          <table>
            <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>`;
      }
      
      html += `
    <div class="section-title"><span class="card-number">${cardNum++}</span>Database - ${db.type}</div>
    <div class="db-card post-output">
      <div class="db-header">
        <span class="db-type">${db.type}</span>
        <span class="db-action">${db.action}</span>
      </div>
      <div class="db-body">
        <div class="db-query">${escapeHtml(db.query)}</div>
        ${tableHtml || '<p style="color:#666;font-size:12px;">No results</p>'}
      </div>
    </div>`;
    }
  }

  html += `
  </div>
</body>
</html>`;

  return html;
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

export async function htmlToPng(html: string, options: HtmlGeneratorOptions): Promise<string> {
  try { mkdirSync(options.outputDir, { recursive: true }); } catch {}
  
  // Write HTML file
  const htmlPath = join(options.outputDir, options.caseName + '_screenshot.html');
  writeFileSync(htmlPath, html);
  console.log('Generated HTML: ' + htmlPath);
  
  // Generate PNG from HTML using Puppeteer
  const pngPath = join(options.outputDir, options.caseName + '_screenshot.png');
  
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set content and wait for fonts to load
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Get full page screenshot
  await page.screenshot({
    path: pngPath,
    fullPage: true,
    type: 'png'
  });
  
  await browser.close();
  console.log('Generated PNG: ' + pngPath);
  
  return pngPath;
}
