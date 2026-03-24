/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': '#0a0b0d',
        'bg-panel': '#12141a',
        'bg-elevated': '#1a1d24',
        'bg-hover': '#22262e',
        accent: {
          DEFAULT: '#00d4aa',
          dim: 'rgba(0, 212, 170, 0.15)',
          hover: '#00f0c0',
        },
        'text-muted': '#8b9199',
        border: '#2a2e36',
        danger: {
          DEFAULT: '#ff6b6b',
          dim: 'rgba(255, 107, 107, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'app': '12px',
        'app-sm': '8px',
      },
      boxShadow: {
        'panel': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
