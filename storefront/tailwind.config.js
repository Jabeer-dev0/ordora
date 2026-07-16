/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../shared/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "var(--brand, #16a34a)",
        accent: "var(--accent, #1e293b)",
        surface: "var(--surface, #ffffff)",
        paper: "var(--paper, #f8fafc)",
        ink: "var(--ink, #0f172a)",
      },
    },
  },
  plugins: [],
}
