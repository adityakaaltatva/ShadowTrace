import axios from "axios";
import { WalletProfile } from "../db/schemas/WalletProfile.js";

export async function loadCryptoScamDB() {
  const url = "https://raw.githubusercontent.com/CryptoScamDB/api/master/addresses.json";
  const res = await axios.get(url);

  const scamWallets = Object.keys(res.data || {});
  for (const w of scamWallets) {
    await WalletProfile.updateOne(
      { wallet: w.toLowerCase() },
      { $addToSet: { tags: "scammer" } },
      { upsert: true }
    );
  }

  console.log(`Loaded ${scamWallets.length} scam wallets from CryptoScamDB`);
}

export async function loadHackedWallets(url: string) {
  // pass a GitHub raw JSON file of hacked addresses
  const res = await axios.get(url);
  const hacked = res.data.wallets || [];

  for (const w of hacked) {
    await WalletProfile.updateOne(
      { wallet: w.toLowerCase() },
      { $addToSet: { tags: "hacked_wallet" } },
      { upsert: true }
    );
  }

  console.log(`Hacked wallet list loaded: ${hacked.length}`);
}
