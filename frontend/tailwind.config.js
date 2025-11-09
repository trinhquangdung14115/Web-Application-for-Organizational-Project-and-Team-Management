/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#f35640",
      },
      backgroundImage: {
        'background': "url('/src/assets/images/background.png')",
        'background2': "url('/src/assets/images/backgroundlight.png')",

      },
    },
  },
  plugins: [],
};
