import { api, qs } from "../api.js";
import { go } from "../router.js";
import { html, mount, $, $$, icon, productCard, skeletonGrid, setTitle } from "../ui.js";
import { remember, getCategories, findCategory } from "../data.js";

const SORTS = [["featured", "Featured"], ["newest", "Newest"], ["price_asc", "Price: low to high"], ["price_desc", "Price: high to low"]];
const PAGE_SIZE = 12;

export default async function (view, _params, q, alive) {
  const f = { section: ["available", "preorder"].includes(q.section) ? q.section : "", category: q.category || "", q: q.q || "", sort: q.sort || "featured",
    page: Math.max(parseInt(q.page, 10) || 1, 1), min: q.min || "", max: q.max || "", sale: q.sale === "1", inStock: q.inStock === "1" };
  const url = (patch = {}) => "/shop" + qs({ ...f, sale: f.sale ? 1 : "", inStock: f.inStock ? 1 : "", sort: f.sort === "featured" ? "" : f.sort, page: f.page > 1 ? f.page : "", ...patch });

  const tree = await getCategories();
  if (!alive()) return;
  const hit = f.category ? findCategory(tree, f.category) : null;
  const cat = hit?.cat, group = hit?.group;
  const title = f.q ? `Results for “${f.q}”` : cat ? cat.name : f.sale ? "On sale" : f.section === "preorder" ? "Pre-orders" : f.section === "available" ? "Available now" : "Shop all";
  setTitle(title);
  const lead = f.section === "preorder" ? "Reserve upcoming pieces today. We ship them the moment they arrive, and you pay on delivery."
    : f.section === "available" ? "In stock and ready to ship within 1–3 days." : cat?.description || "Everything at ORIVO, in stock now and arriving soon.";

  const count = (c) => f.section ? c.counts[f.section] : c.counts.available + c.counts.preorder;
  const catLink = (c, sub) => html`<a class="${sub ? "sub " : ""}${f.category === c.slug ? "on" : ""}" href="#${url({ category: c.slug, page: "" })}">${c.name} <small>${count(c)}</small></a>`;

  mount(view, html`<div class="wrap">
    <div class="page-head"><div class="crumbs"><a href="#/">Home</a> / ${group ? html`<a href="#${url({ category: group.slug, page: "" })}">${group.name}</a> / ` : ""}${title}</div>
      <h1>${title}</h1><p>${lead}</p></div>
    <div class="tabs" role="tablist" aria-label="Store section">
      <a class="all ${!f.section ? "on" : ""}" href="#${url({ section: "", page: "" })}" role="tab" aria-selected="${!f.section}">All</a>
      <a class="a ${f.section === "available" ? "on" : ""}" href="#${url({ section: "available", page: "" })}" role="tab" aria-selected="${f.section === "available"}">Available</a>
      <a class="p ${f.section === "preorder" ? "on" : ""}" href="#${url({ section: "preorder", page: "" })}" role="tab" aria-selected="${f.section === "preorder"}">Pre-orders</a>
    </div>
    <div class="shop">
      <aside class="filters" id="filters" aria-label="Filters">
        <div><h4>Categories</h4><div class="flist">
          <a class="${!f.category ? "on" : ""}" href="#${url({ category: "", page: "" })}">All categories</a>
          ${tree.map((g) => html`${catLink(g)}${g.children.map((c) => catLink(c, true))}`)}</div></div>
        <div><h4>Price (৳)</h4><form id="price-form" style="display:grid;gap:10px"><div class="row" style="gap:8px">
          <input type="number" name="min" min="0" inputmode="numeric" placeholder="Min" value="${f.min}" aria-label="Minimum price">
          <input type="number" name="max" min="0" inputmode="numeric" placeholder="Max" value="${f.max}" aria-label="Maximum price"></div>
          <button class="btn btn-ghost btn-sm" type="submit">Apply</button></form></div>
        <div><h4>Refine</h4><label class="radio" style="margin:0 0 8px"><input type="checkbox" id="f-sale" ${f.sale ? "checked" : ""}> On sale</label>
          <label class="radio" style="margin:0"><input type="checkbox" id="f-stock" ${f.inStock ? "checked" : ""}> Hide sold out</label></div>
      </aside>
      <div>
        <div class="toolbar"><div style="display:flex;gap:10px;align-items:center"><button class="btn btn-ghost btn-sm filter-toggle" id="ft" aria-expanded="false" aria-controls="filters">${icon("filter", 16)} Filters</button>
          <span class="muted" id="count" aria-live="polite">Loading…</span></div>
          <select id="sort" aria-label="Sort products">${SORTS.map(([v, l]) => html`<option value="${v}" ${f.sort === v ? "selected" : ""}>${l}</option>`)}</select></div>
        <div id="results">${skeletonGrid(8)}</div>
      </div>
    </div></div>`);

  $("#ft").addEventListener("click", (e) => { const o = $("#filters").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", String(o)); });
  $("#sort").addEventListener("change", (e) => go(url({ sort: e.target.value, page: "" })));
  $("#f-sale").addEventListener("change", (e) => go(url({ sale: e.target.checked ? 1 : "", page: "" })));
  $("#f-stock").addEventListener("change", (e) => go(url({ inStock: e.target.checked ? 1 : "", page: "" })));
  $("#price-form").addEventListener("submit", (e) => { e.preventDefault(); const d = new FormData(e.target); go(url({ min: d.get("min"), max: d.get("max"), page: "" })); });

  let r;
  try {
    r = await api("/products" + qs({ section: f.section, category: f.category, q: f.q, sort: f.sort, page: f.page, limit: PAGE_SIZE, min: f.min, max: f.max, sale: f.sale ? 1 : "", inStock: f.inStock ? 1 : "" }), { auth: false });
  } catch (e) {
    if (!alive()) return;
    mount($("#results"), html`<div class="empty"><h3>Couldn't load products</h3><p>${e.message}</p></div>`); $("#count").textContent = ""; return;
  }
  if (!alive()) return;
  remember(r.products);
  $("#count").textContent = `${r.total} ${r.total === 1 ? "item" : "items"}`;

  if (!r.products.length) {
    mount($("#results"), html`<div class="empty"><h3>Nothing matches yet</h3><p>Try removing a filter, or look in the other section.</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap"><a class="btn btn-primary btn-sm" href="#/shop">Clear filters</a>
      ${f.section === "available" ? html`<a class="btn btn-amber btn-sm" href="#${url({ section: "preorder", page: "" })}">See pre-orders</a>` : ""}</div></div>`);
    return;
  }
  const pages = r.pages, cur = r.page;
  const nums = [...new Set([1, cur - 1, cur, cur + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  mount($("#results"), html`<div class="grid">${r.products.map(productCard)}</div>
    ${pages > 1 ? html`<nav class="pager" aria-label="Pagination">${cur > 1 ? html`<button data-p="${cur - 1}" aria-label="Previous page">‹</button>` : ""}
      ${nums.map((n, i) => html`${i && n - nums[i - 1] > 1 ? html`<span class="faint" style="align-self:center">…</span>` : ""}<button data-p="${n}" class="${n === cur ? "on" : ""}" ${n === cur ? 'aria-current="page"' : ""}>${n}</button>`)}
      ${cur < pages ? html`<button data-p="${cur + 1}" aria-label="Next page">›</button>` : ""}</nav>` : ""}`);
  $$(".pager button").forEach((b) => b.addEventListener("click", () => go(url({ page: b.dataset.p }))));
}
