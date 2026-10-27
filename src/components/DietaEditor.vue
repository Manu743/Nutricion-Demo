<template>
  <section class="dieta-editor">
    <div class="editor-header">
      <h2>Planificación: {{ dieta.nombre }}</h2>
      <button
        class="columns-toggle"
        :class="{ active: showPanel }"
        @click="showPanel = !showPanel"
      >
        Columnas
      </button>
    </div>

    <p class="hint">
      Agregá comidas y alimentos; los totales se calculan automáticamente.
      La adecuación aceptable es {{ ADEQUACY_MIN }}–{{ ADEQUACY_MAX }} %; fuera de ese rango se marca en rojo.
      Las columnas que elijas se aplican a todas las tablas del plan.
    </p>

    <ColumnVisibilityPanel
      v-if="showPanel"
      :columns="numericColumns"
      :visible-columns="visibleColumns"
      @toggle="toggleColumn"
      @show-all="showAllColumns"
      @hide-all="hideAllColumns"
    />

    <div class="meal-form">
      <input
        v-model="newMealNombre"
        type="text"
        class="admin-input"
        placeholder="Nombre de la comida (ej. Desayuno)"
        @keyup.enter="handleAddMeal"
      />
      <button class="btn-primary" :disabled="!canAddMeal" @click="handleAddMeal">
        Agregar comida
      </button>
    </div>

    <p v-if="message" :class="['admin-message', { success: msgSuccess, error: !msgSuccess }]">
      {{ message }}
    </p>

    <div v-if="loading" class="loading">Cargando comidas...</div>

    <div v-else>
      <div v-for="meal in meals" :key="meal.id" class="meal-card">
        <div class="meal-header">
          <h3>{{ meal.nombre }}</h3>
          <span class="meal-kcal">{{ formatNutrient(mealKcal(meal)) }} kcal</span>
          <span v-if="hasOutOfRange(meal)" class="meal-warning">Fuera de rango</span>
          <button class="btn-delete" @click="handleRemoveMeal(meal)">Eliminar comida</button>
        </div>

        <div class="meal-recommendations">
          <span class="rec-label">Recomendado:</span>
          <label v-for="nutrient in MEAL_NUTRIENTS" :key="nutrient.key" class="rec-field">
            <span>{{ nutrient.label }}</span>
            <input
              type="number"
              min="0"
              step="0.1"
              :value="recommendationValue(meal, nutrient)"
              :placeholder="nutrient.unit"
              :aria-label="`Recomendado de ${nutrient.label}`"
              @change="handleRecommendationChange(meal, nutrient, $event)"
            />
            <span class="rec-unit">{{ nutrient.unit }}</span>
          </label>
        </div>

        <div class="item-search">
          <input
            v-model="searchTerms[meal.id]"
            type="text"
            class="admin-input"
            placeholder="Buscar alimento para agregar..."
            @input="onSearch(meal.id)"
          />
          <ul v-if="searchResults[meal.id] && searchResults[meal.id].length" class="search-results">
            <li
              v-for="food in searchResults[meal.id]"
              :key="food.id_ali"
              @click="handleAddItem(meal, food)"
            >
              <span>{{ food.alimento }}</span>
              <span class="food-code">{{ food.codigo || '' }}</span>
            </li>
          </ul>
        </div>

        <div class="table-scroll">
          <table class="items-table">
            <thead>
              <tr>
                <th class="food-col">Alimento</th>
                <th class="gramos-col">Gramos</th>
                <th v-for="col in visibleColDefs" :key="col.key" class="num-col">{{ col.label }}</th>
                <th class="action-col">✕</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in meal.items" :key="item.id">
                <td class="food-col">{{ item.alimento }}</td>
                <td class="gramos-col">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    :value="item.gramos"
                    @change="handleGramosChange(item, $event)"
                  />
                </td>
                <td v-for="col in visibleColDefs" :key="col.key" class="num-col">
                  {{ formatNutrient(nutrientAmount(item, col.key)) }}
                </td>
                <td class="action-col">
                  <button class="btn-delete" title="Quitar alimento" @click="handleRemoveItem(item)">✕</button>
                </td>
              </tr>
              <tr v-if="!meal.items.length">
                <td :colspan="3 + visibleColDefs.length" class="empty-row">Sin alimentos todavía.</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <th scope="row" class="food-col">Total</th>
                <td class="gramos-col">{{ formatNutrient(mealGramos(meal)) }}</td>
                <td v-for="col in visibleColDefs" :key="col.key" class="num-col">
                  {{ formatNutrient(mealColumnTotal(meal, col.key)) }}
                </td>
                <td class="action-col"></td>
              </tr>
              <tr class="adequacy-row">
                <th scope="row" class="food-col">Adecuación</th>
                <td class="gramos-col"></td>
                <td
                  v-for="col in visibleColDefs"
                  :key="col.key"
                  class="num-col"
                  :class="{ danger: adequacyCellOutOfRange(meal, col.key) }"
                >
                  {{ adequacyCellText(meal, col.key) }}
                </td>
                <td class="action-col"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p v-if="meals.length === 0" class="no-results">
        Esta dieta no tiene comidas todavía. Agregá la primera arriba.
      </p>

      <DietaTotales v-if="meals.length" :meals="meals" :storage-key="columnStorageKey" />
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useDietas } from '../composables/useDietas'
import { NUMERIC_NUTRIENT_COLUMNS, formatNutrient, nutrientAmount } from '../data/nutritionalColumns'
import {
  MEAL_NUTRIENTS,
  ADEQUACY_MIN,
  ADEQUACY_MAX,
  mealNutrient,
  adequacyPct,
  isOutOfRange
} from '../data/mealNutrients'
import { useColumnVisibility } from '../composables/useColumnVisibility'
import ColumnVisibilityPanel from './ColumnVisibilityPanel.vue'
import DietaTotales from './DietaTotales.vue'

