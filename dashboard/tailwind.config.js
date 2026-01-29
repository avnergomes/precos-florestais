/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D5016',
          light: '#4A7C23',
          dark: '#1A3009',
        },
        secondary: {
          DEFAULT: '#8B4513',
          light: '#A0522D',
          dark: '#5D2E0C',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        forest: {
          50: '#f0f7ed',
          100: '#d9ebd1',
          200: '#b3d7a3',
          300: '#8dc375',
          400: '#67af47',
          500: '#4A7C23',
          600: '#3d6a1d',
          700: '#305817',
          800: '#234611',
          900: '#16340b',
        },
        wood: {
          50: '#fdf8f3',
          100: '#f5e6d3',
          200: '#e8cba8',
          300: '#dbb07d',
          400: '#ce9552',
          500: '#8B4513',
          600: '#7a3c11',
          700: '#69330f',
          800: '#582a0d',
          900: '#47210b',
        },
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
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
}
