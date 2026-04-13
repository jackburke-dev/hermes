# Hermes — Setup Guide
## Railway deployment (~25 minutes total)

---

## What you need (all free or cheap)
- GitHub account — github.com
- Railway account — railway.app ($5/mo Hobby plan)
- Anthropic API key — console.anthropic.com (you have this from MochaBot)
- Resend account — resend.com (free, 3,000 emails/month)

---

## Step 1 — Push to GitHub (5 min)

```bash
cd morning-brief
git init
git add .
git commit -m "Hermes initial commit"
```

Go to github.com → click "+" → New repository → name it `hermes` → Create.

Then push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/hermes.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy to Railway (5 min)

1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select your `hermes` repo
3. Railway auto-detects Node.js and runs `npm install && npm run build && npm start`
4. It will fail on first deploy because env vars aren't set yet — that's fine

---

## Step 3 — Add Redis database (2 min)

1. In your Railway project → click "+ New" → Database → Add Redis
2. Click on the Redis service → Variables tab
3. Copy the `REDIS_URL` value — you'll need it in the next step

---

## Step 4 — Generate VAPID keys for push notifications (2 min)

In your terminal:
```bash
npx web-push generate-vapid-keys
```
Copy both keys.

---

## Step 5 — Add environment variables (5 min)

In Railway → your app service (not the Redis one) → Variables tab → Add all of these:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `REDIS_URL` | From Step 3 (auto-filled if services are linked) |
| `RESEND_API_KEY` | From resend.com → API Keys |
| `RESEND_FROM` | e.g. `hermes@yourdomain.com` or Resend's test address |
| `RECIPIENT_EMAIL` | Your email address |
| `VAPID_PUBLIC_KEY` | From Step 4 |
| `VAPID_PRIVATE_KEY` | From Step 4 |
| `VAPID_MAILTO` | `mailto:your@email.com` |
| `CRON_SECRET` | Any random string, e.g. `hermes2026secret` |
| `APP_URL` | Your Railway URL — set this after first successful deploy |

---

## Step 6 — Redeploy (1 min)

Railway → your app → Deployments → click "Redeploy" on the latest.
Watch the logs — you should see "Hermes running on port 3000".

---

## Step 7 — Test generation (3 min)

Once deployed, visit:
```
https://your-app.up.railway.app/api/generate?secret=YOUR_CRON_SECRET
```

This triggers generation immediately. It takes 3–5 minutes.
Watch Railway logs to see each section being generated.
Then open your app — the briefing should be there.

---

## Step 8 — Add to iPad home screen (1 min)

1. Open your Railway URL in Safari on iPad
2. Tap the Share icon (box with arrow)
3. Scroll down → "Add to Home Screen"
4. Name it "Hermes" → Add

It opens as a full-screen app from now on.

---

## Step 9 — Subscribe to email + push

Once the app loads on your iPad:
- Enter your email in the sidebar → Subscribe
- Tap "Enable push notifications" → Allow

You'll get an email + push notification every morning at 5 AM PT.

---

## How the cron works

The server runs 24/7 on Railway. `node-cron` inside the server fires at 5 AM PT (13:00 UTC) every day, calls `generateBriefing()`, saves to Redis, emails you, and sends a push. No external cron service needed.

---

## Resend email note

If you don't have a custom domain, use Resend's onboarding domain for testing:
`delivered@resend.dev` as the from address works on their free tier.
For production, add your domain in the Resend dashboard and verify it.

---

## Troubleshooting

**"No briefing yet"** → Hit the generate endpoint manually (Step 7)

**Generation errors** → Check Railway logs. Most common: wrong API key, Redis not connected

**Push not working on iOS** → Requires iOS 16.4+ and the app must be added to home screen first

**Redis connection errors** → In Railway, make sure the Redis service and your app service are in the same project. Click your app service → Variables → check REDIS_URL is there

**Email not arriving** → Check spam folder. Verify RESEND_API_KEY is correct and domain is verified in Resend dashboard

---

## Cost breakdown

| Service | Cost |
|---------|------|
| Railway Hobby (app + Redis) | $5/month |
| Resend email | Free (3,000/month) |
| Anthropic API (daily generation) | ~$0.50–$1.50/day depending on model |
| **Total** | **~$20–$50/month** |

The Anthropic cost is the main variable. Using `claude-opus-4-5` for everything is highest quality but most expensive. You can swap to `claude-sonnet-4-6` in `src/lib/generator.ts` to cut costs significantly with minimal quality difference.
