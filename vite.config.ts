import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    host: true, // This tells Vite to listen on all addresses, including 0.0.0.0
    allowedHosts: [
      'unslippered-nonmoveably-arnita.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
    ],
  },
  preview: {
    port: 5173,
    host: true,
    allowedHosts: [
      'unslippered-nonmoveably-arnita.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.io',
    ],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});