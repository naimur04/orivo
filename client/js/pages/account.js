import { api } from "../api.js";
import { go } from "../router.js";
import { getUser, setUser, clearAuth } from "../store.js";
import { html, mount, $, $$, money, fmtDate, toast, setTitle } from "../ui.js";
import { orderBody, statusPill } from "./order.js";

function frame(active, body) {
  const u = getUser();
  return html`<div class="wrap"><div class="page-head"><h1>Hi, ${u.name.split(" ")[0]}</h1><p>${u.email}</p></div>
    <div class="acct"><nav class="sidenav" aria-label="Account"><a class="${active === "profile" ? "on" : ""}" href="#/account">Profile</a><a class="${active === "orders" ? "on" : ""}" href="#/account/orders">My orders</a>
      <a href="#/shop">Keep shopping</a><button id="logout">Log out</button></nav><div>${body}</div></div></div>`;
}
const wireLogout = () => $("#logout").addEventListener("click", () => { clearAuth(); toast("You're logged out"); go("/"); });

async function guard() {
  if (!getUser()) { go("/login"); return false; }
  try { setUser((await api("/auth/me")).customer); } catch (e) { if (e.status === 401) { go("/login"); return false; } throw e; }
  return true;
}

export default async function (view, _p, _q, alive) {
  setTitle("My account");
  if (!(await guard()) || !alive()) return;
  const u = getUser();
  mount(view, frame("profile", html`<div class="card"><h3>Your details</h3><form id="pf" novalidate>
      <div class="row"><div class="field"><label for="n">Full name</label><input id="n" name="name" value="${u.name}" required></div>
        <div class="field"><label for="ph">Mobile number</label><input id="ph" name="phone" type="tel" value="${u.phone || ""}" required></div></div>
      <div class="field"><label for="em">Email</label><input id="em" value="${u.email}" disabled><span class="hint">Email can't be changed here.</span></div>
      <div class="field"><label for="ad">Default delivery address</label><textarea id="ad" name="address">${u.address || ""}</textarea></div>
      <div class="field"><label for="zn">Default delivery area</label><select id="zn" name="zone"><option value="">Choose…</option>
        <option value="inside_dhaka" ${u.deliveryZone === "inside_dhaka" ? "selected" : ""}>Inside Dhaka</option><option value="outside_dhaka" ${u.deliveryZone === "outside_dhaka" ? "selected" : ""}>Outside Dhaka</option></select></div>
      <div class="err-text" id="perr" role="alert" hidden style="margin-bottom:12px"></div>
      <button class="btn btn-primary" type="submit">Save changes</button></form></div>
    <div class="card"><h3>Change password</h3><form id="pw" novalidate>
      <div class="row"><div class="field"><label for="cp">Current password</label><input id="cp" name="current" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="np">New password</label><input id="np" name="next" type="password" autocomplete="new-password" minlength="8"></div></div>
      <div class="err-text" id="werr" role="alert" hidden style="margin-bottom:12px"></div>
      <button class="btn btn-ghost" type="submit">Update password</button></form></div>`));
  wireLogout();
  const pf = $("#pf");
  pf.addEventListener("submit", async (e) => {
    e.preventDefault(); const err = $("#perr"); err.hidden = true; const b = $("button", pf); b.disabled = true;
    try { const r = await api("/auth/me", { method: "PUT", body: { name: pf.elements.name.value, phone: pf.phone.value, address: pf.address.value, deliveryZone: pf.zone.value } }); setUser(r.customer); toast("Profile saved"); }
    catch (x) { err.textContent = x.message; err.hidden = false; }
    b.disabled = false;
  });
  const pw = $("#pw");
  pw.addEventListener("submit", async (e) => {
    e.preventDefault(); const err = $("#werr"); err.hidden = true; const b = $("button", pw); b.disabled = true;
    try { await api("/auth/password", { method: "PUT", body: { currentPassword: pw.current.value, newPassword: pw.next.value } }); pw.reset(); toast("Password updated"); }
    catch (x) { err.textContent = x.message; err.hidden = false; }
    b.disabled = false;
  });
}

export async function orders(view, _p, _q, alive) {
  setTitle("My orders");
  if (!(await guard()) || !alive()) return;
  mount(view, frame("orders", html`<div class="skeleton" style="height:200px"></div>`)); wireLogout();
  const r = await api("/auth/orders");
  if (!alive()) return;
  mount(view, frame("orders", r.orders.length ? html`<div class="card" style="padding:8px 22px;overflow-x:auto"><table class="otable"><thead><tr><th>Order</th><th class="hide-s">Date</th><th>Status</th><th>Total</th></tr></thead><tbody>
      ${r.orders.map((o) => html`<tr><td><a class="link" href="#/account/orders/${o.orderNumber}">${o.orderNumber}</a><div class="faint" style="font-size:12px">${o.itemCount} item${o.itemCount === 1 ? "" : "s"}${o.hasPreorder ? " · Pre-order" : ""}</div></td>
        <td class="hide-s">${fmtDate(o.createdAt)}</td><td>${statusPill(o)}</td><td>${money(o.total)}</td></tr>`)}</tbody></table></div>`
    : html`<div class="empty"><h3>No orders yet</h3><p>When you place an order while logged in, it shows up here.</p><a class="btn btn-primary" style="margin-top:16px" href="#/shop">Start shopping</a></div>`));
  wireLogout();
}

export async function orderDetail(view, { number }, _q, alive) {
  setTitle(`Order ${number}`);
  if (!(await guard()) || !alive()) return;
  let o;
  try { o = (await api(`/auth/orders/${encodeURIComponent(number)}`)).order; }
  catch (e) { if (!alive()) return; mount(view, frame("orders", html`<div class="empty"><h3>Order not found</h3><p>${e.message}</p><a class="btn btn-primary" style="margin-top:16px" href="#/account/orders">Back to my orders</a></div>`)); wireLogout(); return; }
  if (!alive()) return;
  mount(view, frame("orders", html`<a class="link" href="#/account/orders" style="display:inline-block;margin-bottom:16px">← All orders</a>${orderBody(o)}`)); wireLogout();
}
