const { fontFamily } = require('tailwindcss/defaultTheme');

const config = {
  darkMode: ['class'],
  content: ['./public/index.html', './src/**/*.{js,jsx,ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom
        violet: {
          DEFAULT: '#904AFF',
          50: '#F6F2FF',
          100: '#EEE8FF',
          200: '#DFD4FF',
          300: '#C8B1FF',
          400: '#AE85FF',
          500: '#904AFF',
          600: '#8930F7',
          700: '#7B1EE3',
          800: '#6718BF',
          900: '#55169C',
          950: '#350B6A',
        },
        seagull: {
          DEFAULT: '#67D7F9',
          50: '#F0FAFF',
          100: '#E0F5FE',
          200: '#BBECFC',
          300: '#67D7F9',
          400: '#3BCDF5',
          500: '#12B7E5',
          600: '#0594C4',
          700: '#06769E',
          800: '#096383',
          900: '#0E526C',
          950: '#093548',
        },
        blue: {
          DEFAULT: '#468CC4',
        },
        green: {
          DEFAULT: '#00FFB2',
        },
        red: {
          DEFAULT: '#FF4A55',
        },
        neutral: {
          DEFAULT: '#6D6D6D',
          50: '#F6F6F6',
          100: '#E7E7E7',
          200: '#D1D1D1',
          300: '#B0B0B0',
          400: '#888888',
          500: '#6D6D6D',
          600: '#5D5D5D',
          700: '#4F4F4F',
          800: '#454545',
          900: '#3D3D3D',
          950: '#000000',
        },
        default: {
          DEFAULT: '#1A0C31',
          light: '#251244',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
      },
      screens: {
        xs: '390px',
        'xs+': '420px',
        sm: '640px',
        md: '768px',
        'md+': '875px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1512px',
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3840px',
      },
      fontSize: {
        '4xl': '40px',
        '6xl': '54px',
        '7xl': '60px',
        '8xl': '90px',
        '9xl': '96px',
        '10xl': '106px',
        '11xl': '118px',
        '12xl': '140px',
        '13xl': '146px',
        '14xl': '160px',
        '15xl': '220px',
      },
      transitionTimingFunction: {
        easeOutCubic: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)',
        easeInCubic: 'cubic-bezier(0.550, 0.055, 0.675, 0.190)',
        easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
        easeFormOpen: 'cubic-bezier(0.1, 0, 0.1, 1)',
        easeFormClose: 'cubic-bezier(0.2, 0, 0, 1)',
        easeInOutExpo: 'cubic-bezier(1.000, 0.000, 0.000, 1.000)',
        easeInOutQuart: 'cubic-bezier(0.770, 0.000, 0.175, 1.000)',
      },
      transitionDuration: {
        700: '700ms',
        1500: '1500ms',
        2000: '2000ms',
        2500: '2500ms',
        3000: '3000ms',
      },
      backgroundSize: {
        'size-200': '150% 100%',
      },
      backgroundPosition: {
        'pos-0': '100% 100%',
        'pos-50': '15px 50%',
        'pos-100': '50% 100%',
      },
      backgroundImage: {
        search: "url('/SearchIcon.svg')",
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};

export default config;
