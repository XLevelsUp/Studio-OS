import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Palette ───────────────────────────
        navy: {
          DEFAULT: '#2E3145',
          dark: '#1A1D2E',
          light: '#3D4163',
        },
        gold: {
          DEFAULT: '#C2B280',
          light: '#D9CAA0',
          dim: 'rgba(194,178,128,0.20)',
        },
        beige: {
          DEFAULT: '#E5DDC8',
          dim: 'rgba(229,221,200,0.60)',
        },
        // ── Base Surfaces ────────────────────────────
        base: '#0A0A0B',
        surface: {
          1: '#111116',
          2: '#18181F',
        },
        // ── Shadcn/UI semantic tokens (dark mode) ────
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'gold-sm': '0 0 16px rgba(194,178,128,0.18)',
        'gold-md': '0 8px 32px rgba(194,178,128,0.22)',
        'gold-lg': '0 20px 60px rgba(194,178,128,0.28)',
        'gold-glow':
          '0 0 40px rgba(194,178,128,0.14), 0 0 80px rgba(194,178,128,0.06)',
      },
      backgroundImage: {
        'gradient-gold':
          'linear-gradient(135deg, #fff 0%, #C2B280 60%, #D9CAA0 100%)',
        'gradient-hero':
          'linear-gradient(135deg, #ffffff 0%, #ffffff 40%, #C2B280 75%, #D9CAA0 100%)',
        'gradient-navy': 'linear-gradient(to bottom, #2E3145, #1A1D2E)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(194,178,128,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(194,178,128,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
        'pulse-gold': 'pulseGold 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