const props = defineProps({
  dieta: { type: Object, required: true }
})

const {
  meals,
  loading,
  loadMeals,
  addMeal,
  removeMeal,
  updateMealRecommendations,
  addItem,
  updateItemGramos,
  removeItem,
  searchFoods
} = useDietas()

const newMealNombre = ref('')
const message = ref('')
const msgSuccess = ref(false)
const searchTerms = reactive({})
const searchResults = reactive({})
const searchTimers = {}

// Una sola selección por plan: la comparten la tabla de cada comida y los totales.
// El componente se remonta por dieta (`:key`), así que la clave es estable.
const numericColumns = NUMERIC_NUTRIENT_COLUMNS
const columnStorageKey = `diet.${props.dieta.id}.visibleColumns`
const {
  showPanel,
  visibleColumns,
  visibleColDefs,
  toggleColumn,
  showAllColumns,
  hideAllColumns
} = useColumnVisibility(numericColumns, columnStorageKey)

const canAddMeal = computed(() => newMealNombre.value.trim().length > 0)

function mealGramos(meal) {
  return meal.items.reduce((acc, item) => acc + (Number(item.gramos) || 0), 0)
}

function mealColumnTotal(meal, key) {
  return meal.items.reduce((acc, item) => acc + nutrientAmount(item, key), 0)
}

function mealKcal(meal) {
  return mealNutrient(meal, MEAL_NUTRIENTS[0])
}

function recommendationValue(meal, nutrient) {
  const value = meal[nutrient.recKey]
  return value === null || value === undefined ? '' : value
}

function mealOutOfRange(meal, nutrient) {
  return isOutOfRange(adequacyPct(mealNutrient(meal, nutrient), meal[nutrient.recKey]))
}

