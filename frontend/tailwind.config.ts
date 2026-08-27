import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Manrope"', 'ui-sans-serif', 'sans-serif'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontWeight: {
        medium: '500',
        semibold: '600',
        extrabold: '800',
      },
      lineHeight: {
        tight: '1.25',
        snug: '1.375',
      },
      letterSpacing: {
        wide: '0.025em',
        wider: '0.05em',
      },
      spacing: {
        '0.25': '0.25rem',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      blur: {
        sm: '8px',
        md: '12px',
        '2xl': '40px',
        '3xl': '64px',
      },
      transitionDuration: {
        DEFAULT: '0.15s',
        '150': '0.15s',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      colors: {
        // Dusk-steel color palette
        page: {
          DEFAULT: '#5a6785',
          2: '#4b5874',
        },
        panel: {
          DEFAULT: '#4d5a7a',
          2: '#455273',
        },
        deep: {
          DEFAULT: '#3d4a69',
          2: '#36425e',
        },
        footer: '#46536f',
        field: '#3e4b6a',
        ink: '#f4f7ff',
        muted: '#c3cde0',
        faint: '#9daabd',
        accent: {
          DEFAULT: '#2e7bff',
          2: '#1a5ce4',
        },
        link: '#79abff',
        line: 'rgba(238, 244, 255, 0.14)',
        danger: '#ff7a8a',
      },
      animation: {
        'scanline': 'scanline 3.4s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        'ping-soft': 'ping-soft 2.2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'floaty': 'floaty 4s ease-in-out infinite',
        'drift': 'drift 14s ease-in-out infinite',
        'drift-slow': 'drift 20s ease-in-out infinite reverse',
        'shake': 'shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'rise': 'rise 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'ready': 'ready 1.7s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-130%)', opacity: '0' },
          '12%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { transform: 'translateY(330%)', opacity: '0' },
        },
        'ping-soft': {
          '0%, 100%': { transform: 'scale(0.5)', opacity: '0.75' },
          '80%': { transform: 'scale(2.1)', opacity: '0' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(40px, -28px, 0) scale(1.08)' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' },
        },
        rise: {
          'from': { opacity: '0', transform: 'translateY(14px)' },
          'to': { opacity: '1', transform: 'none' },
        },
        ready: {
          '0%, 100%': { boxShadow: '0 12px 26px -8px rgba(46, 123, 255, 0.5)' },
          '50%': { boxShadow: '0 14px 36px -4px rgba(46, 123, 255, 0.8)' },
        },
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;