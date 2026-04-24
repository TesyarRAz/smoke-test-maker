import type { HurlEntry, HurlCapture } from '../types/hurl.js';

export function extractCaptures(entries: HurlEntry[]): Map<number, string[]> {
  const captures = new Map<number, string[]>();
  
  for (const entry of entries) {
    if (entry.captures && entry.captures.length > 0) {
      const captureNames = entry.captures.map((c: HurlCapture) => c.name);
      captures.set(entry.index, captureNames);
    }
  }
  
  return captures;
}

export function extractVariableUsage(entries: HurlEntry[]): Map<number, string[]> {
  const usage = new Map<number, string[]>();
  
  for (const entry of entries) {
    const variables = new Set<string>();
    
    if (entry.request.url) {
      extractVariables(entry.request.url).forEach(v => variables.add(v));
    }
    
    if (entry.request.headers) {
      for (const header of entry.request.headers) {
        extractVariables(header.value).forEach(v => variables.add(v));
      }
    }
    
    if (entry.request.body) {
      extractVariables(entry.request.body).forEach(v => variables.add(v));
    }
    
    if (entry.customComments) {
      for (const comment of entry.customComments) {
        extractVariables(comment.query).forEach(v => variables.add(v));
      }
    }
    
    if (variables.size > 0) {
      usage.set(entry.index, Array.from(variables));
    }
  }
  
  return usage;
}

