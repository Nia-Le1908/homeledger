'use strict';
/* HomeLedger router — hash routes, one render per navigation.
   window.__shotReady is false while a view renders and true once the
   page is on screen, so screenshots can wait for it. */

var HLMain = (function () {
  var TITLES = {
    '': 'HomeLedger — Nguyen family budget',
    'transactions': 'Transactions — HomeLedger',
    'budgets': 'Budgets — HomeLedger',
    'goals': 'Family goals — HomeLedger',
    'reports': 'Reports — HomeLedger'
  };

  function parseHash() {
    var raw = window.location.hash || '#/';
    var hash = raw.replace(/^#\/?/, '');
    var parts = hash.split('?');
    var route = parts[0] || '';
    var params = {};
    if (parts[1]) {
      parts[1].split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv[0]) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
      });
    }
    return { route: route, params: params };
  }

  var currentParams = {};

  function render(keepSearch, extraParams) {
    window.__shotReady = false;
    var parsed = parseHash();
    var route = parsed.route;
    var routeChanged = route !== (render.lastRoute || '');
    render.lastRoute = route;
    if (extraParams) {
      currentParams = extraParams;
    } else if (Object.keys(parsed.params).length) {
      currentParams = parsed.params;
    } else if (routeChanged) {
      currentParams = {};
    }
    var view;
    if (route === 'transactions') view = HLViews.transactions(currentParams);
    else if (route === 'budgets') view = HLViews.budgets();
    else if (route === 'goals') view = HLViews.goals();
    else if (route === 'reports') view = HLViews.reports(currentParams);
    else view = HLViews.dashboard();

    document.title = TITLES[route] || TITLES[''];
    var mount = document.getElementById('view');
    mount.innerHTML = view.html;
    document.querySelectorAll('.nav a').forEach(function (a) {
      var href = a.getAttribute('href');
      var r = href.replace(/^#\/?/, '').split('?')[0];
      a.classList.toggle('on', r === route || (r === '' && route === ''));
      if (r === route || (r === '' && route === '')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    view.wire(mount);
    if (keepSearch) {
      var q = mount.querySelector('input[name="q"]');
      if (q) { q.focus(); var v = q.value; q.value = ''; q.value = v; }
    }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { window.__shotReady = true; });
    });
  }

  function start() {
    window.__shotReady = false;
    window.addEventListener('hashchange', function () { render(); });
    HLStore.onChange(function () { render(); });
    document.getElementById('reset-demo').addEventListener('click', function () {
      if (window.confirm('Reset HomeLedger to the original 99 transactions? Your edits will be lost.')) {
        HLStore.resetAll();
      }
    });
    render();
  }

  return { render: render, start: start };
})();

document.addEventListener('DOMContentLoaded', HLMain.start);
