/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        'canvas-soft': 'var(--canvas-soft)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-mute': 'var(--ink-mute)',
        indigo: 'var(--indigo)',
        'indigo-deep': 'var(--indigo-deep)',
        cyan: 'var(--cyan)',
        night: 'var(--night)',
        danger: 'var(--danger)',
        warn: 'var(--warn)',
        calm: 'var(--calm)',
      },
      fontFamily: {
        sans: ['Schibsted Grotesk', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        deva: ['Noto Sans Devanagari', 'Schibsted Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        media: 'var(--radius-media)',
      },
      maxWidth: {
        shell: '1680px',
      },
    },
  },
  plugins: [],
};
