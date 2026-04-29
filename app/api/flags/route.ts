/**
 * GET /api/flags
 * Returns the evaluated flag map for the current user.
 * Used by client components to conditionally render features.
 *
 * POST /api/flags  (admin only — demo mode)
 * Toggle a flag on/off globally. In production this would be
 * gated behind an admin role check.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFlags, FLAG_KEYS } from '@/lib/flags'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id

  const flags = await getFlags(userId)
  return NextResponse.json(flags)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { key, enabled, rolloutPct, userId: targetUserId } = body

  if (!FLAG_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Unknown flag key' }, { status: 400 })
  }

  // Per-user override
  if (targetUserId) {
    const flag = await db.featureFlag.findUnique({ where: { key } })
    if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 })

    await db.flagOverride.upsert({
      where: { flagId_userId: { flagId: flag.id, userId: targetUserId } },
      create: { flagId: flag.id, userId: targetUserId, enabled },
      update: { enabled },
    })
    return NextResponse.json({ ok: true, mode: 'override', key, userId: targetUserId, enabled })
  }

  // Global update
  const update: any = {}
  if (typeof enabled === 'boolean') update.enabled = enabled
  if (typeof rolloutPct === 'number') update.rolloutPct = Math.min(100, Math.max(0, rolloutPct))

  const flag = await db.featureFlag.update({ where: { key }, data: update })
  return NextResponse.json({ ok: true, mode: 'global', key, enabled: flag.enabled, rolloutPct: flag.rolloutPct })
}
