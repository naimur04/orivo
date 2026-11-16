// Tiny templating + shared UI helpers. `html` escapes every interpolated value unless wrapped in raw().
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
export const raw = (s) => ({ __raw: s });
const val = (v) => (v == null || v === false ? "" : Array.isArray(v) ? v.map(val).join("") : typeof v === "object" && "__raw" in v ? v.__raw : esc(v));
export function html(strings, ...vals) { let o = ""; strings.forEach((s, i) => { o += s; if (i < vals.length) o += val(vals[i]); }); return raw(o); }
export const mount = (el, tpl) => { el.innerHTML = tpl.__raw; return el; };
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const money = (n) => "৳" + Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
export const fmtDate = (d, opts = { day: "numeric", month: "short", year: "numeric" }) => { if (!d) return ""; const x = new Date(d); return isNaN(x) ? "" : x.toLocaleDateString("en-GB", opts); };
export const fmtDateTime = (d) => { const x = new Date(String(d).includes("T") ? d : String(d).replace(" ", "T") + "Z"); return isNaN(x) ? "" : x.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); };
export const daysUntil = (d) => { if (!d) return null; const n = Math.ceil((new Date(d + "T00:00:00") - new Date()) / 86400000); return n; };
export const arrivalText = (iso) => { if (!iso) return "Arrival date to be announced"; const n = daysUntil(iso); if (n !== null && n <= 0) return "Arriving any day now"; return `Arrives around ${fmtDate(iso, { day: "numeric", month: "short" })}`; };

