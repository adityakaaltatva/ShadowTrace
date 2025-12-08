import { safeFetch, normalizeAddress } from "./base.js";
import { MongoClient } from "mongodb";

const FEED = "https://chainabuse.com/api/v1/reports";

export async function fetchChainAbuse() {
  const data = await safeFetch(FEED);
  if (!data || !data.data) return [];

  const results: any[] = [];

  for (const report of data.data) {
    if (!report.address) continue;

    results.push({
      address: normalizeAddress(report.address),
      tags: [report.category || "unknown"],
      description: report.title || "",
      category: "CHAIN_ABUSE",
      source: "ChainAbuse",
      confidence: 0.85,
      ts: Date.now()
    });
  }

  return results;
}

export async function storeChainAbuse(records: any[], mongoUrl: string) {
  if (!records.length) return;

  const client = new MongoClient(mongoUrl);
  await client.connect();
  const col = client.db().collection("osint_feeds");

  const ops = records.map(r => ({
    updateOne: {
      filter: { address: r.address, source: r.source },
      update: { $set: r },
      upsert: true
    }
  }));

  await col.bulkWrite(ops);
  await client.close();

  console.log(`Stored ${records.length} ChainAbuse entries`);
}
