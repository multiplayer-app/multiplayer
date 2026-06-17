import { defineConfig } from 'vite'
import * as path from 'path'
import pkg from './package.json'
import react from '@vitejs/plugin-react'
import commonjs from '@rollup/plugin-commonjs'
import tsconfigPaths from 'vite-tsconfig-paths'
import dts from 'vite-plugin-dts'
import tailwindcss from 'tailwindcss'
import svgr from 'vite-plugin-svgr'

const deps = Object.keys({
  ...pkg.dependencies,
  ...pkg.peerDependencies,
  ...pkg.devDependencies,
})

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
  },
  plugins: [
    react(),
    svgr(),
    tsconfigPaths(),
    dts({
      outDir: 'dist',
      staticImport: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'multiplayer-blocknote',
      fileName: format => `index.${format}.js`,
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      plugins: [commonjs()],
      external: (source: string) => {
        if (deps.includes(source)) {
          return true
        }
        return source.includes('prosemirror')
      },
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        interop: 'compat',
        dir: 'dist',
      },
    },
    sourcemap: true,
    emptyOutDir: true,
    outDir: 'dist',
  },
})
