import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        line: "#d8dee8",
        paper: "#f7f9fc",
        mint: "#13a67c",
        cobalt: "#2357d9",
        amber: "#c47a12"
      }
    }
  },
  plugins: []
};

export default config;
