/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Cormorant Garamond", "ui-serif", "Georgia", "serif"],
        body: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#f8f8f8",
        mist: "#070707",
        ember: "#ffffff",
        teal: "#bdbdbd",
        pine: "#0d0d0d",
      },
      boxShadow: {
        glow: "0 25px 60px -40px rgba(14, 165, 164, 0.65)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0px)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        fadeUp: "fadeUp 0.8s ease-out both",
      },
    },
  },
  plugins: [],
};
