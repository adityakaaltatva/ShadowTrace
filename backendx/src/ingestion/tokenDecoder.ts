import { id, getAddress, toBigInt } from "ethers";

export const TRANSFER_SIG = id("Transfer(address,address,uint256)");

export function decodeTransfer(log: any) {
  if (log.topics[0] !== TRANSFER_SIG) return null;

  const from = getAddress("0x" + log.topics[1].slice(26));
  const to = getAddress("0x" + log.topics[2].slice(26));
  const amount = toBigInt(log.data);

  return { from, to, amount };
}
