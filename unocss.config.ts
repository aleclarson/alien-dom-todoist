import { defineConfig } from '@unocss/vite'
import alloc, { Theme } from 'unocss-preset-alloc'

export default defineConfig<Theme>({
  include: ['**/src/**/*.{tsx,jsx,html}'],
  exclude: ['**/*.css'],
  presets: [alloc()],
})
