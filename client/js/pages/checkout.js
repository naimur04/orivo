import { api, ApiError } from "../api.js";
import { go } from "../router.js";
import { cart, getUser, setUser, payloadItems, subscribe } from "../store.js";
import { html, mount, $, $$, icon, money, productImage, setTitle, esc } from "../ui.js";
import { getMeta, refreshCartFromServer, nextAfterAuth, lastOrder } from "../data.js";

const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export default async function (view, _p, _q, alive) {
  setTitle("Checkout");
  const { settings: s, payments } = await getMeta();
  if (getUser()) { try { setUser((await api("/auth/me")).customer); } catch (e) { /* expired token is cleared by api() */ } }
  await refreshCartFromServer();
  if (!alive()) return;
  if (!cart.items.length) return go("/cart");

  const user = getUser();
  const physical = () => cart.items.some((i) => i.type !== "digital");
  const digital = () => cart.items.some((i) => i.type === "digital");
  let done = false;
  const st = { zone: user?.deliveryZone || "", promo: null, quote: null, pay: "cod", busy: false, promoMsg: null };
  nextAfterAuth.set("/checkout");

  mount(view, html`<div class="wrap"><div class="page-head" style="padding-bottom:20px"><div class="crumbs"><a href="#/cart">Bag</a> / Checkout</div><h1>Checkout</h1></div>
    <form class="co" id="co" novalidate>
      <div>
        ${user ? "" : html`<div class="notice ice" style="margin-bottom:18px">${icon("user", 20)}<div><b>Checking out as a guest.</b> No account needed. Just add your details below.
          <div class="muted" style="font-size:13px;margin-top:4px"><a class="link" href="#/login">Log in</a> or <a class="link" href="#/register">create an account</a> to use promo codes and save your details.</div></div></div>`}

        <div class="card"><h3>${icon("user", 20)} Contact</h3>
          <div class="field"><label for="f-name">Full name</label><input id="f-name" name="name" autocomplete="name" required value="${user?.name || ""}" placeholder="Your name"><div class="err-text" data-err="name" hidden></div></div>
          <div class="row">
            <div class="field"><label for="f-phone">Mobile number</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required value="${user?.phone || ""}" placeholder="01712345678"><div class="err-text" data-err="phone" hidden></div></div>
            <div class="field"><label for="f-email">Email <span class="faint" id="email-opt">${digital() ? "" : "(optional)"}</span></label><input id="f-email" name="email" type="email" autocomplete="email" value="${user?.email || ""}" placeholder="you@example.com"><div class="err-text" data-err="email" hidden></div></div>
          </div>
        </div>

        <div class="card" id="ship-card" ${physical() ? "" : "hidden"}><h3>${icon("truck", 20)} Delivery</h3>
          <div class="field"><label for="f-address">Full address</label><textarea id="f-address" name="address" autocomplete="street-address" placeholder="House, road, area, thana, district">${user?.address || ""}</textarea><div class="err-text" data-err="address" hidden></div></div>
          <div class="label" style="margin-bottom:8px" id="zone-l">Delivery area</div>
          <div class="zone" role="radiogroup" aria-labelledby="zone-l">
            <label class="radio"><input type="radio" name="zone" value="inside_dhaka" ${st.zone === "inside_dhaka" ? "checked" : ""}><span><b>Inside Dhaka</b><span>${money(s.delivery_inside_dhaka)} · 1–2 days</span></span></label>
            <label class="radio"><input type="radio" name="zone" value="outside_dhaka" ${st.zone === "outside_dhaka" ? "checked" : ""}><span><b>Outside Dhaka</b><span>${money(s.delivery_outside_dhaka)} · 2–4 days</span></span></label></div>
          <div class="err-text" data-err="zone" hidden></div>
          ${s.free_delivery_threshold ? html`<p class="faint" style="font-size:13px;margin-top:12px">Free delivery on orders over ${money(s.free_delivery_threshold)}.</p>` : ""}
          <div class="field" style="margin:16px 0 0"><label for="f-notes">Order note <span class="faint">(optional)</span></label><input id="f-notes" name="notes" maxlength="300" placeholder="Landmark, preferred delivery time…"></div>
        </div>
        <div class="card" id="dig-card" ${physical() ? "hidden" : ""}><h3>${icon("info", 20)} Digital delivery</h3><p class="muted">Your order has no shipping. We'll send it to your email once it's confirmed, so please double-check the address above.</p></div>

        <div class="card"><h3>${icon("cash", 20)} Payment</h3>
          ${payments.map((m) => html`<label class="radio ${m.enabled ? "" : "off"}"><input type="radio" name="pay" value="${m.id}" ${m.id === "cod" ? "checked" : ""} ${m.enabled ? "" : "disabled"}>
            <span><b style="font-weight:600">${m.label}</b>${m.id === "cod" ? html`<br><span class="muted" style="font-size:13px">Pay in cash when your order arrives</span>` : ""}</span>${m.enabled ? "" : html`<small>Coming soon</small>`}</label>`)}
          <p class="faint" style="font-size:12.5px;margin-top:8px">More ways to pay are on the way: bKash, Nagad, Rocket and cards.</p>
        </div>
      </div>

      <aside class="sum sticky" aria-label="Order summary"><div class="card"><h3>Order summary</h3>
        <div id="sum-items"></div>
        <div style="margin:14px 0 10px" id="promo-box"></div>
        <div id="sum-totals"></div>
        <div class="err-text" id="form-err" role="alert" hidden style="margin:12px 0 0;font-size:14px"></div>
        <button class="btn btn-primary btn-block btn-lg" id="place" type="submit" style="margin-top:16px">Place order</button>
        <p class="faint" style="font-size:12.5px;margin-top:12px;display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;text-align:center">${icon("lock", 13)} By placing your order you agree to our <a class="link" href="#/terms">terms</a>.</p>
      </div></aside>
    </form></div>`);

  const form = $("#co");
  const val = (n) => (form.elements[n]?.value || "").trim();
  const codeOf = () => (st.promo ? st.promo.code : undefined);
  const setErr = (k, msg) => { const el = $(`[data-err="${k}"]`); if (!el) return; el.textContent = msg || ""; el.hidden = !msg; };

  /* ── summary ── */
  function drawItems() {
    mount($("#sum-items"), html`${cart.items.map((i) => html`<div class="sum-item"><div class="pimg">${productImage(i)}<span class="qn">${i.quantity}</span></div>
      <div><div style="font-size:14px;font-weight:500;line-height:1.3">${i.name}</div><div class="faint" style="font-size:12.5px">${[i.size, i.color, i.availability === "preorder" && "Pre-order"].filter(Boolean).join(" · ")}</div></div>
      <b style="font-size:14px">${money(i.price * i.quantity)}</b></div>`)}`);
  }
  function drawTotals() {
    const q = st.quote, sub = q ? q.subtotal : cart.subtotal;
    const zoneChosen = !physical() || st.zone;
    // until the delivery area is chosen the server assumes the dearer zone, so don't show that in the total yet
    const shown = !q ? sub : zoneChosen ? q.total : q.subtotal - q.discount;
    mount($("#sum-totals"), html`<div class="sum-line"><span>Subtotal</span><span>${money(sub)}</span></div>
      ${q && q.discount > 0 ? html`<div class="sum-line"><span>Promo (${q.promo?.code})</span><span class="disc">−${money(q.discount)}</span></div>` : ""}
      <div class="sum-line"><span>Delivery</span><span>${!physical() ? "Digital" : !zoneChosen ? html`<span class="faint">Choose area</span>` : q ? (q.delivery ? money(q.delivery) : html`<span class="disc">Free</span>`) : "…"}</span></div>
      <div class="sum-line total"><span>Total</span><span>${money(shown)}</span></div>`);
    const method = payments.find((m) => m.id === st.pay);
    $("#place").innerHTML = st.busy ? '<span class="spin"></span> Placing order…' : `Place order · ${money(shown)}`;
    $("#place").disabled = st.busy;
  }
  function drawPromo() {
    const box = $("#promo-box");
    if (!getUser()) {
      mount(box, html`<div class="promo-lock">${icon("lock", 20)}<div><b style="color:#fff;font-weight:600">Promo codes are for members</b><br><a class="link" href="#/login">Log in</a> or <a class="link" href="#/register">create a free account</a> to use one. Your bag will be waiting.</div></div>`);
      return;
    }
    if (st.promo) {
      mount(box, html`<div class="promo-ok"><div><b>${st.promo.code}</b> applied<div class="muted" style="font-size:13px">${st.promo.description || ""}</div></div><button type="button" class="rm" id="promo-rm">Remove</button></div>`);
      $("#promo-rm").addEventListener("click", () => { st.promo = null; st.promoMsg = null; drawPromo(); requote(); });
      return;
    }
    mount(box, html`<div class="promo-row"><input id="promo-in" placeholder="Promo code" aria-label="Promo code" autocomplete="off" autocapitalize="characters" style="text-transform:uppercase"><button type="button" class="btn btn-ghost" id="promo-go">Apply</button></div>
      ${st.promoMsg ? html`<div class="err-text" role="alert">${st.promoMsg}</div>` : ""}`);
    const apply = async () => {
      const code = $("#promo-in").value.trim();
      if (!code) { st.promoMsg = "Enter a promo code"; return drawPromo(); }
      const btn = $("#promo-go"); btn.disabled = true;
      try {
        const r = await api("/promo/validate", { method: "POST", body: { items: payloadItems(), zone: st.zone || undefined, code } });
        st.promo = r.promo; st.promoMsg = null; st.quote = r.quote;
      } catch (e) { st.promoMsg = e.message; }
      if (!alive()) return;
      drawPromo(); drawTotals();
    };
    $("#promo-go").addEventListener("click", apply);
    $("#promo-in").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } });
  }

  let qSeq = 0;
  async function requote() {
    const my = ++qSeq;
    try {
      const r = await api("/orders/quote", { method: "POST", body: { items: payloadItems(), zone: st.zone || undefined, promoCode: codeOf() } });
      if (my !== qSeq || !alive()) return;
      st.quote = r.quote;
      if (r.quote.promoError) { st.promo = null; st.promoMsg = r.quote.promoError.message; drawPromo(); }
      setErr("form", ""); $("#form-err").hidden = true;
    } catch (e) {
      if (my !== qSeq || !alive()) return;
      st.quote = null;
      const fe = $("#form-err"); fe.textContent = e.message; fe.hidden = false;
    }
    drawTotals();
  }

  drawItems(); drawPromo(); drawTotals(); requote();
  const off = subscribe(() => { if (done || !alive()) return off(); if (!cart.items.length) return go("/cart"); drawItems(); requote(); });

  $$('input[name="zone"]').forEach((r) => r.addEventListener("change", () => { st.zone = r.value; setErr("zone", ""); requote(); }));
  $$('input[name="pay"]').forEach((r) => r.addEventListener("change", () => { st.pay = r.value; drawTotals(); }));

  /* ── validate + submit ── */
  function validate() {
    let ok = true; const bad = (k, m) => { setErr(k, m); ok = false; };
    ["name", "phone", "email", "address", "zone"].forEach((k) => setErr(k, ""));
    if (val("name").length < 2) bad("name", "Please enter your name");
    if (!PHONE.test(val("phone").replace(/[\s-]/g, ""))) bad("phone", "Enter a valid mobile number, e.g. 01712345678");
    const em = val("email");
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) bad("email", "That email doesn't look right");
    if (digital() && !em) bad("email", "Email is required so we can deliver your digital item");
    if (physical()) {
      if (val("address").length < 8) bad("address", "Please enter your full delivery address");
      if (!st.zone) bad("zone", "Please choose your delivery area");
    }
    if (!ok) { const first = $(".err-text[data-err]:not([hidden])"); first?.closest(".field, .card")?.querySelector("input,textarea")?.focus(); first?.scrollIntoView({ block: "center", behavior: "smooth" }); }
    return ok;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (st.busy) return;
    const fe = $("#form-err"); fe.hidden = true;
    if (!validate()) return;
    st.busy = true; drawTotals();
    try {
      const r = await api("/orders", { method: "POST", body: {
        items: payloadItems(), zone: physical() ? st.zone : undefined, promoCode: codeOf(), paymentMethod: st.pay, notes: val("notes") || undefined,
        contact: { name: val("name"), phone: val("phone"), email: val("email") || undefined, address: physical() ? val("address") : undefined } } });
      lastOrder.set({ orderNumber: r.order.orderNumber, phone: val("phone"), email: val("email"), total: r.order.total, guest: !r.loggedIn, hasPreorder: r.order.hasPreorder, hasDigital: r.order.hasDigital, method: r.order.paymentMethod });
      done = true; cart.clear();
      if (r.payment?.type === "redirect" && r.payment.redirectUrl) { location.href = r.payment.redirectUrl; return; }
      go(`/order/${encodeURIComponent(r.order.orderNumber)}?placed=1`);
    } catch (err) {
      st.busy = false;
      if (!alive()) return;
      if (err.code === "LOGIN_REQUIRED" || err.code === "PROMO_LOGIN_REQUIRED") { st.promo = null; drawPromo(); }
      if (["OUT_OF_STOCK", "PRODUCT_UNAVAILABLE"].includes(err.code)) await refreshCartFromServer();
      fe.textContent = err.message; fe.hidden = false; fe.scrollIntoView({ block: "center", behavior: "smooth" });
      if (err.code && ["PROMO_INVALID", "PROMO_EXPIRED", "PROMO_ALREADY_USED", "PROMO_MIN_ORDER", "PROMO_NOT_APPLICABLE", "PROMO_EXHAUSTED", "PROMO_NOT_STARTED"].includes(err.code)) { st.promo = null; st.promoMsg = err.message; drawPromo(); requote(); }
      drawTotals();
    }
  });
}
