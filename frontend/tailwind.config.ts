import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0a5cab", // azul da sidebar / títulos
          dark: "#084a8a",
          light: "#1f73c4",
          active: "#0b4f95",
        },
        status: {
          ok: "#44b957",
          warn: "#eed322",
          off: "#e85d4d",
          idle: "#3c3c3c",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
