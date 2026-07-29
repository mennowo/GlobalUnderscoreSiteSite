/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        sand: 'rgb(var(--color-sand) / <alpha-value>)',
        coral: 'rgb(var(--color-coral) / <alpha-value>)',
        terracotta: 'rgb(var(--color-terracotta) / <alpha-value>)',
        sage: 'rgb(var(--color-sage) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        mustard: 'rgb(var(--color-mustard) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -15px rgb(var(--color-ink) / 0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-1deg)' },
          '50%': { transform: 'translateY(-6px) rotate(1deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        wiggle: 'wiggle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
