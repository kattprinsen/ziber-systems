/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,js}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#020617",
          raised: "#020617"
        },
        accent: {
          amber: "#f59e0b",
          yellow: "#eab308"
        }
      }
    }
  },
  plugins: []
};
