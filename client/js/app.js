import { route, start, go, parseHash } from "./router.js";
import { cart, subscribe, getUser } from "./store.js";
import { html, raw, mount, $, $$, icon, money, toast, productImage, esc } from "./ui.js";
import { api, qs } from "./api.js";
import { known, getMeta, refreshCartFromServer } from "./data.js";

const app = document.getElementById("app");

/* ───────── shell ───────── */
mount(app, html`
  <div class="topbar" id="topbar" hidden></div>
  <header class="hdr">
    <div class="wrap">
      <a class="brand" href="#/" aria-label="ORIVO home"><img src="/assets/logo-lockup.png" alt="ORIVO" width="103" height="46"></a>
      <nav class="nav" id="nav" aria-label="Main">
        <a class="sec-a" data-k="available" href="#/shop?section=available">Available</a>
        <a class="sec-p" data-k="preorder" href="#/shop?section=preorder">Pre-orders</a>
        <a data-k="women" href="#/shop?category=women">Women</a>
        <a data-k="men" href="#/shop?category=men">Men</a>
        <a data-k="digital" href="#/shop?category=digital">Digital</a>
      </nav>
      <div class="hdr-actions">
        <button class="icon-btn" id="btn-search" aria-label="Search" aria-expanded="false">${icon("search")}</button>
        <a class="icon-btn" id="btn-acct" href="#/login" aria-label="Account">${icon("user")}</a>
        <button class="icon-btn" id="btn-cart" aria-label="Open bag">${icon("bag")}<span class="count" id="cart-count" hidden>0</span></button>
        <button class="icon-btn burger" id="btn-burger" aria-label="Menu" aria-expanded="false">${icon("menu")}</button>
      </div>
    </div>
    <div class="search-panel" id="search-panel" hidden><div class="wrap"><form id="search-form" role="search">
      <input type="search" id="search-input" placeholder="Search bags, dresses, wallets, memberships…" aria-label="Search products" autocomplete="off">
      <button class="btn btn-primary" type="submit">Search</button></form></div></div>
  </header>
  <main id="view" tabindex="-1"></main>
  <footer class="ftr" id="footer"></footer>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" aria-label="Shopping bag" aria-hidden="true"></aside>`);

const view = $("#view");

/* ───────── meta-driven bits: announcement + footer ───────── */
getMeta().then(({ settings: s, payments }) => {
  const bar = $("#topbar");
  if (s.announcement) { bar.textContent = s.announcement; bar.hidden = false; }
  const pay = payments.map((p) => `<span>${esc(p.label)}${p.enabled ? "" : " · soon"}</span>`).join("");
  mount($("#footer"), html`<div class="wrap">
    <div class="fgrid">
      <div><img src="/assets/logo-full.png" alt="ORIVO" width="122" height="78"><p class="muted" style="max-width:32ch">${s.tagline}</p>
        <p class="faint" style="margin-top:14px;font-size:13px">${s.contact_address}${s.contact_phone ? html`<br>${s.contact_phone}` : ""}${s.contact_email ? html`<br>${s.contact_email}` : ""}</p>
        <div class="footer-social" aria-label="Follow ORIVO on social media">
          <h4>Follow us</h4>
          <div class="footer-social-links">
            <a href="https://www.facebook.com/orivo.bd" target="_blank" rel="noopener noreferrer" aria-label="ORIVO on Facebook" title="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"/></svg>
              <span>Facebook</span>
            </a>
            <a href="https://www.instagram.com/orivo.bd/" target="_blank" rel="noopener noreferrer" aria-label="ORIVO on Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>
              <span>Instagram</span>
            </a>
          </div>
        </div></div>
      <div><h4>Shop</h4><ul>
        <li><a href="#/shop?section=available">Available now</a></li><li><a href="#/shop?section=preorder">Pre-orders</a></li>
        <li><a href="#/shop?category=women">Women</a></li><li><a href="#/shop?category=men">Men</a></li><li><a href="#/shop?category=digital">Digital &amp; memberships</a></li></ul></div>
      <div><h4>Help</h4><ul>
        <li><a href="#/track">Track your order</a></li><li><a href="#/shipping">Delivery &amp; payment</a></li><li><a href="#/returns">Returns</a></li>
        <li><a href="#/faq">FAQ</a></li><li><a href="#/contact">Contact us</a></li></ul></div>
      <div><h4>ORIVO</h4><ul>
        <li><a href="#/about">Our story</a></li><li><a href="#/register">Create an account</a></li><li><a href="#/login">Log in</a></li></ul></div>
    </div>
    <div class="fbase"><span>© ${new Date().getFullYear()} ORIVO · Est. 2025 · All rights reserved</span><div class="pay-chips" aria-label="Payment methods">${raw(pay)}</div></div></div>`);
});

