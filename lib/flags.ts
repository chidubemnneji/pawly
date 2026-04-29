/**
 * Pawly Feature Flag System
 *
 * A lightweight LaunchDarkly-style flag evaluator.
 * Flags are stored in Postgres and evaluated per-user at request time.
 *
 * Evaluation order (mirrors LaunchDarkly's targeting rules):
 *   1. Per-user override (FlagOverride table) — always wins
 *   2. Global flag enabled + rolloutPct — deterministic hash so the same
 *      user always gets the same bucket (no flicker)
 *   3. Default: false
 *
 * Usage:
 *   import { getFlags, isEnabled } from '@/lib/flags'
 *
 *   // Server component / route handler
 *   const flags = await getFlags(userId)
 *   if (flags['ai-chat']) { ... }
 *
 *   // Or single flag check
 *   if (await isEnabled('multi-dog', userId)) { ... }
 */

import { db } from './db'

// The canonical flag keys — update this when adding new flags
export const FLAG_KEYS = [
  'ai-chat',           // AI companion chat tab
  'multi-dog',         // Allow more than one dog profile
  'affiliate-cards',   // Insurance + food recommendation cards on Today feed
  'photo-diary',       // Diary / photo timeline tab
  'weight-tracking',   // Weight chart + trend analysis
  'push-notifications',// Web push notification opt-in
  'vet-integration',   // Book vet CTA + clinic sync (Phase 2)
  'breed-insights',    // Expanded breed-specific insight cards
] as const

export type FlagKey = typeof FLAG_KEYS[number]

export type FlagMap = Record<FlagKey, boolean>

/**
 * Deterministic hash — same user always falls in the same bucket.
 * This prevents flag flicker across page loads (same as LD's bucketing).
 */
function hashUserIntoBucket(userId: string, flagKey: string): number {
  const str = `${flagKey}:${userId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // convert to 32-bit int
  }
  return Math.abs(hash) % 100 // 0–99
}

/**
 * Evaluate all flags for a user in a single DB round-trip.
 * Returns a flat map of flag key → boolean.
 */
export async function getFlags(userId: string | undefined): Promise<FlagMap> {
  const result = {} as FlagMap

  // Default everything to false
  for (const key of FLAG_KEYS) {
    result[key] = false
  }

  try {
    // Single query: all flags + this user's overrides
    const flags = await db.featureFlag.findMany({
      include: {
        overrides: userId
          ? { where: { userId } }
          : false,
      },
    })

    for (const flag of flags) {
      if (!FLAG_KEYS.includes(flag.key as FlagKey)) continue

      const override = userId
        ? (flag.overrides as { enabled: boolean }[] | undefined)?.[0]
        : undefined

      if (override !== undefined) {
        // Per-user override wins
        result[flag.key as FlagKey] = override.enabled
      } else if (flag.enabled) {
        if (flag.rolloutPct >= 100) {
          result[flag.key as FlagKey] = true
        } else if (flag.rolloutPct > 0 && userId) {
          // Percentage rollout — deterministic bucketing
          const bucket = hashUserIntoBucket(userId, flag.key)
          result[flag.key as FlagKey] = bucket < flag.rolloutPct
        }
        // rolloutPct === 0 with enabled === true = flag on but rolled out to nobody yet
      }
    }
  } catch (err) {
    // If DB is unavailable, return safe defaults (all false)
    console.error('[flags] evaluation error — using defaults:', err)
  }

  return result
}

/**
 * Evaluate a single flag. Convenience wrapper for route handlers.
 */
export async function isEnabled(key: FlagKey, userId?: string): Promise<boolean> {
  const flags = await getFlags(userId)
  return flags[key]
}

/**
 * Seed default flags — run once on first deploy or call from migration.
 * Idempotent: uses upsert so safe to re-run.
 */
export async function seedFlags() {
  const defaults: Array<{ key: FlagKey; description: string; enabled: boolean; rolloutPct: number }> = [
    { key: 'ai-chat',            description: 'AI companion chat tab',                      enabled: true,  rolloutPct: 100 },
    { key: 'multi-dog',          description: 'Allow more than one dog profile',             enabled: false, rolloutPct: 0   },
    { key: 'affiliate-cards',    description: 'Insurance + food affiliate cards on Today',   enabled: false, rolloutPct: 0   },
    { key: 'photo-diary',        description: 'Photo diary + growth timeline tab',           enabled: false, rolloutPct: 0   },
    { key: 'weight-tracking',    description: 'Weight chart and trend analysis',             enabled: true,  rolloutPct: 100 },
    { key: 'push-notifications', description: 'Web push notification opt-in',               enabled: true,  rolloutPct: 100 },
    { key: 'vet-integration',    description: 'Vet booking CTA and clinic sync',            enabled: false, rolloutPct: 0   },
    { key: 'breed-insights',     description: 'Expanded breed-specific insight cards',      enabled: true,  rolloutPct: 100 },
  ]

  for (const flag of defaults) {
    await db.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: { description: flag.description }, // don't overwrite enabled/rollout on re-seed
    })
  }

  console.log('[flags] seeded', defaults.length, 'flags')
}
