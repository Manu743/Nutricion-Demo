import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { normalizeText } from '../utils/textSearch'

export function useFoods() {
  const foods = ref([])
  const allFoods = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Filtra en memoria el catálogo ya cargado: sin acentos ni mayúsculas.
  function applyFilters(filters = {}) {
    const term = normalizeText(filters.search)
    const grupo = filters.grupo ? String(filters.grupo) : ''
    foods.value = allFoods.value.filter(food => {
      if (term && !normalizeText(food.alimento).includes(term)) return false
      if (grupo && String(food.codigo_grupo) !== grupo) return false
      return true
    })
  }

  async function list(filters = {}) {
    loading.value = true
    error.value = null
    if (!supabase) {
      error.value = 'Supabase no está conectado'
      loading.value = false
      return
    }
    try {
      const { data, error: err } = await supabase
        .from('alimento')
        .select(`
          id_ali,
          alimento,
          codigo,
          codigo_grupo,
          id_subgrupo,
          tipo_alimento,
          notas,
          activo,
          grupos(grupo),
          subgrupos(nombre),
          composicion(*)
        `)
        .eq('activo', true)

      if (err) throw err

      allFoods.value = (data || []).map(item => ({
        id_ali: item.id_ali,
        alimento: item.alimento,
        codigo: item.codigo,
        codigo_grupo: item.codigo_grupo,
        id_subgrupo: item.id_subgrupo,
        tipo_alimento: item.tipo_alimento,
        notas: item.notas,
        grupo: item.grupos?.grupo || 'N/A',
        subgrupo: item.subgrupos?.nombre || 'N/A',
        // Composición nutricional
        energia_kcal: item.composicion?.energia_kcal,
        humedad: item.composicion?.humedad,
        proteina_animal: item.composicion?.proteina_animal,
        proteina_vegetal: item.composicion?.proteina_vegetal,
        grasa: item.composicion?.grasa,
        cho_simples: item.composicion?.cho_simples,
        cho_complejos: item.composicion?.cho_complejos,
        f_cruda: item.composicion?.f_cruda,
        ceniza: item.composicion?.ceniza,
        calcio: item.composicion?.calcio,
        fosforo: item.composicion?.fosforo,
        hierro_hem: item.composicion?.hierro_hem,
        hierro_no_hem: item.composicion?.hierro_no_hem,
        zinc: item.composicion?.zinc,
        sodio: item.composicion?.sodio,
        potasio: item.composicion?.potasio,
        magnesio: item.composicion?.magnesio,
        selenio: item.composicion?.selenio,
        cobre: item.composicion?.cobre,
        sodio_meq: item.composicion?.sodio_meq,
        potasio_meq: item.composicion?.potasio_meq,
        vit_a: item.composicion?.vit_a,
        tiamina: item.composicion?.tiamina,
        riboflavina: item.composicion?.riboflavina,
        niacina: item.composicion?.niacina,
        folatos: item.composicion?.folatos,
        vit_b12: item.composicion?.vit_b12,
        vit_c: item.composicion?.vit_c
      }))

      applyFilters(filters)
    } catch (e) {
      error.value = e.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(alimentoData) {
    error.value = null
    try {
      // 1. Insertar alimento
      const alimentoPayload = {
        alimento: alimentoData.alimento,
        codigo: alimentoData.codigo || null,
        codigo_grupo: alimentoData.codigo_grupo,
        id_subgrupo: alimentoData.id_subgrupo || null,
        tipo_alimento: alimentoData.tipo_alimento || 'normal',
        notas: alimentoData.notas || null,
        activo: true
      }

      const { data: insertedAlimento, error: alimentoErr } = await supabase
        .from('alimento')
        .insert(alimentoPayload)
        .select()
        .single()
      if (alimentoErr) throw alimentoErr

      const id_ali = insertedAlimento?.id_ali || insertedAlimento?.id
      if (!id_ali) throw new Error('No se pudo obtener el id del alimento insertado.')

      // 2. Insertar composición nutricional
      const composicionPayload = {
        id_ali,
        energia_kcal: alimentoData.energia_kcal ?? null,
        humedad: alimentoData.humedad ?? null,
        proteina_animal: alimentoData.proteina_animal ?? null,
        proteina_vegetal: alimentoData.proteina_vegetal ?? null,
        grasa: alimentoData.grasa ?? null,
        cho_simples: alimentoData.cho_simples ?? null,
        cho_complejos: alimentoData.cho_complejos ?? null,
        f_cruda: alimentoData.f_cruda ?? null,
        ceniza: alimentoData.ceniza ?? null,
        calcio: alimentoData.calcio ?? null,
        fosforo: alimentoData.fosforo ?? null,
        hierro_hem: alimentoData.hierro_hem ?? null,
        hierro_no_hem: alimentoData.hierro_no_hem ?? null,
        zinc: alimentoData.zinc ?? null,
        sodio: alimentoData.sodio ?? null,
        potasio: alimentoData.potasio ?? null,
        magnesio: alimentoData.magnesio ?? null,
        selenio: alimentoData.selenio ?? null,
        cobre: alimentoData.cobre ?? null,
        sodio_meq: alimentoData.sodio_meq ?? null,
        potasio_meq: alimentoData.potasio_meq ?? null,
        vit_a: alimentoData.vit_a ?? null,
        tiamina: alimentoData.tiamina ?? null,
        riboflavina: alimentoData.riboflavina ?? null,
        niacina: alimentoData.niacina ?? null,
        folatos: alimentoData.folatos ?? null,
        vit_b12: alimentoData.vit_b12 ?? null,
        vit_c: alimentoData.vit_c ?? null
      }

      const { error: compErr } = await supabase
        .from('composicion')
        .insert(composicionPayload)
      if (compErr) throw compErr

      return {
        id_ali,
        ...alimentoPayload,
        ...composicionPayload
      }
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function softDelete(id) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('alimento')
        .update({ activo: false })
        .eq('id_ali', id)
      if (err) throw err
      allFoods.value = allFoods.value.filter(f => f.id_ali !== id)
      foods.value = foods.value.filter(f => f.id_ali !== id)
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function getById(id) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('alimento')
        .select(`
          *,
          grupos(grupo),
          subgrupos(nombre),
          composicion(*)
        `)
        .eq('id_ali', id)
        .single()
      if (err) throw err
      return data
    } catch (e) {
      error.value = e.message || String(e)
      return null
    } finally {
      loading.value = false
    }
  }

  return { foods, loading, error, list, applyFilters, create, softDelete, getById }
}
