/* VERITAS LIFE · Korapay checkout in the game (loaded by config.js after the game starts). */
(function () {
  'use strict';
  var N = window.VLNet; if (!N) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var naira = function (n) { return '₦' + Math.round(n).toLocaleString('en-US'); };
  var tok = function () { try { return localStorage.getItem('vl-token'); } catch (e) { return null; } };
  function api(path, body) {
    return fetch(path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong'); e.code = r.status; throw e; } return j; }); });
  }
  function toast(t, m, k) { if (N.VL && N.VL.S) N.VL.toast(t, m, k); }
  var cfgP = api('/api/shop/config').then(function (c) { N.payCfg = c; N.live = c.payments === 'korapay' && !c.korapayTest; return c; }).catch(function () { return { payments: 'test' }; });

  function askEmail(pk, test) {
    return new Promise(function (done) {
      var saved = ''; try { saved = localStorage.getItem('vl-email') || ''; } catch (e) { }
      var m = document.createElement('div'); m.className = 'vlgate';
      m.innerHTML = '<div class="vlg-card"><h1 style="font-size:24px">Top up</h1><p class="vlg-sub"><b>' + naira(pk.coins) + '</b> game money for <b>' + naira(pk.ng) + '</b>' + (test ? '<br><span style="color:#f0cf86">Korapay TEST mode: no real money</span>' : '') + '</p>' +
        '<form><label>Email for your receipt</label><input name="email" type="email" required placeholder="you@example.com" value="' + esc(saved) + '" style="width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid rgba(239,230,207,.18);background:#0f231e;color:#efe6cf;font:inherit;font-size:16px">' +
        '<div class="vlg-err"></div><button class="vlg-go" type="submit">Pay ' + naira(pk.ng) + ' with Korapay</button><button type="button" class="vlg-x" style="margin-top:8px;border:0;background:none;color:#a9b5a4;padding:10px;font:inherit">Cancel</button></form>' +
        '<p class="vlg-note">You will go to Korapay to pay by card, bank transfer or USSD, then come back to the game.</p></div>';
      document.body.appendChild(m); var f = m.querySelector('form');
      f.onsubmit = function (e) { e.preventDefault(); var v = f.email.value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { m.querySelector('.vlg-err').textContent = 'Enter a valid email.'; return; } m.remove(); done(v); };
      m.querySelector('.vlg-x').onclick = function () { m.remove(); done(null); };
    });
  }

  N.buy = function (id) {
    return cfgP.then(function (cfg) {
      if (cfg.payments !== 'korapay') return api('/api/shop/buy', { pack: id }).then(function (j) { toast('Top up', naira(j.coins) + ' is on its way (test mode, no real money charged).'); });
      var pk = cfg.packs[id];
      return askEmail(pk, cfg.korapayTest).then(function (email) {
        if (!email) return;
        toast('Korapay', 'Opening secure checkout…');
        return api('/api/shop/buy', { pack: id, email: email }).then(function (j) {
          try { localStorage.setItem('vl-email', email); localStorage.setItem('vl-payref', j.reference); } catch (e) { }
          var go = function () { location.href = j.checkout_url; };
          try { if (N.VL && N.VL.S && N.saveNow) N.saveNow(N.VL.snapState()).then(go, go); else go(); } catch (e) { go(); }
        });
      });
    }).catch(function (e) { toast('Top up failed', esc(e.message), 'bad'); });
  };

  /* Back from Korapay: confirm the payment (the webhook also does this in the background). */
  function checkReturn() {
    var q = new URLSearchParams(location.search); var ref = q.get('reference');
    if (!ref && q.get('paid')) { try { ref = localStorage.getItem('vl-payref'); } catch (e) { } }
    if (!ref) return; history.replaceState(null, '', location.pathname);
    var tries = 0;
    (function attempt() {
      if (!tok()) { if (tries++ < 30) return setTimeout(attempt, 2000); return; }
      api('/api/shop/verify', { reference: ref }).then(function (j) {
        if (j.ok) { try { localStorage.removeItem('vl-payref'); } catch (e) { } return later('Payment confirmed', naira(j.coins) + ' is being added to your account. Thank you!', 'good'); }
        if (j.pending && tries++ < 8) return setTimeout(attempt, 4000);
        later('Payment not confirmed yet', 'If you were charged, your game money will arrive automatically once Korapay confirms it.', 'bad');
      }).catch(function (e) { if (e.code !== 404 && tries++ < 8) return setTimeout(attempt, 4000); });
    })();
  }
  function later(t, m, k) { var n = 0; (function w() { if (N.VL && N.VL.S) return setTimeout(function () { N.VL.toast(t, m, k); }, 1200); if (n++ < 120) setTimeout(w, 1000); })(); }
  checkReturn();
})();
