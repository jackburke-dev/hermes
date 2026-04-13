import { Router, Request, Response } from 'express'
import { getLatestBriefing, getBriefingByDate, saveEmailSubscriber, removeEmailSubscriber, savePushSubscription } from '../lib/storage'
import { generateBriefing } from '../lib/generator'
import { sendNotifications } from '../lib/notifications'
import { saveBriefing } from '../lib/storage'

const router = Router()

// ── Get briefing ──────────────────────────────────────────────────
router.get('/briefing', async (req: Request, res: Response) => {
  try {
    const briefing = req.query.date
      ? await getBriefingByDate(req.query.date as string)
      : await getLatestBriefing()
    if (!briefing) return res.status(404).json({ error: 'No briefing found yet.' })
    res.json(briefing)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// ── Trigger generation (cron calls this, or manual) ───────────────
router.get('/generate', async (req: Request, res: Response) => {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  // Respond immediately so the request doesn't time out on the caller side
  res.json({ ok: true, message: 'Generation started. Check logs for progress.' })

  // Run async — no timeout since this is a persistent server
  try {
    const briefing = await generateBriefing()
    await saveBriefing(briefing)
    await sendNotifications(briefing)
    console.log(`Hermes: generation complete for ${briefing.date}`)
  } catch (err) {
    console.error('Hermes: generation error:', err)
  }
})

// ── Email subscribe ───────────────────────────────────────────────
router.post('/subscribe/email', async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' })
  await saveEmailSubscriber(email)
  res.json({ ok: true })
})

// ── Email unsubscribe ─────────────────────────────────────────────
router.get('/unsubscribe', async (req: Request, res: Response) => {
  const { email } = req.query
  if (email) await removeEmailSubscriber(email as string)
  res.send(`<html><body style="font-family:Georgia,serif;text-align:center;padding:60px;background:#faf8f4;">
    <p style="font-size:18px;color:#555;">You've been unsubscribed from Hermes.</p>
  </body></html>`)
})

// ── Push subscribe ────────────────────────────────────────────────
router.post('/subscribe/push', async (req: Request, res: Response) => {
  const { subscription } = req.body
  if (!subscription) return res.status(400).json({ error: 'No subscription' })
  await savePushSubscription(subscription)
  res.json({ ok: true })
})

// ── VAPID public key (needed by browser to subscribe) ─────────────
router.get('/vapid-key', (_req: Request, res: Response) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY })
})

// ── Health check ──────────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

export default router
