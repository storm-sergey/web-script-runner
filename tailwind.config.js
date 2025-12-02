/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // True Neutral (Pure Greys, no brown/blue tint) to avoid "muddy" look
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Jewel-tone Ruby (Primary Action)
        ruby: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48', // Vibrant Primary
          700: '#be123c', // Deep interaction
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        // Metallic Gold (Accents, Focus)
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308', // Base Metallic
          600: '#ca8a04', // Readable on white
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        }
      }
    }
  },
  plugins: [],
}