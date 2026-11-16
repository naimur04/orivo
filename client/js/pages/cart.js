import { cart, subscribe } from "../store.js";
import { html, mount, $, $$, icon, money, productImage, setTitle } from "../ui.js";
import { refreshCartFromServer, getMeta } from "../data.js";

export default async function (view, _p, _q, alive) {
  setTitle("Your bag");
  const { settings: s } = await getMeta();
  await refreshCartFromServer();
  if (!alive()) return;

  const render = () => {
    if (!cart.items.length) {
      mount(view, html`<div class="wrap"><div class="page-head"><h1>Your bag</h1></div>
        <div class="empty"><h3>Your bag is empty</h3><p>Start with what's in stock, or reserve something that's arriving soon.</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap"><a class="btn btn-primary" href="#/shop?section=available">Shop available</a><a class="btn btn-amber" href="#/shop?section=preorder">Pre-orders</a></div></div></div>`);
      return;
    }
    const sub = cart.subtotal, pre = cart.items.some((i) => i.availability === "preorder"), physical = cart.items.some((i) => i.type !== "digital");
    const left = s.free_delivery_threshold && physical ? Math.max(0, s.free_delivery_threshold - sub) : 0;
    mount(view, html`<div class="wrap"><div class="page-head"><h1>Your bag <span class="muted" style="font-weight:400;font-size:.5em">(${cart.count})</span></h1></div>
      <div class="co"><div class="card" style="padding:8px 26px">${cart.items.map((i) => { const k = cart.key(i); return html`<div class="citem" style="grid-template-columns:96px 1fr">
          <a class="pimg" href="#/product/${i.slug}">${productImage(i)}</a>
          <div><a class="nm" href="#/product/${i.slug}">${i.name}</a>
            <div class="opts">${[i.size && "Size " + i.size, i.color, i.availability === "preorder" && "Pre-order"].filter(Boolean).join(" · ") || " "}</div>
            <div class="ln"><div class="qty" role="group" aria-label="Quantity"><button data-q="${k}" data-d="-1" aria-label="Decrease">${icon("minus", 16)}</button><span>${i.quantity}</span><button data-q="${k}" data-d="1" aria-label="Increase">${icon("plus", 16)}</button></div><b>${money(i.price * i.quantity)}</b></div>
            <button class="rm" data-rm="${k}" style="margin-top:8px">Remove</button></div></div>`; })}</div>
        <div class="sticky"><div class="card"><h3>Order summary</h3>
          <div class="sum-line"><span>Subtotal</span><span>${money(sub)}</span></div>
          <div class="sum-line"><span>Delivery</span><span class="faint">Calculated at checkout</span></div>
          ${left > 0 ? html`<div class="notice ice" style="margin:12px 0 4px;font-size:13px">${icon("truck", 18)}<span>Add ${money(left)} more for free delivery.</span></div>` : ""}
          ${pre ? html`<div class="notice amber" style="margin:12px 0 4px;font-size:13px">${icon("clock", 18)}<span>Pre-order items ship when they arrive. You pay on delivery.</span></div>` : ""}
          <div class="sum-line total"><span>Estimated total</span><span>${money(sub)}</span></div>
          <a class="btn btn-primary btn-block btn-lg" href="#/checkout" style="margin-top:14px">Checkout ${icon("arrow", 18)}</a>
          <p class="faint" style="font-size:12.5px;margin-top:12px;text-align:center">No account needed. Promo codes are for ORIVO members.</p></div></div></div></div>`);
    // bind directly to the freshly rendered nodes (the #view element itself lives across pages)
    $$("[data-q]", view).forEach((b) => b.addEventListener("click", () => { const it = cart.items.find((i) => cart.key(i) === b.dataset.q); if (it) cart.setQty(b.dataset.q, it.quantity + Number(b.dataset.d)); }));
    $$("[data-rm]", view).forEach((b) => b.addEventListener("click", () => cart.remove(b.dataset.rm)));
  };
  render();
  const off = subscribe(() => { if (!alive()) return off(); render(); });
}
