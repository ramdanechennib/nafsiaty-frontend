/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: '#2c3e50',
        secondary: '#3498db',
        accent: '#e74c3c',
        success: '#27ae60',
        warning: '#f39c12',
      },
    },
  },
  plugins: [],
}