/* ───── icons (24px line icons) ───── */
const P = {
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  shirt: '<path d="M8.5 3 3 6l2 4 3-1v11h8V9l3 1 2-4-5.5-3a3.5 3.5 0 0 1-7 0z"/>',
  shoe: '<path d="M3 18h14l4-3v3"/><path d="M3 18V5l5 6 5 1"/><path d="M3 18v2h18v-2"/>',
  gem: '<path d="M6 4h12l4 5-10 12L2 9z"/><path d="M2 9h20M9 4l-1 5 4 12 4-12-1-5"/>',
  lipstick: '<rect x="8" y="12" width="8" height="9" rx="1.5"/><path d="M9.5 12V7l5-4v9"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16.5 14.5h1.5"/>',
  watch: '<circle cx="12" cy="12" r="5"/><path d="M9 3h6l-1 4h-4zM9 21h6l-1-4h-4zM12 10v2.2l1.4 1"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.2 6L12 16.7 6.5 19.6l1.2-6L3.2 9.4l6.1-.8z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  truck: '<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  shield: '<path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  box: '<path d="m3 7 9-4 9 4v10l-9 4-9-4z"/><path d="m3 7 9 4 9-4M12 11v10"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
export const icon = (name, size = 22, sw = 1.7) => raw(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.star}</svg>`);

const GLYPH = (slug = "", type = "") => {
  if (type === "digital" || slug.startsWith("digital")) return "star";
  if (slug.includes("bag")) return "bag"; if (slug.includes("shoe")) return "shoe"; if (slug.includes("accessor")) return "gem";
  if (slug.includes("makeup")) return "lipstick"; if (slug.includes("wallet")) return "wallet"; if (slug.includes("clothes")) return "shirt";
  if (slug.includes("others")) return "watch"; return "bag";
};
export const groupGlyph = (g) => ({ women: "gem", men: "watch", digital: "star" }[g] || "bag");

/* ───── contour lines: topographic rings, echoes the peak in the logo ───── */
export function contours(seed = 1, rings = 11, cls = "contours") {
  let paths = "";
  for (let i = 1; i <= rings; i++) {
    const R = 24 + i * 14, pts = [];
    for (let a = 0; a <= 64; a++) {
      const t = (a / 64) * Math.PI * 2;
      const r = R * (1 + 0.16 * Math.sin(2 * t + seed) + 0.08 * Math.sin(3 * t + seed * 2.3 + i * 0.09) + 0.04 * Math.sin(5 * t + seed * 1.7));
      pts.push([(200 + Math.cos(t) * r * 1.25).toFixed(1), (150 + Math.sin(t) * r * 0.95).toFixed(1)]);
    }
    paths += `<path d="M${pts.map((p) => p.join(",")).join("L")}Z" opacity="${(0.25 + (i / rings) * 0.6).toFixed(2)}"/>`;
  }
  return raw(`<svg class="${cls}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">${paths}</svg>`);
}

/* ───── product art: used whenever a product has no photo yet ───── */
const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const HUES = [[212, 70], [222, 62], [200, 66], [232, 54], [206, 58], [218, 74]];
export function art(p) {
  const h = hash(p.slug || p.name), [hue, sat] = HUES[h % HUES.length];
  const pre = p.availability === "preorder";
  const a = `hsl(${hue} ${sat}% 24%)`, b = `hsl(${hue + 12} ${sat - 8}% 9%)`;
  const glyph = GLYPH(p.category?.slug, p.type);
  const tint = pre ? "#ffbd66" : "#8fd3ff";
  return raw(`<svg class="art" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.name)}">
    <defs><linearGradient id="g${h}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="300" height="400" fill="url(#g${h})"/>
    <g stroke="${tint}" fill="none" stroke-width=".8" opacity=".28" transform="translate(-50 ${40 + (h % 80)}) scale(1.3)">${contours(h % 9, 9).__raw.replace(/<\/?svg[^>]*>/g, "")}</g>
    <g transform="translate(110 150) scale(3.4)" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round" opacity=".92">${P[glyph]}</g>
    <text x="150" y="352" text-anchor="middle" font-family="Poppins,system-ui,sans-serif" font-weight="700" font-size="15" letter-spacing="4" fill="#fff" opacity=".35">ORIVO</text></svg>`);
}
export const productImage = (p, which = 1) => {
  const src = which === 1 ? p.image : p.image2;
  return src ? raw(`<img src="${esc(src)}" alt="${which === 1 ? esc(p.name) : ""}" loading="lazy" ${which === 2 ? 'class="alt"' : ""}>`) : which === 1 ? art(p) : raw("");
};

/* ───── toast ───── */
export function toast(msg, kind = "") {
  let box = $(".toasts"); if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); document.body.append(box); }
  const t = document.createElement("div"); t.className = "toast " + kind; t.innerHTML = (kind === "err" ? "" : icon("check", 18, 2.4).__raw) + `<span>${esc(msg)}</span>`;
  box.append(t); setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = 0; setTimeout(() => t.remove(), 320); }, kind === "err" ? 5000 : 2600);
}

/* ───── product card ───── */
export function productCard(p) {
  const pre = p.availability === "preorder", out = !p.inStock;
  const needsChoice = p.sizes.length || p.colors.length;
  return html`<article class="pcard">
    <div class="pimg">
      <a class="stretch" href="#/product/${p.slug}" aria-label="${p.name}"></a>
      ${productImage(p, 1)}${productImage(p, 2)}
      <div class="badges">
        ${pre ? html`<span class="badge pre">Pre-order</span>` : ""}
        ${p.onSale ? html`<span class="badge sale">-${p.discountPercent}%</span>` : ""}
        ${out ? html`<span class="badge out">Sold out</span>` : p.badge && !pre ? html`<span class="badge">${p.badge}</span>` : ""}
      </div>
      ${!out ? html`<div class="quick" style="z-index:3">${needsChoice
        ? html`<a class="btn btn-primary btn-sm btn-block" href="#/product/${p.slug}">Choose options</a>`
        : html`<button class="btn ${pre ? "btn-amber" : "btn-primary"} btn-sm btn-block" data-add="${p.id}">${pre ? "Pre-order now" : "Add to bag"}</button>`}</div>` : ""}
    </div>
    <div>
      <a class="pname" href="#/product/${p.slug}">${p.name}</a>
      <div class="pmeta">${p.category ? p.category.name : ""}${p.group ? " · " + p.group.name : ""}${p.type === "digital" && p.billingPeriod !== "one_time" ? " · " + (p.billingPeriod === "monthly" ? "per month" : "per year") : ""}</div>
    </div>
    <div class="price"><span class="now ${p.onSale ? "sale" : ""}">${money(p.price)}</span>${p.onSale ? html`<s>${money(p.regularPrice)}</s>` : ""}</div>
    ${pre ? html`<div class="arrival">${icon("clock", 15)} ${arrivalText(p.preorderDate)}</div>` : p.stockLeft ? html`<div class="arrival">Only ${p.stockLeft} left</div>` : ""}
  </article>`;
}
export const skeletonGrid = (n = 8) => html`<div class="grid">${Array.from({ length: n }, () => html`<div><div class="skeleton" style="aspect-ratio:3/4"></div><div class="skeleton" style="height:14px;margin-top:14px;width:70%"></div><div class="skeleton" style="height:14px;margin-top:8px;width:35%"></div></div>`)}</div>`;

export const setTitle = (t) => { document.title = t ? `${t} · ORIVO` : "ORIVO — Own the Look. Own the Moment."; };
export const view = () => document.getElementById("view");
