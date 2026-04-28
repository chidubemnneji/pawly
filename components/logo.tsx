import * as React from 'react';

/**
 * Pawly logo — paw-mark + wordmark.
 * Use `withWordmark={false}` for the icon-only variant (favicons, app icons).
 */
export function Logo({
  withWordmark = true,
  className = '',
  size = 32,
}: {
  withWordmark?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Pawly"
      >
        <rect x="2" y="2" width="36" height="36" rx="11" fill="#3F6B4E" />
        <ellipse cx="11" cy="17" rx="2.4" ry="3" fill="#FAF6F0" />
        <ellipse cx="29" cy="17" rx="2.4" ry="3" fill="#FAF6F0" />
        <ellipse cx="16" cy="11" rx="2" ry="2.6" fill="#FAF6F0" />
        <ellipse cx="24" cy="11" rx="2" ry="2.6" fill="#FAF6F0" />
        <path
          d="M14 27.5c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 5.5-6 5.5-6-2.2-6-5.5z"
          fill="#FAF6F0"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-[22px] font-semibold tracking-tight text-ink leading-none">
          Pawly
        </span>
      )}
    </div>
  );
}