/* ───────── header state ───────── */
function syncHeader() {
  const n = cart.count, c = $("#cart-count");
  c.textContent = n > 99 ? "99+" : n; c.hidden = !n;
  $("#btn-cart").setAttribute("aria-label", `Open bag (${n} item${n === 1 ? "" : "s"})`);
  const u = getUser(), a = $("#btn-acct");
  a.href = u ? "#/account" : "#/login";
  a.setAttribute("aria-label", u ? `Account: ${u.name}` : "Log in");
}
function syncNav() {
  const { path, query } = parseHash();
  const key = path === "/shop" ? (query.section || (query.category || "").split("-")[0] || "") : "";
  $$("#nav a").forEach((a) => a.classList.toggle("on", a.dataset.k === key));
}

/* ───────── search + mobile menu ───────── */
const panel = $("#search-panel"), burger = $("#btn-burger"), nav = $("#nav");
function setSearch(open) { panel.hidden = !open; $("#btn-search").setAttribute("aria-expanded", String(open)); if (open) $("#search-input").focus(); }
$("#btn-search").addEventListener("click", () => setSearch(panel.hidden));
$("#search-form").addEventListener("submit", (e) => {
  e.preventDefault(); const q = $("#search-input").value.trim(); if (!q) return;
  setSearch(false); go("/shop" + qs({ q }));
});
burger.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", String(o)); });
const closeMenus = () => { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); setSearch(false); };

/* ───────── cart drawer ───────── */
const drawer = $("#drawer"), scrim = $("#scrim");
let lastFocus = null;
function drawerLines() {
  if (!cart.items.length) return html`<div class="empty" style="margin:24px 0"><h3>Your bag is empty</h3><p>Nothing here yet. Start with what's in stock, or reserve something new.</p>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap"><a class="btn btn-primary btn-sm" href="#/shop?section=available" data-close>Shop available</a><a class="btn btn-amber btn-sm" href="#/shop?section=preorder" data-close>Pre-orders</a></div></div>`;
  return html`${cart.items.map((i) => { const k = cart.key(i); return html`<div class="citem">
    <a class="pimg" href="#/product/${i.slug}" data-close>${productImage(i)}</a>
    <div><a class="nm" href="#/product/${i.slug}" data-close>${i.name}</a>
      <div class="opts">${[i.size && "Size " + i.size, i.color, i.availability === "preorder" && "Pre-order"].filter(Boolean).join(" · ")}</div>
      <div class="ln"><div class="qty" role="group" aria-label="Quantity"><button data-q="${k}" data-d="-1" aria-label="Decrease">${icon("minus", 16)}</button><span>${i.quantity}</span><button data-q="${k}" data-d="1" aria-label="Increase">${icon("plus", 16)}</button></div>
        <b>${money(i.price * i.quantity)}</b></div>
      <button class="rm" data-rm="${k}" style="margin-top:8px">Remove</button></div></div>`; })}`;
}
function renderDrawer() {
  const has = cart.items.length, pre = cart.items.some((i) => i.availability === "preorder");
  mount(drawer, html`<header><h3>Your bag <span class="muted" style="font-weight:400;font-size:15px">(${cart.count})</span></h3><button class="icon-btn" data-close aria-label="Close bag">${icon("x")}</button></header>
    <div class="body">${drawerLines()}</div>
    ${has ? html`<footer>
      ${pre ? html`<div class="notice amber" style="font-size:13px">${icon("clock", 18)}<span>Your bag has pre-order items. They ship when they arrive, and you pay on delivery.</span></div>` : ""}
      <div class="tot"><span>Subtotal</span><span>${money(cart.subtotal)}</span></div>
      <p class="faint" style="font-size:12.5px;margin:-4px 0 2px">Delivery and promo codes are applied at checkout.</p>
      <a class="btn btn-primary btn-block btn-lg" href="#/checkout" data-close>Checkout</a>
      <a class="btn btn-ghost btn-block btn-sm" href="#/cart" data-close>View full bag</a></footer>` : ""}`);
}
function openDrawer() {
  lastFocus = document.activeElement; renderDrawer();
  drawer.classList.add("on"); scrim.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
  drawer.querySelector("[data-close]")?.focus();
  refreshCartFromServer();
}
function closeDrawer() {
  if (!drawer.classList.contains("on")) return;
  drawer.classList.remove("on"); scrim.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); document.body.style.overflow = "";
  lastFocus?.focus?.();
}
$("#btn-cart").addEventListener("click", openDrawer);
scrim.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawer(); closeMenus(); } });

