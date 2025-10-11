import Web3 from "web3";
import { config } from "../config/env.js";
import { log } from "../utils/logger.js";

const ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_txId", "type": "string" },
      { "internalType": "string", "name": "_riskLabel", "type": "string" }
    ],
    "name": "storeRiskResult",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const web3 = new Web3(new Web3.providers.HttpProvider(config.blockchain.rpc));
const contract = new web3.eth.Contract(ABI, config.blockchain.contract);
const account = web3.eth.accounts.privateKeyToAccount(config.blockchain.privateKey);
web3.eth.accounts.wallet.add(account);

export const pushToBlockchain = async (txId, riskLabel) => {
  try {
    const tx = contract.methods.storeRiskResult(txId, riskLabel);
    const gas = await tx.estimateGas({ from: account.address });
    const receipt = await tx
      .send({ from: account.address, gas })
      .once("receipt", (r) => log("✅ Blockchain Tx:", r.transactionHash));
    return receipt;
  } catch (err) {
    log("❌ Blockchain Error:", err.message);
    throw err;
  }
};
