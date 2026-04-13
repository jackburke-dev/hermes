import Anthropic from '@anthropic-ai/sdk'
import type { Briefing, Story, Opening, GlobeLocation, GlobeConnection } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const todayStr = () => new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

// ─────────────────────────────────────────────────────────────────
// PROMPTS
// ─────────────────────────────────────────────────────────────────

const PROMPT_OPENING = () => `
Today is ${todayStr()}.

You are writing the opening of Hermes — a daily morning briefing. Search the web to understand the biggest stories happening today, then choose ONE of the following to open with:

Option A: An original short poem (4–8 lines) that captures the mood or weight of the world today. The poem should feel resonant and specific to what's actually happening — not generic.

Option B: A quote from literature, history, philosophy, or science that feels genuinely illuminating given today's events. Choose something that makes the reader pause.

Alternate between poems and quotes across different days. Today, pick whichever feels more powerful given the news.

After the poem or quote, write a single transitional sentence — no more than one — that names the 2 or 3 biggest themes in today's briefing. This sentence should feel like a breath before the reader dives in.

Return ONLY valid JSON in this exact format, no markdown fences, no explanation:
{
  "type": "poem",
  "content": "the full poem text with line breaks as \\n",
  "attribution": "leave blank if original poem, or author name if quote",
  "bridge": "one sentence naming today's biggest themes"
}
`.trim()

const PROMPT_BIG = () => `
Today is ${todayStr()}.

You are the lead writer for Hermes, a deeply contextual morning briefing read by Jack — a premed student, ER technician, EMT, swing trader, and entrepreneur in Los Angeles. Jack is sharp and curious but may lack background on many global stories. He leans liberal but explicitly wants neutral, fact-based journalism that lets him form his own opinions rather than having opinions handed to him.

Search the web across at least 6–8 different sources and identify the 3 most significant stories happening in the world RIGHT NOW today. Prioritize genuine global weight: major geopolitical events, economic shifts that affect millions, significant policy decisions, humanitarian crises, scientific breakthroughs with real consequences.

For each story, write a long-form original piece — not a summary, not bullet points, but a real article. Think New Yorker meets Foreign Affairs in terms of depth and prose quality. Write in flowing paragraphs throughout. No bullet points, no numbered lists, anywhere.

Each article must include:

A strong opening paragraph that grounds the reader in the scene — something specific and vivid that makes the story feel real and immediate.

A section explaining WHO the key players are, what each side actually wants, and what their stated motivations are. Present every perspective fairly. Use framing like "Iran argues that..." and "The United States contends that..." rather than implying one side is correct or framing one as a villain. Both sides in any conflict have reasons they believe in.

A full factual account of WHAT happened — with dates, names, and specifics where available.

HISTORICAL BACKGROUND — this is essential. Assume Jack doesn't know the backstory. How did we get here? What happened in the months and years leading up to this moment that makes it make sense? Who are the historical actors and what decisions brought us to this point? Write this as narrative, not a timeline.

WHY THIS MATTERS — walk through the immediate consequences and then the second and third-order effects. What happens to oil prices, to other countries, to ordinary people, to long-term geopolitics? Think in systems.

A "Medicine & Health" note at the end of the article connecting this story to healthcare — even if the story isn't medical. Oil prices affect hospital supply chains and ambulance costs. Wars create trauma surges and destroy healthcare infrastructure. Political instability affects vaccination programs. Find the connection and make it real for a future physician.

A "What to Watch" closing — 2 or 3 specific, concrete things Jack should track in the coming days and weeks to follow this story.

Each article should be 700–950 words. Write everything in paragraph form. Politically neutral framing throughout.

Also extract location data for each story for the interactive globe. Use ISO 3166-1 alpha-3 country codes (USA, IRN, RUS, CHN, GBR, etc.).

Return ONLY valid JSON in this exact format, no markdown fences, no explanation before or after:
{
  "stories": [
    {
      "id": "big-1",
      "headline": "Full compelling headline",
      "subheadline": "One sentence of additional context",
      "readingMinutes": 7,
      "body": "Full article text in markdown paragraphs. Use **bold** for key terms and people on first mention. Separate paragraphs with double newlines.",
      "medicineNote": "How this story connects to healthcare and medicine...",
      "watchFor": ["Specific thing to watch 1", "Specific thing 2", "Specific thing 3"],
      "locations": [
        {"country": "Iran", "countryCode": "IRN", "role": "primary", "lat": 32.4, "lng": 53.7},
        {"country": "United States", "countryCode": "USA", "role": "actor", "lat": 37.1, "lng": -95.7}
      ],
      "connections": [
        {"from": "USA", "to": "IRN", "label": "Naval blockade"}
      ]
    }
  ]
}
`.trim()

