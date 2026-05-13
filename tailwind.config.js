/** @type {import('tailwindcss').Config} */
module.exports = {
  // Habilitamos el modo oscuro basado en una clase en el HTML
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Definimos tu paleta de colores personalizada
        primary: {
          DEFAULT: '#0b6c9c', // Tu color principal
          light: '#33b0e3',   // Tu color de contraste/acento
        },
        dark: {
          // Colores para el modo oscuro
          background: '#1a202c',
          surface: '#2d3748',
          text: '#e2e8f0',
          muted: '#718096',
        }
      },
      // Añadimos transiciones para animaciones suaves
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [],
}