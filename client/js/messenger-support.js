/* ORIVO floating Messenger support — frontend only. */
(() => {
  const URL = 'https://m.me/101540568796035';
  const init = () => {
    if (document.getElementById('orivo-messenger-support')) return;
    const style = document.createElement('style');
    style.textContent = `
      #orivo-messenger-support{position:fixed;left:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:900;display:flex;align-items:center;gap:9px;font-family:inherit}
      #orivo-messenger-support .orivo-msgr-icon{width:46px;height:46px;flex:0 0 46px;display:grid;place-items:center;border-radius:50%;background:#087fff;color:white;box-shadow:0 5px 20px #001b3d44;text-decoration:none;transition:transform .2s ease}
      #orivo-messenger-support .orivo-msgr-icon:hover{transform:scale(1.07)}
      #orivo-messenger-support .orivo-msgr-tip{max-width:200px;padding:9px 12px;border-radius:11px;background:#fff;color:#082445;font-size:12px;font-weight:600;line-height:1.35;box-shadow:0 5px 22px #001b3d33;opacity:0;visibility:hidden;transform:translateX(-7px);transition:opacity .22s ease,transform .22s ease,visibility .22s}
      #orivo-messenger-support.is-expanded .orivo-msgr-tip,#orivo-messenger-support:focus-within .orivo-msgr-tip,#orivo-messenger-support:hover .orivo-msgr-tip{opacity:1;visibility:visible;transform:translateX(0)}
      @media(max-width:600px){#orivo-messenger-support{left:11px;bottom:calc(12px + env(safe-area-inset-bottom,0px))}#orivo-messenger-support .orivo-msgr-icon{width:42px;height:42px;flex-basis:42px}#orivo-messenger-support .orivo-msgr-tip{max-width:160px;font-size:11px;padding:8px 10px}}
      @media(prefers-reduced-motion:reduce){#orivo-messenger-support *{transition:none!important}}
    `;
    document.head.appendChild(style);
    const wrapper = document.createElement('div');
    wrapper.id = 'orivo-messenger-support';
    wrapper.className = 'is-expanded';
    const link = document.createElement('a');
    link.className = 'orivo-msgr-icon';
    link.href = URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Chat with ORIVO on Messenger (opens in a new tab)');
    link.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.78 1.325 5.27 3.42 6.968V22l3.315-1.82c1.03.29 2.128.446 3.265.446 5.523 0 10-4.145 10-9.258S17.523 2 12 2Zm1.003 12.47-2.546-2.72-4.97 2.72 5.468-5.8 2.61 2.72 4.906-2.72-5.468 5.8Z"/></svg>';
    const tip = document.createElement('span');
    tip.className = 'orivo-msgr-tip';
    tip.textContent = 'Need help? Chat with ORIVO';
    wrapper.append(link, tip);
    document.body.appendChild(wrapper);
    setTimeout(() => wrapper.classList.remove('is-expanded'), 5000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
