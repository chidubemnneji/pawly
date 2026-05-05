import { prisma } from '@/lib/db';
import { getActiveDog } from '@/lib/active-dog';
import { ChatView } from '@/components/app/chat';
import { auth } from '@/lib/auth';
import { getModelConfig } from '@/lib/aiModels';

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const dog = await getActiveDog(sp);

  const session = await auth();
  const userId = session?.user?.id;

  const [messages, modelConfig] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { dogId: dog.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: { id: true, role: true, content: true, severity: true, createdAt: true },
    }),
    // Resolve vision flag server-side — passed to client as a prop
    // When ai-vision-enabled flag is true for this user, camera button appears
    getModelConfig(userId),
  ]);

  return (
    <ChatView
      dogId={dog.id}
      dogName={dog.name}
      initialMessages={messages}
      visionEnabled={modelConfig.visionEnabled}
    />
  );
}
