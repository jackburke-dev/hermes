import { Resend } from 'resend'
import webpush from 'web-push'
import { buildEmail } from './email'
import { getAllEmailSubscribers, getAllPushSubscriptions } from './storage'
import type { Briefing } from './types'

const resend = new Resend(process.env.RESEND_API_KEY)

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendNotifications(briefing: Briefing): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const { html, text, subject } = buildEmail(briefing, appUrl)

  // Email
  const emails = await getAllEmailSubscribers()
  if (emails.length) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'hermes@resend.dev',
        to: emails,
        subject,
        html,
        text,
      })
      console.log(`Hermes: email sent to ${emails.length} subscribers`)
    } catch (err) {
      console.error('Hermes: email send failed:', err)
    }
  }

  // Push notifications
  const subs = await getAllPushSubscriptions()
  if (subs.length) {
    const payload = JSON.stringify({
      title: 'Hermes',
      body: `Your morning briefing is ready — ${new Date(briefing.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
      url: appUrl,
    })
    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub as webpush.PushSubscription, payload))
    )
    const failed = results.filter(r => r.status === 'rejected').length
    console.log(`Hermes: push sent to ${subs.length - failed}/${subs.length} subscribers`)
  }
}
