import axios from "axios";
import { WalletProfile } from "../db/schemas/WalletProfile.js";

export async function loadOFAC() {
  const url = "https://raw.githubusercontent.com/.../ofac_eth_addresses.json";

  const res = await axios.get(url);
  const sanctioned = res.data.addresses || [];

  for (const addr of sanctioned) {
    await WalletProfile.updateOne(
      { wallet: addr.toLowerCase() },
      {
        $set: { sanctions: true },
        $addToSet: { tags: "sanctioned" },
      },
      { upsert: true }
    );
  }

  console.log(`Loaded ${sanctioned.length} OFAC sanctioned addresses`);
}
