// Centralized API Base URL configuration and resilient fetch helper
export const getApiBase = () => {
  if (typeof window !== "undefined" && window.location && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return "http://127.0.0.1:5000";
};

export const API_BASE = getApiBase();

/**
 * Resilient fetch that tries current hostname:5000 and falls back to alternate
 * (e.g., localhost:5000 <-> 127.0.0.1:5000) to protect against Brave Shields
 * Private Network Access blocks and local port mismatches.
 */
export async function resilientFetch(path, options = {}) {
  const primaryBase = getApiBase();
  const alternateBase = primaryBase.includes("localhost") 
    ? "http://127.0.0.1:5000" 
    : "http://localhost:5000";

  const url1 = path.startsWith("http") ? path : `${primaryBase}${path.startsWith('/') ? path : '/' + path}`;
  try {
    return await fetch(url1, options);
  } catch (err1) {
    console.warn(`Fetch to ${url1} failed (${err1.message}). Retrying alternate host...`);
    let url2 = path;
    if (path.startsWith("http")) {
      url2 = path.includes("localhost:5000") 
        ? path.replace("http://localhost:5000", "http://127.0.0.1:5000")
        : path.replace("http://127.0.0.1:5000", "http://localhost:5000");
    } else {
      url2 = `${alternateBase}${path.startsWith('/') ? path : '/' + path}`;
    }
    return await fetch(url2, options);
  }
}
