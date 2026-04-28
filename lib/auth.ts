import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

const isDemoMode = process.env.PAWLY_DEMO_MODE === 'true';
const hasGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
const hasResend = !!process.env.AUTH_RESEND_KEY;

const providers = [];
if (hasGoogle) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    })
  );
}
if (hasResend) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.AUTH_EMAIL_FROM ?? 'Pawly <onboarding@resend.dev>',
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  trustHost: true,
});

/**
 * getCurrentUser — returns the active user.
 * In DEMO mode (no auth configured), creates/returns a singleton "demo user" so
 * the app is fully functional without OAuth/email setup. Switch demo off in prod.
 */
export async function getCurrentUser() {
  if (isDemoMode || providers.length === 0) {
    const demoEmail = 'demo@pawly.local';
    let user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          name: 'Demo Owner',
        },
      });
    }
    return user;
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}
