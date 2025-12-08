// backend/src/graph/compute.ts
import Graph from "graphology";
import pagerank from "graphology-pagerank";
import louvain from "graphology-communities-louvain";
import { GraphNode, GraphEdge } from "./graphClient.js";

/**
 * Recompute PageRank and Louvain clusters.
 * - reads edges & nodes from Mongo
 * - builds graphology graph
 * - runs pagerank + louvain
 * - writes back pagerank & clusterId to nodes collection
 *
 * options:
 *  - minEdgeWeight: ignore tiny edges (optional)
 */
export async function recomputeGraph(options: { minEdgeWeight?: number } = {}) {
  const minEdge = options.minEdgeWeight || 0;

  // load edges & nodes
  const [edges, nodes] = await Promise.all([
    GraphEdge.find({ weight: { $gte: minEdge } } as any).lean(),
    GraphNode.find().lean()
  ]);

  const g = new Graph({ directed: true, multi: false } as any);

  // add nodes
  for (const n of nodes) {
    g.addNode(n.address, { lastSeen: n.lastSeen });
  }

  // add edges
  for (const e of edges) {
    if (!g.hasNode(e.from)) g.addNode(e.from);
    if (!g.hasNode(e.to)) g.addNode(e.to);

    // use weight attribute
    if (g.hasEdge(e.from, e.to)) {
      // edge exists — increment weight attribute
      const prev = g.getEdgeAttribute(g.edge(e.from, e.to), "weight") || 0;
      g.updateEdgeAttribute(e.from, e.to, "weight", prev + e.weight);
    } else {
      g.addEdgeWithKey(`${e.from}-${e.to}`, e.from, e.to, { weight: e.weight });
    }
  }

  // Skip computation if graph is too small (no edges)
  if (g.order === 0 || g.size === 0) {
    console.warn("⚠️ Graph too small: skipping pagerank/louvain computation");
    return { nodes: 0, edges: 0 };
  }

  // pagerank with error handling (may fail to converge with sparse graphs)
  let pr: any = {};
  try {
    pr = pagerank(g, { getEdgeWeight: (edge) => g.getEdgeAttribute(edge, "weight") || 1 });
  } catch (err) {
    console.warn("⚠️ PageRank convergence failed (sparse graph):", err);
    // fallback: assign equal pagerank to all nodes
    for (const node of g.nodes()) {
      pr[node] = 1 / g.order;
    }
  }
  // write pagerank to mongo
  const bulkNodeOps: any[] = [];
  for (const [node, score] of Object.entries(pr)) {
    bulkNodeOps.push({
      updateOne: {
        filter: { address: node },
        update: { $set: { pagerank: score } },
        upsert: true
      }
    });
  }
  if (bulkNodeOps.length) await (GraphNode as any).bulkWrite(bulkNodeOps);

  // louvain clustering (returns map node->community)
  const communitiesResult = louvain.assign(g) as any;
  const communities: Record<string, number> = communitiesResult || {};

  // write clusterId to nodes collection
  const bulkClusterOps: any[] = [];
  for (const [node, cluster] of Object.entries(communities)) {
    bulkClusterOps.push({
      updateOne: {
        filter: { address: node },
        update: { $set: { clusterId: String(cluster) } },
        upsert: true
      }
    });
  }
  if (bulkClusterOps.length) await (GraphNode as any).bulkWrite(bulkClusterOps);

  return { nodes: Object.keys(pr).length, edges: edges.length };
}
