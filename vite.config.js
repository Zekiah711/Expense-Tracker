// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Expense-Tracker/', // must match GitHub repo name exactly (case-sensitive)
  plugins: [react()],
});