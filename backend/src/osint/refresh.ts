import { fetchCryptoScamDB, storeAbuseDBRecords } from "./abuseDB.js";
import { fetchPhishingFeed, storePhishFeed } from "./phishAPI.js";
import { fetchChainAbuse, storeChainAbuse } from "./chainabuse.js";

export async function refreshOSINTFeeds(mongoUrl: string) {
  console.log("OSINT refresh started...");

  const scam = await fetchCryptoScamDB();
  await storeAbuseDBRecords(scam, mongoUrl);

  const phish = await fetchPhishingFeed();
  await storePhishFeed(phish, mongoUrl);

  const chain = await fetchChainAbuse();
  await storeChainAbuse(chain, mongoUrl);

  console.log("OSINT refresh complete.");
}
