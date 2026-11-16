import { api } from "../api.js";
import { getUser } from "../store.js";
import { html, mount, $, icon, money, productImage, fmtDateTime, setTitle } from "../ui.js";
import { lastOrder, PAY_LABEL } from "../data.js";

export const statusPill = (o) => html`<span class="status ${o.status}">${o.statusLabel}</span>`;

/** Full order view, shared by the confirmation page, tracking page and the account area. */
export function orderBody(o) {
  const cancelled = o.status === "cancelled";
  const next = cancelled ? "This order was cancelled." : o.status === "delivered" ? "Delivered. We hope you love it." : o.hasPreorder
    ? "Your pre-order is reserved. We'll call to confirm, then ship it as soon as it arrives." : o.hasDigital && !o.items.some((i) => i.type !== "digital")
    ? "We'll email your digital item once the order is confirmed." : "We'll call to confirm your order, then pack and ship it.";
  return html`<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:6px">
      <div><div class="faint" style="font-size:13px">Order ${o.orderNumber}</div><div class="muted" style="font-size:13px">${fmtDateTime(o.createdAt)}</div></div>${statusPill(o)}</div>
    <p class="muted" style="margin:12px 0 18px">${next}</p>
    <div class="timeline" aria-label="Order progress">${o.timeline.map((t) => html`<div class="tl ${t.status === "cancelled" ? "cancelled" : ""}"><i></i><div><b>${t.label}</b><span>${fmtDateTime(t.at)}${t.note ? " · " + t.note : ""}</span></div></div>`)}</div></div>
    <div class="card"><h3>Items</h3>${o.items.map((i) => html`<div class="sum-item" style="grid-template-columns:56px 1fr auto"><div class="pimg">${productImage({ name: i.name, slug: i.name, image: i.image, availability: i.availability, type: i.type, category: null })}<span class="qn">${i.quantity}</span></div>
        <div><div style="font-size:14px;font-weight:500">${i.name}</div><div class="faint" style="font-size:12.5px">${[i.size, i.color, i.availability === "preorder" && "Pre-order"].filter(Boolean).join(" · ")}</div></div><b style="font-size:14px">${money(i.total)}</b></div>`)}
      <div style="margin-top:10px"><div class="sum-line"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
        ${o.discount > 0 ? html`<div class="sum-line"><span>Promo ${o.promoCode ? `(${o.promoCode})` : ""}</span><span class="disc">−${money(o.discount)}</span></div>` : ""}
        <div class="sum-line"><span>Delivery</span><span>${o.delivery ? money(o.delivery) : "Free"}</span></div>
        <div class="sum-line total"><span>Total</span><span>${money(o.total)}</span></div></div></div>
    <div class="card"><h3>Details</h3><div class="row" style="gap:22px">
      <div><div class="label">Deliver to</div><p>${o.customerName}<br>${o.customerPhone}${o.customerEmail ? html`<br>${o.customerEmail}` : ""}</p><p class="muted" style="margin-top:6px;white-space:pre-line">${o.address}</p></div>
      <div><div class="label">Payment</div><p>${PAY_LABEL[o.paymentMethod] || o.paymentMethod}<br><span class="muted">${o.paymentStatus === "paid" ? "Paid" : o.paymentMethod === "cod" ? "Pay on delivery" : "Awaiting payment"}</span></p>
        ${o.notes ? html`<div class="label" style="margin-top:12px">Your note</div><p class="muted">${o.notes}</p>` : ""}</div></div></div>`;
}

async function fetchOrder(number) {
  if (getUser()) { try { return (await api(`/auth/orders/${encodeURIComponent(number)}`)).order; } catch (e) { if (e.status !== 404 && e.status !== 401) throw e; } }
  const last = lastOrder.get();
  if (last && last.orderNumber === number) return (await api("/orders/track", { method: "POST", body: { orderNumber: number, phone: last.phone }, auth: false })).order;
  return null;
}

