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
        if (comment.query) {
          extractVariables(comment.query).forEach(v => variables.add(v));
        }
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
  index: number;
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
    index: entry.index,
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
  
  // Calculate topological layer
  const nodeLayer = new Map<string, number>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    nodeLayer.set(node.id, 0);
    inDegree.set(node.id, 0);
  }

  for (const link of links) {
    inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const currentLayer = nodeLayer.get(nodeId)!;
    for (const link of links) {
      if (link.source === nodeId) {
        const targetLayer = nodeLayer.get(link.target)!;
        const newLayer = currentLayer + 1;
        if (newLayer > targetLayer) {
          nodeLayer.set(link.target, newLayer);
          queue.push(link.target);
        }
      }
    }
  }

  const sortedNodes = [...nodes].sort((a, b) => 
    (nodeLayer.get(a.id) || 0) - (nodeLayer.get(b.id) || 0)
  );

  return generateFlowDiagramHtml(sortedNodes, links);
}

function generateFlowDiagramHtml(nodes: GraphNode[], links: GraphLink[]): string {
  const nodeIdMap = new Map<string, string>();
  nodes.forEach((node, i) => {
    nodeIdMap.set(node.id, `n${i}`);
  });

  const cyNodes = nodes.map((node, i) => ({
    data: {
      id: `n${i}`,
      label: `${node.method} ${node.url}`,
      method: node.method
    }
  }));

  const cyEdges = links.map((link, i) => {
    const sourceId = nodeIdMap.get(link.source) || link.source;
    const targetId = nodeIdMap.get(link.target) || link.target;
    return {
      data: {
        id: `e${i}`,
        source: sourceId,
        target: targetId,
        label: link.label
      }
    };
  });

  return `<!DOCTYPE html>
<html>
<head>
    <title>API Process Flow</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.26.0/cytoscape.min.js"></script>
    <script src="https://unpkg.com/dagre@0.8.5/dist/dagre.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/cytoscape-dagre@2.5.0/cytoscape-dagre.min.js"></script>
    
    <style>
        body { font-family: sans-serif; margin: 0; background: #f9fafe; }
        #cy { width: 100vw; height: 100vh; display: block; }
        .header {
            position: absolute; top: 20px; left: 20px; z-index: 10;
            background: white; padding: 15px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 5px solid #0074D9;
        }
        h2 { margin: 0; font-size: 18px; color: #333; }
        p { margin: 5px 0 0 0; font-size: 12px; color: #666; }
    </style>
</head>
<body>

    <div class="header">
        <h2>API Sequence Flow</h2>
        <p>Nodes: ${nodes.length} | Links: ${links.length}</p>
    </div>

    <div id="cy"></div>

    <script>
        document.addEventListener('DOMContentLoaded', function(){
            var cy = window.cy = cytoscape({
                container: document.getElementById('cy'),
                boxSelectionEnabled: false,
                
                style: [
                    {
                        selector: 'node',
                        style: {
                            'content': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'shape': 'round-rectangle',
                            'width': '250px',
                            'height': '50px',
                            'background-color': '#ffffff',
                            'border-width': 2,
                            'border-color': '#0074D9',
                            'color': '#333',
                            'font-size': '10px',
                            'font-weight': 'bold',
                            'text-wrap': 'wrap',
                            'text-max-width': '230px'
                        }
                    },
                    {
                        selector: 'node[method = "POST"]',
                        style: { 'border-color': '#2ECC40', 'background-color': '#f6fff8' }
                    },
                    {
                        selector: 'node[method = "PATCH"]',
                        style: { 'border-color': '#FF851B', 'background-color': '#fff9f4' }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'target-arrow-shape': 'triangle',
                            'line-color': '#a0aec0',
                            'target-arrow-color': '#a0aec0',
                            'curve-style': 'taxi',
                            'taxi-direction': 'horizontal',
                            'label': 'data(label)',
                            'font-size': '9px',
                            'color': '#4a5568',
                            'text-background-opacity': 1,
                            'text-background-color': '#f9fafe',
                            'text-background-padding': '3px',
                            'edge-text-rotation': 'autorotate'
                        }
                    }
                ],

                elements: {
                    nodes: ${JSON.stringify(cyNodes)},
                    edges: ${JSON.stringify(cyEdges)}
                },

                layout: {
                    name: 'dagre',
                    rankDir: 'LR',
                    nodeSep: 40,
                    rankSep: 120,
                    align: 'DR'
                }
            });
        });
    </script>
</body>
</html>`;
}