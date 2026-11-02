/* ==========================================================================
   SURAKSHA ALERT – Android App Shell (behaviour)
   Loaded ONLY inside the Android build, after the original js/app.js.
   Wraps existing global functions (navigate, triggerSosCountdown, ...)
   without modifying them, and adds native app chrome + device integration.
   ========================================================================== */
(function () {
  'use strict';

  var Cap = window.Capacitor;
  var Plugins = (Cap && Cap.Plugins) || {};
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());

  var APP_VERSION = '1.1.0';
  var HOME = 'dashboard';
  var TAB_PAGES = ['dashboard', 'journey', 'contacts'];

  var PAGES = {
    landing:    { title: 'About Suraksha',     sub: 'Walk freely. Stay prepared.' },
    dashboard:  { title: 'Suraksha Alert',     sub: 'Your Safety • Your Strength' },
    readiness:  { title: 'Readiness Score',    sub: 'Prepare before you step out' },
    journey:    { title: 'Smart Journey',      sub: 'Timed check-ins on the go' },
    escalation: { title: 'Escalation Flow',    sub: 'Priority contact ladder' },
    contacts:   { title: 'Trusted Contacts',   sub: 'Your emergency circle' },
    shield:     { title: 'Active Shield',      sub: 'Voice, shake & fake call' },
    emergency:  { title: 'Emergency Help',     sub: 'Verified Indian helplines' },
    history:    { title: 'Activity',           sub: 'Your safety timeline' },
    innovation: { title: 'Innovation',         sub: 'What makes Suraksha different' }
  };

  /* ---------------- Icons (inline SVG, stroke = currentColor) ---------------- */
  function ico(paths, size) {
    size = size || 22;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }
  var I = {
    shield:  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldA: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    home:    '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    route:   '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/>',
    users:   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    grid:    '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    back:    '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    gauge:   '<path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    ladder:  '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    phone:   '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    clock:   '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    bulb:    '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/>',
    info:    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    play:    '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
    reset:   '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    chev:    '<path d="m9 18 6-6-6-6"/>'
  };

  /* ---------------- Device helpers ---------------- */
  function haptic(style) {
    try {
      if (Plugins.Haptics) {
        Plugins.Haptics.impact({ style: style || 'LIGHT' });
      } else if (navigator.vibrate) {
        navigator.vibrate(style === 'HEAVY' ? 40 : 10);
      }
    } catch (e) { /* no-op */ }
  }
  function vibratePattern(ms) {
    try {
      if (Plugins.Haptics && Plugins.Haptics.vibrate) Plugins.Haptics.vibrate({ duration: ms });
      else if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) { /* no-op */ }
  }

  /* ---------------- Build chrome ---------------- */
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  var topbar = el(
    '<header class="as-topbar" id="asTopbar">' +
      '<div class="as-topbar-inner">' +
        '<button class="as-icon-btn as-back" id="asBack" aria-label="Back">' + ico(I.back) + '</button>' +
        '<span class="as-logo">' + ico(I.shieldA, 20) + '</span>' +
        '<div class="as-titles"><span class="as-title" id="asTitle">Suraksha Alert</span>' +
        '<span class="as-subtitle" id="asSub">Your Safety • Your Strength</span></div>' +
        '<button class="as-score-chip" id="asScore" aria-label="Safety readiness score">' +
          '<span class="as-score-dot"></span><span id="asScoreText">90%</span></button>' +
      '</div>' +
    '</header>'
  );

  var bottomnav = el(
    '<nav class="as-bottomnav" aria-label="Main">' +
      '<div class="as-bottomnav-inner">' +
        tab('dashboard', 'Home', I.home) +
        tab('journey', 'Journey', I.route) +
        '<div class="as-sos-tab"><button class="as-sos-fab" id="asSos" aria-label="Emergency SOS">SOS</button>' +
          '<span class="as-sos-label">Emergency</span></div>' +
        tab('contacts', 'Contacts', I.users) +
        '<button class="as-tab" data-as-more="1">' +
          '<span class="as-tab-ico">' + ico(I.grid) + '</span><span>More</span></button>' +
      '</div>' +
    '</nav>'
  );
  function tab(page, label, icon) {
    return '<button class="as-tab" data-as-page="' + page + '">' +
      '<span class="as-tab-ico">' + ico(icon) + '</span><span>' + label + '</span></button>';
  }

  var scrim = el('<div class="as-scrim" id="asScrim"></div>');

  function user() {
    try { return (window.appState && window.appState.state && window.appState.state.user) || {}; }
    catch (e) { return {}; }
  }

  var sheet = el(
    '<div class="as-sheet" id="asSheet" role="dialog" aria-label="More">' +
      '<div class="as-handle"></div>' +
      '<div class="as-sheet-profile"><div class="as-avatar" id="asAvatar">AS</div>' +
        '<div><strong id="asUserName">Aanya Sen</strong><span id="asUserMeta">Protected • Demo mode</span></div></div>' +
      '<div class="as-sheet-label">Safety tools</div>' +
      '<div class="as-grid">' +
        gridItem('readiness', 'Readiness Score', I.gauge, '') +
        gridItem('escalation', 'Escalation Flow', I.ladder, 'plum') +
        gridItem('shield', 'Active Shield', I.shield, 'purple') +
        gridItem('emergency', 'Emergency 112', I.phone, '') +
        gridItem('history', 'Activity', I.clock, 'plum') +
        gridItem('innovation', 'Innovation', I.bulb, 'purple') +
      '</div>' +
      '<div class="as-sheet-label">App</div>' +
      '<div class="as-list">' +
        listItem('as-about', I.info, 'About Suraksha', 'Our mission and how it works') +
        listItem('as-tour', I.play, 'Guided demo tour', 'Step-by-step walkthrough of every feature') +
        listItem('as-reset', I.reset, 'Reset demo data', 'Restore sample contacts and history') +
      '</div>' +
      '<div class="as-version">Suraksha Alert v' + APP_VERSION + ' • Made with care in India</div>' +
    '</div>'
  );
  function gridItem(page, label, icon, cls) {
    return '<button class="as-grid-item ' + cls + '" data-as-page="' + page + '">' +
      '<span class="as-grid-ico">' + ico(icon) + '</span>' + label + '</button>';
  }
  function listItem(id, icon, label, sub) {
    return '<button class="as-list-item" id="' + id + '"><span class="as-grid-ico" style="width:36px;height:36px;border-radius:12px">' +
      ico(icon, 19) + '</span><span>' + label + '<small>' + sub + '</small></span>' +
      '<span class="as-chev">' + ico(I.chev, 18) + '</span></button>';
  }

  /* ---------------- Navigation with history ---------------- */
  var originalNavigate = window.navigate;
  var stack = [];
  var current = 'landing';
  var suppressPush = false;

  function updateChrome(pageId) {
    var meta = PAGES[pageId] || PAGES.dashboard;
    document.getElementById('asTitle').textContent = meta.title;
    document.getElementById('asSub').textContent = meta.sub;
    var isRoot = pageId === HOME || TAB_PAGES.indexOf(pageId) !== -1;
    topbar.classList.toggle('as-has-back', !isRoot);

    var active = TAB_PAGES.indexOf(pageId) !== -1 ? pageId : (pageId === HOME ? HOME : 'more');
    var tabs = bottomnav.querySelectorAll('.as-tab');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var on = t.getAttribute('data-as-page') === active || (active === 'more' && t.hasAttribute('data-as-more'));
      t.classList.toggle('active', on);
    }
  }

  window.navigate = function (pageId) {
    if (!document.getElementById('section-' + pageId)) return originalNavigate(pageId);
    if (!suppressPush && pageId !== current) {
      // Tabs reset the stack like a native bottom-nav; others push
      if (pageId === HOME) stack = [];
      else stack.push(current);
      if (stack.length > 30) stack.shift();
    }
    current = pageId;
    closeSheet();
    originalNavigate(pageId);
    window.scrollTo(0, 0);
    updateChrome(pageId);
  };

  function goBack() {
    var prev = stack.pop();
    if (!prev || prev === current) prev = HOME;
    document.body.classList.add('as-nav-back');
    suppressPush = true;
    window.navigate(prev);
    suppressPush = false;
    setTimeout(function () { document.body.classList.remove('as-nav-back'); }, 350);
  }

  /* ---------------- Sheet ---------------- */
  function openSheet() {
    var u = user();
    if (u.name) document.getElementById('asUserName').textContent = u.name;
    if (u.avatar) document.getElementById('asAvatar').textContent = u.avatar;
    document.getElementById('asUserMeta').textContent = (u.city ? u.city + ' • ' : '') + 'Protected';
    scrim.classList.add('open');
    sheet.classList.add('open');
  }
  function closeSheet() {
    scrim.classList.remove('open');
    sheet.classList.remove('open');
  }
  function sheetOpen() { return sheet.classList.contains('open'); }

  /* ---------------- Readiness chip mirrors the original badge ---------------- */
  function syncScore() {
    var badge = document.getElementById('navScoreBadge');
    if (!badge) return;
    var txt = (badge.textContent || '').trim() || '—';
    document.getElementById('asScoreText').textContent = txt;
    var n = parseInt(txt, 10);
    if (!isNaN(n)) topbar.style.setProperty('--as-score', n);
  }

  /* ---------------- Haptics on key emergency actions ---------------- */
  function wrap(name, before) {
    var fn = window[name];
    if (typeof fn !== 'function') return;
    window[name] = function () {
      try { before(); } catch (e) { /* no-op */ }
      return fn.apply(this, arguments);
    };
  }

  /* ---------------- Hardware back button ---------------- */
  function isActive(id) {
    var n = document.getElementById(id);
    return !!(n && n.classList.contains('active'));
  }
  function onBack() {
    if (sheetOpen()) return closeSheet();
    if (isActive('fakeCallOverlay')) return window.declineFakeCall && window.declineFakeCall();
    if (isActive('sosModal')) return window.cancelSosCountdown && window.cancelSosCountdown();
    if (isActive('contactModal')) return window.closeContactModal && window.closeContactModal();
    var jb = document.getElementById('judgeBar');
    if (jb && jb.style.display === 'flex') return window.dismissJudgeTour && window.dismissJudgeTour();
    if (current !== HOME) return goBack();
    if (Plugins.App) Plugins.App.minimizeApp();
  }

  /* ---------------- Init ---------------- */
  function init() {
    document.body.classList.add('as-app');
    document.body.appendChild(topbar);
    document.body.appendChild(bottomnav);
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);

    bottomnav.addEventListener('click', function (e) {
      var b = e.target.closest('[data-as-page],[data-as-more]');
      if (!b) return;
      haptic('LIGHT');
      if (b.hasAttribute('data-as-more')) { sheetOpen() ? closeSheet() : openSheet(); return; }
      var page = b.getAttribute('data-as-page');
      if (page === current) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (page !== HOME) stack = [HOME];
      suppressPush = true;
      window.navigate(page);
      suppressPush = false;
    });
    sheet.addEventListener('click', function (e) {
      var b = e.target.closest('[data-as-page]');
      if (b) { haptic('LIGHT'); window.navigate(b.getAttribute('data-as-page')); }
    });
    scrim.addEventListener('click', closeSheet);
    document.getElementById('asBack').addEventListener('click', function () { haptic('LIGHT'); goBack(); });
    document.getElementById('asScore').addEventListener('click', function () { haptic('LIGHT'); window.navigate('readiness'); });
    document.getElementById('asSos').addEventListener('click', function () { window.triggerSosCountdown(); });
    document.getElementById('as-about').addEventListener('click', function () { window.navigate('landing'); });
    document.getElementById('as-tour').addEventListener('click', function () { closeSheet(); window.startJudgeTour(); });
    document.getElementById('as-reset').addEventListener('click', function () {
      closeSheet();
      window.resetAllStateToDefault();
      stack = [];
      window.navigate(HOME);
    });

    // Swipe down on the sheet handle area to dismiss
    var startY = null;
    sheet.addEventListener('touchstart', function (e) { if (sheet.scrollTop <= 0) startY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchmove', function (e) {
      if (startY !== null && e.touches[0].clientY - startY > 70) { startY = null; closeSheet(); }
    }, { passive: true });
    sheet.addEventListener('touchend', function () { startY = null; }, { passive: true });

    window.addEventListener('scroll', function () {
      topbar.classList.toggle('as-scrolled', window.scrollY > 4);
    }, { passive: true });

    wrap('triggerSosCountdown', function () { haptic('HEAVY'); vibratePattern(250); });
    wrap('proceedImmediateSosDispatch', function () { vibratePattern(600); });
    wrap('handleSafeCheckIn', function () { haptic('MEDIUM'); });
    wrap('triggerFakeCallModal', function () { vibratePattern(400); });

    var badge = document.getElementById('navScoreBadge');
    if (badge && window.MutationObserver) {
      new MutationObserver(syncScore).observe(badge, { childList: true, characterData: true, subtree: true });
    }

    // Open straight into the app (the marketing page lives under More → About)
    suppressPush = true;
    window.navigate(HOME);
    suppressPush = false;
    stack = [];
    syncScore();

    if (Plugins.App) Plugins.App.addListener('backButton', onBack);
    if (Plugins.SplashScreen) setTimeout(function () { Plugins.SplashScreen.hide({ fadeOutDuration: 300 }); }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Exposed for debugging in the WebView console
  window.SurakshaShell = { back: onBack, isNative: isNative, version: APP_VERSION };
})();