function extractVariables(text: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

export interface GraphEdge {
  source: number;
  target: number;
  label: string;
}

export function buildEdges(
  captures: Map<number, string[]>,
  usage: Map<number, string[]>
): GraphEdge[] {
  const edges: GraphEdge[] = [];
  
  const variableSources = new Map<string, number>();
  for (const [entryIndex, captureNames] of captures) {
    for (const varName of captureNames) {
      variableSources.set(varName, entryIndex);
    }
  }
  
  for (const [targetEntry, usedVars] of usage) {
    for (const varName of usedVars) {
      const sourceEntry = variableSources.get(varName);
      if (sourceEntry !== undefined && sourceEntry !== targetEntry) {
        edges.push({
          source: sourceEntry,
          target: targetEntry,
          label: varName
        });
      }
    }
  }
  
  return edges;
}

export function generateGraphml(entries: HurlEntry[]): string {
  const captures = extractCaptures(entries);
  const usage = extractVariableUsage(entries);
  const edges = buildEdges(captures, usage);
  
  // Build node ID map: index -> "METHOD URL"
  const nodeIdMap = new Map<number, string>();
  for (const entry of entries) {
    nodeIdMap.set(entry.index, `${entry.request.method} ${entry.request.url}`);
  }
  
  const nodes = entries.map(entry => {
    const id = `${entry.request.method} ${entry.request.url}`;
    const method = entry.request.method;
    const url = escapeXml(entry.request.url);
    
    return `    <node id="${escapeXml(id)}">
      <data key="method">${escapeXml(method)}</data>
      <data key="url">${url}</data>
    </node>`;
  }).join('\n');
  
  const edgeXml = edges.map(edge => {
    const sourceId = nodeIdMap.get(edge.source) || String(edge.source);
    const targetId = nodeIdMap.get(edge.target) || String(edge.target);
    return `    <edge id="e${edge.source}-${edge.target}" source="${escapeXml(sourceId)}" target="${escapeXml(targetId)}">
      <data key="label">${escapeXml(edge.label)}</data>
    </edge>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.org/graphml">
  <key id="method" for="node" attr.name="method" attr.type="string"/>
  <key id="url" for="node" attr.name="url" attr.type="string"/>
  <key id="label" for="edge" attr.name="label" attr.type="string"/>
  <graph id="G" edgedefault="directed">
${nodes}
${edgeXml}
  </graph>
</graphml>`;
}

function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface GraphNode {
  id: string;
  method: string;
  url: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
}

export function generateFlowHtml(entries: HurlEntry[]): string {
  const captures = extractCaptures(entries);
  const usage = extractVariableUsage(entries);
  const edges = buildEdges(captures, usage);
  
  const nodes: GraphNode[] = entries.map(entry => ({
    id: `${entry.request.method} ${entry.request.url}`,
    method: entry.request.method,
    url: entry.request.url
  }));
  
  const nodeIdMap = new Map<number, string>();
  for (const entry of entries) {
    nodeIdMap.set(entry.index, `${entry.request.method} ${entry.request.url}`);
  }
  
  const links: GraphLink[] = edges.map(edge => ({
    source: nodeIdMap.get(edge.source) || String(edge.source),
    target: nodeIdMap.get(edge.target) || String(edge.target),
    label: edge.label
  }));
  
  return generateFlowDiagramHtml(nodes, links);
}

function generateFlowDiagramHtml(nodes: GraphNode[], links: GraphLink[]): string {
  const nodeCount = nodes.length;
  const nodeWidth = 200;
  const nodeHeight = 60;
  const gapX = 100;
  
  const svgWidth = nodeCount * (nodeWidth + gapX) + gapX;
  const svgHeight = nodeHeight + gapX * 2;
  
  let nodesSvg = '';
  let defs = `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#666"/>
    </marker>
  </defs>`;
  
  nodes.forEach((node, i) => {
    const x = gapX + i * (nodeWidth + gapX);
    const y = gapX;
    
    const methodColor = getMethodColor(node.method);
    const shortUrl = shortenUrl(node.url);
    
    nodesSvg += `
    <g transform="translate(${x}, ${y})">
      <rect width="${nodeWidth}" height="${nodeHeight}" rx="8" fill="white" stroke="${methodColor}" stroke-width="2"/>
      <rect width="50" height="${nodeHeight}" rx="8" fill="${methodColor}"/>
      <text x="25" y="${nodeHeight / 2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="14" font-weight="bold">${node.method}</text>
      <text x="60" y="${nodeHeight / 2 - 8}" dominant-baseline="middle" fill="#333" font-size="11" font-family="monospace">${shortUrl}</text>
      <text x="60" y="${nodeHeight / 2 + 10}" dominant-baseline="middle" fill="#666" font-size="9" font-family="monospace">${node.method}</text>
    </g>`;
  });
  
  let linksSvg = '';
  links.forEach(link => {
    const sourceIdx = nodes.findIndex(n => n.id === link.source);
    const targetIdx = nodes.findIndex(n => n.id === link.target);
    
    if (sourceIdx >= 0 && targetIdx >= 0) {
      const x1 = gapX + sourceIdx * (nodeWidth + gapX) + nodeWidth;
      const y1 = gapX + nodeHeight / 2;
      const x2 = gapX + targetIdx * (nodeWidth + gapX);
      const y2 = gapX + nodeHeight / 2;
      
      linksSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#666" stroke-width="2" marker-end="url(#arrowhead)"/>`;
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      linksSvg += `<rect x="${midX - 30}" y="${midY - 10}" width="60" height="20" rx="4" fill="#f5f5f5" stroke="#ddd"/>
<text x="${midX}" y="${midY + 4}" text-anchor="middle" fill="#666" font-size="10">${link.label}</text>`;
    }
  });
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Flow Diagram</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: ${svgWidth}px; margin: 0 auto; }
    .header { background: white; padding: 20px; margin-bottom: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header h1 { font-size: 24px; color: #333; }
    .diagram { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    svg { display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Flow Diagram</h1>
      <p>Nodes: ${nodeCount} | Links: ${links.length}</p>
    </div>
    <div class="diagram">
      <svg width="${svgWidth}" height="${svgHeight}">
        ${defs}
        ${linksSvg}
        ${nodesSvg}
      </svg>
    </div>
  </div>
</body>
</html>`;
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    DELETE: '#f93e3e',
    PATCH: '#9012fe'
  };
  return colors[method.toUpperCase()] || '#6c757d';
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    return path.length > 20 ? path.substring(0, 17) + '...' : path;
  } catch {
    return url.length > 20 ? url.substring(0, 17) + '...' : url;
  }
}