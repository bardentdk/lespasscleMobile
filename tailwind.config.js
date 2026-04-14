/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfe',
          300: '#7cc2fd',
          400: '#36a1fa',
          500: '#0c83eb',
          600: '#006eb8', // Ton bleu logo
          700: '#005896',
          800: '#004a7a',
          900: '#003e66',
        },
        accent: {
          500: '#f59e0b', // Ton jaune logo
        }
      },
    },
  },
  plugins: [],
}