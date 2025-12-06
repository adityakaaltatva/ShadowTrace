import { JsonRpcProvider } from "ethers";
import { ETH_RPC, KNOWN_STABLES, KNOWN_BRIDGES } from "../config.js";
import { pg, initPg } from "../db/pgClient.js";
import { connectMongo } from "../db/mongoClient.js";
import { WalletProfile } from "../db/schemas/WalletProfile.js";
import { decodeTransfer } from "./tokenDecoder.js";

import {
  recordStableIn,
  recordErcOut,
  recordBridgeCall,
  isKnownBridgeAddress
} from "../intelligence/dealbreaker.js";

const provider = new JsonRpcProvider(ETH_RPC);

export async function startListener() {
  await initPg();
  await connectMongo();

  console.log("🔥 ShadowTrace Ethereum Listener Started");

  provider.on("block", async (blockNumber: number) => {
    const blockData = await provider.getBlock(blockNumber);
    if (!blockData) return;
    const transactions = await Promise.all(
      (await provider.getBlock(blockNumber, true)) as any
    );
    
    await pg.query(
      `INSERT INTO blocks(block_number, timestamp) VALUES ($1, to_timestamp($2)) ON CONFLICT DO NOTHING`,
      [blockNumber, blockData.timestamp]
    );

    const txDetails = [];
    for (const txHash of transactions) {
      if (typeof txHash === "string") {
        const tx = await provider.getTransaction(txHash);
        if (tx) txDetails.push(tx);
      } else {
        txDetails.push(txHash);
      }
    }

    for (const tx of txDetails) {
      await pg.query(
        `INSERT INTO transactions(tx_hash, block_number, from_addr, to_addr, value, data)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT DO NOTHING`,
        [tx.hash, tx.blockNumber, tx.from, tx.to, tx.value.toString(), tx.data]
      );

      // ========= Detect Bridge Behavior =========
      if (tx.to && isKnownBridgeAddress(tx.to)) {
        await recordBridgeCall(tx.from, tx.hash, Date.now(), tx.to, "unknown-chain");
      }

      // ========= Decode ERC20 Transfers =========
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (!receipt) continue;
      for (const log of receipt.logs) {
        const decoded = decodeTransfer(log);
        if (!decoded) continue;

        const tokenInfo = KNOWN_STABLES.find(
          (s: any) => s.addr.toLowerCase() === log.address.toLowerCase()
        );

        const symbol = tokenInfo ? tokenInfo.symbol : "UNKNOWN";

        await pg.query(
          `INSERT INTO erc20_transfers(tx_hash, token, from_addr, to_addr, amount)
           VALUES ($1,$2,$3,$4,$5)`,
          [tx.hash, symbol, decoded.from, decoded.to, decoded.amount.toString()]
        );

        // Wallet profiles update
        await WalletProfile.updateOne(
          { wallet: decoded.from.toLowerCase() },
          { $inc: { tx_count: 1 }, $set: { last_seen: new Date() } },
          { upsert: true }
        );
        await WalletProfile.updateOne(
          { wallet: decoded.to.toLowerCase() },
          { $inc: { tx_count: 1 }, $set: { last_seen: new Date() } },
          { upsert: true }
        );

        // ========= Feed Dealbreaker Engine =========
        if (tokenInfo) {
          // Incoming stablecoin transfer
          await recordStableIn(
            decoded.to,
            decoded.amount,
            tx.hash,
            Date.now(),
            symbol
          );
        }

        // Outgoing transfer (used for structuring detection)
        await recordErcOut(
          decoded.from,
          decoded.amount,
          tx.hash,
          Date.now()
        );
      }
    }

    console.log("Processed block:", blockNumber);
  });
}
