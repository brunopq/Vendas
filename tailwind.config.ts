import type { Config } from "tailwindcss"
import theme from "tailwindcss/defaultTheme"
import type { PluginAPI } from "tailwindcss/types/config"

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["selector", "class"],
  theme: {
    extend: {
      colors: {
        primary: {
          "50": "#edf0fe",
          "100": "#cdd1e7",
          "200": "#adb2d2",
          "300": "#8c93bf",
          "400": "#6c74ac",
          "500": "#525b92",
          "600": "#404772",
          "700": "#2d3252",
          "800": "#1a1e33",
          "900": "#070a16",
        },
        accent: {
          "50": "#FFF1F3",
          "100": "#FFE4E7",
          "200": "#FFCCD4",
          "300": "#FFA2B2",
          "400": "#FD6F89",
          "500": "#F73760",
          "600": "#E41A4F",
          "700": "#C10F42",
          "800": "#A1103E",
          "900": "#8A113B",
          "950": "#4D041B",
        },
      },
      fontFamily: {
        sans: ["Sora", ...theme.fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addBase, theme }: PluginAPI) => {
      const extractColorVars = (
        colorObj: Record<string, string>,
        colorGroup = "",
      ) =>
        Object.entries(colorObj).reduce((vars, [colorKey, value]) => {
          const cssVariable =
            colorKey === "DEFAULT"
              ? `--color${colorGroup}`
              : `--color${colorGroup}-${colorKey}`

          const newVars: Record<string, string> =
            typeof value === "string"
              ? { [cssVariable]: value }
              : extractColorVars(value, `-${colorKey}`)

          // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
          return { ...vars, ...newVars }
        }, {})

      addBase({
        ":root": extractColorVars(theme("colors")),
      })
    },
  ],
} satisfies Config
