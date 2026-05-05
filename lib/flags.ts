/**
 * Pawly Feature Flag System
 *
 * A LaunchDarkly-style flag evaluator with geo-targeting support.
 *
 * Evaluation order (mirrors LD's targeting rules):
 *   1. Per-user override (FlagOverride table) — always wins
 *   2. Geo gate — if flag.countries is non-empty, client country must be in list
 *   3. Global enabled + rolloutPct — deterministic hash bucketing (no flicker)
 *   4. Default: false
 *
 * Geo detection: client IP extracted from Railway's x-forwarded-for header,
 * resolved to country via ip-api.com (free tier) with 10-min in-process cache.
 * Replace with MaxMind GeoLite2 local DB in production for zero latency.
 *
 * Usage:
 *   import { getFlags, isEnabled } from '@/lib/flags'
 *
 *   const flags = await getFlags(userId, req)
 *   if (flags['ai-chat']) { ... }
 *
 *   if (await isEnabled('leptospirosis-reminder', userId, req)) { ... }
 */

import { NextRequest } from 'next/server'
import { db } from './db'
import { getGeoContext, type CountryCode } from './geo'

export const FLAG_KEYS = [
  // Core features
  'ai-chat',                  // AI companion chat — available globally
  'multi-dog',                // Multiple dog profiles — Phase 2
  'weight-tracking',          // Weight chart + trends — available globally
  'push-notifications',       // Web push opt-in — available globally
  'breed-insights',           // Expanded breed cards — available globally
  'photo-diary',              // Photo timeline — Phase 2

  // Geo-gated: UK / IE
  'leptospirosis-reminder',   // Core vaccine in UK/IE/EU, optional elsewhere
  'vet-integration',          // Vet booking — UK/IE first

  // Geo-gated: US
  'rabies-annual-reminder',   // Some US states require annual rabies boosters
  'us-insurance-affiliate',   // Lemonade, Trupanion — US partners

  // Geo-gated: UK + US
  'affiliate-pet-insurance',  // Pet insurance comparison cards

  // Geo-gated: APAC
  'heartworm-reminder',       // Critical in AU/NZ/SG — less common in UK/EU
  'apac-insurance-affiliate', // AU/NZ-specific insurance partners

  // Geo-gated: EU
  'eu-pet-passport',          // EU pet passport documentation guidance
] as const

export type FlagKey = typeof FLAG_KEYS[number]
export type FlagMap = Record<FlagKey, boolean | string>

