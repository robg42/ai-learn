/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6B46C1',
        'primary-dark': '#553C9A',
        accent: '#38BDF8',
        'bg-dark': '#0F0F1A',
        'bg-card': '#1A1A2E',
        'text-primary': '#F1F5F9',
        'text-muted': '#94A3B8',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      animation: {
        'badge-earn': 'badge-earn 0.6s ease-out',
        'check-pulse': 'check-pulse 0.5s ease-out',
        'border-sweep': 'border-sweep 0.8s ease-out',
      },
      keyframes: {
        'badge-earn': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'check-pulse': {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'border-sweep': {
          '0%': { borderColor: 'transparent' },
          '50%': { borderColor: '#6B46C1' },
          '100%': { borderColor: '#6B46C1' },
        }
      }
    },
  },
  plugins: [],
};
