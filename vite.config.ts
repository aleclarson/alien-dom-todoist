import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import alienDOM from '@alien-dom/vite'
import unocss from '@unocss/vite'

export default defineConfig({
  plugins: [alienDOM(), unocss(), tsconfigPaths()],
})