// El recomendado es del nutriente total (proteína animal + vegetal, CHO simples + complejos).
// Para no repetir el mismo porcentaje, la adecuación se muestra una sola vez por grupo:
// en la primera columna visible de sus fuentes.
function columnAdequacy(meal, columnKey) {
  const nutrient = MEAL_NUTRIENTS.find(item => item.sources.includes(columnKey))
  if (!nutrient) return undefined
  const primaryKey = nutrient.sources.find(key =>
    visibleColDefs.value.some(col => col.key === key)
  )
  if (primaryKey !== columnKey) return undefined
  return adequacyPct(mealNutrient(meal, nutrient), meal[nutrient.recKey])
}

function adequacyCellText(meal, columnKey) {
  const pct = columnAdequacy(meal, columnKey)
  if (pct === undefined) return ''
  return pct === null ? '—' : `${formatNutrient(pct)} %`
}

function adequacyCellOutOfRange(meal, columnKey) {
  const pct = columnAdequacy(meal, columnKey)
  return typeof pct === 'number' && isOutOfRange(pct)
}

function hasOutOfRange(meal) {
  return MEAL_NUTRIENTS.some(nutrient => mealOutOfRange(meal, nutrient))
}

function showMessage(text, success = true) {
  message.value = text
  msgSuccess.value = success
}

async function handleAddMeal() {
  const nombre = newMealNombre.value.trim()
  if (!nombre) return
  message.value = ''
  try {
    await addMeal(props.dieta.id, nombre)
    newMealNombre.value = ''
    showMessage('Comida agregada.')
  } catch (e) {
    showMessage(e.message || String(e), false)
  }
}

async function handleRemoveMeal(meal) {
  if (!window.confirm(`¿Eliminar la comida "${meal.nombre}" y sus alimentos?`)) return
  message.value = ''
  try {
    await removeMeal(meal.id)
    showMessage('Comida eliminada.')
  } catch (e) {
    showMessage(e.message || String(e), false)
  }
}

async function handleRecommendationChange(meal, nutrient, event) {
  const raw = String(event.target.value ?? '').trim()
  const value = raw === '' ? null : Number(raw)
  if (value !== null && (!Number.isFinite(value) || value < 0)) {
    event.target.value = recommendationValue(meal, nutrient)
    showMessage('El valor recomendado debe ser un número mayor o igual a 0.', false)
    return
  }
  message.value = ''
  try {
    await updateMealRecommendations(meal.id, { [nutrient.recKey]: value })
  } catch (e) {
    event.target.value = recommendationValue(meal, nutrient)
    showMessage(e.message || String(e), false)
  }
}

function onSearch(mealId) {
  clearTimeout(searchTimers[mealId])
  const term = (searchTerms[mealId] || '').trim()
  if (term.length < 2) {
    searchResults[mealId] = []
    return
  }
  searchTimers[mealId] = setTimeout(async () => {
    searchResults[mealId] = await searchFoods(term)
  }, 250)
}

async function handleAddItem(meal, food) {
  message.value = ''
  try {
    await addItem(meal.id, food, 100)
    searchTerms[meal.id] = ''
    searchResults[meal.id] = []
  } catch (e) {
    showMessage(e.message || String(e), false)
  }
}

async function handleGramosChange(item, event) {
  const gramos = Number(event.target.value)
  if (!Number.isFinite(gramos) || gramos <= 0) {
    event.target.value = item.gramos
    showMessage('Los gramos deben ser mayores que 0.', false)
    return
  }
  message.value = ''
  try {
    await updateItemGramos(item.id, gramos)
    item.gramos = gramos
  } catch (e) {
    event.target.value = item.gramos
    showMessage(e.message || String(e), false)
  }
}

async function handleRemoveItem(item) {
  message.value = ''
  try {
    await removeItem(item.id)
  } catch (e) {
    showMessage(e.message || String(e), false)
  }
}

onMounted(() => {
  loadMeals(props.dieta.id)
})
</script>

