// @ts-expect-error pg types not available
import { Pool } from "pg";
import { PG_CONN } from "../config.js";

export const pg = new Pool({ connectionString: PG_CONN });

export async function initPg() {
  await pg.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      block_number BIGINT PRIMARY KEY,
      timestamp TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS transactions (
      tx_hash TEXT PRIMARY KEY,
      block_number BIGINT,
      from_addr TEXT,
      to_addr TEXT,
      value NUMERIC,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS erc20_transfers (
      id SERIAL PRIMARY KEY,
      tx_hash TEXT,
      token TEXT,
      from_addr TEXT,
      to_addr TEXT,
      amount NUMERIC
    );
  `);
}
