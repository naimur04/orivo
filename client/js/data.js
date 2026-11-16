// Shared data helpers: remembers products the shopper has seen (so "Add to bag" buttons only need an id),
// and caches the public settings / category tree for the whole session.
import { api, qs } from "./api.js";
import { cart } from "./store.js";
import { toast } from "./ui.js";

export const known = new Map();
export const remember = (list) => { (list || []).forEach((p) => known.set(p.id, p)); return list; };

const FALLBACK = {
  settings: { store_name: "ORIVO", tagline: "Own the Look. Own the Moment.", announcement: "", contact_phone: "", contact_email: "", contact_address: "",
    delivery_inside_dhaka: 70, delivery_outside_dhaka: 130, free_delivery_threshold: 0, low_stock_threshold: 5 },
  payments: [{ id: "cod", label: "Cash on Delivery", enabled: true, online: false }]
};
let metaP = null;
export const getMeta = () => (metaP ||= api("/settings/public", { auth: false })
  .then((r) => ({ settings: { ...FALLBACK.settings, ...r.settings }, payments: r.paymentMethods?.length ? r.paymentMethods : FALLBACK.payments }))
  .catch(() => { metaP = null; return FALLBACK; }));

let catP = null;
export const getCategories = () => (catP ||= api("/categories", { auth: false }).then((r) => r.categories).catch(() => { catP = null; return []; }));
export const findCategory = (tree, slug) => { for (const g of tree) { if (g.slug === slug) return { cat: g, group: null }; for (const c of g.children) if (c.slug === slug) return { cat: c, group: g }; } return null; };

export const PAY_LABEL = { cod: "Cash on Delivery", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", card: "Card" };
export const SECTION_LABEL = { available: "Available now", preorder: "Pre-orders" };

/** Where to send the shopper after login/register (e.g. back to checkout). */
export const nextAfterAuth = { set: (p) => { try { sessionStorage.setItem("orivo_next", p); } catch (e) {} }, take: () => { try { const v = sessionStorage.getItem("orivo_next"); sessionStorage.removeItem("orivo_next"); return v; } catch (e) { return null; } } };
export const lastOrder = { set: (o) => { try { sessionStorage.setItem("orivo_last_order", JSON.stringify(o)); } catch (e) {} }, get: () => { try { return JSON.parse(sessionStorage.getItem("orivo_last_order") || "null"); } catch (e) { return null; } } };

/** Prices, names and stock can change after an item was added. Re-check them whenever the bag is opened. */
export async function refreshCartFromServer() {
  if (!cart.items.length) return false;
  try {
    const ids = [...new Set(cart.items.map((i) => i.productId))].join(",");
    const r = await api("/products" + qs({ ids, limit: 48 }), { auth: false });
    remember(r.products);
    const changed = cart.sync(r.products);
    if (changed) toast("Some prices or availability in your bag were updated");
    return changed;
  } catch (e) { return false; }
}
export const openBag = () => document.dispatchEvent(new Event("orivo:bag"));
