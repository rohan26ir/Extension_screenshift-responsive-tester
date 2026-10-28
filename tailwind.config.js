/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./src/viewer/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#121214',
        canvasDark: '#1f1f1f',
        dockBg: '#18181b',
        frameBorder: '#27272a'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'device-outer': '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'device-inner': 'inset 0 0 4px 2px rgba(0,0,0,0.4)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.25)',
      }
    },
  },
  plugins: [],
}
