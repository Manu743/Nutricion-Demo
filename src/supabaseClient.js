// En la demo no hay backend: este cliente resuelve las consultas en memoria
// y guarda los cambios en localStorage. La app real usa Supabase.
import { createDemoClient } from './demo/demoClient'

export const supabase = createDemoClient()

export function resetDemoDatabase() {
  supabase.reset()
}
