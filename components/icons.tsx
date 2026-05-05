/**
 * Pawly icon set - hand-tuned, single-stroke, friendly.
 * All icons accept className for sizing/colour via currentColor.
 */
import * as React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24): React.SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const PawIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <ellipse cx="6" cy="9" rx="1.6" ry="2" />
    <ellipse cx="18" cy="9" rx="1.6" ry="2" />
    <ellipse cx="9.5" cy="5.5" rx="1.4" ry="1.8" />
    <ellipse cx="14.5" cy="5.5" rx="1.4" ry="1.8" />
    <path d="M8 17.5c0-2.2 1.6-4 4-4s4 1.8 4 4-1.6 3.5-4 3.5-4-1.3-4-3.5z" />
  </svg>
);

export const BowlIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 11h18l-2 7a3 3 0 0 1-3 2H8a3 3 0 0 1-3-2l-2-7z" />
    <path d="M7 11c1-3 3-5 5-5s4 2 5 5" />
  </svg>
);

export const WalkIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="5" r="1.6" />
    <path d="M9 22l2-7-3-3 2-5 4 2 2 3" />
    <path d="M15 22l-1-5" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const HeartIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
  </svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </svg>
);

export const PillIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <rect x="3" y="9" width="18" height="6" rx="3" />
    <path d="M12 9v6" />
  </svg>
);

export const ChatIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4.2A8 8 0 0 1 21 12z" />
    <path d="M9 11h6M9 14h4" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 12l4 4 10-10" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z" />
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size, ...rest }) => (
  <svg {...base(size)} {...rest}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ICONS = {
  paw: PawIcon,
  bowl: BowlIcon,
  walk: WalkIcon,
  shield: ShieldIcon,
  heart: HeartIcon,
  sparkle: SparkleIcon,
  pill: PillIcon,
  chat: ChatIcon,
  check: CheckIcon,
  home: HomeIcon,
  user: UserIcon,
  plus: PlusIcon,
  sun: SunIcon,
  moon: MoonIcon,
  arrowRight: ArrowRightIcon,
  chevronRight: ChevronRightIcon,
  chevronLeft: ChevronLeftIcon,
} as const;

export type IconKey = keyof typeof ICONS;

export function Icon({ name, ...rest }: IconProps & { name: IconKey }) {
  const Cmp = ICONS[name] ?? PawIcon;
  return <Cmp {...rest} />;
}
