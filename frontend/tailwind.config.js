/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        palette: {
          sand: '#FFFFFF',
          coral: '#FFFFFF',
          terracotta: '#FFFFFF',
          gold: '#FFFFFF',
        },
        brand: {
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F4F4F5',
          300: '#E4E4E7',
          400: '#D4D4D8',
          500: '#A1A1AA',
          600: '#71717A',
          700: '#52525B',
          800: '#3F3F46',
          900: '#27272A',
          950: '#000000',
        },
        surface: {
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F4F4F5',
          300: '#E4E4E7',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#27272A',
          800: '#18181B',
          900: '#09090B',
          950: '#000000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
