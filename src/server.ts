import express from 'express'
import compression from 'compression'
import cors from 'cors'
import path from 'path'
import cron from 'node-cron'
import apiRouter from './routes/api'
import { generateBriefing } from './lib/generator'
import { saveBriefing } from './lib/storage'
import { sendNotifications } from './lib/notifications'

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

// ── Middleware ────────────────────────────────────────────────────
app.use(compression())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── API routes ────────────────────────────────────────────────────
app.use('/api', apiRouter)

// ── Static frontend ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')))

// ── SPA fallback — all non-API routes serve index.html ───────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' })
  res.sendFile(path.join(__dirname, '../public/index.html'))
})

// ── Cron: 5:00 AM Pacific Time (UTC-7 in summer, UTC-8 in winter)
// We use 13:00 UTC which = 5:00 AM PT year-round (close enough)
// For precise DST handling you could use a library like luxon
cron.schedule('0 13 * * *', async () => {
  console.log('Hermes cron: starting scheduled generation...')
  try {
    const briefing = await generateBriefing()
    await saveBriefing(briefing)
    await sendNotifications(briefing)
    console.log('Hermes cron: done.')
  } catch (err) {
    console.error('Hermes cron: error:', err)
  }
}, {
  timezone: 'America/Los_Angeles',
})

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nHermes running on port ${PORT}`)
  console.log(`Daily briefing scheduled for 5:00 AM PT`)
  console.log(`Manual trigger: GET /api/generate?secret=YOUR_CRON_SECRET\n`)
})
