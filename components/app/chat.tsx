'use client';

import { useEffect, useRef, useState } from 'react';
import { ChatIcon, ArrowRightIcon } from '@/components/icons';
import type { ChatMessage } from '@prisma/client';

type Msg = Pick<ChatMessage, 'id' | 'role' | 'content' | 'severity' | 'createdAt'> & {
  imageUrl?: string;       // client-side preview for photo messages
  observations?: string[]; // structured findings from vision analysis
};

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
  visionEnabled = false, // from ai-vision-enabled feature flag
}: {
  dogId: string;
  dogName: string;
  initialMessages: Msg[];
  visionEnabled?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [pendingImage, setPendingImage] = useState<{
    base64: string;
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
    previewUrl: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  // Convert file to base64
  async function handleImageSelect(file: File) {
    if (!file.type.startsWith('image/')) return;
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';
    const previewUrl = URL.createObjectURL(file);

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Strip the data:image/...;base64, prefix
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    });

    setPendingImage({ base64, mediaType, previewUrl });
  }

  const send = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingImage) || isLoading) return;
    setInput('');
    setFollowUps([]);

    const image = pendingImage;
    setPendingImage(null);

    // Optimistic user message
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      role: 'USER',
      content: trimmed || 'What do you see in this photo?',
      severity: 'NORMAL',
      createdAt: new Date(),
      imageUrl: image?.previewUrl,
    };
    setMessages((m) => [...m, optimistic]);
    setIsLoading(true);

    try {
      let data: any;

      if (image) {
        // Vision path — photo attached
        const res = await fetch('/api/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dogId,
            imageBase64: image.base64,
            mediaType: image.mediaType,
            question: trimmed || undefined,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'vision failed');
        }
        data = await res.json();

        const reply: Msg = {
          id: `ai-${Date.now()}`,
          role: 'ASSISTANT',
          content: data.text,
          severity: data.severity === 'URGENT' ? 'URGENT' : 'NORMAL',
          createdAt: new Date(),
          observations: data.observations,
        };
        setMessages((m) => [...m, reply]);
        setFollowUps(['Tell me more', 'Should I see the vet?', 'What should I watch for?']);
      } else {
        // Standard chat path
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dogId, message: trimmed }),
        });
        if (!res.ok) throw new Error('chat failed');
        data = await res.json();

        const reply: Msg = {
          id: data.assistantMessageId ?? `ai-${Date.now()}`,
          role: 'ASSISTANT',
          content: data.text,
          severity: data.severity,
          createdAt: new Date(),
        };
        setMessages((m) => [...m, reply]);
        setFollowUps(data.followUps ?? []);
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: err.message?.includes('not yet available')
            ? err.message
            : "Hmm, I had trouble answering that one. Try again in a moment?",
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
            <p className="text-[12px] text-ink-faint leading-tight">
              Care companion · advising on {dogName}
              {visionEnabled && (
                <span className="ml-2 inline-flex items-center gap-1 text-moss font-medium">
                  · 📷 Photo analysis on
                </span>
              )}
            </p>
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
                {visionEnabled && ' You can also share a photo for me to analyse.'}
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
                {pendingImage && (
                  <span className="text-xs text-ink-faint ml-1">Analysing photo…</span>
                )}
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

      {/* Pending image preview */}
      {pendingImage && (
        <div className="border-t border-ink/[0.07] bg-cream/85 px-5 md:px-10 py-2">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="relative">
              <img
                src={pendingImage.previewUrl}
                alt="Pending upload"
                className="w-16 h-16 rounded-xl object-cover border border-ink/10"
              />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-cream text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-ink-soft">
              Photo ready — type a question or send to analyse
            </p>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-ink/[0.07] bg-cream/85 backdrop-blur px-5 md:px-10 py-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageSelect(file);
            e.target.value = ''; // reset so same file can be re-selected
          }}
        />

        <form
          className="max-w-3xl mx-auto flex items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); send(input); }}
        >
          {/* Camera button — only shown when ai-vision-enabled flag is true */}
          {visionEnabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-12 h-12 shrink-0 rounded-full bg-white border border-ink/10 text-ink-soft flex items-center justify-center hover:border-moss hover:text-moss disabled:opacity-40 transition-colors"
              aria-label="Attach photo"
              title="Analyse a photo of your dog"
            >
              <CameraIcon />
            </button>
          )}

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
            placeholder={
              pendingImage
                ? `Ask about this photo… (or just send)`
                : `Ask about ${dogName}…`
            }
            className="flex-1 resize-none bg-white border border-ink/10 rounded-2xl px-4 py-3 text-[15px] outline-none focus:border-moss max-h-32"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !pendingImage) || isLoading}
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
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Attached image (user side) */}
      {msg.imageUrl && (
        <img
          src={msg.imageUrl}
          alt="Shared photo"
          className="w-48 h-48 rounded-2xl object-cover mb-1.5 border border-ink/10"
        />
      )}

      <div
        className={`relative max-w-[85%] px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
          isUser
            ? 'btn-gradient text-cream rounded-br-sm shadow-soft'
            : isUrgent
              ? 'bg-danger/10 text-ink border border-danger/30 rounded-bl-sm'
              : 'glass-strong text-ink rounded-bl-sm'
        }`}
      >
        {isUrgent && (
          <p className="text-[11px] uppercase tracking-wider font-semibold text-danger mb-1.5">
            Urgent — call your vet
          </p>
        )}
        <p className="text-[15px]">{msg.content}</p>
      </div>

      {/* Vision observations — structured findings shown as pills */}
      {msg.observations && msg.observations.length > 0 && (
        <div className="mt-2 ml-2 max-w-[85%]">
          <p className="text-[11px] text-ink-faint mb-1.5 font-medium uppercase tracking-wider">
            Observations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {msg.observations.map((obs, i) => (
              <span
                key={i}
                className="text-[12px] px-2.5 py-1 bg-white border border-ink/10 rounded-full text-ink-soft"
              >
                {obs}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isUser && !isUrgent && (
        <p className="text-[11px] text-ink-faint mt-1 ml-2 max-w-[85%]">
          General guidance — not vet advice. Always check with your vet for medical concerns.
        </p>
      )}
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

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
