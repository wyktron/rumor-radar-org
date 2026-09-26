import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        viral: {
          DEFAULT: "hsl(var(--viral))",
          foreground: "hsl(var(--viral-foreground))",
        },
        attention: {
          DEFAULT: "hsl(var(--attention))",
          foreground: "hsl(var(--attention-foreground))",
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
        signal: {
          low: "hsl(var(--signal-low))",
          moderate: "hsl(var(--signal-moderate))",
          high: "hsl(var(--signal-high))",
          viral: "hsl(var(--signal-viral))",
          debunked: "hsl(var(--signal-debunked))",
          verified: "hsl(var(--signal-verified))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'gradient-radar': 'var(--gradient-radar)',
        'gradient-panel': 'var(--gradient-panel)',
        'gradient-signal': 'var(--gradient-signal)',
        'gradient-danger': 'var(--gradient-danger)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        panel: 'var(--shadow-panel)',
        elev: 'var(--shadow-elev)',
        attention: 'var(--shadow-attention)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 16px hsl(var(--primary) / 0.4)" },
          "50%": { boxShadow: "0 0 28px hsl(var(--primary) / 0.7)" },
        },
        "aura-breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.35)", opacity: "0.95" },
        },
        "hue-cycle": {
          "0%": { filter: "hue-rotate(0deg)" },
          "100%": { filter: "hue-rotate(360deg)" },
        },
        "attention-shake": {
          "0%, 88%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "91%": { transform: "translateX(-2px) rotate(-6deg)" },
          "94%": { transform: "translateX(2px) rotate(6deg)" },
          "97%": { transform: "translateX(-1px) rotate(-3deg)" },
        },
        "swipe-hint": {
          "0%": { transform: "translateY(6px)", opacity: "0.2" },
          "50%": { transform: "translateY(-6px)", opacity: "1" },
          "100%": { transform: "translateY(6px)", opacity: "0.2" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        "aura-breathe": "aura-breathe 3s ease-in-out infinite",
        "hue-cycle": "hue-cycle 6s linear infinite",
        "attention-shake": "attention-shake 5s ease-in-out infinite",
        "swipe-hint": "swipe-hint 1.6s ease-in-out infinite",
      },

    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
