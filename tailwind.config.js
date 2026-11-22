/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#fdf8f3",
          100: "#f5e9dc",
          500: "#8b5e3c",
          700: "#5c3a21",
          900: "#2d1a0f",
        },
      },
    },
  },
  plugins: [],
};
