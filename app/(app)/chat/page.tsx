import { prisma } from '@/lib/db';
import { getActiveDog } from '@/lib/active-dog';
import { ChatView } from '@/components/app/chat';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);

  const messages = await prisma.chatMessage.findMany({
    where: { dogId: dog.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: { id: true, role: true, content: true, severity: true, createdAt: true },
  });

  return <ChatView dogId={dog.id} dogName={dog.name} initialMessages={messages} />;
}
