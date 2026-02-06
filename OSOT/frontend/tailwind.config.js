/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './index.html',
  ],
  safelist: [
    {
      pattern: /^(bg|text|border|ring|from|to)-(brand)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        // OSOT Layout Colors
        'sidebar-bg': 'hsl(var(--sidebar-bg))',
        'sidebar-border': 'hsl(var(--sidebar-border))',
        'sidebar-text': 'hsl(var(--sidebar-text))',
        'sidebar-text-muted': 'hsl(var(--sidebar-text-muted))',
        'sidebar-hover': 'hsl(var(--sidebar-hover))',
        'sidebar-active-bg': 'hsl(var(--sidebar-active-bg))',
        'sidebar-active-text': 'hsl(var(--sidebar-active-text))',
        'header-bg': 'hsl(var(--header-bg))',
        'header-border': 'hsl(var(--header-border))',
        'header-text': 'hsl(var(--header-text))',
        'content-bg': 'hsl(var(--content-bg))',
        'notification-bg': 'hsl(var(--notification-bg))',
        'notification-border': 'hsl(var(--notification-border))',
        'notification-text': 'hsl(var(--notification-text))',
        'info-label': 'hsl(var(--info-label))',
        'info-value': 'hsl(var(--info-value))',
        // OSOT Custom Colors
        osot: {
          primary: '#1e40af', // Blue
          secondary: '#10b981', // Green
          accent: '#f59e0b', // Amber
          danger: '#ef4444', // Red
        },
        // OSOT Brand Colors
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#314379', // Base color
          600: '#2a3a68',
          700: '#233157',
          800: '#1c2846',
          900: '#151f35',
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
}