export default async function (view, { number }, query, alive) {
  setTitle(`Order ${number}`);
  mount(view, html`<div class="wrap"><div class="mid" style="padding:50px 0"><div class="skeleton" style="height:300px"></div></div></div>`);
  let order = null, err = null;
  try { order = await fetchOrder(number); } catch (e) { err = e; }
  if (!alive()) return;

  if (!order) {
    mount(view, html`<div class="wrap"><div class="narrow auth"><h1>Find your order</h1>
      <p class="muted" style="margin-bottom:22px">${err ? err.message : "Enter the phone number you used at checkout to view this order."}</p>${trackForm(number, "")}</div></div>`);
    wireTrack(view, alive); return;
  }
  const placed = query.placed === "1";
  const pay = query.payment;
  mount(view, html`<div class="wrap"><div class="mid" style="padding:44px 0 0">
    ${placed ? html`<div style="text-align:center;margin-bottom:30px"><div class="big-check">${icon("check", 36, 2.2)}</div><h1 style="font-size:clamp(28px,4vw,42px)">Thank you, ${order.customerName.split(" ")[0]}!</h1>
      <p class="muted" style="margin-top:10px">${order.hasPreorder ? "Your pre-order is reserved." : "Your order is placed."} Save your order number:</p>
      <div class="onum">${order.orderNumber}</div>
      <p class="faint" style="font-size:13px">You'll need it with your phone number (${order.customerPhone}) to track this order.</p></div>`
    : html`<div class="page-head" style="padding-top:0"><div class="crumbs"><a href="#/">Home</a> / Order</div><h1>Order ${order.orderNumber}</h1></div>`}
    ${pay === "failed" || pay === "cancelled" ? html`<div class="notice err" style="margin-bottom:18px">${icon("info", 18)}<span>Your payment didn't go through. You can place a new order, or choose Cash on Delivery.</span></div>` : ""}
    ${pay === "success" ? html`<div class="notice ok" style="margin-bottom:18px">${icon("check", 18)}<span>Payment received. Thank you!</span></div>` : ""}
    ${orderBody(order)}
    ${placed && !getUser() ? html`<div class="card" style="margin-top:18px"><h3>${icon("star", 20)} Want promo codes next time?</h3><p class="muted" style="margin-bottom:16px">Create a free ORIVO account to unlock member promo codes, faster checkout and order history.</p><a class="btn btn-primary" href="#/register">Create free account</a></div>` : ""}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:24px;justify-content:center"><a class="btn btn-primary" href="#/shop">Continue shopping</a><a class="btn btn-ghost" href="#/track">Track another order</a></div>
  </div></div>`);
}

const trackForm = (number, phone) => html`<form id="track-form" novalidate><div class="field"><label for="t-num">Order number</label><input id="t-num" name="number" placeholder="ORV-261103-A1B2C3" value="${number}" autocapitalize="characters" required></div>
  <div class="field"><label for="t-phone">Phone number used for the order</label><input id="t-phone" name="phone" type="tel" placeholder="01712345678" value="${phone}" required></div>
  <div class="err-text" id="t-err" role="alert" hidden style="margin-bottom:12px"></div>
  <button class="btn btn-primary btn-block btn-lg" type="submit">Track order</button></form>`;

function wireTrack(root, alive, onResult) {
  const form = $("#track-form", root); if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#t-err", root), btn = $("button", form); err.hidden = true;
    const number = form.elements.number.value.trim(), phone = form.elements.phone.value.trim();
    if (!number || !phone) { err.textContent = "Enter both your order number and phone number"; err.hidden = false; return; }
    btn.disabled = true;
    try {
      const r = await api("/orders/track", { method: "POST", body: { orderNumber: number, phone }, auth: false });
      lastOrder.set({ orderNumber: r.order.orderNumber, phone, guest: !getUser() });
      if (onResult) onResult(r.order); else location.hash = `#/order/${encodeURIComponent(r.order.orderNumber)}`;
    } catch (e2) { err.textContent = e2.message; err.hidden = false; }
    btn.disabled = false;
  });
}

export async function track(view, _p, query, alive) {
  setTitle("Track your order");
  const last = lastOrder.get();
  mount(view, html`<div class="wrap"><div class="narrow auth"><h1>Track your order</h1><p class="muted" style="margin-bottom:22px">No account needed. Enter your order number and the phone number you used at checkout.</p>
    ${trackForm(query.n || last?.orderNumber || "", last?.phone || "")}</div><div class="mid" id="track-out" style="padding-bottom:20px"></div></div>`);
  wireTrack(view, alive, (o) => { mount($("#track-out"), html`<div style="margin-top:34px">${orderBody(o)}</div>`); $("#track-out").scrollIntoView({ behavior: "smooth", block: "start" }); });
}
