'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatIcon, ArrowRightIcon } from '@/components/icons';
import type { ChatMessage } from '@prisma/client';

type Msg = Pick<ChatMessage, 'id' | 'role' | 'content' | 'severity' | 'createdAt'>;

const STARTER_PROMPTS = [
  'Is my dog a healthy weight?',
  'What should I work on this week?',
  'How much should they eat?',
  'Tell me about my breed',
];

export function ChatView({
  dogId,
  dogName,
  initialMessages,
}: {
  dogId: string;
  dogName: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    setFollowUps([]);

    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      role: 'USER',
      content: trimmed,
      severity: 'NORMAL',
      createdAt: new Date(),
    };
    setMessages((m) => [...m, optimistic]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, message: trimmed }),
      });
      if (!res.ok) throw new Error('chat failed');
      const data = await res.json();
      const reply: Msg = {
        id: data.assistantMessageId ?? `ai-${Date.now()}`,
        role: 'ASSISTANT',
        content: data.text,
        severity: data.severity,
        createdAt: new Date(),
      };
      setMessages((m) => [...m, reply]);
      setFollowUps(data.followUps ?? []);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: "Hmm, I had trouble answering that one. Try again in a moment?",
          severity: 'NORMAL',
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Header */}
      <div className="px-5 md:px-10 py-5 border-b border-ink/[0.07] bg-cream/85 backdrop-blur">
        <div className="flex items-center gap-3 max-w-3xl mx-auto w-full">
          <div className="w-10 h-10 rounded-full bg-moss text-cream flex items-center justify-center">
            <ChatIcon size={20} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Pawly</p>
            <p className="text-[12px] text-ink-faint leading-tight">Care companion · advising on {dogName}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-10 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="inline-flex w-14 h-14 rounded-full bg-moss-soft text-moss items-center justify-center mb-4">
                <ChatIcon size={26} />
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">Hi! I&rsquo;m Pawly.</h2>
              <p className="text-ink-soft mt-2 max-w-md mx-auto">
                I know {dogName} by name and details. Ask me anything about feeding, training, behaviour or health.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="px-4 py-2 rounded-full bg-white border border-ink/10 text-sm hover:border-ink/30"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => <Bubble key={m.id} msg={m} />)}

          {isLoading && (
            <div className="flex">
              <div className="bg-white rounded-2xl px-4 py-3 inline-flex items-center gap-2 shadow-soft">
                <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
              </div>
            </div>
          )}

          {followUps.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 pt-2">
              {followUps.map((f) => (
                <button
                  key={f}
                  onClick={() => send(f)}
                  className="px-3 py-1.5 rounded-full bg-white border border-ink/10 text-sm hover:border-ink/30"
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-ink/[0.07] bg-cream/85 backdrop-blur px-5 md:px-10 py-4">
        <form
          className="max-w-3xl mx-auto flex items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={`Ask about ${dogName}…`}
            className="flex-1 resize-none bg-white border border-ink/10 rounded-2xl px-4 py-3 text-[15px] outline-none focus:border-moss max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 shrink-0 rounded-full bg-moss text-cream flex items-center justify-center disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowRightIcon size={20} />
          </button>
        </form>
        <p className="text-[11px] text-ink-faint text-center mt-2 max-w-3xl mx-auto">
          Pawly is helpful guidance — not a substitute for veterinary advice.
        </p>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'USER';
  const isUrgent = msg.severity === 'URGENT';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
          isUser
            ? 'bg-moss text-cream rounded-br-sm'
            : isUrgent
              ? 'bg-danger/10 text-ink border border-danger/30 rounded-bl-sm'
              : 'bg-white text-ink shadow-soft rounded-bl-sm'
        }`}
      >
        {isUrgent && (
          <p className="text-[11px] uppercase tracking-wider font-semibold text-danger mb-1.5">Urgent</p>
        )}
        <p className="text-[15px]">{msg.content}</p>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-ink/30 inline-block animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
