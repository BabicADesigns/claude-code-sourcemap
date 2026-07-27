/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#8B9B7A',
          light: '#A6B398',
          dark: '#6F7D61',
        },
        cream: {
          DEFAULT: '#F5EEE6',
          dark: '#EDE3D6',
        },
        rose: {
          DEFAULT: '#C4A096',
          light: '#D6B9B0',
          dark: '#A9827A',
        },
        gold: {
          DEFAULT: '#F0C878',
          light: '#F5D89A',
          dark: '#D9AE55',
        },
        adriatic: {
          DEFAULT: '#6A9AB0',
          light: '#8AB2C4',
          dark: '#527D91',
        },
        ink: '#3A352E',
        border: '#E3D8C8',
        background: '#F5EEE6',
        foreground: '#3A352E',
        card: '#FFFFFF',
        muted: '#EDE3D6',
        'muted-foreground': '#8A8072',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgb(58 53 46 / 0.08)',
        card: '0 4px 20px -4px rgb(58 53 46 / 0.12)',
      },
    },
  },
  plugins: [],
}
