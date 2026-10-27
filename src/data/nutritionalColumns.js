// Columnas nutricionales compartidas entre la lista de alimentos y los totales de dietas.
export const NUTRIENT_COLUMNS = [
  { key: 'codigo', label: 'Cód.', raw: true },
  { key: 'codigo_grupo', label: 'Grupo', raw: true },
  { key: 'energia_kcal', label: 'Energía', unit: 'kcal' },
  { key: 'humedad', label: 'Humedad' },
  { key: 'proteina_animal', label: 'Prot. Anim.' },
  { key: 'proteina_vegetal', label: 'Prot. Veget.' },
  { key: 'grasa', label: 'Grasa' },
  { key: 'cho_simples', label: 'CHO S.' },
  { key: 'cho_complejos', label: 'CHO C.' },
  { key: 'f_cruda', label: 'F. Cruda' },
  { key: 'ceniza', label: 'Ceniza' },
  { key: 'calcio', label: 'Ca' },
  { key: 'fosforo', label: 'P' },
  { key: 'hierro_hem', label: 'Fe Hem' },
  { key: 'hierro_no_hem', label: 'Fe No Hem' },
  { key: 'zinc', label: 'Zn' },
  { key: 'sodio', label: 'Na' },
  { key: 'potasio', label: 'K' },
  { key: 'magnesio', label: 'Mg' },
  { key: 'selenio', label: 'Se' },
  { key: 'cobre', label: 'Cu' },
  { key: 'vit_a', label: 'Vit. A' },
  { key: 'tiamina', label: 'Tiamina' },
  { key: 'riboflavina', label: 'Ribofl.' },
  { key: 'niacina', label: 'Niacina' },
  { key: 'folatos', label: 'Folatos' },
  { key: 'vit_b12', label: 'B12' },
  { key: 'vit_c', label: 'Vit. C' }
]

// Columnas numéricas (sin los identificadores de texto) para tablas de totales.
export const NUMERIC_NUTRIENT_COLUMNS = NUTRIENT_COLUMNS.filter(col => !col.raw)

export function formatNutrient(value) {
  if (!value && value !== 0) return '-'
  return Number(value).toFixed(2)
}

// Aporte de un alimento para una columna nutricional: valor por 100 g × gramos / 100.
export function nutrientAmount(item, key) {
  const value = Number(item[key])
  if (!Number.isFinite(value)) return 0
  return value * (Number(item.gramos) || 0) / 100
}
