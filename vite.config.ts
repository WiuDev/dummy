import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Usa o `paths` do tsconfig (alias `@/` → `src/`).
    tsconfigPaths: true,
  },
})
