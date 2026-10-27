import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { NUMERIC_NUTRIENT_COLUMNS } from '../data/nutritionalColumns'
import { normalizeText } from '../utils/textSearch'

const NUTRIENT_KEYS = NUMERIC_NUTRIENT_COLUMNS.map(col => col.key)

function nutrientsFrom(composicion) {
  const values = {}
  for (const key of NUTRIENT_KEYS) {
    values[key] = composicion?.[key] ?? null
  }
  return values
}

function flattenItem(item) {
  return {
    id: item.id,
    id_ali: item.id_ali,
    gramos: Number(item.gramos) || 0,
    alimento: item.alimento?.alimento || 'Alimento eliminado',
    ...nutrientsFrom(item.alimento?.composicion)
  }
}

const RECOMMENDATION_KEYS = ['energia_kcal_rec', 'proteina_rec', 'grasa_rec', 'cho_rec']

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function recommendationsFrom(meal) {
  const values = {}
  for (const key of RECOMMENDATION_KEYS) {
    values[key] = toNumberOrNull(meal?.[key])
  }
  return values
}

export function useDietas() {
  const dietas = ref([])
  const meals = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Catálogo de alimentos por instancia: se descarga una vez y alimenta todas
  // las búsquedas del editor (insensibles a acentos y mayúsculas).
  let foodCatalogPromise = null

  function loadFoodCatalog() {
    if (!foodCatalogPromise) {
      foodCatalogPromise = supabase
        .from('alimento')
        .select('id_ali, alimento, codigo, composicion(*)')
        .eq('activo', true)
        .order('alimento', { ascending: true })
        .then(({ data, error: err }) => {
          if (err) throw err
          return data || []
        })
        .catch(e => {
          foodCatalogPromise = null
          throw e
        })
    }
    return foodCatalogPromise
  }

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
        .from('dietas')
        .select('*')
        .order('created_at', { ascending: true })
      if (err) throw err
      dietas.value = data || []
    } catch (e) {
      error.value = e.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function create(dieta) {
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('dietas')
        .insert({ nombre: dieta.nombre })
        .select()
        .single()
      if (err) throw err
      dietas.value.push(data)
      return data
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function remove(id) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('dietas')
        .delete()
        .eq('id', id)
      if (err) throw err
      dietas.value = dietas.value.filter(d => d.id !== id)
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function loadMeals(dietaId) {
    loading.value = true
    error.value = null
    if (!supabase) {
      error.value = 'Supabase no está conectado'
      loading.value = false
      return
    }
    try {
      const { data, error: err } = await supabase
        .from('dieta_comidas')
        .select(`
          id,
          dieta_id,
          nombre,
          energia_kcal_rec,
          proteina_rec,
          grasa_rec,
          cho_rec,
          dieta_items(
            id,
            id_ali,
            gramos,
            alimento(alimento, composicion(*))
          )
        `)
        .eq('dieta_id', dietaId)
        .order('id', { ascending: true })
      if (err) throw err
      meals.value = (data || []).map(meal => ({
        id: meal.id,
        dieta_id: meal.dieta_id,
        nombre: meal.nombre,
        ...recommendationsFrom(meal),
        items: (meal.dieta_items || []).map(flattenItem)
      }))
    } catch (e) {
      error.value = e.message || String(e)
    } finally {
      loading.value = false
    }
  }

  async function addMeal(dietaId, nombre) {
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('dieta_comidas')
        .insert({ dieta_id: dietaId, nombre })
        .select()
        .single()
      if (err) throw err
      meals.value.push({ ...data, items: [] })
      return data
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function removeMeal(mealId) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('dieta_comidas')
        .delete()
        .eq('id', mealId)
      if (err) throw err
      meals.value = meals.value.filter(m => m.id !== mealId)
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function updateMealRecommendations(mealId, values) {
    error.value = null
    const payload = {}
    for (const key of RECOMMENDATION_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(values, key)) continue
      const value = toNumberOrNull(values[key])
      if (value !== null && value < 0) {
        const invalid = new Error('Los valores recomendados no pueden ser negativos.')
        error.value = invalid.message
        throw invalid
      }
      payload[key] = value
    }
    if (!Object.keys(payload).length) return

    try {
      const { error: err } = await supabase
        .from('dieta_comidas')
        .update(payload)
        .eq('id', mealId)
      if (err) throw err

      const meal = meals.value.find(m => m.id === mealId)
      if (meal) Object.assign(meal, payload)
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function addItem(comidaId, food, gramos = 100) {
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('dieta_items')
        .insert({ comida_id: comidaId, id_ali: food.id_ali, gramos })
        .select('id')
        .single()
      if (err) throw err

      const meal = meals.value.find(m => m.id === comidaId)
      if (meal) {
        meal.items.push({
          id: data.id,
          id_ali: food.id_ali,
          gramos,
          alimento: food.alimento,
          ...food.nutrients
        })
      }
      return data
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function updateItemGramos(itemId, gramos) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('dieta_items')
        .update({ gramos })
        .eq('id', itemId)
      if (err) throw err
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function removeItem(itemId) {
    error.value = null
    try {
      const { error: err } = await supabase
        .from('dieta_items')
        .delete()
        .eq('id', itemId)
      if (err) throw err

      for (const meal of meals.value) {
        const idx = meal.items.findIndex(item => item.id === itemId)
        if (idx !== -1) {
          meal.items.splice(idx, 1)
          break
        }
      }
    } catch (e) {
      error.value = e.message || String(e)
      throw e
    }
  }

  async function searchFoods(term) {
    error.value = null
    if (!supabase) {
      error.value = 'Supabase no está conectado'
      return []
    }
    const normalized = normalizeText(term)
    if (!normalized) return []

    try {
      const catalog = await loadFoodCatalog()
      return catalog
        .filter(food => normalizeText(food.alimento).includes(normalized))
        .slice(0, 10)
        .map(food => ({
          id_ali: food.id_ali,
          alimento: food.alimento,
          codigo: food.codigo,
          nutrients: nutrientsFrom(food.composicion)
        }))
    } catch (e) {
      error.value = e.message || String(e)
      return []
    }
  }

  return {
    dietas,
    meals,
    loading,
    error,
    load,
    create,
    remove,
    loadMeals,
    addMeal,
    removeMeal,
    updateMealRecommendations,
    addItem,
    updateItemGramos,
    removeItem,
    searchFoods
  }
}
