/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f0a1a',
                surface: 'rgba(20, 15, 35, 0.6)',
                'sidebar-glass': 'rgba(15, 10, 25, 0.85)',
                primary: '#FFFFFF',
                secondary: '#8E8E93',
                accent: '#8B5CF6', // Violet-500
                error: '#FF453A',
            },
            fontFamily: {
                sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 15px rgba(139, 92, 246, 0.2), inset 0 0 10px rgba(139, 92, 246, 0.05)',
                'glow-lg': '0 0 30px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.1)',
            }
        },
    },
    plugins: [],
}
