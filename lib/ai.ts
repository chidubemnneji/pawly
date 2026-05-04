import Anthropic from '@anthropic-ai/sdk';
import type { Dog } from '@prisma/client';
import { ageFromDOB, lifeStage } from './utils';
import { findBreed } from './breeds';

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Model IDs are now controlled via feature flags (lib/aiModels.ts)
// Default values here are fallbacks only — flags override at runtime
const MODEL_MAIN_DEFAULT = 'claude-sonnet-4-6';
const MODEL_TRIAGE_DEFAULT = 'claude-haiku-4-5-20251001';
const MODEL_VISION_DEFAULT = 'claude-sonnet-4-6';

const EMERGENCY_KEYWORDS = [
  'seizure', 'fitting', 'collapsed', 'unconscious', 'choking',
  'bloated', 'distended', 'swollen belly', 'retching nothing',
  'blood in vomit', 'vomiting blood', 'blood in stool', 'bleeding heavily',
  'breathing problems', "can't breathe", 'difficulty breathing',
  'antifreeze', 'chocolate', 'grapes', 'xylitol', 'rat poison', 'ibuprofen',
  'hit by car', 'ran over', 'broken bone', 'compound fracture',
  'unresponsive', "won't wake", 'pale gums', 'blue gums', 'white gums',
];

export type ChatResponse = {
  text: string;
  severity: 'NORMAL' | 'URGENT';
  followUps: string[];
};

/**
 * Build a system prompt that injects everything the model needs to know
 * about THIS specific dog. This is the moat: ChatGPT can answer generic
 * "is X kg healthy for a Cockapoo" — only Pawly can answer "is Bella healthy."
 */
