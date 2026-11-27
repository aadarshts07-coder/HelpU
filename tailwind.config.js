/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Controlled class-based, defaults to light
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // Primary Indigo
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        page: '#f7f8fc',
        card: '#ffffff',
        subtle: '#f1f5f9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'light-sm': '0 1px 2px rgba(15,23,42,.06)',
        'light-md': '0 4px 16px rgba(15,23,42,.08)',
        'light-lg': '0 10px 25px -3px rgba(15,23,42,.08), 0 4px 6px -4px rgba(15,23,42,.04)',
      },
    },
  },
  plugins: [],
}
