import { safeFetch, normalizeAddress } from "./base.js";
import { MongoClient } from "mongodb";

const FEED = "https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/addresses.json";

export async function fetchPhishingFeed() {
  const result = await safeFetch(FEED);
  if (!result) return [];

  return Object.keys(result).map(addr => ({
    address: normalizeAddress(addr),
    tags: ["phishing"],
    category: "PHISH_SCAM",
    source: "MetaMask-PhishFort",
    confidence: 0.9,
    ts: Date.now(),
  }));
}

export async function storePhishFeed(records: any[], mongoUrl: string) {
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

  console.log(`Stored ${records.length} phishing OSINT entries`);
}
