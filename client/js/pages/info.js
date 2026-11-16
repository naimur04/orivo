import { html, mount, icon, contours, setTitle, money } from "../ui.js";
import { getMeta } from "../data.js";

const doc = (title, lead, body) => html`<div class="wrap"><div class="page-head"><div class="crumbs"><a href="#/">Home</a> / ${title}</div><h1>${title}</h1>${lead ? html`<p>${lead}</p>` : ""}</div><div class="prose">${body}</div></div>`;

export async function about(view) {
  setTitle("Our story");
  mount(view, html`<div class="wrap"><div class="page-head"><div class="crumbs"><a href="#/">Home</a> / Our story</div><h1>Own the look. <span class="serif">Own the moment.</span></h1></div>
    <div class="member" style="margin-top:10px">${contours(4, 10)}<div class="prose" style="max-width:none"><p>ORIVO started in 2025 with a simple idea: everyday Bangladesh deserves pieces that feel considered. Bags with structure, clothes that move, wallets that age well, and beauty that's easy to love.</p>
      <p>We keep two shelves. <b style="color:var(--ice)">Available</b> is what's in stock and ships within days. <b style="color:var(--amber)">Pre-orders</b> lets you reserve what's arriving next, at today's price, with nothing to pay until it reaches you.</p>
      <p>Soon we're adding digital memberships too, so ORIVO can follow you beyond the parcel.</p></div>
      <ul><li>${icon("check", 20, 2.2)}<span><b>Hand-checked.</b> Every item is inspected before it ships.</span></li><li>${icon("check", 20, 2.2)}<span><b>Honest pricing.</b> The price you see is the price you pay, plus delivery.</span></li><li>${icon("check", 20, 2.2)}<span><b>Real support.</b> Real people reply to every message.</span></li></ul></div></div>`);
}

export async function contact(view) {
  setTitle("Contact");
  const { settings: s } = await getMeta();
  mount(view, doc("Contact us", "Questions about an order, a size, or a pre-order? We're happy to help.", html`
    <div class="card" style="max-width:520px">${s.contact_phone ? html`<p><b style="color:#fff">Phone / WhatsApp</b><br>${s.contact_phone}</p>` : ""}
      ${s.contact_email ? html`<p><b style="color:#fff">Email</b><br><a class="link" href="mailto:${s.contact_email}">${s.contact_email}</a></p>` : ""}
      ${s.contact_address ? html`<p><b style="color:#fff">Address</b><br>${s.contact_address}</p>` : ""}
      <p class="faint" style="margin:0">Have an order number? <a class="link" href="#/track">Track it here</a>.</p></div>`));
}

export async function faq(view) {
  setTitle("FAQ");
  const qa = [
    ["Do I need an account to order?", "No. You can check out as a guest with just your name, phone number and address. An account adds member promo codes, saved details and order history."],
    ["Who can use promo codes?", "Promo codes are for customers with an ORIVO account. Log in before checkout and enter your code in the order summary."],
    ["How do I pay?", "Cash on Delivery is available now, across Bangladesh. bKash, Nagad, Rocket and card payments are coming soon."],
    ["What's the difference between Available and Pre-order?", "Available items are in stock and ship in 1–3 days. Pre-order items are arriving soon. You reserve now at today's price, and we ship as soon as they land. You still pay on delivery."],
    ["Can I cancel a pre-order?", "Yes, any time before it ships. Message us with your order number."],
    ["How do I track my order?", "Use Track order in the footer with your order number and phone number, or log in and open My orders."],
    ["How do digital products work?", "Memberships and other digital items are delivered to your email after your order is confirmed. No shipping address needed."]];
  mount(view, doc("FAQ", "", html`<div class="acc" style="margin-top:0">${qa.map(([q, a], i) => html`<details ${i === 0 ? "open" : ""}><summary>${q}</summary><div class="in">${a}</div></details>`)}</div>`));
}

export async function shipping(view) {
  setTitle("Delivery & payment");
  const { settings: s } = await getMeta();
  mount(view, doc("Delivery & payment", "How and when your order reaches you.", html`
    <h2>Delivery charges</h2><p>Inside Dhaka: ${money(s.delivery_inside_dhaka)} (1–2 days). Outside Dhaka: ${money(s.delivery_outside_dhaka)} (2–4 days).${s.free_delivery_threshold ? ` Free delivery on orders over ${money(s.free_delivery_threshold)}.` : ""}</p>
    <h2>Pre-orders</h2><p>Pre-order items ship as soon as they arrive, and we'll keep you posted. If your order has both in-stock and pre-order items, they're sent together when the pre-order item lands.</p>
    <h2>Payment</h2><p>Cash on Delivery is available nationwide. Please keep the exact amount ready. Online payment with bKash, Nagad, Rocket and cards is coming soon.</p>
    <h2>Digital products</h2><p>Delivered by email after your order is confirmed. No delivery charge.</p>`));
}

export async function returns(view) {
  setTitle("Returns");
  mount(view, doc("Returns & exchanges", "We want you to love what you ordered.", html`
    <h2>Physical items</h2><p>Contact us within 3 days of delivery for a size exchange or a return. Items must be unworn, unwashed and have their tags attached. Makeup and perfume can only be returned if unopened.</p>
    <h2>Pre-orders</h2><p>Cancel any time before your order ships, at no cost.</p>
    <h2>Digital memberships</h2><p>Cancel any time before the next billing period starts.</p>
    <h2>How to start</h2><p>Go to <a class="link" href="#/contact">Contact us</a> with your order number and what you'd like to do.</p>`));
}

export async function terms(view) {
  setTitle("Terms");
  mount(view, doc("Terms of use", "", html`<p>By placing an order you confirm that the details you gave are correct and that you will accept and pay for the order on delivery. Prices are in Bangladeshi Taka (৳) and may change before an order is placed. Promo codes are for registered customers only, can't be combined, and may be withdrawn at any time. Orders can be declined or cancelled if an item is unavailable.</p><p>We use your name, phone number and address only to process and deliver your order.</p>`));
}

export function notFound(msg) {
  const view = document.getElementById("view"); setTitle("Not found");
  mount(view, html`<div class="wrap"><div class="empty" style="margin:70px 0"><h3>Page not found</h3><p>${msg || "That page doesn't exist, or it has moved."}</p>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:18px"><a class="btn btn-primary" href="#/">Back home</a><a class="btn btn-ghost" href="#/shop">Shop all</a></div></div></div>`);
}
export default notFound;
