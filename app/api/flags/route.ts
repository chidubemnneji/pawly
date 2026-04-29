/**
 * GET /api/flags
 * Returns evaluated flag map for the current user + their detected geo context.
 *
 * Response: { flags: FlagMap, geo: { country, region } }
 *
 * POST /api/flags
 * Toggle a flag globally or set a per-user override.
 * Body: { key, enabled?, rolloutPct?, userId?, countries? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFlags, FLAG_KEYS } from '@/lib/flags'
import { getGeoContext } from '@/lib/geo'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id

  const [flags, geo] = await Promise.all([
    getFlags(userId, req),
    getGeoContext(req),
  ])

  return NextResponse.json({
    flags,
    geo: { country: geo.country, region: geo.region },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { key, enabled, rolloutPct, userId: targetUserId, countries } = body

  if (!FLAG_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Unknown flag key' }, { status: 400 })
  }

  // Per-user override
  if (targetUserId !== undefined) {
    const flag = await db.featureFlag.findUnique({ where: { key } })
    if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 })

    await db.flagOverride.upsert({
      where: { flagId_userId: { flagId: flag.id, userId: targetUserId } },
      create: { flagId: flag.id, userId: targetUserId, enabled },
      update: { enabled },
    })
    return NextResponse.json({ ok: true, mode: 'user-override', key, userId: targetUserId, enabled })
  }

  // Global update
  const update: Record<string, unknown> = {}
  if (typeof enabled === 'boolean') update.enabled = enabled
  if (typeof rolloutPct === 'number') update.rolloutPct = Math.min(100, Math.max(0, rolloutPct))
  if (Array.isArray(countries)) update.countries = countries

  const flag = await db.featureFlag.update({ where: { key }, data: update })
  return NextResponse.json({
    ok: true,
    mode: 'global',
    key,
    enabled: flag.enabled,
    rolloutPct: flag.rolloutPct,
    countries: flag.countries,
  })
}
