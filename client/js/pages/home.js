import { HERO } from "../hero-config.js";
import { api } from "../api.js";
import { getUser } from "../store.js";
import { html, mount, icon, contours, productCard, productImage, skeletonGrid, groupGlyph, setTitle } from "../ui.js";
import { remember } from "../data.js";


const groupClass = { women: "w", men: "m", digital: "d" };
const sectionHead = (title, sub, link, label = "View all") => html`<div class="sec-head"><div><h2>${title}</h2>${sub ? html`<p>${sub}</p>` : ""}</div>${link ? html`<a class="btn btn-ghost btn-sm" href="${link}">${label} ${icon("arrow", 16)}</a>` : ""}</div>`;

export default async function (view) {
  setTitle("");
  mount(view, html`<div class="hero"><div class="panel a"></div><div class="panel p"></div></div><div class="wrap"><div class="sec">${skeletonGrid(4)}</div></div>`);
  const d = await api("/home", { auth: false });
  const all = [...d.featured, ...d.newArrivals, ...d.preorders, ...d.sale];
  remember(all);
  const { available, preorder } = d.counts;
  const user = getUser();

  mount(view, html`
  <section class="hero hero-in" aria-label="Shop sections">
    <div class="panel a" style="--hero-image:url('${HERO.availableImage}')">
      <span class="tag"><i class="dot"></i> In stock · ships in 1–3 days</span>
      <h1>Available now</h1>
      <p class="sub">${available ? `${available} pieces ready to ship` : "New pieces landing soon"}. Order today, pay when it reaches your door.</p>
      <div><a class="btn btn-primary btn-lg" href="#/shop?section=available">Shop available ${icon("arrow", 18)}</a></div>
    </div>
    <div class="ridge" aria-hidden="true"></div>
    <div class="panel p" style="--hero-image:url('${HERO.preorderImage}')">
      <span class="tag"><i class="dot"></i> Reserve what's next</span>
      <h2>Pre-orders</h2>
      <p class="sub">${preorder ? `${preorder} upcoming pieces` : "Upcoming pieces"} you can lock in today. We ship the moment they arrive.</p>
      <div><a class="btn btn-amber btn-lg" href="#/shop?section=preorder">Browse pre-orders ${icon("arrow", 18)}</a></div>
    </div>
  </section>

  <div class="facts" role="list"><div class="wrap" style="display:contents">
    <div class="fact" role="listitem">${icon("cash")}<div><b>Cash on delivery</b><span>Pay when it arrives, nationwide</span></div></div>
    <div class="fact" role="listitem">${icon("truck")}<div><b>Fast delivery</b><span>Inside Dhaka and all 64 districts</span></div></div>
    <div class="fact" role="listitem">${icon("shield")}<div><b>Authentic quality</b><span>Hand-checked before it ships</span></div></div>
    <div class="fact" role="listitem">${icon("clock")}<div><b>Pre-order peace of mind</b><span>No payment until your order arrives</span></div></div>
  </div></div>

  <div class="wrap">
    <section class="sec" aria-labelledby="h-shop">
      <div class="sec-head"><div><h2 id="h-shop">Shop by <span class="serif">world</span></h2><p>Three ways into ORIVO. Pick a world, then a category.</p></div></div>
      <div class="groups">${d.categories.map((g) => html`<div class="group ${groupClass[g.slug] || "w"} ${g.image ? "has-category-image" : ""}">
        ${g.image ? html`<img class="category-photo" src="${g.image}" alt="" loading="lazy">` : html`${contours(g.id * 3, 10)}<div class="glyph">${icon(groupGlyph(g.slug), 84, 1.2)}</div>`}
        <h3><a href="#/shop?category=${g.slug}" class="stretch-link">${g.name}</a></h3>
        <p>${g.description}${g.counts.available + g.counts.preorder ? ` · ${g.counts.available + g.counts.preorder} items` : ""}</p>
        <div class="chips">${g.children.map((c) => html`<a class="chip" href="#/shop?category=${c.slug}">${c.name}</a>`)}</div></div>`)}</div>
    </section>

    ${d.featured.length ? html`<section class="sec home-product-section">${sectionHead(html`Featured <span class="serif">picks</span>`, "The pieces everyone's asking about.", "#/shop?sort=featured")}
      <div class="rail">${d.featured.map(productCard)}</div></section>` : ""}

    ${d.newArrivals.length ? html`<section class="sec home-product-section">${sectionHead("New arrivals", "Fresh in stock and ready to ship.", "#/shop?section=available&sort=newest")}
      <div class="grid">${d.newArrivals.slice(0, 8).map(productCard)}</div></section>` : ""}
  </div>

  ${d.preorders.length ? html`<section class="band home-product-section" aria-labelledby="h-pre">${contours(5, 14)}<div class="wrap">
    <div class="sec-head"><div><h2 id="h-pre">Coming soon. <span class="serif" style="color:var(--amber)">Reserve yours.</span></h2>
      <p>Pre-orders are priced today and shipped as soon as stock lands. Pay on delivery, no advance needed.</p></div>
      <a class="btn btn-amber btn-sm" href="#/shop?section=preorder">All pre-orders ${icon("arrow", 16)}</a></div>
    <div class="rail">${d.preorders.map(productCard)}</div></div></section>` : ""}

  <div class="wrap">
    ${d.sale.length ? html`<section class="sec home-product-section">${sectionHead(html`On <span class="serif">sale</span>`, "Limited-time prices.", "#/shop?sale=1")}
      <div class="grid">${d.sale.slice(0, 4).map(productCard)}</div></section>` : ""}

    <section class="member" aria-labelledby="h-mem">${contours(2, 9, "contours")}
      <div><span class="tag" style="display:inline-flex;gap:8px;color:var(--ice);font-weight:600;font-size:14px;margin-bottom:14px">${icon("star", 18)} ORIVO Circle</span>
        <h2 id="h-mem">${user ? `Welcome back, ${user.name.split(" ")[0]}.` : html`Join ORIVO. <span class="serif">Unlock more.</span>`}</h2>
        <p class="muted" style="margin:14px 0 26px;max-width:44ch">${user ? "Your promo codes are ready to use at checkout." : "You can always check out as a guest. A free account adds promo codes, saved details and order history."}</p>
        ${user ? html`<a class="btn btn-primary" href="#/shop">Start shopping</a>` : html`<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary" href="#/register">Create free account</a><a class="btn btn-ghost" href="#/login">Log in</a></div>`}</div>
      <ul><li>${icon("check", 20, 2.2)}<span><b>Member promo codes.</b> Discounts are applied at checkout for account holders.</span></li>
        <li>${icon("check", 20, 2.2)}<span><b>Faster checkout.</b> Your name, phone and address are filled in for you.</span></li>
        <li>${icon("check", 20, 2.2)}<span><b>Order history.</b> Track every order in one place.</span></li></ul>
    </section>
  </div>`);
}
