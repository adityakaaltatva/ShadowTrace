import { cache } from "./dealbreaker.js"; // import cache

export function getRecentEvents(wallet: string) {
  wallet = wallet.toLowerCase();
  return cache.get(wallet) || [];
}
