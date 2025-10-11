import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  blockchain: {
    rpc: process.env.BLOCKCHAIN_RPC_URL,
    contract: process.env.CONTRACT_ADDRESS,
    privateKey: process.env.PRIVATE_KEY
  }
};
