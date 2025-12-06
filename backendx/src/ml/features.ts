import { pg } from "../db/pgClient.js";

export async function extractWalletFeatures(wallet: string) {
  const { rows: txOut } = await pg.query(
    "SELECT COUNT(*)::int AS c FROM transactions WHERE from_addr=$1",
    [wallet]
  );

  const { rows: txIn } = await pg.query(
    "SELECT COUNT(*)::int AS c FROM transactions WHERE to_addr=$1",
    [wallet]
  );

  const { rows: stableFlows } = await pg.query(
    "SELECT COUNT(*)::int AS c FROM erc20_transfers WHERE (from_addr=$1 OR to_addr=$1)",
    [wallet]
  );

  return {
    tx_out: txOut[0].c,
    tx_in: txIn[0].c,
    stable_activity: stableFlows[0].c,
  };
}
