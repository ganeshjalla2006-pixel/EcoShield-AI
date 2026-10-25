/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#070a08',
          900: '#0b100d',
          850: '#101713',
          800: '#151f1a',
          750: '#1a2620',
          700: '#23322b',
          600: '#32453c',
          500: '#485e53',
          400: '#71857b',
          300: '#9cb0a6',
          200: '#c5d3cc',
          100: '#e5ece8',
        },
        forest: {
          950: '#03140b',
          900: '#052213',
          850: '#072e1a',
          800: '#0b3d23',
          700: '#0f5230',
          600: '#157343',
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7',
          200: '#a7f3d0',
          100: '#d1fae5',
          50: '#ecfdf5',
        },
        risk: {
          low: '#10b981',      // Emerald green
          moderate: '#f59e0b', // Amber
          high: '#f97316',     // Orange
          critical: '#ef4444', // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
