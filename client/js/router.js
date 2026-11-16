// Hash router: "#/shop?section=preorder" -> handler(params, query)
const routes = []; let current = null;
export const route = (pattern, handler) => { const keys = []; const re = new RegExp("^" + pattern.replace(/:([a-z]+)/gi, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$"); routes.push({ re, keys, handler }); };
export const parseHash = () => { const h = location.hash.slice(1) || "/"; const [path, q = ""] = h.split("?"); return { path: path.replace(/\/+$/, "") || "/", query: Object.fromEntries(new URLSearchParams(q)) }; };
export const go = (to) => { if (location.hash === "#" + to) dispatch(); else location.hash = to; };
export async function dispatch() {
  const { path, query } = parseHash();
  for (const r of routes) {
    const m = r.re.exec(path); if (!m) continue;
    const params = {}; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    const token = (current = {}); 
    await r.handler(params, query, () => token === current);
    return;
  }
  const { notFound } = await import("./pages/info.js"); notFound();
}
export const start = () => { addEventListener("hashchange", () => { dispatch(); scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" }); }); dispatch(); };
