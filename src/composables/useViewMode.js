import { ref, watch } from 'vue'

const MODES = ['table', 'cards']

// Persiste el modo de visualización por vista usando `storageKey`.
export function useViewMode(storageKey, defaultMode = 'table') {
  function loadViewMode() {
    try {
      const saved = localStorage.getItem(storageKey)
      if (MODES.includes(saved)) return saved
    } catch (e) {
      // localStorage no disponible: se usa el modo por defecto
    }
    return defaultMode
  }

  const viewMode = ref(loadViewMode())

  watch(viewMode, mode => {
    try {
      localStorage.setItem(storageKey, mode)
    } catch (e) {
      // Persistencia opcional: falla silenciosa si localStorage no está disponible
    }
  })

  return { viewMode }
}
