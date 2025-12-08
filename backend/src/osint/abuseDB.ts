import { safeFetch, normalizeAddress } from "./base.js";
import { MongoClient } from "mongodb";

const FEED_URL = "https://api.cryptoscamdb.org/v1/addresses";

export async function fetchCryptoScamDB() {
  const data = await safeFetch(FEED_URL);
  if (!data || !data.result) return [];

  const results = [];

  for (const entry of data.result) {
    const addr = normalizeAddress(entry.address);
    const tags = entry.type || [];
    results.push({
      address: addr,
      tags,
      category: "CRYPTO_SCAM_DB",
      source: "CryptoScamDB",
      confidence: 0.95,
      ts: Date.now(),
    });
  }
  return results;
}

export async function storeAbuseDBRecords(records: any[], mongoUrl: string) {
  if (!records.length) return;

  const client = new MongoClient(mongoUrl);
  await client.connect();
  const col = client.db().collection("osint_feeds");

  const ops = records.map(r => ({ updateOne: {
    filter: { address: r.address, source: r.source },
    update: { $set: r },
    upsert: true
  }}));

  await col.bulkWrite(ops);
  await client.close();

  console.log(`Stored ${records.length} CryptoScamDB OSINT entries`);
}
