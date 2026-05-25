import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        up: '#ef4444',
        down: '#22c55e',
        neutral: '#6b7280',
      },
    },
  },
  plugins: [],
} satisfies Config;
