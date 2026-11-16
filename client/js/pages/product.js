import { api } from "../api.js";
import { go } from "../router.js";
import { cart } from "../store.js";
import { html, mount, $, $$, icon, money, toast, productImage, art, productCard, arrivalText, fmtDate, setTitle } from "../ui.js";
import { remember, getMeta, openBag } from "../data.js";

export default async function (view, { slug }, _q, alive) {
  mount(view, html`<div class="wrap"><div class="pdp"><div class="skeleton" style="aspect-ratio:4/5"></div><div><div class="skeleton" style="height:40px;width:70%"></div><div class="skeleton" style="height:24px;width:30%;margin-top:18px"></div><div class="skeleton" style="height:140px;margin-top:28px"></div></div></div></div>`);
  let p;
  try { ({ product: p } = await api("/products/" + encodeURIComponent(slug), { auth: false })); }
  catch (e) {
    if (!alive()) return;
    if (e.status === 404) { const { notFound } = await import("./info.js"); return notFound("That product isn't available any more."); }
    throw e;
  }
  if (!alive()) return;
  const { settings: s } = await getMeta();
  remember([p, ...p.related]);
  setTitle(p.name);

  const pre = p.availability === "preorder", digital = p.type === "digital", out = !p.inStock;
  const sel = { size: p.sizes.length === 1 ? p.sizes[0] : null, color: p.colors.length === 1 ? p.colors[0] : null, qty: 1, img: 0 };
  const imgs = p.images?.length ? p.images : [];
  const period = p.billingPeriod === "monthly" ? "per month" : p.billingPeriod === "yearly" ? "per year" : "";
  const maxQty = p.stockLeft ? p.stockLeft : 10;

  const stage = () => imgs.length ? html`<img src="${imgs[sel.img]}" alt="${p.name}">` : art(p);
  const label = pre ? "Pre-order now" : digital ? "Get it now" : "Add to bag";

  mount(view, html`<div class="wrap">
    <div class="crumbs" style="padding-top:22px"><a href="#/">Home</a> / ${p.group ? html`<a href="#/shop?category=${p.group.slug}">${p.group.name}</a> / ` : ""}${p.category ? html`<a href="#/shop?category=${p.category.slug}">${p.category.name}</a> / ` : ""}${p.name}</div>
    <div class="pdp" style="padding-top:8px">
      <div class="gallery" style="${imgs.length > 1 ? "" : "grid-template-columns:1fr"}">
        ${imgs.length > 1 ? html`<div class="thumbs">${imgs.map((u, i) => html`<button data-i="${i}" class="${i === 0 ? "on" : ""}" aria-label="Photo ${i + 1}"><img src="${u}" alt="" loading="lazy"></button>`)}</div>` : ""}
        <div class="stage" id="stage">${stage()}<div class="badges">${pre ? html`<span class="badge pre">Pre-order</span>` : ""}${p.onSale ? html`<span class="badge sale">-${p.discountPercent}%</span>` : ""}${out ? html`<span class="badge out">Sold out</span>` : ""}</div></div>
      </div>
      <div class="pinfo">
        <div class="pmeta">${p.category ? p.category.name : ""}${p.sku ? " · SKU " + p.sku : ""}</div>
        <h1>${p.name}</h1>
        <div class="price"><span class="now ${p.onSale ? "sale" : ""}">${money(p.price)}</span>${p.onSale ? html`<s>${money(p.regularPrice)}</s>` : ""}${period ? html`<span class="muted" style="font-size:14px;font-weight:400">${period}</span>` : ""}</div>
        ${p.shortDescription ? html`<p class="muted" style="margin-top:10px">${p.shortDescription}</p>` : ""}

        ${pre ? html`<div class="pre-box"><b>${icon("clock", 16)} Pre-order · ${arrivalText(p.preorderDate)}</b>
          <span class="muted">${p.preorderNote || "We ship it as soon as it arrives. Pay on delivery, nothing to pay today."}</span></div>` : ""}
        ${digital ? html`<div class="notice ice" style="margin:18px 0">${icon("info", 18)}<span>Digital product. We deliver it to your email after your order is confirmed. No shipping needed.</span></div>` : ""}

        ${p.sizes.length ? html`<div class="opt"><div class="label"><span>Size <b id="size-val">${sel.size || ""}</b></span></div>
          <div class="pills" role="radiogroup" aria-label="Size">${p.sizes.map((v) => html`<button class="pill ${sel.size === v ? "on" : ""}" role="radio" aria-checked="${sel.size === v}" data-size="${v}">${v}</button>`)}</div></div>` : ""}
        ${p.colors.length ? html`<div class="opt"><div class="label"><span>Colour <b id="color-val">${sel.color || ""}</b></span></div>
          <div class="pills" role="radiogroup" aria-label="Colour">${p.colors.map((v) => html`<button class="pill ${sel.color === v ? "on" : ""}" role="radio" aria-checked="${sel.color === v}" data-color="${v}">${v}</button>`)}</div></div>` : ""}

        ${out ? html`<div class="notice err" style="margin:22px 0">${icon("info", 18)}<span>This item is sold out right now. Check the pre-order section for what's arriving next.</span></div>
          <a class="btn btn-ghost" href="#/shop?section=preorder">See pre-orders</a>`
        : html`<div class="buy">
          ${digital ? "" : html`<div class="qty" role="group" aria-label="Quantity"><button id="qm" aria-label="Decrease quantity">${icon("minus", 16)}</button><span id="qv" aria-live="polite">1</span><button id="qp" aria-label="Increase quantity">${icon("plus", 16)}</button></div>`}
          <button class="btn ${pre ? "btn-amber" : "btn-primary"} btn-lg" id="add" style="flex:1;min-width:180px">${label}</button></div>
          <button class="btn btn-ghost btn-block" id="buy-now">Buy it now</button>
          ${p.stockLeft ? html`<div class="stock-note">Only ${p.stockLeft} left in stock</div>` : ""}
          <div class="err-text" id="opt-err" role="alert" hidden></div>`}

        <div class="acc">
          <details open><summary>Details</summary><div class="in">${p.description || p.shortDescription || "A signature ORIVO piece."}</div></details>
          <details><summary>Delivery &amp; payment</summary><div class="in">${digital ? "Delivered by email once your order is confirmed." : `Inside Dhaka ${money(s.delivery_inside_dhaka)} · Outside Dhaka ${money(s.delivery_outside_dhaka)}${s.free_delivery_threshold ? `. Free delivery on orders over ${money(s.free_delivery_threshold)}.` : "."}`}
Cash on delivery is available nationwide. Online payments (bKash, Nagad, Rocket and cards) are coming soon.${pre ? "\nPre-orders ship when stock arrives. You pay on delivery." : ""}</div></details>
          <details><summary>Returns</summary><div class="in">${digital ? "Digital memberships can be cancelled any time before the next billing period." : "Not right? Contact us within 3 days of delivery for a size exchange or return on unworn items with tags attached."}</div></details>
        </div>
      </div>
    </div>
    ${p.related.length ? html`<section class="sec"><div class="sec-head"><h2>You may also like</h2></div><div class="grid">${p.related.map(productCard)}</div></section>` : ""}</div>`);

  /* gallery */
  $$(".thumbs button").forEach((b) => b.addEventListener("click", () => {
    sel.img = Number(b.dataset.i); $$(".thumbs button").forEach((x) => x.classList.toggle("on", x === b));
    const img = $("#stage img"); if (img) img.src = imgs[sel.img];
  }));
  if (out) return;

  /* options */
  const pick = (kind) => $$(`[data-${kind}]`).forEach((b) => b.addEventListener("click", () => {
    sel[kind] = b.dataset[kind]; $(`#${kind}-val`).textContent = sel[kind];
    $$(`[data-${kind}]`).forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(on)); });
    $("#opt-err").hidden = true;
  }));
  pick("size"); pick("color");
  if (!digital) {
    const setQ = (n) => { sel.qty = Math.max(1, Math.min(maxQty, n)); $("#qv").textContent = sel.qty; };
    $("#qm").addEventListener("click", () => setQ(sel.qty - 1)); $("#qp").addEventListener("click", () => setQ(sel.qty + 1));
  }

  function commit() {
    const missing = p.sizes.length && !sel.size ? "size" : p.colors.length && !sel.color ? "colour" : null;
    if (missing) { const e = $("#opt-err"); e.textContent = `Please choose a ${missing} first.`; e.hidden = false; return false; }
    const inBag = cart.items.filter((i) => i.productId === p.id).reduce((n, i) => n + i.quantity, 0);
    if (p.stockLeft && inBag + sel.qty > p.stockLeft) { toast(`Only ${p.stockLeft} available, and you already have ${inBag} in your bag`, "err"); return false; }
    cart.add(p, { size: sel.size, color: sel.color, quantity: digital ? 1 : sel.qty });
    return true;
  }
  $("#add").addEventListener("click", () => { if (commit()) { toast(pre ? "Pre-order added to your bag" : "Added to your bag"); openBag(); } });
  $("#buy-now").addEventListener("click", () => { if (commit()) go("/checkout"); });
}
