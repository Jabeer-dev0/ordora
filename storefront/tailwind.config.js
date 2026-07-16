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
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        ink: { DEFAULT: "hsl(var(--ink))", 2: "hsl(var(--ink-2))" },
        brand: { orange: "hsl(var(--brand-orange))", blue: "hsl(var(--brand-blue))" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", '"Arial Black"', '"Helvetica Neue"', "sans-serif"],
        "body-serif": ["var(--font-body-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        "card-lg": "2.125rem",
        pill: "128px",
      },
      boxShadow: {
        card: "0 12px 35px rgba(11, 30, 76, 0.10)",
        "card-lg": "0 24px 70px rgba(11, 30, 76, 0.12)",
      },
      keyframes: {
        "sheet-in": {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.98)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "cart-bump": {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 0.26s cubic-bezier(0.16, 1, 0.3, 1)",
        "cart-bump": "cart-bump 0.4s ease",
      },
    },
  },
  plugins: [],
}
