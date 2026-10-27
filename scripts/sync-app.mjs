// Regenera src a partir de la app real (../src) y del overlay de la demo.
// Fuente de verdad: la app. Solo se reemplazan los archivos de overlay
// (cliente de datos, main.js y el marco visual).
import { access, cp, rm, readFile, readdir } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const demoRoot = join(here, '..')
const appSrc = join(demoRoot, '..', 'src')
const demoSrc = join(demoRoot, 'src')
const overlay = join(demoRoot, 'overlay')

// La app real exporta el cliente de Supabase; la demo lo reemplaza.
const REPLACED_FILES = new Set(['supabaseClient.js'])

const REQUIRED_AFTER_SYNC = [
  'App.vue',
  'main.js',
  'supabaseClient.js',
  'demo/demoClient.js',
  'demo/seedData.js',
  'DemoShell.vue'
]

async function countFiles(directory) {
  let total = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    total += entry.isDirectory() ? await countFiles(join(directory, entry.name)) : 1
  }
  return total
}

// Sin la app real como hermana, borrar src/ dejaría la demo sin código. El
// fallo tiene que ocurrir antes de tocar nada.
try {
  await access(appSrc)
} catch {
  console.error(`No se encontró la app real en ${appSrc}.`)
  console.error('Este comando necesita el repositorio de la app como carpeta hermana. No se modificó src/.')
  process.exit(1)
}

await rm(demoSrc, { recursive: true, force: true })
await cp(appSrc, demoSrc, {
  recursive: true,
  filter: source => !REPLACED_FILES.has(basename(source))
})
await cp(overlay, demoSrc, { recursive: true })

for (const relativePath of REQUIRED_AFTER_SYNC) {
  try {
    await readFile(join(demoSrc, relativePath))
  } catch (error) {
    throw new Error(`Falta ${relativePath} después de sincronizar. Revisá demo/overlay.`)
  }
}

const clientSource = await readFile(join(demoSrc, 'supabaseClient.js'), 'utf8')
if (!clientSource.includes('createDemoClient')) {
  throw new Error('demo/src/supabaseClient.js no es el cliente de la demo. Revisá el overlay.')
}

console.log(`demo/src sincronizado: ${await countFiles(demoSrc)} archivos desde ${appSrc}`)
