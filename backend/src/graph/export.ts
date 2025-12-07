// backend/src/graph/export.ts
import { GraphNode, GraphEdge } from "./graphClient.js";

export async function exportCluster(clusterId: string) {
  const nodes = await GraphNode.find({ clusterId } as any).lean();
  const addresses = nodes.map(n => n.address);

  const edges = await GraphEdge.find({
    from: { $in: addresses },
    to: { $in: addresses }
  } as any).lean();

  return toCytoscape(nodes, edges);
}

export async function exportEgoNetwork(center: string, depth = 1) {
  center = center.toLowerCase();

  const level1 = await GraphEdge.find({ $or: [
    { from: center },
    { to: center }
  ]} as any).lean();

  let nodesSet = new Set([center]);

  for (const e of level1) {
    nodesSet.add(e.from);
    nodesSet.add(e.to);
  }

  if (depth === 2) {
    const addrList = [...nodesSet];
    const level2 = await GraphEdge.find({
      $or: [
        { from: { $in: addrList }},
        { to: { $in: addrList }}
      ]
    } as any).lean();
    for (const e of level2) {
      nodesSet.add(e.from);
      nodesSet.add(e.to);
    }
  }

  const allNodes = await GraphNode.find({ address: { $in: [...nodesSet] }} as any).lean();
  const allEdges = await GraphEdge.find({
    from: { $in: [...nodesSet] },
    to: { $in: [...nodesSet] }
  } as any).lean();

  return toCytoscape(allNodes, allEdges);
}

export function toCytoscape(nodes, edges) {
  return {
    nodes: nodes.map(n => ({
      data: {
        id: n.address,
        pagerank: n.pagerank || 0,
        clusterId: n.clusterId || "unknown",
      }
    })),
    edges: edges.map(e => ({
      data: {
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        weight: e.weight || 1
      }
    }))
  };
}