drawer.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeDrawer();
  const q = e.target.closest("[data-q]"); if (q) { const it = cart.items.find((i) => cart.key(i) === q.dataset.q); if (it) cart.setQty(q.dataset.q, it.quantity + Number(q.dataset.d)); return; }
  const rm = e.target.closest("[data-rm]"); if (rm) cart.remove(rm.dataset.rm);
});

/* ───────── add-to-bag buttons anywhere on the page ───────── */
view.addEventListener("click", (e) => {
  const b = e.target.closest("[data-add]"); if (!b) return;
  const p = known.get(Number(b.dataset.add)); if (!p) return;
  cart.add(p); toast(`${p.name} added to your bag`); openDrawer();
});
document.addEventListener("click", (e) => { if (e.target.closest("#nav a")) closeMenus(); });

subscribe(() => { syncHeader(); if (drawer.classList.contains("on")) renderDrawer(); });
syncHeader();
document.addEventListener("orivo:bag", openDrawer);

/* ───────── routes (page modules load on demand) ───────── */
const page = (file, fn = "default") => async (params, query, alive) => {
  closeMenus(); closeDrawer(); syncNav();
  try {
    const mod = await import(`./pages/${file}.js`);
    if (!alive()) return;
    await mod[fn](view, params, query, alive);
    if (alive()) { view.classList.remove("page-fade"); void view.offsetWidth; view.classList.add("page-fade"); }
  } catch (e) {
    if (!alive()) return;
    console.error(e);
    mount(view, html`<div class="wrap"><div class="empty" style="margin:60px 0"><h3>We couldn't load this page</h3><p>${e.message || "Please check your connection."}</p>
      <button class="btn btn-primary" style="margin-top:18px" id="retry">Try again</button></div></div>`);
    $("#retry")?.addEventListener("click", () => go(location.hash.slice(1) || "/"));
  }
};

route("/", page("home"));
route("/shop", page("shop"));
route("/product/:slug", page("product"));
route("/cart", page("cart"));
route("/checkout", page("checkout"));
route("/order/:number", page("order"));
route("/track", page("order", "track"));
route("/login", page("auth", "login"));
route("/register", page("auth", "register"));
route("/account", page("account"));
route("/account/orders", page("account", "orders"));
route("/account/orders/:number", page("account", "orderDetail"));
for (const k of ["about", "contact", "faq", "shipping", "returns", "terms"]) route("/" + k, page("info", k));

start();
