import { prisma } from './db';
import { requireUser } from './auth';
import type { Dog } from '@prisma/client';

/**
 * Resolve the "active" dog for the current request. Looks up `?dog=` param,
 * falls back to the user's first dog. Throws if user has no dogs.
 */
export async function getActiveDog(searchParams?: Record<string, string | string[] | undefined>): Promise<Dog> {
  const user = await requireUser();

  const dogIdParam = searchParams?.dog;
  const dogId = Array.isArray(dogIdParam) ? dogIdParam[0] : dogIdParam;

  if (dogId) {
    const dog = await prisma.dog.findFirst({ where: { id: dogId, userId: user.id } });
    if (dog) return dog;
  }

  const fallback = await prisma.dog.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  if (!fallback) throw new Error('NO_DOGS');
  return fallback;
}
