import { api } from "../api.js";
import { go } from "../router.js";
import { setAuth, getUser } from "../store.js";
import { html, mount, $, setTitle } from "../ui.js";
import { nextAfterAuth } from "../data.js";

const done = (r) => { setAuth(r.token, r.customer); const next = nextAfterAuth.take(); go(next && next.startsWith("/") ? next : "/account"); };
const fail = (el, msg) => { el.textContent = msg; el.hidden = false; el.scrollIntoView({ block: "nearest" }); };

function shell(title, sub, body, alt) {
  return html`<div class="wrap"><div class="narrow auth"><h1>${title}</h1><p class="muted" style="margin-bottom:26px">${sub}</p>
    <div class="card">${body}</div><p class="muted" style="text-align:center;margin-top:20px">${alt}</p></div></div>`;
}

export async function login(view) {
  setTitle("Log in");
  if (getUser()) return go("/account");
  mount(view, shell("Welcome back", "Log in to use promo codes and see your orders.", html`<form id="f" novalidate>
      <div class="field"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required></div>
      <div class="err-text" id="err" role="alert" hidden style="margin-bottom:12px"></div>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Log in</button></form>`,
    html`New to ORIVO? <a class="link" href="#/register">Create an account</a><br><span class="faint" style="font-size:13px">Or just <a class="link" href="#/checkout">check out as a guest</a>.</span>`));
  const f = $("#f");
  f.addEventListener("submit", async (e) => {
    e.preventDefault(); const b = $("button", f), err = $("#err"); err.hidden = true;
    if (!f.email.value.trim() || !f.password.value) return fail(err, "Enter your email and password");
    b.disabled = true;
    try { done(await api("/auth/login", { method: "POST", body: { email: f.email.value, password: f.password.value }, auth: false })); }
    catch (x) { b.disabled = false; fail(err, x.message); }
  });
}

export async function register(view) {
  setTitle("Create account");
  if (getUser()) return go("/account");
  mount(view, shell("Create your account", "Free, and it takes a minute. You'll get member promo codes and faster checkout.", html`<form id="f" novalidate>
      <div class="field"><label for="n">Full name</label><input id="n" name="name" autocomplete="name" required></div>
      <div class="row"><div class="field"><label for="e">Email</label><input id="e" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="ph">Mobile number</label><input id="ph" name="phone" type="tel" autocomplete="tel" placeholder="01712345678" required></div></div>
      <div class="field"><label for="p">Password</label><input id="p" name="password" type="password" autocomplete="new-password" minlength="8" required><span class="hint">At least 8 characters</span></div>
      <div class="err-text" id="err" role="alert" hidden style="margin-bottom:12px"></div>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Create account</button></form>`,
    html`Already have an account? <a class="link" href="#/login">Log in</a>`));
  const f = $("#f");
  f.addEventListener("submit", async (e) => {
    e.preventDefault(); const b = $("button", f), err = $("#err"); err.hidden = true;
    if (f.elements.name.value.trim().length < 2) return fail(err, "Please enter your name");
    if (f.password.value.length < 8) return fail(err, "Password must be at least 8 characters");
    b.disabled = true;
    try { done(await api("/auth/register", { method: "POST", body: { name: f.elements.name.value, email: f.email.value, phone: f.phone.value, password: f.password.value }, auth: false })); }
    catch (x) { b.disabled = false; fail(err, x.message); }
  });
}
