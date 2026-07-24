/* ============================================================
   PREMIERE LOADER — Minimal fallback tab switching
   (Primary interactivity is in app.js)
   ============================================================ */
'use strict';

(function () {
  if (window.self !== window.top) return;

  function init() {
    if (document.querySelector('.pr-tab--active[data-tab="timeline"]')) return;

    const tabs = document.querySelectorAll('.pr-tab');
    const panels = document.querySelectorAll('.pr-panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('pr-tab--active'));
        panels.forEach((p) => p.classList.remove('pr-panel--active'));
        tab.classList.add('pr-tab--active');
        const target = document.getElementById('panel-' + tab.dataset.tab);
        if (target) target.classList.add('pr-panel--active');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
