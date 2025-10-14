/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enhanced dark mode palette
        'blood-red': '#DC2626',
        'deep-red': '#7F1D1D',
        'shadow-black': '#0F1419',
        'void-black': '#000000',
        'slate-darker': '#0F172A',
        'slate-dark': '#1E293B',
        'slate-medium': '#334155',
        'slate-light': '#64748B',
        'pale-gray': '#94A3B8',
        'dead-white': '#F1F5F9',
        'warning-red': '#EF4444',
        'toxic-green': '#10B981',
        'neon-green': '#00FF41',
        'electric-blue': '#3B82F6',
        // Aliases for components
        'primary': '#DC2626',
        'secondary': '#10B981',
        'dark': '#0F1419',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Orbitron', 'sans-serif'],
        'mono': ['Rubik Mono One', 'monospace'],
        'horror': ['Inter', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'flicker': 'flicker 0.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'horror': '0 0 20px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.8)',
        'glow-red': '0 0 15px rgba(255, 0, 0, 0.8)',
        'inner-dark': 'inset 0 2px 15px rgba(0, 0, 0, 0.9)',
      },
    },
  },
  plugins: [],
}
