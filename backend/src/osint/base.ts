import axios from "axios";

export async function safeFetch(url: string) {
  try {
    const res = await axios.get(url, { timeout: 8000 });
    return res.data;
  } catch (err) {
    console.error("OSINT fetch error:", url, err);
    return null;
  }
}

export function normalizeAddress(addr: string) {
  return (addr || "").toLowerCase();
}
