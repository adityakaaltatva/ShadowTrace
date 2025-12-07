import { ethers } from "ethers";
import { ETH_RPC, KNOWN_STABLES } from "../config.js";
import { pg, initPg } from "../db/pgClient.js";
import { connectMongo } from "../db/mongoClient.js";
import { WalletProfile } from "../db/schemas/WalletProfile.js";
import { decodeTransfer } from "./tokenDecoder.js";
import { ingestTransfer } from "../graph/ingest.js";

import {
  recordStableIn,
  recordErcOut,
  recordBridgeCall,
  isKnownBridgeAddress
} from "../intelligence/dealbreaker.js";

// ---- ETHERS v5 PROVIDER ----
const provider = new ethers.providers.JsonRpcProvider(
  ETH_RPC || process.env.ETH_RPC
);

export async function startListener() {
  await initPg();
  await connectMongo();

  console.log("🔥 ShadowTrace Ethereum Listener Started (ethers v5)");

  provider.on("block", async (blockNumber: number) => {
    try {
      // Fetch full block with transactions
      const block = await provider.getBlockWithTransactions(blockNumber);
      if (!block) return;

      await pg.query(
        `INSERT INTO blocks(block_number, timestamp) VALUES ($1, to_timestamp($2)) ON CONFLICT DO NOTHING`,
        [blockNumber, block.timestamp]
      );

      for (const tx of block.transactions) {
        if (!tx) continue;

        // Store transaction
        await pg.query(
          `INSERT INTO transactions(tx_hash, block_number, from_addr, to_addr, value, data)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT DO NOTHING`,
          [
            tx.hash,
            tx.blockNumber,
            tx.from,
            tx.to,
            tx.value ? tx.value.toString() : "0",
            tx.data
          ]
        );

        // Bridge detection
        if (tx.to && isKnownBridgeAddress(tx.to)) {
          await recordBridgeCall(tx.from, tx.hash, Date.now(), tx.to, "unknown-chain");
        }

        // Fetch logs
        let receipt;
        try {
          receipt = await provider.getTransactionReceipt(tx.hash);
        } catch {
          continue;
        }
        if (!receipt || !receipt.logs) continue;

        for (const log of receipt.logs) {
          const decoded = decodeTransfer(log);
          if (!decoded) continue;

          const tokenInfo = KNOWN_STABLES.find(
            (t) => t.addr.toLowerCase() === log.address.toLowerCase()
          );

          const symbol = tokenInfo ? tokenInfo.symbol : "UNKNOWN";

          // Store ERC20 transfer
          await pg.query(
            `INSERT INTO erc20_transfers(tx_hash, token, from_addr, to_addr, amount)
             VALUES ($1,$2,$3,$4,$5)`,
            [
              tx.hash,
              symbol,
              decoded.from,
              decoded.to,
              decoded.amount.toString()
            ]
          );

          // Ingest transfer into graph for clustering & enrichment
          await ingestTransfer(decoded.from, decoded.to, BigInt(decoded.amount.toString()), Date.now());

          // Stablecoin incoming detection
          if (tokenInfo) {
            await recordStableIn(
              decoded.to,
              BigInt(decoded.amount.toString()),
              tx.hash,
              Date.now(),
              symbol
            );
          }

          // Outgoing transfer detection
          await recordErcOut(
            decoded.from,
            BigInt(decoded.amount.toString()),
            tx.hash,
            Date.now()
          );
        }
      }

      console.log(`Processed block: ${blockNumber}`);
    } catch (err) {
      console.error("Error processing block:", err);
    }
  });
}
