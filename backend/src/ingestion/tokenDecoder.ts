import { id, getAddress } from "ethers";

// ERC20 Transfer event signature (ethers v6)
const TRANSFER_SIG = id("Transfer(address,address,uint256)").slice(0, 10);

export function decodeTransfer(log: any) {
  if (!log || !log.topics || log.topics.length < 3) return null;
  if (log.topics[0].toLowerCase() !== TRANSFER_SIG.toLowerCase()) return null;

  const from = getAddress("0x" + log.topics[1].slice(26));
  const to   = getAddress("0x" + log.topics[2].slice(26));

  // ethers v6 uses toBigInt() for large numbers
  const amount = BigInt(log.data);

  return {
    from,
    to,
    amount
  };
}
