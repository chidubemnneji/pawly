/**
 * POST /api/vision
 *
 * Analyse a photo of a dog. Gated behind the ai-vision-enabled feature flag.
 * The vision model is independently versioned via the ai-vision-model flag -
 * so the model can be updated or rolled back without changing the reasoning
 * or triage models.
 *
 * This is the per-model rollout governance story:
 *   - ai-reasoning-model: controls chat quality
 *   - ai-triage-model:    controls emergency detection
 *   - ai-vision-model:    controls photo analysis
 *
 * Each can be at a different rollout % and rolled back independently.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { analysePhoto } from '@/lib/ai'
import { getModelConfig } from '@/lib/aiModels'

const visionSchema = z.object({
  dogId: z.string(),
  imageBase64: z.string().min(1),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  question: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Resolve model config - check if vision is enabled for this user
    const modelConfig = await getModelConfig(userId, req as any)

    if (!modelConfig.visionEnabled) {
      return NextResponse.json(
        {
          error: 'feature_disabled',
          message: 'Photo analysis is not yet available. Check back soon.',
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { dogId, imageBase64, mediaType, question } = visionSchema.parse(body)

    const dog = await db.dog.findFirst({ where: { id: dogId, userId } })
    if (!dog) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const response = await analysePhoto(
      imageBase64,
      mediaType,
      dog,
      question,
      modelConfig.vision,  // flag-controlled model - can roll back instantly
    )

    return NextResponse.json({
      ...response,
      _meta: { model: modelConfig.vision },
    })
  } catch (err) {
    console.error('[vision]', err)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
