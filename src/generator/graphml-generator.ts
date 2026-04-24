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