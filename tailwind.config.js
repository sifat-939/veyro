const fs = require('fs');
const path = require('path');
const colors = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'colors.json'), { encoding: 'utf-8' })
);

module.exports = {
  darkMode: 'class',
  purge: {
    enabled: process.env.NODE_ENV !== 'development',
    content: [
      path.join(__dirname, 'src/index.html'),
      path.join(__dirname, 'src/**/*.{vue,js,ts,jsx,tsx}'),
      path.join(__dirname, 'templates/**/*.html'),
    ],
    options: {
      safelist: [
        /^(bg|text|border)-(gray|orange|green|red|yellow|blue|indigo|pink|purple|teal)-(50|100|200|300|400|500|600|700|800|900)$/,
        /(^|:)dark:(bg|text|border)-(gray|orange|green|red|yellow|blue|indigo|pink|purple|teal)-(50|100|200|300|400|500|600|700|800|900)$/,
        /^(bg|text|border)-gray-(25|850|875|890)$/,
        /(^|:)dark:(bg|text|border)-gray-(25|850|875|890)$/,
        'bg-opacity-20',
      ],
    },
  },
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        'monospace',
      ],
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      lg: '14px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px',
    },
    extend: {
      maxHeight: {
        64: '16rem',
      },
      minWidth: {
        40: '10rem',
        56: '14rem',
      },
      maxWidth: {
        32: '8rem',
        56: '14rem',
      },
      spacing: {
        7: '1.75rem',
        14: '3.5rem',
        18: '4.5rem',
        28: '7rem',
        72: '18rem',
        80: '20rem',
      },
      boxShadow: {
        'outline-px': '0 0 0 1px rgba(20, 125, 120, 0.35)',
        DEFAULT: '0 2px 8px 0 rgba(22, 44, 53, 0.04)',
        md: '0 0 2px 0 rgba(0, 0, 0, 0.10), 0 2px 4px 0 rgba(0, 0, 0, 0.08)',
        button: '0 0.5px 0 0 rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        sm: '0.375rem', // 6px
        DEFAULT: '0.5rem', // 8px
        md: '0.625rem', // 10px
        lg: '0.875rem', // 14px
        xl: '1rem', // 16px
      },
      gridColumn: {
        'span-full': '1 / -1',
      },
      colors,
    },
  },
  variants: {
    margin: ['responsive', 'first', 'last', 'hover', 'focus'],
    backgroundColor: [
      'responsive',
      'first',
      'hover',
      'focus',
      'focus-within',
      'dark',
    ],
    display: ['group-hover'],
    borderWidth: ['last'],
    fontWeight: ['dark'],
  },
  plugins: [require('tailwindcss-rtl')],
};

/*
 * 208, 100, 50
 * 209,  62, 50
 */
