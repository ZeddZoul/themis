import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          accent: '#8D240C',
          'accent-hover': '#A12A0E',
          'accent-active': '#741F0A',
        },
        background: {
          main: '#FFFFFF',
          subtle: '#F8F9FA',
        },
        text: {
          primary: '#122438',
          secondary: '#6090A1',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '3rem',
      },
      screens: {
        'mobile': '768px',
        'tablet': '1024px',
        'desktop': '1280px',
      },
    },
  },
  plugins: [],
};
export default config;