function buildSystemPrompt(dog: Dog): string {
  const breed = findBreed(dog.breed);
  const stage = lifeStage(dog.dob);
  const age = ageFromDOB(dog.dob);

  return `You are Pawly, a calm, knowledgeable AI care companion for dog owners. You are NOT a vet. You give breed-aware, age-aware, profile-aware guidance grounded in standard veterinary best practices for the UK and US markets.

## The dog you're advising on
- Name: ${dog.name}
- Breed: ${dog.breed ?? 'Unknown'}${breed ? ` (${breed.group} group)` : ''}
- Age: ${age} (${stage})
- Sex: ${dog.sex === 'F' ? 'Female' : dog.sex === 'M' ? 'Male' : 'Unknown'}${dog.neutered ? ', neutered/spayed' : dog.neutered === false ? ', intact' : ''}
- Weight: ${dog.weight ? `${dog.weight} ${dog.weightUnit.toLowerCase()}` : 'Not recorded'}${breed ? ` (typical range: ${breed.weightKg[0]}–${breed.weightKg[1]} kg)` : ''}
- Conditions: ${dog.conditions.length ? dog.conditions.join(', ') : 'None recorded'}
- Allergies: ${dog.allergies.length ? dog.allergies.join(', ') : 'None recorded'}
- Current food: ${dog.food ?? 'Not recorded'}
- Daily exercise target: ${dog.exerciseMins} min, ${dog.walkStyle.toLowerCase().replace('_', '-')} walks
${breed ? `\n## Breed notes for ${breed.name}\n- Typical exercise need: ${breed.exercise}\n- Common traits: ${breed.traits}\n- Watch for: ${breed.watchFor}` : ''}

## Style rules
- Use the dog's name, ${dog.name}, naturally throughout — not in every sentence.
- Be warm and concise. Real paragraphs, not bullet lists, unless steps require ordering.
- Reference the dog's actual data when it's relevant. Don't be generic.
- For anything medical-adjacent: end with "I'd check with your vet" — never give specific drug doses.
- If the user describes signs of an emergency, stop everything and tell them to contact a vet immediately. Do not try to help further.
- Don't recommend products by brand unless asked.
- Never claim to diagnose. Never claim certainty about a medical condition.

## Length
2–5 sentences for simple questions. Up to 2 short paragraphs for detailed ones. No essays.`;
}

/**
 * runTriage — quick keyword classifier (cheap), augmented by Haiku if available.
 * Returns true if the user's message describes a likely emergency.
 */
async function runTriage(userMessage: string, triageModel = MODEL_TRIAGE_DEFAULT): Promise<boolean> {
  const lower = userMessage.toLowerCase();
  if (EMERGENCY_KEYWORDS.some((k) => lower.includes(k))) return true;

  if (!client) return false; // No API key — fall back to keyword-only

  // Optional Haiku-based escalation for ambiguous cases (vomiting, lethargy, not eating).
  const ambiguousSignals = ['vomit', 'lethargic', 'not eating', "won't eat", 'limp', 'crying', 'whimper', 'tremor', 'shaking'];
  if (!ambiguousSignals.some((k) => lower.includes(k))) return false;

  try {
    const res = await client.messages.create({
      model: triageModel,
      max_tokens: 8,
      system:
        'You are a veterinary triage classifier. Given a dog owner\'s message, reply with EXACTLY one word: URGENT or NORMAL. URGENT means the dog needs to see a vet within hours, not days. Be conservative — when in doubt, NORMAL.',
      messages: [{ role: 'user', content: userMessage }],
    });
    const block = res.content[0];
    const text = block?.type === 'text' ? block.text.trim().toUpperCase() : '';
    return text.startsWith('URGENT');
  } catch {
    return false;
  }
}

const URGENT_RESPONSE = `That sounds urgent. Please contact your vet — or an emergency clinic if it's out of hours — straight away. Don't wait it out.

If you'd like, I can help you decide what to tell them on the phone.`;

/**
 * runChat — main entry point. Returns a structured response object.
 * If ANTHROPIC_API_KEY isn't set, falls back to a profile-aware mock so the
 * app still feels alive in dev/demo.
 */
export async function runChat(
  dog: Dog,
  userMessage: string,
  history: { role: 'USER' | 'ASSISTANT'; content: string }[],
  modelConfig?: { reasoning?: string; triage?: string }
): Promise<ChatResponse> {
  const reasoningModel = modelConfig?.reasoning || MODEL_MAIN_DEFAULT;
  const triageModel = modelConfig?.triage || MODEL_TRIAGE_DEFAULT;
  const isUrgent = await runTriage(userMessage, triageModel);
  if (isUrgent) {
    return {
      text: URGENT_RESPONSE,
      severity: 'URGENT',
      followUps: ['What should I say to the vet?', 'How do I find an emergency vet?'],
    };
  }

  if (!client) {
    return mockChat(dog, userMessage);
  }

  try {
    const res = await client.messages.create({
      model: reasoningModel,
      max_tokens: 600,
      system: buildSystemPrompt(dog),
      messages: [
        ...history.slice(-10).map((h) => ({
          role: h.role === 'USER' ? ('user' as const) : ('assistant' as const),
          content: h.content,
        })),
        { role: 'user' as const, content: userMessage },
      ],
    });
    const block = res.content[0];
    const text = block?.type === 'text' ? block.text : '';
    return {
      text: text.trim(),
      severity: 'NORMAL',
      followUps: suggestFollowUps(userMessage),
    };
  } catch (err) {
    console.error('[ai] Claude call failed, falling back to mock:', err);
    return mockChat(dog, userMessage);
  }
}

function suggestFollowUps(userMessage: string): string[] {
  const m = userMessage.toLowerCase();
  if (/(weight|fat|portion)/.test(m)) return ['Show me a healthy portion', 'Weighing at home tips'];
  if (/(food|diet|eat)/.test(m)) return ['Safe treats?', 'Switching food slowly'];
  if (/(itch|scratch|skin)/.test(m)) return ['When to see the vet?', 'Mild itching home tips'];
  if (/(train|sit|recall|lead)/.test(m)) return ['Help with recall', 'Stop pulling on lead'];
  return ['Plan my week', 'Tell me about my breed'];
}

/* ---------- Fallback mock (also used in dev without an API key) ---------- */
function mockChat(dog: Dog, userMessage: string): ChatResponse {
  const m = userMessage.toLowerCase();
  const name = dog.name;
  const breed = dog.breed ?? 'mixed-breed';
  const stage = lifeStage(dog.dob);
  const breedData = findBreed(dog.breed);

  if (/(weight|fat|chubby|skinny|thin|heavy)/.test(m)) {
    if (dog.weight && breedData) {
      const [min, max] = breedData.weightKg;
      const w = dog.weight;
      let text;
      if (w < min) text = `${name} is below the typical ${breed} range of ${min}–${max} kg. Worth a quick chat with your vet.`;
      else if (w > max) text = `${name} is a touch above the typical ${breed} range of ${min}–${max} kg. Try reducing portions by 10% for two weeks and re-weighing.`;
      else text = `${name} is ${w} kg — right in the typical ${breed} range of ${min}–${max} kg. Healthy weight!`;
      return { text, severity: 'NORMAL', followUps: ['Show me a healthy portion', 'Weighing at home tips'] };
    }
  }

  if (/(food|diet|eat|portion)/.test(m)) {
    return {
      text: `For an ${stage} ${breed}${dog.weight ? ` at ${dog.weight} kg` : ''}, split daily food across ${dog.feedingTimes.length || 2} meals. Always check the kcal density on the bag — feeding guides vary a lot.`,
      severity: 'NORMAL',
      followUps: ['Safe treats?', 'Switching food slowly'],
    };
  }

  if (/(itch|scratch|allergy)/.test(m)) {
    return {
      text: `Itching is most commonly: parasites (one flea bite can set off itching for weeks), environmental allergies, or food sensitivities. Where on the body is the itching worst? Paws/belly/ears often points to allergies; tail base often points to fleas. If it's been more than a week of regular scratching, I'd see the vet.`,
      severity: 'NORMAL',
      followUps: ['When to see the vet?', 'Mild itching home tips'],
    };
  }

  if (/(train|recall|lead|pull|sit|stay)/.test(m)) {
    const tip = stage === 'puppy'
      ? '3–5 minute sessions, several times a day, end on a win.'
      : 'Use clear markers ("yes" or a clicker the moment they get it right) and high-value rewards.';
    return {
      text: `${tip} For ${name} (${breedData?.traits ?? 'individual personality varies'}), I'd lean into food-rewarded shaping over correction. What command are you working on?`,
      severity: 'NORMAL',
      followUps: ['Help with recall', 'Stop pulling on lead'],
    };
  }

  if (/^(hi|hello|hey)/.test(m) && m.length < 20) {
    return {
      text: `Hi! I'm Pawly's care companion. I know ${name} is a ${stage} ${breed}${dog.weight ? `, ${dog.weight} kg` : ''}. Ask me anything — feeding, training, behaviour, health questions.`,
      severity: 'NORMAL',
      followUps: [`Is ${name} a healthy weight?`, 'What should I work on this week?', `Tell me about ${breed}s`],
    };
  }

  return {
    text: `Good question. For ${name} as a ${stage} ${breed}, the honest answer depends on the specifics — when did this start, how often is it happening, anything else off (appetite, energy, mood)? Tell me a bit more and I can be more useful.`,
    severity: 'NORMAL',
    followUps: ['Plan my week', `Tell me about ${breed}s`],
  };
}

// ── Vision / Photo Analysis ───────────────────────────────────────────────
// Gated behind ai-vision-enabled flag — rolled out independently from chat.
// Uses the same Anthropic client but with image input for analysing photos
// of the dog (skin conditions, body condition score, wound assessment).

export type VisionResponse = {
  text: string
  severity: 'NORMAL' | 'URGENT' | 'UNSUPPORTED'
  observations: string[]  // structured findings from the image
}

/**
 * Analyse a photo of a dog and return structured observations.
 * Model is passed in from flag config — can be updated without redeployment.
 *
 * @param imageBase64 - base64-encoded image data
 * @param mediaType   - image MIME type (image/jpeg, image/png etc)
 * @param dog         - dog profile for personalised context
 * @param userQuestion - optional question about the image
 * @param visionModel  - model ID from flag (default: claude-sonnet-4-6)
 */
export async function analysePhoto(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  dog: Dog,
  userQuestion?: string,
  visionModel = MODEL_VISION_DEFAULT,
): Promise<VisionResponse> {
  if (!client) {
    return {
      text: `Photo analysis isn't available in demo mode. Add an Anthropic API key to enable it.`,
      severity: 'UNSUPPORTED',
      observations: [],
    }
  }

  const prompt = userQuestion
    ? `The owner asks: "${userQuestion}"\n\nPlease analyse this photo of ${dog.name} (${dog.breed ?? 'dog'}) and answer their question, noting any relevant observations.`
    : `Please analyse this photo of ${dog.name} (${dog.breed ?? 'dog'}) and describe what you observe about their physical condition, coat, body condition score, or any visible concerns.`

  const systemPrompt = `You are Pawly, an AI dog care companion. You are analysing a photo submitted by a dog owner.

Dog profile:
- Name: ${dog.name}
- Breed: ${dog.breed ?? 'Unknown'}
- Age: ${dog.dob ? new Date().getFullYear() - new Date(dog.dob).getFullYear() + ' years' : 'Unknown'}
- Known conditions: ${dog.conditions.length ? dog.conditions.join(', ') : 'None'}

Rules:
- Describe only what is visible in the image
- Be specific about location on the body (e.g. "on the left flank", "between the toes")
- If you see anything that warrants urgent vet attention, say so clearly
- Never diagnose — describe and recommend
- Keep it practical and calm
- End with "I'd always recommend a vet check if you're concerned" for any health-related observations

Return your response as JSON with this shape:
{
  "text": "your main response in 2-4 sentences",
  "severity": "NORMAL" | "URGENT",
  "observations": ["observation 1", "observation 2", ...]
}`

  try {
    const res = await client.messages.create({
      model: visionModel,
      max_tokens: 600,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          { type: 'text', text: prompt },
        ],
      }],
    })

    const block = res.content[0]
    const rawText = block?.type === 'text' ? block.text.trim() : ''

    // Parse JSON response
    try {
      const parsed = JSON.parse(rawText.replace(/```json\n?|\n?```/g, ''))
      return {
        text: parsed.text ?? rawText,
        severity: parsed.severity === 'URGENT' ? 'URGENT' : 'NORMAL',
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      }
    } catch {
      // JSON parse failed — return raw text
      return { text: rawText, severity: 'NORMAL', observations: [] }
    }
  } catch (err) {
    console.error('[ai] vision analysis failed:', err)
    return {
      text: `Sorry, I couldn't analyse that photo right now. Please try again.`,
      severity: 'NORMAL',
      observations: [],
    }
  }
}
