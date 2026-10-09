/* Sends one plain email (used for password-reset codes). No extra packages needed.
   Works with either:
   - Resend:  RESEND_API_KEY (+ EMAIL_FROM, e.g. "Veritas Life <noreply@yourdomain.com>")
   - Any SMTP server over SSL, for example Gmail with an app password:
       SMTP_USER=you@gmail.com  SMTP_PASS=<16-letter app password>
       (optional) SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  EMAIL_FROM="Veritas Life <you@gmail.com>"
   If none of these are set, mailer.ready is false and the game tells players to ask the admin. */
'use strict';
const tls = require('tls');

const RESEND = process.env.RESEND_API_KEY || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const SMTP_HOST = process.env.SMTP_HOST || (SMTP_USER.endsWith('@gmail.com') ? 'smtp.gmail.com' : '');
const SMTP_PORT = +process.env.SMTP_PORT || 465;
const FROM = process.env.EMAIL_FROM || (SMTP_USER ? 'Veritas Life <' + SMTP_USER + '>' : 'Veritas Life <onboarding@resend.dev>');
const ready = !!(RESEND || (SMTP_USER && SMTP_PASS && SMTP_HOST));
const addr = s => { const m = String(s).match(/<([^>]+)>/); return m ? m[1] : String(s).trim(); };

async function viaResend(to, subject, text) {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM, to: [to], subject, text }) });
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()).slice(0, 200));
}

/* Minimal SMTP over implicit TLS (port 465): EHLO, AUTH LOGIN, MAIL, RCPT, DATA, QUIT. */
function viaSmtp(to, subject, text) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host: SMTP_HOST, port: SMTP_PORT, servername: SMTP_HOST });
    let buf = '', step = 0, done = false;
    const b64 = s => Buffer.from(s, 'utf8').toString('base64');
    const enc = s => '=?UTF-8?B?' + b64(s) + '?=';
    const body = String(text).replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
    const msg = ['From: ' + FROM.replace(/^([^<]+)</, (m, n) => enc(n.trim()) + ' <'), 'To: <' + to + '>', 'Subject: ' + enc(subject), 'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', 'Date: ' + new Date().toUTCString(), '', body, '.'].join('\r\n');
    const seq = [
      [220, 'EHLO veritaslife'], [250, 'AUTH LOGIN'], [334, b64(SMTP_USER)], [334, b64(SMTP_PASS)], [235, 'MAIL FROM:<' + addr(FROM) + '>'],
      [250, 'RCPT TO:<' + to + '>'], [250, 'DATA'], [354, msg], [250, 'QUIT']];
    const fail = e => { if (done) return; done = true; try { sock.destroy(); } catch (x) { } reject(e); };
    const timer = setTimeout(() => fail(new Error('SMTP timeout')), 15000);
    sock.on('data', d => {
      buf += d.toString('utf8');
      // wait for a complete reply (last line has "NNN " not "NNN-")
      const lines = buf.split('\r\n').filter(Boolean); const last = lines[lines.length - 1] || '';
      if (!/^\d{3} /.test(last) || !buf.endsWith('\r\n')) return;
      const code = +last.slice(0, 3); buf = '';
      if (step >= seq.length) { clearTimeout(timer); done = true; sock.end(); return resolve(); }
      const [want, send] = seq[step];
      if (code !== want) { clearTimeout(timer); return fail(new Error('SMTP ' + code + ' at step ' + step + ': ' + last.slice(0, 160))); }
      step++; sock.write(send + '\r\n');
      if (step === seq.length) { clearTimeout(timer); done = true; setTimeout(() => { try { sock.end(); } catch (x) { } }, 200); resolve(); }
    });
    sock.on('error', fail);
  });
}

async function send(to, subject, text) { if (!ready) throw new Error('Email is not set up'); return RESEND ? viaResend(to, subject, text) : viaSmtp(to, subject, text); }
module.exports = { ready, send };
