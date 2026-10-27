// Nutrientes con valor recomendado por comida y sus fuentes en `composicion`.
// Proteína y carbohidratos se muestran como totales (animal + vegetal, simples + complejos).
export const MEAL_NUTRIENTS = [
  {
    key: 'energia',
    recKey: 'energia_kcal_rec',
    label: 'Energía',
    unit: 'kcal',
    sources: ['energia_kcal']
  },
  {
    key: 'proteina',
    recKey: 'proteina_rec',
    label: 'Proteína',
    unit: 'g',
    sources: ['proteina_animal', 'proteina_vegetal']
  },
  {
    key: 'grasa',
    recKey: 'grasa_rec',
    label: 'Lípidos',
    unit: 'g',
    sources: ['grasa']
  },
  {
    key: 'cho',
    recKey: 'cho_rec',
    label: 'Carbohidratos',
    unit: 'g',
    sources: ['cho_simples', 'cho_complejos']
  }
]

export const ADEQUACY_MIN = 90
export const ADEQUACY_MAX = 110

// Aporte de un alimento a un nutriente: valor por 100 g × gramos / 100.
export function itemNutrient(item, nutrient) {
  const gramos = Number(item.gramos) || 0
  return nutrient.sources.reduce((acc, key) => {
    const value = Number(item[key])
    return Number.isFinite(value) ? acc + value * gramos / 100 : acc
  }, 0)
}

export function mealNutrient(meal, nutrient) {
  return (meal.items || []).reduce((acc, item) => acc + itemNutrient(item, nutrient), 0)
}

// Adecuación = consumo real / recomendado × 100. Sin recomendación no hay porcentaje.
export function adequacyPct(actual, recommended) {
  const value = Number(recommended)
  if (!Number.isFinite(value) || value <= 0) return null
  return actual / value * 100
}

export function isOutOfRange(pct) {
  return pct !== null && (pct < ADEQUACY_MIN || pct > ADEQUACY_MAX)
}
