import { ref } from 'vue'
import { supabase } from '../supabaseClient'

export function useSubgrupos() {
  const subgrupos = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load(grupoId) {
    loading.value = true
    error.value = null
    if (!supabase) {
      error.value = 'Supabase no está conectado'
      loading.value = false
      return
    }
    try {
      let query = supabase
        .from('subgrupos')
        .select('*, grupos(grupo)')
        .order('id', { ascending: true })
      if (grupoId) {
        query = query.eq('codigo_grupo', grupoId)
      }
      const { data, error: err } = await query
      if (err) throw err
      subgrupos.value = data || []
    } catch (e) {
      error.value = e.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(subgrupo) {
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('subgrupos')
        .insert(subgrupo)
        .select('*, grupos(grupo)')
        .single()
      if (err) throw err
      subgrupos.value.push(data)
      return data
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function remove(id) {
    error.value = null
    try {
      // Check FK references in alimento
      const { count, error: countErr } = await supabase
        .from('alimento')
        .select('*', { count: 'exact', head: true })
        .eq('id_subgrupo', id)
      if (countErr) throw countErr
      if (count > 0) {
        throw new Error(
          `No se puede eliminar: hay ${count} alimento(s) asociados a este subgrupo.`
        )
      }

      const { error: err } = await supabase
        .from('subgrupos')
        .delete()
        .eq('id', id)
      if (err) throw err
      subgrupos.value = subgrupos.value.filter(s => s.id !== id)
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  return { subgrupos, loading, error, load, create, remove }
}
