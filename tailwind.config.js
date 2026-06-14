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
          DEFAULT: '#065F46', // Dark green
          dark: '#044e39',
        },
        accent: {
          DEFAULT: '#A7F3D0', // Mint
          light: '#D1FAE5',
        },
        background: '#F4F6F5', // Soft organic off-white
        'text-dark': '#065F46',
        'text-light': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        subtle: '0 4px 20px rgba(6, 95, 70, 0.04)',
        card: '0 8px 30px rgba(6, 95, 70, 0.06)',
      }
    },
  },
  plugins: [],
}
