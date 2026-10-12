# VERITAS LIFE

## Hosting on Cloudflare (recommended, free plan)
The game files are served from Cloudflare's edge; the game server runs in one Durable Object (`cf/worker.js`)
that keeps its data in its own SQLite storage. Players hold one live connection open instead of calling the
server every second, which keeps a busy school inside the free limits.

1. Cloudflare dashboard → **Workers & Pages → Create → Import a repository** → pick `Veritas-life-frontend`.
   Deploy command: `npx wrangler deploy` (the build runs by itself, see `wrangler.jsonc`).
2. **Settings → Variables and Secrets**: add `ADMIN_PASSWORD` (secret). Optional: `RESEND_API_KEY` + `EMAIL_FROM`
   for password-reset emails, `KORAPAY_SECRET_KEY` for real payments, and `IMPORT_URL` + `IMPORT_TOKEN`
   (your Upstash REST URL and token) to copy existing players over once.
3. Open `https://veritas-life.<your-subdomain>.workers.dev`.
4. In the admin website set `VL_API` (config.js) to that address, log in and press **☁ Move data from Upstash** once.

Free-plan limits to know: 100,000 Worker requests and 100,000 Durable Object requests a day (live-connection
messages count 20 messages as 1 request), reset at 1 AM Lagos time. Gmail SMTP does not work on Cloudflare; use Resend for emails.

# VERITAS LIFE (all on Vercel)

The whole online game runs on one Vercel project. Real players are students; all staff are NPCs.

| URL | What |
|---|---|
| `/` | The game: players log in with `VUG/26/<matric number>` and a password |
| admin website (separate project) | Stats, players, live activity, 🚨 Send bandits, **₦ Give money** (one player by matric/username, the first N players, everyone online, every player), **🎤 Concert** (lineup, day, time, ticket prices) |
| `/api/*` | The game server (one Vercel Function) |

The data lives in **Upstash Redis**, added from the Vercel Marketplace (it has a free plan). Players sync with the server every 1–2.5 seconds.

## Deploy (about 5 minutes)

1. **Import the repo:** vercel.com → Add New → Project → import `Veritas-life-frontend`. Set the framework preset to **Other**, leave the build command empty, and deploy.
2. **Add the database:** in the project, open **Storage → Create Database → Upstash → Redis (Free)** and connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
3. **Admin password:** go to **Settings → Environment Variables** and add `ADMIN_PASSWORD` = a long secret.
4. **Redeploy:** Deployments → ⋯ → Redeploy, so the new variables take effect.

Check it works by opening `https://<project>.vercel.app/api/config`. Expected output:

```json
{"payments":"test","packs":{...},"storage":"upstash"}
```

If it says the database is not connected, step 2 or 4 was missed.

## Run it on your computer

```bash
npm run dev
```

Output:

```
VERITAS LIFE · http://localhost:3000  · admin: http://localhost:3000/admin  · database: in-memory
```

Locally, the admin password is `change-me-now` unless you set `ADMIN_PASSWORD`. The in-memory database resets when you stop the server. To use your real Upstash data locally, set `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

## Costs and limits

- **Upstash:** every sync uses about 8–10 Redis commands, so a player online for an hour uses roughly 15,000–25,000. The free plan covers light testing. For a real launch, switch Upstash to pay-as-you-go, which is cheap per 100,000 commands. You can watch usage in the Upstash dashboard.
- **Vercel:** every sync is one function call. Vercel's Hobby plan is free for personal, non-commercial projects. If you charge real money, you need the Pro plan.
- **Each player's game clock is their own.** Presence, chat, money, raids and parties are shared.
- **The game logic runs in the browser,** so a determined cheater could edit their own money. Transfers are checked against the last saved balance.

## Payments

`PAYMENTS_MODE=test` (the default): the Top up app gives ₦1,000,000 of game money for ₦20,000 **without charging anything**. To take real money, verify the payment (for example with Paystack) in `api/index.js` → `shop/buy` before crediting. The code marks the spot.

## Password reset emails

Players can reset their password with a 6-digit code sent to their email. Turn it on with **one** of these in Vercel → Settings → Environment Variables, then redeploy:

- **Gmail (easiest):** `SMTP_USER` = your Gmail address, `SMTP_PASS` = a Gmail *app password* (Google Account → Security → 2-Step Verification → App passwords).
- **Resend:** `RESEND_API_KEY` and `EMAIL_FROM` (needs a verified domain).

Until then, "Forgot password" tells players to ask the admin. The admin API has `POST /api/admin/resetpass {userId}`, which returns a temporary password.

## Editing the game code

The big game file `index.html` contains the modules in `src/` (arrival scene, characters and stories, dating, Yahoo, bandits, vehicles, controls). Edit the file in `src/`, then run:

```bash
node build.js
```

That copies the modules into `index.html` between the `@@EARLY` / `@@MODULES` markers. Commit both.

## Realistic people

Near the camera, every character is drawn as a rigged, realistic human (`src/humans.js`). Far away, or with
**Profile → Settings → People: Classic**, the old blocky characters are used. The data file `vendor/hm/hm.bin`
is built from the free MakeHuman base mesh, morph targets, skeleton and eyes (released as CC0 by the
MakeHuman project, makehumancommunity.org). To rebuild it from a MakeHuman checkout:

    node tools/humans/build-humans.js <path>/makehuman/makehuman/data vendor/hm

Each person's face, body and clothes come from their existing look (skin, top, trousers or skirt, shoes,
hair style and colour, hijab), so nothing else in the game needs changing. Their skeleton copies the
classic character's joints every frame, so every pose and cutscene works the same.
