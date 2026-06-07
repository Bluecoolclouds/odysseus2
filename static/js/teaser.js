/* ── Language auto-detect ─────────────────────────────────────────────── */
(function () {
  var STORAGE_KEY = 'odysseus_teaser_lang';
  var currentLang = document.documentElement.getAttribute('data-lang') || 'ru';

  // Language switcher links: remember the user's explicit choice
  document.querySelectorAll('.lang-switch').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = el.getAttribute('data-lang');
      if (target) sessionStorage.setItem(STORAGE_KEY, target);
    });
  });

  // Auto-detect only if the user hasn't manually picked a language
  if (!sessionStorage.getItem(STORAGE_KEY)) {
    var browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    var preferRu = browserLang.startsWith('ru') || browserLang.startsWith('be') || browserLang.startsWith('uk');
    var targetLang = preferRu ? 'ru' : 'en';
    if (targetLang !== currentLang) {
      window.location.replace(targetLang === 'ru' ? '/teaser' : '/teaser-en');
      return;
    }
  }

  /* ── Scroll reveal ────────────────────────────────────────────────────── */
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
})();
