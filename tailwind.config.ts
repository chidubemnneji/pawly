import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
    './lib/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6F0',
        'cream-deep': '#F2EBDD',
        ink: {
          DEFAULT: '#1F2A24',
          soft: '#5A655F',
          faint: '#8C9591',
        },
        moss: {
          DEFAULT: '#3F6B4E',
          deep: '#2C4D38',
          soft: '#D7E5DA',
        },
        terracotta: {
          DEFAULT: '#C9694B',
          soft: '#F2D9CF',
        },
        biscuit: {
          DEFAULT: '#E9C9A0',
          soft: '#F7EBD7',
        },
        warn: '#D69540',
        danger: '#B7453B',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(31,42,36,0.04), 0 6px 16px rgba(31,42,36,0.06)',
        lift: '0 2px 6px rgba(31,42,36,0.06), 0 12px 32px rgba(31,42,36,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 320ms cubic-bezier(.2,.7,.3,1) both',
        'slide-r': 'slideR 360ms cubic-bezier(.2,.7,.3,1) both',
        'pop-in': 'popIn 320ms cubic-bezier(.2,.7,.3,1) both',
        'check-bounce': 'check 380ms cubic-bezier(.2,.7,.3,1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideR: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        check: {
          '0%': { transform: 'scale(.4)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