// Deterministic bucketing — same user always in same bucket (no flicker)
function hashUserIntoBucket(userId: string, flagKey: string): number {
  const str = `${flagKey}:${userId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash) % 100
}

function passesGeoGate(flagCountries: string[], clientCountry: CountryCode): boolean {
  if (!flagCountries || flagCountries.length === 0) return true // no geo gate
  return flagCountries.includes(clientCountry.toUpperCase())
}

export async function getFlags(
  userId: string | undefined,
  req?: NextRequest
): Promise<FlagMap> {
  const result = {} as FlagMap
  for (const key of FLAG_KEYS) result[key] = false

  // Model flags default to their stable model IDs
  result['ai-reasoning-model'] = 'claude-sonnet-4-6'
  result['ai-triage-model'] = 'claude-haiku-4-5-20251001'
  result['ai-vision-model'] = 'claude-sonnet-4-6'

  // Resolve geo context once — cached per IP
  const geo = await getGeoContext(req).catch(() => ({ country: 'GB', region: 'UK_IE' as const, ip: '' }))

  try {
    const flags = await db.featureFlag.findMany({
      include: {
        overrides: userId ? { where: { userId } } : false,
      },
    })

    for (const flag of flags) {
      if (!FLAG_KEYS.includes(flag.key as FlagKey)) continue

      const override = userId
        ? (flag.overrides as { enabled: boolean }[] | undefined)?.[0]
        : undefined

      if (override !== undefined) {
        // Per-user override always wins — bypasses geo gate too
        result[flag.key as FlagKey] = override.enabled
        continue
      }

      // String-valued flags (model IDs) — return the string when flag is enabled
      if (flag.stringValue && flag.enabled) {
        result[flag.key as FlagKey] = flag.stringValue
        continue
      }

      // Geo gate — must pass before rollout is evaluated
      if (!passesGeoGate(flag.countries, geo.country)) {
        result[flag.key as FlagKey] = false
        continue
      }

      // Rollout evaluation
      if (!flag.enabled) continue

      if (flag.rolloutPct >= 100) {
        result[flag.key as FlagKey] = true
      } else if (flag.rolloutPct > 0 && userId) {
        const bucket = hashUserIntoBucket(userId, flag.key)
        result[flag.key as FlagKey] = bucket < flag.rolloutPct
      }
    }
  } catch (err) {
    console.error('[flags] evaluation error — using safe defaults:', err)
  }

  return result
}

export async function isEnabled(
  key: FlagKey,
  userId?: string,
  req?: NextRequest
): Promise<boolean> {
  const flags = await getFlags(userId, req)
  return flags[key]
}

// Country lists by region
const COUNTRIES = {
  UK_IE: ['GB', 'IE'],
  EU:    ['DE', 'FR', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'AT', 'CH', 'ES', 'IT', 'PT', 'PL', 'CZ', 'HU', 'RO', 'GR'],
  US:    ['US'],
  APAC:  ['AU', 'NZ', 'SG', 'JP', 'KR', 'HK', 'TW', 'IN', 'MY', 'PH'],
}

export async function seedFlags() {
  const defaults: Array<{
    key: FlagKey
    description: string
    enabled: boolean
    rolloutPct: number
    countries: string[]
  }> = [
    // Global flags
    { key: 'ai-chat',               description: 'AI companion chat',                         enabled: true,  rolloutPct: 100, countries: [] },
    { key: 'multi-dog',             description: 'Multiple dog profiles',                      enabled: false, rolloutPct: 0,   countries: [] },
    { key: 'weight-tracking',       description: 'Weight chart and trend analysis',             enabled: true,  rolloutPct: 100, countries: [] },
    { key: 'push-notifications',    description: 'Web push notification opt-in',               enabled: true,  rolloutPct: 100, countries: [] },
    { key: 'breed-insights',        description: 'Expanded breed-specific insight cards',      enabled: true,  rolloutPct: 100, countries: [] },
    { key: 'photo-diary',           description: 'Photo diary and growth timeline',            enabled: false, rolloutPct: 0,   countries: [] },

    // UK / IE
    { key: 'leptospirosis-reminder', description: 'Leptospirosis as a core vaccine (UK/IE)',  enabled: true,  rolloutPct: 100, countries: [...COUNTRIES.UK_IE, ...COUNTRIES.EU] },
    { key: 'vet-integration',        description: 'Vet booking CTA — UK/IE first',            enabled: false, rolloutPct: 0,   countries: COUNTRIES.UK_IE },

    // US
    { key: 'rabies-annual-reminder', description: 'Annual rabies reminder (state-dependent)',  enabled: true,  rolloutPct: 100, countries: COUNTRIES.US },
    { key: 'us-insurance-affiliate', description: 'Lemonade/Trupanion affiliate cards',       enabled: false, rolloutPct: 0,   countries: COUNTRIES.US },

    // UK + US
    { key: 'affiliate-pet-insurance', description: 'Pet insurance comparison — UK + US',      enabled: false, rolloutPct: 0,   countries: [...COUNTRIES.UK_IE, ...COUNTRIES.US] },

    // APAC
    { key: 'heartworm-reminder',     description: 'Heartworm prevention reminder (APAC)',      enabled: true,  rolloutPct: 100, countries: COUNTRIES.APAC },
    { key: 'apac-insurance-affiliate', description: 'AU/NZ insurance affiliate cards',        enabled: false, rolloutPct: 0,   countries: COUNTRIES.APAC },

    // EU
    { key: 'eu-pet-passport',        description: 'EU pet passport documentation guidance',   enabled: true,  rolloutPct: 100, countries: COUNTRIES.EU },

    // AI model governance flags — stringValue stores the model ID
    // To upgrade a model: update stringValue in the DB or via /api/flags
    // To roll back: set enabled: false → falls back to MODEL_DEFAULTS in aiModels.ts
    { key: 'ai-reasoning-model',    description: 'Reasoning model ID for chat responses',         enabled: true,  rolloutPct: 100, countries: [], stringValue: 'claude-sonnet-4-6' },
    { key: 'ai-triage-model',       description: 'Triage classifier model ID',                    enabled: true,  rolloutPct: 100, countries: [], stringValue: 'claude-haiku-4-5-20251001' },
    { key: 'ai-vision-model',       description: 'Vision model ID for photo analysis',            enabled: true,  rolloutPct: 100, countries: [], stringValue: 'claude-sonnet-4-6' },
    { key: 'ai-vision-enabled',     description: 'Enable photo analysis feature',                 enabled: true,  rolloutPct: 100, countries: [] },
  ]

  for (const flag of defaults) {
    await db.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: { description: flag.description, countries: flag.countries },
    })
  }

  console.log('[flags] seeded', defaults.length, 'flags across UK/IE, US, APAC, EU')
}
