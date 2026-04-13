import Redis from 'ioredis'
import type { Briefing } from './types'

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
    _redis.on('error', (err) => console.error('Redis error:', err))
  }
  return _redis
}

const TTL_90_DAYS = 60 * 60 * 24 * 90

export async function saveBriefing(briefing: Briefing): Promise<void> {
  const redis = getRedis()
  const key = `briefing:${briefing.date}`
  await redis.set(key, JSON.stringify(briefing), 'EX', TTL_90_DAYS)
  await redis.set('briefing:latest', briefing.date)
  console.log(`Hermes: saved briefing for ${briefing.date}`)
}

export async function getLatestBriefing(): Promise<Briefing | null> {
  const redis = getRedis()
  const latestDate = await redis.get('briefing:latest')
  if (!latestDate) return null
  const raw = await redis.get(`briefing:${latestDate}`)
  return raw ? JSON.parse(raw) : null
}

export async function getBriefingByDate(date: string): Promise<Briefing | null> {
  const redis = getRedis()
  const raw = await redis.get(`briefing:${date}`)
  return raw ? JSON.parse(raw) : null
}

export async function saveEmailSubscriber(email: string): Promise<void> {
  const redis = getRedis()
  await redis.sadd('subscribers:email', email)
}

export async function removeEmailSubscriber(email: string): Promise<void> {
  const redis = getRedis()
  await redis.srem('subscribers:email', email)
}

export async function getAllEmailSubscribers(): Promise<string[]> {
  const redis = getRedis()
  return redis.smembers('subscribers:email')
}

export async function savePushSubscription(sub: object): Promise<void> {
  const redis = getRedis()
  const id = Buffer.from(JSON.stringify(sub)).toString('base64').slice(0, 40)
  await redis.set(`push:${id}`, JSON.stringify(sub), 'EX', TTL_90_DAYS)
}

export async function getAllPushSubscriptions(): Promise<object[]> {
  const redis = getRedis()
  const keys = await redis.keys('push:*')
  if (!keys.length) return []
  const vals = await Promise.all(keys.map(k => redis.get(k)))
  return vals.filter(Boolean).map(v => JSON.parse(v!))
}
