# VERITAS LIFE (all on Vercel)

The whole online game runs on one Vercel project. Real players are students; all staff are NPCs.

| URL | What |
|---|---|
| `/` | The game: players log in with `VUG/26/<matric number>` and a password |
| `/admin` | Your admin website: stats, players, live activity, **🚨 Send bandits** |
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
