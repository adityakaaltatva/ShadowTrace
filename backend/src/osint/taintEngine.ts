import { MongoClient } from "mongodb";

export async function resolveOSINTForAddress(addr: string, mongoUrl?: string) {
  // Gracefully handle missing MongoDB URI (for benchmarks, dev, testing without DB)
  if (!mongoUrl) {
    return { riskBoost: 0, tags: [] };
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();
  const col = client.db().collection("osint_feeds");

  const recs = await col.find({ address: addr.toLowerCase() }).toArray();
  await client.close();

  if (!recs.length) return { riskBoost: 0, tags: [] };

  const tags = recs.flatMap(r => r.tags);
  const riskBoost = Math.min(30, recs.length * 5); // max +30 risk

  return { riskBoost, tags };
}

/**
 * Basic taint propagation:
 * If A is malicious and A → B transfer occurs, B inherits a taint with decay=0.5
 */
export function propagateTaint(fromTags: string[], weight = 0.5) {
  if (!fromTags.length) return 0;
  return Math.min(20, fromTags.length * (10 * weight)); // up to +20
}
