/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0A0F1D',
        primary: '#00E5FF',
        secondary: '#7B61FF',
        success: '#00FF94',
        warning: '#FFC857',
        danger: '#FF5C7A',
        glassBg: 'rgba(22, 30, 49, 0.65)',
        glassBorder: 'rgba(255, 255, 255, 0.05)',
        glassBorderActive: 'rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-primary': 'none',
        'glow-secondary': 'none',
        'glow-success': 'none',
        'glow-danger': 'none',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
