import { ref, computed } from 'vue'

// Estado compartido por `storageKey`: dos componentes que piden la misma vista
// comparten la misma selección (por ejemplo, detalle por comida y totales).
const sharedStates = new Map()

// `columns` debe ser un array estático de { key, label }.
// La selección se persiste por vista usando `storageKey`.
function createState(columns, storageKey) {
  function loadVisibleColumns() {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw !== null) {
        const saved = JSON.parse(raw)
        if (Array.isArray(saved)) {
          return columns.map(col => col.key).filter(key => saved.includes(key))
        }
      }
    } catch (e) {
      // localStorage no disponible o JSON inválido: se usan todas las columnas
    }
    return columns.map(col => col.key)
  }

  const showPanel = ref(false)
  const visibleColumns = ref(loadVisibleColumns())

  const visibleColDefs = computed(() =>
    columns.filter(col => visibleColumns.value.includes(col.key))
  )

  function persistVisibleColumns() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns.value))
    } catch (e) {
      // Persistencia opcional: falla silenciosa si localStorage no está disponible
    }
  }

  function toggleColumn(key) {
    const next = new Set(visibleColumns.value)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    visibleColumns.value = columns.filter(col => next.has(col.key)).map(col => col.key)
    persistVisibleColumns()
  }

  function showAllColumns() {
    visibleColumns.value = columns.map(col => col.key)
    persistVisibleColumns()
  }

  function hideAllColumns() {
    visibleColumns.value = []
    persistVisibleColumns()
  }

  return {
    showPanel,
    visibleColumns,
    visibleColDefs,
    toggleColumn,
    showAllColumns,
    hideAllColumns
  }
}

export function useColumnVisibility(columns, storageKey) {
  let state = sharedStates.get(storageKey)
  if (!state) {
    state = createState(columns, storageKey)
    sharedStates.set(storageKey, state)
  }
  return state
}
