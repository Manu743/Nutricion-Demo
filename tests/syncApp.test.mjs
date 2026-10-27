import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile, cp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))

test('sync-app keeps src when the real app is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nutricion-sync-'))
  try {
    const demoRoot = join(root, 'demo')
    await mkdir(join(demoRoot, 'scripts'), { recursive: true })
    await cp(
      join(repoRoot, 'scripts', 'sync-app.mjs'),
      join(demoRoot, 'scripts', 'sync-app.mjs')
    )
    await mkdir(join(demoRoot, 'src'), { recursive: true })
    const sentinel = join(demoRoot, 'src', 'App.vue')
    await writeFile(sentinel, 'sentinel')

    const result = spawnSync(process.execPath, ['scripts/sync-app.mjs'], {
      cwd: demoRoot,
      encoding: 'utf8'
    })

    assert.equal(result.status, 1)
    assert.match(result.stderr, /No se encontró la app real/)
    assert.equal(await readFile(sentinel, 'utf8'), 'sentinel')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
