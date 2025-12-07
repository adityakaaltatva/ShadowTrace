import { ethers } from "ethers";

// ERC20 Transfer event signature (ethers v5)
const TRANSFER_SIG = ethers.utils.id("Transfer(address,address,uint256)").slice(0, 10);

export function decodeTransfer(log: any) {
  if (!log || !log.topics || log.topics.length < 3) return null;
  if (log.topics[0].toLowerCase() !== TRANSFER_SIG.toLowerCase()) return null;

  const from = ethers.utils.getAddress("0x" + log.topics[1].slice(26));
  const to   = ethers.utils.getAddress("0x" + log.topics[2].slice(26));

  // ethers v5 does NOT have toBigInt()
  const amount = ethers.BigNumber.from(log.data);

  return {
    from,
    to,
    amount
  };
}
