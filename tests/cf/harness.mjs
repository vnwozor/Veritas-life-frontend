import { DatabaseSync } from 'node:sqlite';
import { EventEmitter } from 'node:events';
const DBFILE = process.env.DB || ':memory:';
// fake WebSocketPair
class FakeWS extends EventTarget { constructor() { super(); this.peer = null; this.sent = []; } accept() {} send(d) { if (this.peer) setTimeout(() => this.peer.dispatchEvent(Object.assign(new Event('message'), { data: d })), 0); } close() { if (this.peer) this.peer.dispatchEvent(new Event('close')); this.dispatchEvent(new Event('close')); } }
globalThis.WebSocketPair = function () { const a = new FakeWS(), b = new FakeWS(); a.peer = b; b.peer = a; return { 0: a, 1: b }; };
const OrigResponse = globalThis.Response;
globalThis.Response = class extends OrigResponse { constructor(body, init = {}) { const ws = init.webSocket; const st = init.status; if (st === 101) { super(null, { status: 200 }); this._ws = ws; this._st = 101; } else super(body, init); } };
const mk = (db) => ({ storage: { sql: { exec: (q, ...b) => { const st = db.prepare(q); if (/^\s*select/i.test(q)) { const rows = st.all(...b); return { toArray: () => rows }; } st.run(...b.map(x => x === undefined ? null : x)); return { toArray: () => [] }; } } } });
export async function boot(env) { const db = new DatabaseSync(DBFILE); const mod = await import((process.env.BUNDLE || './bundle.mjs') + '?' + Math.random()); const g = new mod.Game(mk(db), env); return { g, db, mod }; }
