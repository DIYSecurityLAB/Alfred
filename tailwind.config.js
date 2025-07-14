/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundColor: {
        'primary-light': '#B9B8B8',
        'primary-dark': '#606060',
      },
      colors: {
        'text-primary-light': '#000000',
        'text-primary-dark': '#ffffff',
        'orange-primary': '#F39200',
        success: '#28A745',
      },
      fontFamily: {
        lexend: ['"Lexend Deca"', 'sans-serif'], // Fonte global
        pixelade: ['"Pixelade"', 'sans-serif'], // Fonte exclusiva do Navbar
      },
      animation: {
        'scale-bounce': 'scaleBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'attention': 'attention 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fadeInPop': 'fadeInPop 0.6s cubic-bezier(0.26, 1.04, 0.54, 1.3) forwards',
        'soft-pulse': 'softPulse 2s ease-in-out infinite',
        'color-shift': 'colorShift 0.8s ease-in-out',
      },
      keyframes: {
        scaleBounce: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
          '40%': { transform: 'scale(1.15)', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
          '60%': { transform: 'scale(0.94)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
          '80%': { transform: 'scale(1.05)', boxShadow: '0 3px 8px rgba(0,0,0,0.1)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        },
        attention: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
          '20%': { transform: 'scale(1.12)', boxShadow: '0 5px 15px rgba(0,0,0,0.15)' },
          '40%': { transform: 'scale(0.94)', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
          '60%': { transform: 'scale(1.08)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
          '80%': { transform: 'scale(0.98)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0,0,0,0)' },
        },
        fadeInPop: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(10px)' },
          '70%': { opacity: '1', transform: 'scale(1.05) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        softPulse: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        colorShift: {
          '0%': { filter: 'brightness(100%)' },
          '50%': { filter: 'brightness(110%)' },
          '100%': { filter: 'brightness(100%)' },
        },
      },
    },
  },
  plugins: [],
};
