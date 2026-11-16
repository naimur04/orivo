// Cart + session, persisted in localStorage (wrapped: storage can be blocked in private windows).
const safe = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };
const subs = new Set();
export const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };
const emit = () => subs.forEach((f) => f());

/* ───── session ───── */
let user = null; try { user = JSON.parse(safe.get("orivo_user") || "null"); } catch (e) {}
export const getToken = () => safe.get("orivo_token");
export const getUser = () => (getToken() ? user : null);
export function setAuth(token, customer) { safe.set("orivo_token", token); user = customer; safe.set("orivo_user", JSON.stringify(customer)); emit(); }
export function setUser(customer) { user = customer; safe.set("orivo_user", JSON.stringify(customer)); emit(); }
export function clearAuth() { safe.del("orivo_token"); safe.del("orivo_user"); user = null; emit(); }

/* ───── cart ───── */
let items = []; try { items = JSON.parse(safe.get("orivo_cart_v1") || "[]"); if (!Array.isArray(items)) items = []; } catch (e) { items = []; }
const save = () => { safe.set("orivo_cart_v1", JSON.stringify(items)); emit(); };
const key = (i) => `${i.productId}|${i.size || ""}|${i.color || ""}`;

export const cart = {
  get items() { return items; },
  get count() { return items.reduce((s, i) => s + i.quantity, 0); },
  get subtotal() { return items.reduce((s, i) => s + i.price * i.quantity, 0); },
  add(p, { size = null, color = null, quantity = 1 } = {}) {
    const line = { productId: p.id, slug: p.slug, name: p.name, price: p.price, image: p.image, availability: p.availability, type: p.type, category: p.category, size, color, quantity };
    const ex = items.find((i) => key(i) === key(line));
    if (ex) ex.quantity = Math.min(ex.quantity + quantity, 20); else items.push(line);
    save();
  },
  setQty(k, q) { const it = items.find((i) => key(i) === k); if (!it) return; it.quantity = Math.max(1, Math.min(20, q)); save(); },
  remove(k) { items = items.filter((i) => key(i) !== k); save(); },
  clear() { items = []; save(); },
  key,
  /** Replace stale snapshots (price, name, availability) with fresh data from the server. */
  sync(fresh) {
    const map = new Map(fresh.map((p) => [p.id, p])); let changed = false;
    items = items.filter((i) => { const p = map.get(i.productId); if (!p) { changed = true; return false; } if (p.price !== i.price || p.availability !== i.availability) changed = true;
      Object.assign(i, { price: p.price, name: p.name, image: p.image, availability: p.availability, type: p.type, slug: p.slug }); return true; });
    save(); return changed;
  }
};
export const payloadItems = () => items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size || undefined, color: i.color || undefined }));
export const prefs = { get: (k) => safe.get("orivo_" + k), set: (k, v) => safe.set("orivo_" + k, v) };
