/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // iOS system colors for light mode
        'ios-blue': '#007AFF',
        'ios-green': '#34C759',
        'ios-indigo': '#5856D6',
        'ios-orange': '#FF9500',
        'ios-pink': '#FF2D55',
        'ios-purple': '#AF52DE',
        'ios-red': '#FF3B30',
        'ios-teal': '#5AC8FA',
        'ios-yellow': '#FFCC00',
        'ios-gray': '#8E8E93',
        'ios-gray2': '#AEAEB2',
        'ios-gray3': '#C7C7CC',
        'ios-gray4': '#D1D1D6',
        'ios-gray5': '#E5E5EA',
        'ios-gray6': '#F2F2F7',
        
        // iOS system colors for dark mode
        'ios-dark-bg': '#1C1C1E',
        'ios-dark-elevated': '#2C2C2E',
        'ios-dark-secondary': '#3A3A3C',
        'ios-dark-tertiary': '#48484A',
        'ios-dark-border': '#38383A',
        'ios-dark-separator': '#545458',
        'ios-dark-text': '#FFFFFF',
        'ios-dark-text-secondary': '#EBEBF5BF', // ~75% white
        'ios-dark-text-tertiary': '#EBEBF599', // ~60% white
        'ios-dark-text-quaternary': '#EBEBF566', // ~40% white
      },
      fontFamily: {
        'sf-pro': ['"SF Pro Display"', '"SF Pro"', 'system-ui', 'sans-serif'],
        'sf-pro-text': ['"SF Pro Text"', 'system-ui', 'sans-serif'],
        'sf-mono': ['"SF Mono"', 'monospace'],
      },
      fontSize: {
        'ios-large-title': ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'ios-title1': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'ios-title2': ['22px', { lineHeight: '28px', fontWeight: '700' }],
        'ios-title3': ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'ios-headline': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'ios-body': ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'ios-callout': ['16px', { lineHeight: '21px', fontWeight: '400' }],
        'ios-subhead': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'ios-footnote': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'ios-caption1': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'ios-caption2': ['11px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        'ios': '10px',
        'ios-sm': '6px',
        'ios-lg': '14px',
      },
      animation: {
        'ios-slide-in': 'ios-slide-in 0.3s ease-out',
        'ios-fade-in': 'ios-fade-in 0.2s ease-out',
      },
      keyframes: {
        'ios-slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'ios-fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}