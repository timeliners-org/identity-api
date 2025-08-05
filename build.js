// build.js - Einfache Build-Konfiguration mit esbuild
import esbuild from 'esbuild'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'))

// Externe Abhängigkeiten aus package.json extrahieren
const externals = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
]

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outdir: 'dist',
  external: externals,
  minify: process.argv.includes('--minify'),
  sourcemap: process.argv.includes('--sourcemap'),
  keepNames: true,
  tsconfig: './tsconfig.json',
  resolveExtensions: ['.ts', '.js'],
  loader: {
    '.ts': 'ts'
  }
}

try {
  console.log('🚀 Building with esbuild...')
  console.log(`📦 Minification: ${buildOptions.minify ? 'enabled' : 'disabled'}`)
  console.log(`🗺️  Source maps: ${buildOptions.sourcemap ? 'enabled' : 'disabled'}`)
  
  await esbuild.build(buildOptions)
  
  console.log('✅ Build completed successfully!')
} catch (error) {
  console.error('❌ Build failed:', error)
  process.exit(1)
}
