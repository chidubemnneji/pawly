/**
 * Pawly Geo Detection
 *
 * Extracts the client's country from Railway's x-forwarded-for header
 * and resolves it via the ip-api.com free tier (no API key needed,
 * 45 req/min limit — fine for server-side flag evaluation which is cached).
 *
 * In production, swap ip-api.com for a self-hosted MaxMind GeoLite2
 * lookup (zero latency, no rate limits, no external dependency).
 *
 * Country groups used in feature flag targeting:
 *
 *  UK_IE    — GB, IE
 *  EU       — DE, FR, NL, BE, SE, NO, DK, FI, AT, CH, ES, IT, PT, PL
 *  US       — US
 *  APAC     — AU, NZ, SG, JP, KR, HK, TW, IN
 */

import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

export type CountryCode = string // ISO 3166-1 alpha-2

export type GeoRegion = 'UK_IE' | 'EU' | 'US' | 'APAC' | 'OTHER'

const REGIONS: Record<GeoRegion, CountryCode[]> = {
  UK_IE: ['GB', 'IE'],
  EU:    ['DE', 'FR', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'AT', 'CH', 'ES', 'IT', 'PT', 'PL', 'CZ', 'HU', 'RO', 'GR'],
  US:    ['US'],
  APAC:  ['AU', 'NZ', 'SG', 'JP', 'KR', 'HK', 'TW', 'IN', 'MY', 'PH', 'TH', 'ID'],
  OTHER: [],
}

export function getRegion(country: CountryCode): GeoRegion {
  for (const [region, codes] of Object.entries(REGIONS) as [GeoRegion, string[]][]) {
    if (region === 'OTHER') continue
    if (codes.includes(country.toUpperCase())) return region
  }
  return 'OTHER'
}

// Simple in-memory cache — country lookup per IP, TTL 10 min
const geoCache = new Map<string, { country: string; expiresAt: number }>()

async function resolveCountryFromIp(ip: string): Promise<CountryCode> {
  // Skip private/loopback IPs (local dev)
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return process.env.DEV_GEO_COUNTRY || 'GB' // default to GB in local dev
  }

  const cached = geoCache.get(ip)
  if (cached && cached.expiresAt > Date.now()) return cached.country

  try {
    // ip-api.com: free, no API key, 45 req/min
    // In production replace with MaxMind GeoLite2 local DB for zero latency
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(800), // 800ms max — fast fail
    })
    if (!res.ok) return 'GB'
    const data = await res.json()
    const country = data.countryCode || 'GB'
    geoCache.set(ip, { country, expiresAt: Date.now() + 10 * 60 * 1000 }) // 10 min TTL
    return country
  } catch {
    return 'GB' // safe fallback
  }
}

/**
 * Extract client IP from Railway's x-forwarded-for header.
 * Railway sets this automatically — the first IP in the chain is the client.
 */
export async function getClientIp(req?: NextRequest): Promise<string> {
  try {
    // In route handlers we have the request object
    if (req) {
      const forwarded = req.headers.get('x-forwarded-for')
      if (forwarded) return forwarded.split(',')[0].trim()
      return req.headers.get('x-real-ip') || '127.0.0.1'
    }
    // In server components we use next/headers
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return headersList.get('x-real-ip') || '127.0.0.1'
  } catch {
    return '127.0.0.1'
  }
}

/**
 * Main export — resolves country + region for a given request.
 * Cached per-IP so repeated calls in the same request cycle are free.
 */
export async function getGeoContext(req?: NextRequest): Promise<{
  ip: string
  country: CountryCode
  region: GeoRegion
}> {
  const ip = await getClientIp(req)
  const country = await resolveCountryFromIp(ip)
  const region = getRegion(country)
  return { ip, country, region }
}
