import type { Briefing, Story } from './types'

function storyHtml(story: Story, accentColor: string): string {
  const bodyHtml = story.body
    .split('\n\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 20px;font-family:'Georgia',serif;font-size:17px;line-height:1.9;color:#3a3028;">${p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`)
    .join('')

  return `
<div style="margin-bottom:52px;padding-bottom:52px;border-bottom:1px solid #e8e2d9;">
  <div style="border-left:3px solid ${accentColor};padding-left:18px;margin-bottom:20px;">
    <h2 style="font-family:'Georgia',serif;font-size:24px;font-weight:700;color:#1a1410;margin:0 0 8px;line-height:1.2;">${story.headline}</h2>
    <p style="font-family:'Georgia',serif;font-size:15px;color:#999;margin:0;font-style:italic;">${story.subheadline}</p>
  </div>
  <p style="font-family:'Georgia',serif;font-size:12px;color:#bbb;margin:0 0 24px;letter-spacing:0.08em;">${story.readingMinutes} MIN READ</p>
  ${bodyHtml}
  ${story.medicineNote ? `
  <div style="background:#f0f9f4;border-left:3px solid #1a6b4a;padding:16px 20px;margin:28px 0 0;border-radius:2px;">
    <p style="font-family:'Georgia',serif;font-size:11px;font-weight:700;color:#1a6b4a;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">Medicine & Health</p>
    <p style="font-family:'Georgia',serif;font-size:15px;color:#2a4a38;margin:0;line-height:1.75;">${story.medicineNote}</p>
  </div>` : ''}
  ${story.interviewNote ? `
  <div style="background:#f0f4fa;border-left:3px solid #1a3a6b;padding:16px 20px;margin:16px 0 0;border-radius:2px;">
    <p style="font-family:'Georgia',serif;font-size:11px;font-weight:700;color:#1a3a6b;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 8px;">For Your Interviews</p>
    <p style="font-family:'Georgia',serif;font-size:15px;color:#2a3a5a;margin:0;line-height:1.75;">${story.interviewNote}</p>
  </div>` : ''}
  ${story.watchFor?.length ? `
  <div style="margin-top:24px;">
    <p style="font-family:'Georgia',serif;font-size:11px;font-weight:700;color:#C41E3A;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;">What to Watch</p>
    ${story.watchFor.map(w => `<p style="font-family:'Georgia',serif;font-size:15px;color:#666;margin:0 0 8px;padding-left:14px;border-left:2px solid #f0b0b8;">→ ${w}</p>`).join('')}
  </div>` : ''}
</div>`
}

function sectionHtml(title: string, color: string, stories: Story[]): string {
  if (!stories.length) return ''
  return `
<div style="margin-bottom:60px;">
  <div style="border-bottom:2px solid ${color};padding-bottom:12px;margin-bottom:36px;">
    <p style="font-family:'Georgia',serif;font-size:11px;font-weight:700;color:${color};letter-spacing:0.35em;text-transform:uppercase;margin:0;">${title}</p>
  </div>
  ${stories.map(s => storyHtml(s, color)).join('')}
</div>`
}

export function buildEmail(briefing: Briefing, appUrl: string): { html: string; text: string; subject: string } {
  const dateStr = new Date(briefing.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const openingLines = briefing.opening.content
    .split('\n')
    .map(l => `<p style="font-family:'Georgia',serif;font-size:20px;line-height:1.85;color:#2a2018;font-style:italic;margin:0 0 4px;">${l}</p>`)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hermes · ${dateStr}</title></head>
<body style="margin:0;padding:0;background:#faf8f4;">
<div style="max-width:680px;margin:0 auto;padding:clamp(32px,5vw,56px) clamp(20px,4vw,40px);background:#faf8f4;">

  <!-- Masthead -->
  <div style="text-align:center;padding-bottom:48px;border-bottom:2px solid #1a1410;margin-bottom:52px;">
    <p style="font-family:'Georgia',serif;font-size:11px;letter-spacing:0.45em;color:#C41E3A;text-transform:uppercase;margin:0 0 16px;">Hermes · Morning Briefing</p>
    <h1 style="font-family:'Georgia',serif;font-size:clamp(28px,5vw,42px);font-weight:900;color:#1a1410;margin:0;letter-spacing:-1px;line-height:1.1;">${dateStr}</h1>
  </div>

  <!-- Opening -->
  <div style="text-align:center;margin-bottom:56px;padding:0 clamp(0px,3vw,28px);">
    ${openingLines}
    ${briefing.opening.attribution ? `<p style="font-family:'Georgia',serif;font-size:13px;color:#bbb;margin:20px 0 0;">— ${briefing.opening.attribution}</p>` : ''}
    <div style="width:32px;height:1px;background:#C41E3A;margin:28px auto;"></div>
    <p style="font-family:'Georgia',serif;font-size:16px;color:#888;font-style:italic;margin:0;">${briefing.opening.bridge}</p>
  </div>

  <!-- Sections -->
  ${sectionHtml('The Big Stories', '#C41E3A', briefing.sections.big)}
  ${sectionHtml('Healthcare & Medicine', '#1a6b4a', briefing.sections.health)}
  ${sectionHtml('Innovation', '#1a3a6b', briefing.sections.innovation)}
  ${sectionHtml('Geopolitics', '#7a4a10', briefing.sections.geo)}
  ${sectionHtml('Los Angeles', '#6a1a7a', briefing.sections.local)}

  <!-- Footer -->
  <div style="text-align:center;padding-top:48px;border-top:1px solid #e8e2d9;margin-top:20px;">
    <p style="font-family:'Georgia',serif;font-size:12px;color:#bbb;margin:0 0 10px;">Hermes · Generated at 5:00 AM PT</p>
    <p style="font-family:'Georgia',serif;font-size:12px;color:#ccc;margin:0;">
      <a href="${appUrl}" style="color:#C41E3A;text-decoration:none;">Open app</a>
      &nbsp;·&nbsp;
      <a href="${appUrl}/unsubscribe" style="color:#ccc;text-decoration:none;">Unsubscribe</a>
    </p>
  </div>

</div>
</body>
</html>`

  const subject = `Hermes · ${new Date(briefing.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`

  const text = [
    'HERMES · MORNING BRIEFING',
    dateStr,
    '─'.repeat(50),
    briefing.opening.content,
    briefing.opening.attribution ? `— ${briefing.opening.attribution}` : '',
    '',
    briefing.opening.bridge,
    '─'.repeat(50),
    ...Object.entries(briefing.sections).flatMap(([key, stories]) => [
      '',
      key.toUpperCase(),
      ...(stories as Story[]).flatMap(s => ['', s.headline, '', s.body.slice(0, 400) + '...', '']),
    ]),
    '',
    `Open in app: ${appUrl}`,
  ].join('\n')

  return { html, text, subject }
}
