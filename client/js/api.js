import { getToken, clearAuth } from "./store.js";

export class ApiError extends Error { constructor(msg, status, code, data) { super(msg); this.status = status; this.code = code; this.data = data; } }

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const t = auth ? getToken() : null; if (t) headers.Authorization = "Bearer " + t;
  let res;
  try { res = await fetch("/api" + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined }); }
  catch (e) { throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "NETWORK"); }
  let data = {}; try { data = await res.json(); } catch (e) { /* non-JSON */ }
  if (!res.ok || data.success === false) {
    if (res.status === 401 && data.code === "LOGIN_REQUIRED") clearAuth();
    throw new ApiError(data.message || "Something went wrong. Please try again.", res.status, data.code, data);
  }
  return data;
}
export const qs = (o) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, v); const s = p.toString(); return s ? "?" + s : ""; };
