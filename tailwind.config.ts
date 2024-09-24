import type { Config } from "tailwindcss"
import theme from "tailwindcss/defaultTheme"

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: "selector",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#edf0fe",
          100: "#cdd1e7",
          200: "#adb2d2",
          300: "#8c93bf",
          400: "#6c74ac",
          500: "#525b92",
          600: "#404772",
          700: "#2d3252",
          800: "#1a1e33",
          900: "#070a16",
        },
        accent: {
          50: "#FFF1F3",
          100: "#FFE4E7",
          200: "#FFCCD4",
          300: "#FFA2B2",
          400: "#FD6F89",
          500: "#F73760",
          600: "#E41A4F",
          700: "#C10F42",
          800: "#A1103E",
          900: "#8A113B",
          950: "#4D041B",
        },
      },
      fontFamily: {
        sans: ["Sora", ...theme.fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config
