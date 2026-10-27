import { ref } from 'vue'
import { supabase } from '../supabaseClient'

export function useGrupos() {
  const grupos = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    error.value = null
    if (!supabase) {
      error.value = 'Supabase no está conectado'
      loading.value = false
      return
    }
    try {
      const { data, error: err } = await supabase
        .from('grupos')
        .select('*')
        .order('id', { ascending: true })
      if (err) throw err
      grupos.value = data || []
    } catch (e) {
      error.value = e.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(grupo) {
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('grupos')
        .insert(grupo)
        .select()
        .single()
      if (err) throw err
      grupos.value.push(data)
      return data
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function update(id, changes) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('grupos')
        .update(changes)
        .eq('id', id)
      if (err) throw err
      const idx = grupos.value.findIndex(g => g.id === id)
      if (idx !== -1) grupos.value[idx] = { ...grupos.value[idx], ...changes }
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function remove(grupoOrId, codigo) {
    error.value = null

    const id = typeof grupoOrId === 'object' && grupoOrId !== null ? grupoOrId.id : grupoOrId
    const codigoGrupo = typeof grupoOrId === 'object' && grupoOrId !== null
      ? grupoOrId.codigo
      : codigo || grupos.value.find(g => g.id === id)?.codigo

    if (!codigoGrupo) {
      const missingCodigoError = new Error('No se puede eliminar el grupo: falta el código de grupo para verificar referencias.')
      error.value = missingCodigoError.message
      throw missingCodigoError
    }

    try {
      // Check FK references by business code before deleting the group.
      const { count: foodCount, error: foodCountErr } = await supabase
        .from('alimento')
        .select('*', { count: 'exact', head: true })
        .eq('codigo_grupo', codigoGrupo)
      if (foodCountErr) throw foodCountErr
      if (foodCount > 0) {
        throw new Error(
          `No se puede eliminar: hay ${foodCount} alimento(s) asociados a este grupo.`
        )
      }

      const { count: subgrupoCount, error: subgrupoCountErr } = await supabase
        .from('subgrupos')
        .select('*', { count: 'exact', head: true })
        .eq('codigo_grupo', codigoGrupo)
      if (subgrupoCountErr) throw subgrupoCountErr
      if (subgrupoCount > 0) {
        throw new Error(
          `No se puede eliminar: hay ${subgrupoCount} subgrupo(s) asociados a este grupo.`
        )
      }

      const { error: err } = await supabase
        .from('grupos')
        .delete()
        .eq('id', id)
      if (err) throw err
      grupos.value = grupos.value.filter(g => g.id !== id)
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  return { grupos, loading, error, load, create, update, remove }
}