const PROMPT_HEALTH = () => `
Today is ${todayStr()}.

You are writing the Healthcare & Medicine section of Hermes for Jack — a premed student applying to medical school, who works as an ER technician and EMT in Los Angeles. Jack wants to genuinely understand the future of medicine and healthcare policy, not just collect talking points. He wants to form real opinions.

Search the web for the 2–3 most significant healthcare, medicine, biotech, or public health stories happening right now. Aim for range: ideally one clinical or scientific development, one healthcare system or policy story, and one forward-looking story about where medicine is heading (AI in care delivery, new treatment paradigms, research breakthroughs, public health trends).

Also search Reddit — specifically r/collapse — for their most recent weekly thread. If there's anything related to health, environment, or public health infrastructure worth including, weave it in. That community surfaces important stories that mainstream outlets undercover.

For each story write 450–650 words in flowing paragraphs — no bullet points, no numbered lists. Each piece should:

Open with why this story matters right now, in concrete terms.

Explain the science or policy in plain but intellectually honest language. Don't oversimplify to the point of distortion. Medicine is complicated and Jack can handle nuance.

Connect it to the broader paradigm shift happening in medicine. The fee-for-service model is under pressure. AI is beginning to do things only physicians could do. Public health infrastructure is being systematically defunded. Precision medicine is changing treatment. Whichever is relevant — make the connection explicit.

Be honest about uncertainty. Medicine is full of "we don't know yet" and "early results are promising but." Jack should learn to sit with that epistemic humility. It will make him a better doctor.

Include an "interview note" at the end — one insight from this story that would be genuinely compelling and original to bring up in a medical school interview. Not a cliché. Something that shows real engagement with the complexity of medicine.

Political neutrality applies fully to healthcare policy debates. There are legitimate arguments across the political spectrum about how to organize a healthcare system, and Jack should be exposed to all of them.

Return ONLY valid JSON in this exact format, no markdown fences:
{
  "stories": [
    {
      "id": "health-1",
      "headline": "Headline",
      "subheadline": "One sentence",
      "readingMinutes": 5,
      "body": "Full article...",
      "interviewNote": "For your med school interviews: ...",
      "locations": [{"country": "United States", "countryCode": "USA", "role": "primary", "lat": 37.1, "lng": -95.7}]
    }
  ]
}
`.trim()

const PROMPT_INNOVATION = () => `
Today is ${todayStr()}.

You are writing the Innovation & Startups section of Hermes for Jack — an entrepreneurially-minded premed student and algorithmic trader in Los Angeles who cares deeply about technology that makes the world genuinely better.

Search for 2 truly exciting recent stories in: healthcare technology, AI or software with real demonstrated impact, climate and clean energy, robotics, or significant scientific discoveries. Filter ruthlessly for signal over noise — avoid funding announcements without substance, avoid hype. Focus on things where something real has actually happened or been demonstrated.

For each story write 400–550 words in flowing paragraphs. Go several layers deep:

What does this company or technology actually do in plain language?

Why does this particular approach matter — what have others tried that didn't work, and why might this work where they failed?

What is the actual problem being solved, and how big is that problem in human terms? Who suffers when this problem isn't solved?

What does the world plausibly look like in 10 years if this succeeds? Be specific and honest — don't be a cheerleader, but do let yourself be genuinely excited if the evidence warrants it.

What are the legitimate concerns or obstacles? Good innovation writing acknowledges what could go wrong.

Return ONLY valid JSON in this exact format, no markdown fences:
{
  "stories": [
    {
      "id": "innovation-1",
      "headline": "Headline",
      "subheadline": "One sentence",
      "readingMinutes": 4,
      "body": "Full article...",
      "locations": []
    }
  ]
}
`.trim()

const PROMPT_GEO = () => `
Today is ${todayStr()}.

You are writing the Geopolitics & Global Economy section of Hermes for Jack — a college student in Los Angeles who is actively trying to understand the world beyond the American bubble. Jack finds that US media often ignores or misrepresents the rest of the world, and he wants to genuinely understand international events.

Search for 2–3 significant international stories — with particular attention to regions that receive less US media coverage: sub-Saharan Africa, Southeast Asia, Central Asia, Latin America, the Balkans, the Pacific Islands. Also check r/collapse's most recent weekly thread for anything globally significant that mainstream outlets may be missing.

For each story write a full dispatch — 550–750 words in flowing paragraphs. This section should feel like reading a thoughtful foreign correspondent who has actually been to these places and understands them.

For any country or conflict that Jack likely doesn't know:

Open with 2–3 paragraphs of genuine historical context. Not a Wikipedia summary — narrative. How did this country get here? What colonial history, Cold War dynamics, internal politics, or economic forces shaped the situation Jack is reading about today? This context is not optional — it is the most important part of understanding international news.

Who are the key figures and factions, and what do they actually want? Present their motivations sympathetically even if their actions are destructive. People in conflict rarely see themselves as villains.

What just happened, specifically, and why now?

How does this event ripple outward — economically, diplomatically, humanitarily? How does a civil conflict in one country affect food prices in another? How does an election in a small country change the calculus for a great power? Think in systems and connections.

What does the United States have to do with this, directly or indirectly? This could be historical (colonialism, Cold War interventions), economic (trade, debt, resource extraction), or current (military presence, sanctions, diplomatic pressure). Be honest about US foreign policy — factually, not ideologically.

Present all political perspectives neutrally. Many international conflicts involve legitimate grievances on multiple sides, and the "good guys vs. bad guys" framing almost never captures reality.

Return ONLY valid JSON in this exact format, no markdown fences:
{
  "stories": [
    {
      "id": "geo-1",
      "headline": "Headline",
      "subheadline": "One sentence",
      "readingMinutes": 6,
      "body": "Full article...",
      "locations": [
        {"country": "Country", "countryCode": "ISO3", "role": "primary", "lat": 0.0, "lng": 0.0}
      ],
      "connections": []
    }
  ]
}
`.trim()

