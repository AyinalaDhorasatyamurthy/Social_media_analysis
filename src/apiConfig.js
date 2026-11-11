// Centralized API Base URL configuration and resilient fetch helper
export const getApiBase = () => {
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return "http://127.0.0.1:5000";
};

export const API_BASE = getApiBase();

/**
 * Resilient fetch that prioritizes the Nginx same-origin `/api` reverse proxy
 * in production containers (Docker Compose & Kubernetes/Minikube) and falls back
 * across `localhost:5000` <-> `127.0.0.1:5000` for local development setups.
 */
export async function resilientFetch(path, options = {}) {
  if (path.startsWith("http")) {
    try {
      return await fetch(path, options);
    } catch (err1) {
      console.warn(`Fetch to ${path} failed (${err1.message}). Retrying alternate host...`);
      const altUrl = path.includes("localhost:5000")
        ? path.replace("http://localhost:5000", "http://127.0.0.1:5000")
        : path.replace("http://127.0.0.1:5000", "http://localhost:5000");
      return await fetch(altUrl, options);
    }
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isProd = process.env.NODE_ENV === "production";
  const localPrimary =
    typeof window !== "undefined" && window.location && window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "http://127.0.0.1:5000";
  const localAlt =
    localPrimary === "http://localhost:5000" ? "http://127.0.0.1:5000" : "http://localhost:5000";

  if (isProd) {
    const proxyUrl = `/api${normalizedPath}`;
    try {
      const res = await fetch(proxyUrl, options);
      const contentType = res.headers.get("content-type") || "";
      // Only fall back to host port 5000 if no reverse proxy handled /api (HTML fallback or static 404)
      if (contentType.includes("application/json") || (res.ok && !contentType.includes("text/html"))) {
        return res;
      }
      console.warn(`Same-origin proxy ${proxyUrl} returned HTML/404. Falling back to host backend...`);
    } catch (proxyErr) {
      console.warn(`Same-origin proxy ${proxyUrl} failed (${proxyErr.message}). Falling back to host backend...`);
    }
  }

  const url1 = `${localPrimary}${normalizedPath}`;
  try {
    return await fetch(url1, options);
  } catch (err1) {
    console.warn(`Fetch to ${url1} failed (${err1.message}). Retrying alternate host...`);
    const url2 = `${localAlt}${normalizedPath}`;
    return await fetch(url2, options);
  }
}
