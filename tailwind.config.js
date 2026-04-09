/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        background: '#f5f5f7', // Apple soft gray background
        surface: 'rgba(255, 255, 255, 0.7)',
        surfaceDark: 'rgba(255, 255, 255, 0.9)',
        appleBlue: '#0066cc',
        appleDark: '#1d1d1f',
        danger: '#ff3b30',
        warning: '#ff9500',
        success: '#34c759',
      },
    },
  },
  plugins: [],
}
