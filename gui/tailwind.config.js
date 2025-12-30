/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0D0D0D',
                surface: '#1C1C1E', // with opacity in usage usually
                primary: '#FFFFFF',
                secondary: '#8E8E93',
                accent: '#B026FF',
                error: '#FF453A',
            },
            fontFamily: {
                sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 15px rgba(176, 38, 255, 0.2), inset 0 0 10px rgba(176, 38, 255, 0.05)',
            }
        },
    },
    plugins: [],
}
