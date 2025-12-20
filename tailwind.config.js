/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        numeric: ['Manrope', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#D4AF37", // Celestial Gold
          50: "#FCF6E3",
          100: "#F8EDC8",
          200: "#F2E099",
          300: "#EBD36A",
          400: "#E4C63B",
          500: "#D4AF37",
          600: "#B08F2C",
          700: "#8C6F21",
          800: "#684F16",
          900: "#44350B",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#001F54", // Midnight Blue
          50: "#E0E8F5",
          100: "#B3C3E2",
          200: "#809BCB",
          300: "#4D73B4",
          400: "#1A4B9D",
          500: "#001F54",
          600: "#001A4A",
          700: "#001439",
          800: "#000F28",
          900: "#000A17",
          foreground: "#FFFFFF",
        },
        tertiary: {
          DEFAULT: "#FFFFF0", // Ivory
          200: "#FCFCF7",
          300: "#F9F9EE",
          400: "#F6F6E5",
        },
        neutral: {
          DEFAULT: "#1B1B1F", // Graphite
          50: "#F7F4FB",
          100: "#EAE6F2",
          200: "#DCD5E5",
          400: "#A095B7",
          600: "#5B536F",
          800: "#322C3F",
        },
        success: {
          DEFAULT: "#3BAA84",
          light: "#57C49D",
          dark: "#2F8869",
        },
        error: {
          DEFAULT: "#E86E6E",
          light: "#F18A8A",
          dark: "#C75959",
        },
        warning: {
          DEFAULT: "#F6B27A",
          light: "#F8C49A",
          dark: "#D99156",
        },
        info: {
          DEFAULT: "#6A9BEF",
          light: "#8AB4F5",
          dark: "#4A7BD0",
        },
        destructive: {
          DEFAULT: "#E86E6E",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
