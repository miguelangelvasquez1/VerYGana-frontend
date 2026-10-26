import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Solo lógica sin interfaz: entorno node. El alias `@` replica el de tsconfig.json.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
});
