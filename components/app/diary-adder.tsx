'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function DiaryAdder({ dogId }: { dogId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Please pick an image');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image too large (max 12 MB)');
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file, 800, 0.82);
      setPhotoDataUrl(dataUrl);
    } catch {
      setError("Couldn't process that image");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!photoDataUrl) return;
    setBusy(true);
    try {
      const res = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dogId, photoUrl: photoDataUrl, caption: caption || undefined }),
      });
      if (!res.ok) throw new Error('save failed');
      setPhotoDataUrl('');
      setCaption('');
      startTransition(() => router.refresh());
    } catch {
      setError('Save failed — try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-ink/[0.06] shadow-soft p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight mb-3">Add an entry</h2>
      <div className="flex gap-4 items-start">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-24 h-24 rounded-2xl bg-biscuit-soft text-moss-deep flex items-center justify-center overflow-hidden border-2 border-dashed border-ink/15 hover:border-moss transition-colors shrink-0"
          aria-label="Add photo"
        >
          {photoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : busy ? (
            <span className="text-sm text-ink-soft">…</span>
          ) : (
            <span className="text-2xl">+</span>
          )}
        </button>
        <div className="flex-1">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What happened? (optional)"
            rows={3}
            className="w-full bg-cream border border-ink/10 rounded-xl px-4 py-3 outline-none focus:border-moss text-sm resize-none"
          />
        </div>
      </div>
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
      <button
        onClick={submit}
        disabled={!photoDataUrl || busy}
        className="bg-moss text-cream rounded-full h-11 px-6 font-medium disabled:opacity-50 mt-3"
      >
        {busy ? 'Saving…' : 'Save entry'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

async function resizeToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(1, maxSize / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('no ctx'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('load failed'));
    };
    img.src = url;
  });
}
