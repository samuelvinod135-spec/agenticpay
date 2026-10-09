import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07090E',
        surface: {
          DEFAULT: '#0D111A',
          hover: '#151C2C',
          card: 'rgba(13, 17, 26, 0.85)',
          muted: '#101522',
        },
        foreground: '#F3F0FF',
        primary: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          foreground: '#FFFFFF',
        },
        border: {
          DEFAULT: '#1E293B',
          subtle: 'rgba(139, 92, 246, 0.15)',
          focus: 'rgba(6, 182, 212, 0.6)',
        },
        muted: {
          DEFAULT: '#94A3B8',
          violet: '#A78BFA',
        },
        accent: {
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          indigo: '#6366F1',
          emerald: '#10B981',
          rose: '#EF4444',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.4)',
        'glow-purple': '0 0 20px -3px rgba(139, 92, 246, 0.4)',
        'glow-violet': '0 0 20px -3px rgba(124, 58, 237, 0.4)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-focus': '0 0 15px rgba(6, 182, 212, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.65)'
      },
      backgroundImage: {
        'radial-top': 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(139, 92, 246, 0.22), rgba(7, 9, 14, 0))',
        'radial-glow': 'radial-gradient(ellipse at top, rgba(6, 182, 212, 0.15), transparent 70%)',
        'gradient-cyan-purple': 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
      }
    }
  },
  plugins: []
};

export default config;
