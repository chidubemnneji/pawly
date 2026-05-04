/**
 * Pawly — AI Model Configuration
 *
 * Each AI model in Pawly is independently versioned and rolled out via
 * feature flags. This mirrors the pattern LaunchDarkly customers use for
 * AI workload governance:
 *
 *   1. Ship a new model version behind a flag at 0% rollout
 *   2. Ramp to 10% → watch error rates and latency
 *   3. Promote to 100% or roll back instantly — no redeployment
 *   4. Per-user overrides let beta testers get new models early
 *
 * Three models, three independent rollout lifecycles:
 *
 *   REASONING  — main chat responses (claude-sonnet-4-6)
 *                Flag: ai-reasoning-model
 *                Governs: response quality, tone, accuracy
 *
 *   TRIAGE     — emergency keyword classifier (claude-haiku-4-5)
 *                Flag: ai-triage-model
 *                Governs: emergency detection speed + cost
 *
 *   VISION     — photo / image analysis (claude-sonnet-4-6 with vision)
 *                Flag: ai-vision-model + ai-vision-enabled
 *                Governs: photo analysis availability + model choice
 *
 * Each flag stores the model string (e.g. "claude-sonnet-4-6") so updating
 * a model is a flag value change in the dashboard — not a code change.
 */

import { getFlags } from './flags'

// Stable fallback model IDs — used when flags are unavailable
export const MODEL_DEFAULTS = {
  reasoning: 'claude-sonnet-4-6',
  triage:    'claude-haiku-4-5-20251001',
  vision:    'claude-sonnet-4-6',         // vision uses same model, different prompt
} as const

export type ModelConfig = {
  reasoning: string   // model for main chat responses
  triage: string      // model for emergency triage classification
  vision: string      // model for image analysis
  visionEnabled: boolean // whether photo analysis is available to this user
}

/**
 * Resolves the model config for a specific user.
 * Each model is evaluated independently — a user can be on the new
 * reasoning model but still on the stable triage model.
 */
export async function getModelConfig(
  userId?: string,
  req?: Request
): Promise<ModelConfig> {
  try {
    const flags = await getFlags(userId, req as any)

    return {
      // Flag stores the model string — change model by updating flag value in dashboard
      // Falls back to stable default if flag is off or unavailable
      reasoning:    String(flags['ai-reasoning-model'] || MODEL_DEFAULTS.reasoning),
      triage:       String(flags['ai-triage-model']    || MODEL_DEFAULTS.triage),
      vision:       String(flags['ai-vision-model']    || MODEL_DEFAULTS.vision),
      visionEnabled: Boolean(flags['ai-vision-enabled']),
    }
  } catch {
    // If flag evaluation fails, serve stable defaults — never break AI
    return {
      reasoning:    MODEL_DEFAULTS.reasoning,
      triage:       MODEL_DEFAULTS.triage,
      vision:       MODEL_DEFAULTS.vision,
      visionEnabled: false,
    }
  }
}