const PROMPT_LOCAL = () => `
Today is ${todayStr()}.

You are writing the Los Angeles & Southern California section of Hermes for Jack, who lives in the Claremont area of Los Angeles.

Search for 2–3 significant recent local stories covering Greater LA and SoCal. Look for: major political developments (LA mayoral race, California governor's race, state legislature), housing and infrastructure news, environmental or weather developments, anything meaningfully affecting daily life in the region, notable crime or public safety developments that have broader implications.

For each write 200–300 words in flowing prose paragraphs. Be direct and grounded — Jack wants to know what's actually happening in his city, not a press release.

Return ONLY valid JSON in this exact format, no markdown fences:
{
  "stories": [
    {
      "id": "local-1",
      "headline": "Headline",
      "subheadline": "One sentence",
      "readingMinutes": 2,
      "body": "Article...",
      "locations": [{"country": "United States", "countryCode": "USA", "role": "primary", "lat": 34.05, "lng": -118.24}]
    }
  ]
}
`.trim()

// ─────────────────────────────────────────────────────────────────
// CLAUDE CALLER
// ─────────────────────────────────────────────────────────────────

async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    tools: [{ type: "web_search_20250305", name: "web_search" }] as any,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('\n')
    .trim()

  // Extract JSON even if model adds surrounding text
  const jsonMatch = text.match(/{[\s\S]*}/)
  if (jsonMatch) return jsonMatch[0].trim()
  // Strip markdown fences
  return text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()
}

async function runSection<T>(label: string, prompt: string, maxTokens: number): Promise<T> {
  console.log(`Hermes: generating ${label}...`)
  const start = Date.now()
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callClaude(prompt, maxTokens)
      const parsed = JSON.parse(raw) as T
      console.log(`Hermes: ${label} done in ${((Date.now() - start) / 1000).toFixed(1)}s`)
      return parsed
    } catch (err) {
      console.error(`Hermes: ${label} attempt ${attempt} failed:`, err)
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, 3000 * attempt))
    }
  }
  throw new Error(`${label} failed after 3 attempts`)
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export async function generateBriefing(): Promise<Briefing> {
  const date = new Date().toISOString().split('T')[0]
  console.log(`\nHermes: starting full briefing generation for ${date}`)
  const totalStart = Date.now()

  // Run all sections sequentially (each does its own web searches)
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  const opening = await runSection<Opening>('opening', PROMPT_OPENING(), 600)
  await sleep(20000)
  const bigResult = await runSection<{ stories: Story[] }>('big stories', PROMPT_BIG(), 6000)
  const healthResult = await runSection<{ stories: Story[] }>('healthcare', PROMPT_HEALTH(), 4000)
  const innovationResult = await runSection<{ stories: Story[] }>('innovation', PROMPT_INNOVATION(), 3500)
  const geoResult = await runSection<{ stories: Story[] }>('geopolitics', PROMPT_GEO(), 5000)
  const localResult = await runSection<{ stories: Story[] }>('local', PROMPT_LOCAL(), 2000)

  // Collect globe data
  const allLocations: GlobeLocation[] = []
  const allConnections: GlobeConnection[] = []
  const seenCodes = new Set<string>()

  for (const story of [
    ...bigResult.stories,
    ...geoResult.stories,
    ...healthResult.stories,
  ]) {
    for (const loc of story.locations || []) {
      if (!seenCodes.has(loc.countryCode)) {
        allLocations.push(loc)
        seenCodes.add(loc.countryCode)
      }
    }
    for (const conn of story.connections || []) {
      allConnections.push(conn)
    }
  }

  const briefing: Briefing = {
    date,
    generatedAt: new Date().toISOString(),
    opening,
    sections: {
      big: bigResult.stories || [],
      health: healthResult.stories || [],
      innovation: innovationResult.stories || [],
      geo: geoResult.stories || [],
      local: localResult.stories || [],
    },
    globe: { locations: allLocations, connections: allConnections },
  }

  const totalTime = ((Date.now() - totalStart) / 1000 / 60).toFixed(1)
  console.log(`Hermes: briefing complete in ${totalTime} minutes`)
  return briefing
}
// fixed
