import test from 'node:test'
import assert from 'node:assert/strict'
import { useColumnVisibility } from '../src/composables/useColumnVisibility.js'

const COLUMNS = [
  { key: 'energia_kcal', label: 'Energía', unit: 'kcal' },
  { key: 'grasa', label: 'Grasa' },
  { key: 'calcio', label: 'Ca' }
]

// Cada test usa una clave propia: el composable cachea el estado por clave.
function uniqueKey(name) {
  return `test.columnVisibility.${name}.${Math.random().toString(36).slice(2)}`
}

test('shows every column when nothing is stored', () => {
  const state = useColumnVisibility(COLUMNS, uniqueKey('defaults'))

  assert.deepEqual(state.visibleColumns.value, ['energia_kcal', 'grasa', 'calcio'])
  assert.deepEqual(state.visibleColDefs.value.map(col => col.key), ['energia_kcal', 'grasa', 'calcio'])
})

test('toggling a column off removes it from the visible definitions', () => {
  const state = useColumnVisibility(COLUMNS, uniqueKey('toggle'))

  state.toggleColumn('grasa')

  assert.deepEqual(state.visibleColumns.value, ['energia_kcal', 'calcio'])
  assert.deepEqual(state.visibleColDefs.value.map(col => col.key), ['energia_kcal', 'calcio'])

  state.toggleColumn('grasa')

  assert.deepEqual(state.visibleColumns.value, ['energia_kcal', 'grasa', 'calcio'])
})

test('show all and hide all reset the selection', () => {
  const state = useColumnVisibility(COLUMNS, uniqueKey('all'))

  state.hideAllColumns()
  assert.equal(state.visibleColDefs.value.length, 0)

  state.showAllColumns()
  assert.equal(state.visibleColDefs.value.length, COLUMNS.length)
})

test('two views sharing a storage key stay in sync', () => {
  const key = uniqueKey('shared')
  const editor = useColumnVisibility(COLUMNS, key)
  const totals = useColumnVisibility(COLUMNS, key)

  editor.toggleColumn('calcio')

  assert.deepEqual(totals.visibleColumns.value, ['energia_kcal', 'grasa'])
})

test('each storage key keeps its own selection', () => {
  const dietA = useColumnVisibility(COLUMNS, uniqueKey('diet-a'))
  const dietB = useColumnVisibility(COLUMNS, uniqueKey('diet-b'))

  dietA.toggleColumn('grasa')

  assert.deepEqual(dietA.visibleColumns.value, ['energia_kcal', 'calcio'])
  assert.deepEqual(dietB.visibleColumns.value, ['energia_kcal', 'grasa', 'calcio'])
})

test('persists the selection and restores it for a new state', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value))
  }

  try {
    const key = uniqueKey('persist')
    const state = useColumnVisibility(COLUMNS, key)
    state.toggleColumn('energia_kcal')

    assert.deepEqual(JSON.parse(store.get(key)), ['grasa', 'calcio'])
  } finally {
    delete globalThis.localStorage
  }
})
