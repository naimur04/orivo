/* ORIVO promo: upload your image to client/assets/promo-banner.jpg. */
(() => {
  const IMAGE_URL = "/assets/promo-banner.jpg";
  const SEEN_KEY = "orivo-promo-seen-v1";
  const DISPLAY_MS = 3000;
  try { if (sessionStorage.getItem(SEEN_KEY)) return; } catch (_) {}
  // Homepage only; don't interrupt a direct visit to checkout or a product.
  if (location.hash && location.hash !== "#/" && location.hash !== "#") return;
  const img = new Image();
  img.alt = "ORIVO promotional offer";
  img.className = "orivo-promo-image";
  img.onload = () => {
    if (document.getElementById("orivo-promo-overlay")) return;
    if (location.hash && location.hash !== "#/" && location.hash !== "#") return;
    const overlay = document.createElement("div");
    overlay.id = "orivo-promo-overlay";
    overlay.className = "orivo-promo-overlay";
    const dialog = document.createElement("div");
    dialog.className = "orivo-promo-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "ORIVO promotional banner");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "orivo-promo-close";
    close.setAttribute("aria-label", "Close promotion");
    close.textContent = "×";
    dialog.append(img, close);
    overlay.append(dialog);
    document.body.append(overlay);
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (_) {}
    let timer;
    const dismiss = () => { clearTimeout(timer); overlay.remove(); document.removeEventListener("keydown", onKey); window.removeEventListener("hashchange", dismiss); };
    const onKey = (event) => { if (event.key === "Escape") dismiss(); };
    close.addEventListener("click", dismiss);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) dismiss(); });
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", dismiss);
    timer = setTimeout(dismiss, DISPLAY_MS);
    close.focus({ preventScroll: true });
  };
  img.onerror = () => {}; // No image uploaded yet: show nothing.
  img.src = IMAGE_URL;
})();
