// "vite-plugin-dts": "^4.5.4",

import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import pluginChecker from 'vite-plugin-checker'
// import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    nodePolyfills(),
    // dts({ rollupTypes: true }),
    pluginChecker({ typescript: true }),
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'CalendarClient',
      fileName: 'index',
    },
  },
  resolve: {
    alias: {
      'node-fetch': 'axios',
    },
  },
})
