// FCI-grouped breed list with weight ranges and breed-specific care facts.
// This is intentionally a TS module (not a DB table) so the SEO and onboarding
// pre-fill logic can ship statically. Add breeds liberally — every entry here
// becomes a /breeds/[slug] SEO page automatically (see app/breeds/[slug]/page.tsx).

export type Breed = {
  name: string;
  slug: string;
  group: BreedGroup;
  weightKg: [number, number];
  exercise: string;
  traits: string;
  watchFor: string;
};

export type BreedGroup =
  | 'Mixed/Designer'
  | 'Sporting'
  | 'Herding'
  | 'Hound'
  | 'Terrier'
  | 'Toy'
  | 'Non-Sporting'
  | 'Working';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function b(
  name: string,
  group: BreedGroup,
  weightKg: [number, number],
  exercise: string,
  traits: string,
  watchFor: string
): Breed {
  return { name, slug: slugify(name), group, weightKg, exercise, traits, watchFor };
}

export const BREEDS: Breed[] = [
  // Mixed/Designer
  b('Cockapoo', 'Mixed/Designer', [7, 14], '60–90 min/day', 'social, food-motivated, lively', 'ear infections, separation anxiety'),
  b('Cavapoo', 'Mixed/Designer', [5, 11], '45–60 min/day', 'gentle, affectionate, eager-to-please', 'mitral valve disease (Cavalier inheritance), dental issues'),
  b('Labradoodle', 'Mixed/Designer', [22, 32], '90+ min/day', 'social, intelligent, energetic', 'hip dysplasia, ear infections'),
  b('Goldendoodle', 'Mixed/Designer', [22, 36], '90+ min/day', 'friendly, trainable, social', 'hip dysplasia, eye conditions'),
  b('Mixed breed', 'Mixed/Designer', [10, 25], '60+ min/day', 'individual personality varies', 'general health checks'),

  // Sporting
  b('Labrador Retriever', 'Sporting', [25, 36], '90+ min/day', 'eager-to-please, food-motivated, social', 'weight gain, hip/elbow dysplasia'),
  b('Golden Retriever', 'Sporting', [25, 34], '90+ min/day', 'gentle, family-oriented, trainable', 'hip dysplasia, cancer risk'),
  b('Cocker Spaniel', 'Sporting', [11, 14], '60 min/day', 'affectionate, alert, biddable', 'ear infections, eye conditions'),
  b('English Springer Spaniel', 'Sporting', [18, 25], '90+ min/day', 'cheerful, energetic, trainable', 'ear infections, hip dysplasia'),
  b('Vizsla', 'Sporting', [20, 30], '120+ min/day', 'affectionate, energetic, sensitive', 'separation anxiety, hip dysplasia'),
  b('Weimaraner', 'Sporting', [25, 40], '120+ min/day', 'fearless, friendly, energetic', 'bloat, hip dysplasia'),

  // Herding
  b('Border Collie', 'Herding', [14, 20], '120+ min/day, mental stimulation essential', 'highly trainable, intense focus, herding drive', 'compulsive behaviours when under-stimulated'),
  b('Australian Shepherd', 'Herding', [16, 32], '90+ min/day', 'intelligent, work-driven, loyal', 'hip dysplasia, eye conditions'),
  b('German Shepherd', 'Herding', [22, 40], '90+ min/day', 'confident, courageous, smart', 'hip/elbow dysplasia, degenerative myelopathy'),
  b('Belgian Malinois', 'Herding', [20, 30], '120+ min/day', 'highly driven, alert, work-oriented', 'hip dysplasia, anxiety in low-stimulation homes'),
  b('Welsh Corgi (Pembroke)', 'Herding', [10, 14], '45–60 min/day', 'affectionate, smart, alert', 'IVDD, obesity'),

  // Hound
  b('Beagle', 'Hound', [9, 11], '60–90 min/day', 'curious, scent-driven, sociable', 'weight gain, recall in open spaces'),
  b('Dachshund', 'Hound', [7, 15], '45–60 min/day', 'bold, vocal, prey-drive', 'IVDD (back issues) — avoid stairs/jumping'),
  b('Greyhound', 'Hound', [27, 40], '45 min/day', 'gentle, quiet, sprinter', 'sensitive to anaesthesia, dental issues'),
  b('Whippet', 'Hound', [9, 19], '60 min/day', 'gentle, quiet, sprinter', 'thin coat — needs warmth, dental issues'),
  b('Basset Hound', 'Hound', [20, 30], '45 min/day', 'easy-going, scent-driven', 'IVDD, ear infections, obesity'),

  // Terrier
  b('Jack Russell Terrier', 'Terrier', [5, 8], '60+ min/day', 'bold, energetic, high prey drive', 'patellar luxation, deafness'),
  b('Yorkshire Terrier', 'Terrier', [2, 3], '30 min/day', 'bold, affectionate, vocal', 'dental issues, tracheal collapse'),
  b('Staffordshire Bull Terrier', 'Terrier', [11, 17], '60 min/day', 'affectionate, courageous, people-oriented', 'skin allergies, hip dysplasia'),
  b('West Highland White Terrier', 'Terrier', [7, 10], '60 min/day', 'alert, lively, friendly', 'skin conditions, jaw issues'),

  // Toy
  b('Cavalier King Charles Spaniel', 'Toy', [5, 8], '40–60 min/day', 'gentle, affectionate, low-prey-drive', 'mitral valve disease, syringomyelia'),
  b('Pug', 'Toy', [6, 8], '30–45 min/day, careful in heat', 'charming, mischievous, loving', 'BOAS (breathing), eye injuries, obesity'),
  b('Chihuahua', 'Toy', [1.5, 3], '30 min/day', 'devoted, alert, quick', 'dental issues, patellar luxation'),
  b('Pomeranian', 'Toy', [2, 3.5], '30 min/day', 'lively, bold, vocal', 'dental issues, tracheal collapse'),
  b('Shih Tzu', 'Toy', [4, 7], '30 min/day', 'affectionate, playful, outgoing', 'eye conditions, breathing issues'),

  // Non-Sporting
  b('Bulldog (English)', 'Non-Sporting', [18, 25], '20–30 min/day, careful in heat', 'docile, friendly, courageous', 'BOAS, hip dysplasia, skin folds'),
  b('French Bulldog', 'Non-Sporting', [8, 14], '30–45 min/day, careful in heat', 'affectionate, low-energy, vocal', 'BOAS (breathing), heat sensitivity, allergies'),
  b('Boston Terrier', 'Non-Sporting', [4, 11], '45 min/day', 'friendly, lively, intelligent', 'BOAS, eye conditions'),
  b('Dalmatian', 'Non-Sporting', [20, 32], '90+ min/day', 'energetic, dignified, smart', 'deafness, urinary stones'),
  b('Poodle (Standard)', 'Non-Sporting', [20, 32], '90+ min/day', 'intelligent, active, elegant', 'hip dysplasia, Addison disease'),
  b('Miniature Poodle', 'Non-Sporting', [5, 8], '60 min/day', 'intelligent, active, alert', 'patellar luxation, eye conditions'),

  // Working
  b('Boxer', 'Working', [25, 32], '90+ min/day', 'bright, fun-loving, active', 'cardiomyopathy, cancer risk'),
  b('Rottweiler', 'Working', [35, 60], '90+ min/day', 'loyal, loving, confident guardian', 'hip dysplasia, osteosarcoma'),
  b('Bernese Mountain Dog', 'Working', [36, 52], '60 min/day', 'good-natured, calm, strong', 'cancer (high), hip dysplasia, short lifespan'),
  b('Siberian Husky', 'Working', [16, 27], '120+ min/day', 'loyal, mischievous, athletic', 'eye conditions, escape-prone'),
  b('Doberman Pinscher', 'Working', [27, 45], '90+ min/day', 'loyal, fearless, alert', 'cardiomyopathy, von Willebrand'),
  b('Great Dane', 'Working', [50, 90], '60 min/day', 'patient, dependable, gentle giant', 'bloat (urgent), heart conditions, short lifespan'),
];

export const BREED_GROUPS: BreedGroup[] = [
  'Mixed/Designer', 'Sporting', 'Herding', 'Hound',
  'Terrier', 'Toy', 'Non-Sporting', 'Working',
];

export function findBreed(name: string | null | undefined): Breed | null {
  if (!name) return null;
  return BREEDS.find((b) => b.name === name) ?? null;
}

export function findBreedBySlug(slug: string): Breed | null {
  return BREEDS.find((b) => b.slug === slug) ?? null;
}

export function searchBreeds(query: string): Breed[] {
  const q = query.trim().toLowerCase();
  if (!q) return BREEDS;
  return BREEDS.filter((b) => b.name.toLowerCase().includes(q));
}

export function groupBreeds(breeds: Breed[]): Record<string, Breed[]> {
  const out: Record<string, Breed[]> = {};
  for (const b of breeds) {
    (out[b.group] ||= []).push(b);
  }
  return out;
}
