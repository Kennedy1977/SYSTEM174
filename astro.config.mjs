// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://system174.co.uk',
  output: 'server',
  adapter: node({
    mode: 'middleware',
  }),
  vite: {
    plugins: [tailwindcss()]
  }
});
