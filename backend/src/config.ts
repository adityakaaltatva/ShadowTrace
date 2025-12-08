import dotenv from "dotenv";
dotenv.config();

export const ETH_RPC = process.env.ETH_RPC || "http://localhost:8545"; // fallback to local node
export const PG_CONN = process.env.PG_CONN || "postgresql://user:pass@localhost:5432/shadowtrace";
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/shadowtrace";

export const KNOWN_STABLES = [
  { addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6 },
  { addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6 },
  { addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", decimals: 18 }
];

export const KNOWN_BRIDGES = [
  "0x3b95bdc0f61a257d9c2a41507be489babbc4355c", // Wormhole
  "0x5a3d4c7e8f89a3b1f5db223eccc87cda4fa37f74", // Celer cBridge
  "0x5ace17ee1b420d471c2ce3e7edaf78c174d31f77", // Polygon POS Bridge
];