<style scoped>
.dieta-editor {
  margin-top: 20px;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.dieta-editor h2 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.columns-toggle {
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: white;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.2s;
}

.columns-toggle:hover,
.columns-toggle.active {
  border-color: #42b983;
  color: #42b983;
}

.hint {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #7f8c8d;
}

.meal-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.admin-input {
  padding: 10px 12px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 5px;
  transition: border-color 0.3s;
  flex: 1;
  min-width: 200px;
  box-sizing: border-box;
}

.admin-input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 5px rgba(66, 185, 131, 0.3);
}

.btn-primary {
  padding: 10px 18px;
  background-color: #42b983;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #369f6e;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.admin-message {
  margin: 8px 0;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 4px;
}

.admin-message.success {
  background-color: #d4edda;
  color: #1f7a3a;
  border: 1px solid #1f7a3a;
}

.admin-message.error {
  background-color: #ffeaa7;
  color: #c0392b;
  border: 1px solid #c0392b;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
}

.meal-card {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.meal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.meal-header h3 {
  margin: 0;
  font-size: 14px;
  color: #2c3e50;
}

.meal-kcal {
  font-size: 13px;
  font-weight: 600;
  color: #42b983;
}

.meal-header .btn-delete {
  margin-left: auto;
}

.meal-warning {
  padding: 3px 9px;
  border-radius: 10px;
  background-color: #fde8e8;
  border: 1px solid #c0392b;
  color: #c0392b;
  font-size: 11px;
  font-weight: 600;
}

.btn-delete {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  color: #c0392b;
  font-size: 13px;
  transition: background-color 0.2s;
}

.btn-delete:hover {
  background-color: #fde8e8;
  border-color: #c0392b;
}

.item-search {
  position: relative;
  margin-bottom: 10px;
}

.item-search .admin-input {
  width: 100%;
}

.search-results {
  list-style: none;
  margin: 4px 0 0 0;
  padding: 0;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  max-height: 220px;
  overflow-y: auto;
}

.search-results li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.search-results li:last-child {
  border-bottom: none;
}

.search-results li:hover {
  background-color: #f0f8ff;
}

.food-code {
  color: #7f8c8d;
  font-size: 12px;
}

.meal-recommendations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px 10px;
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.rec-label {
  font-size: 11px;
  font-weight: 600;
  color: #7f8c8d;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.rec-field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #2c3e50;
}

.rec-field input {
  width: 80px;
  padding: 5px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
  box-sizing: border-box;
}

.rec-field input:focus {
  outline: none;
  border-color: #42b983;
}

.rec-unit {
  font-size: 11px;
  color: #7f8c8d;
}

.table-scroll {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.items-table th,
.items-table td {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  text-align: left;
  white-space: nowrap;
}

.items-table th {
  font-size: 11px;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* La primera columna queda fija al desplazarse horizontalmente. */
.items-table .food-col {
  position: sticky;
  left: 0;
  background-color: white;
  z-index: 1;
}

.items-table thead .food-col {
  z-index: 2;
}

.items-table .gramos-col {
  width: 110px;
  text-align: right;
}

.items-table .gramos-col input {
  width: 90px;
  padding: 6px 8px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
}

.items-table .gramos-col input:focus {
  outline: none;
  border-color: #42b983;
}

.items-table .num-col {
  min-width: 96px;
  text-align: right;
}

.items-table tfoot th,
.items-table tfoot td {
  border-top: 1px solid #e0e0e0;
}

.items-table tfoot .total-row th,
.items-table tfoot .total-row td {
  font-size: 12px;
  font-weight: 700;
  color: #2c3e50;
  background-color: #fafafa;
}

.items-table tfoot .adequacy-row th,
.items-table tfoot .adequacy-row td {
  font-size: 12px;
  font-weight: 600;
  color: #7f8c8d;
}

.items-table tfoot .food-col {
  background-color: #fafafa;
}

.items-table .danger {
  background-color: #fde8e8;
  color: #c0392b;
  font-weight: 700;
}

.items-table .action-col {
  width: 50px;
  text-align: center;
}

.empty-row {
  padding: 12px;
  text-align: center;
  color: #7f8c8d;
  font-size: 13px;
}

.no-results {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-size: 14px;
}
</style>
