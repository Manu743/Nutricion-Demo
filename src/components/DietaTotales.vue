<template>
  <div class="totals-container">
    <div class="totals-header">
      <h3>Totales de la dieta</h3>
      <div class="totals-actions">
        <ViewModeToggle v-model="viewMode" />
        <button
          class="columns-toggle"
          :class="{ active: showPanel }"
          @click="showPanel = !showPanel"
        >
          Columnas
        </button>
      </div>
    </div>

    <ColumnVisibilityPanel
      v-if="showPanel"
      :columns="numericColumns"
      :visible-columns="visibleColumns"
      @toggle="toggleColumn"
      @show-all="showAllColumns"
      @hide-all="hideAllColumns"
    />

    <div v-if="viewMode === 'table'" class="table-container">
      <table class="totals-table">
        <thead>
          <tr>
            <th class="sticky-col">Comida</th>
            <th v-for="col in visibleColDefs" :key="col.key">{{ col.label }}</th>
            <th v-for="nutrient in MEAL_NUTRIENTS" :key="nutrient.key" class="adequacy-head">
              Adec. {{ nutrient.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in mealTotals" :key="row.id">
            <td class="sticky-col meal-name">{{ row.nombre }}</td>
            <td v-for="col in visibleColDefs" :key="col.key">
              {{ formatNutrient(row.totals[col.key]) }}
            </td>
            <td
              v-for="nutrient in MEAL_NUTRIENTS"
              :key="nutrient.key"
              class="adequacy-col"
              :class="{ danger: isOutOfRange(mealAdequacy(row.meal, nutrient)) }"
            >
              <span class="adequacy-value">{{ adequacyText(mealAdequacy(row.meal, nutrient)) }}</span>
              <span class="rec-hint">{{ recText(mealRecommended(row.meal, nutrient), nutrient) }}</span>
            </td>
          </tr>
          <tr class="day-total">
            <td class="sticky-col meal-name">Total del día</td>
            <td v-for="col in visibleColDefs" :key="col.key">
              {{ formatNutrient(dayTotals[col.key]) }}
            </td>
            <td
              v-for="nutrient in MEAL_NUTRIENTS"
              :key="nutrient.key"
              class="adequacy-col"
              :class="{ danger: isOutOfRange(dayAdequacy(nutrient)) }"
            >
              <span class="adequacy-value">{{ adequacyText(dayAdequacy(nutrient)) }}</span>
              <span class="rec-hint">{{ recText(dayRecommended(nutrient), nutrient) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="viewMode === 'table'" class="totals-hint">
      Adecuación = total de la comida / recomendado. Aceptable: {{ ADEQUACY_MIN }}–{{ ADEQUACY_MAX }} %.
      El total del día se calcula solo si todas las comidas tienen recomendado.
    </p>

    <div v-else class="total-cards">
      <article v-for="row in mealTotals" :key="row.id" class="total-card">
        <h4>{{ row.nombre }}</h4>
        <dl class="card-nutrients">
          <div v-for="col in visibleColDefs" :key="col.key" class="nutrient-item">
            <dt>{{ col.label }}</dt>
            <dd>
              {{ formatNutrient(row.totals[col.key]) }}<span v-if="col.unit"> {{ col.unit }}</span>
            </dd>
          </div>
        </dl>
      </article>

      <article class="total-card day-card">
        <h4>Total del día</h4>
        <dl class="card-nutrients">
          <div v-for="col in visibleColDefs" :key="col.key" class="nutrient-item">
            <dt>{{ col.label }}</dt>
            <dd>
              {{ formatNutrient(dayTotals[col.key]) }}<span v-if="col.unit"> {{ col.unit }}</span>
            </dd>
          </div>
        </dl>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
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
import { useViewMode } from '../composables/useViewMode'
import ColumnVisibilityPanel from './ColumnVisibilityPanel.vue'
import ViewModeToggle from './ViewModeToggle.vue'

const props = defineProps({
  meals: { type: Array, default: () => [] }
})

const numericColumns = NUMERIC_NUTRIENT_COLUMNS

const {
  showPanel,
  visibleColumns,
  visibleColDefs,
  toggleColumn,
  showAllColumns,
  hideAllColumns
} = useColumnVisibility(numericColumns, 'dietTotals.visibleColumns')

const { viewMode } = useViewMode('dietTotals.viewMode')

function sumMeal(items) {
  const totals = {}
  for (const col of numericColumns) {
    totals[col.key] = items.reduce((acc, item) => acc + nutrientAmount(item, col.key), 0)
  }
  return totals
}

const mealTotals = computed(() =>
  props.meals.map(meal => ({
    id: meal.id,
    nombre: meal.nombre,
    meal,
    totals: sumMeal(meal.items)
  }))
)

const dayTotals = computed(() => {
  const totals = {}
  for (const col of numericColumns) {
    totals[col.key] = mealTotals.value.reduce((acc, meal) => acc + meal.totals[col.key], 0)
  }
  return totals
})

function mealRecommended(meal, nutrient) {
  const value = Number(meal[nutrient.recKey])
  return Number.isFinite(value) && value > 0 ? value : null
}

function mealAdequacy(meal, nutrient) {
  return adequacyPct(mealNutrient(meal, nutrient), mealRecommended(meal, nutrient))
}

function dayRecommended(nutrient) {
  if (!props.meals.length) return null
  let sum = 0
  for (const meal of props.meals) {
    const value = mealRecommended(meal, nutrient)
    if (value === null) return null
    sum += value
  }
  return sum
}

function dayAdequacy(nutrient) {
  const actual = props.meals.reduce((acc, meal) => acc + mealNutrient(meal, nutrient), 0)
  return adequacyPct(actual, dayRecommended(nutrient))
}

function adequacyText(pct) {
  return pct === null ? '—' : `${formatNutrient(pct)} %`
}

function recText(value, nutrient) {
  return value === null ? '' : `rec. ${formatNutrient(value)} ${nutrient.unit}`
}
</script>

<style scoped>
.totals-container {
  margin-top: 24px;
}

.totals-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.totals-header h3 {
  margin: 0;
  font-size: 15px;
  color: #2c3e50;
}

.totals-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.table-container {
  margin-top: 12px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.totals-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  min-width: 1200px;
}

.totals-table th,
.totals-table td {
  padding: 8px 5px;
  text-align: right;
  border: 1px solid #e0e0e0;
  white-space: nowrap;
}

.totals-table th {
  background-color: #42b983;
  color: white;
  font-weight: bold;
  font-size: 10px;
}

.totals-table td.sticky-col,
.totals-table th.sticky-col {
  text-align: left;
  position: sticky;
  left: 0;
  background-color: white;
  font-weight: 500;
  min-width: 140px;
  z-index: 1;
}

.totals-table th.sticky-col {
  background-color: #3aa876;
  z-index: 2;
}

.totals-table tbody tr:nth-child(even) td {
  background-color: #f9f9f9;
}

.totals-table tbody tr:nth-child(even) td.sticky-col {
  background-color: #f9f9f9;
}

.totals-table tbody tr:hover td,
.totals-table tbody tr:hover td.sticky-col {
  background-color: #f0f8ff;
}

.totals-table .day-total td {
  font-weight: 700;
  background-color: #eafaf1;
  border-top: 2px solid #42b983;
}

.totals-table .day-total td.sticky-col {
  background-color: #eafaf1;
}

.totals-table th.adequacy-head {
  background-color: #3aa876;
}

.totals-table .adequacy-col {
  text-align: right;
}

.totals-table .adequacy-value {
  display: block;
  font-weight: 600;
}

.totals-table .rec-hint {
  display: block;
  font-size: 9px;
  font-weight: 400;
  color: #7f8c8d;
}

.totals-table tbody tr td.adequacy-col.danger {
  background-color: #fde8e8;
}

.totals-table tbody tr td.adequacy-col.danger .adequacy-value {
  color: #c0392b;
  font-weight: 700;
}

.totals-table tbody tr td.adequacy-col.danger .rec-hint {
  color: #c0392b;
}

.totals-hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: #7f8c8d;
}

.total-cards {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.total-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 14px;
}

.total-card h4 {
  margin: 0;
  font-size: 14px;
  color: #2c3e50;
}

.card-nutrients {
  margin: 12px 0 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 14px;
}

.nutrient-item {
  border-top: 1px solid rgba(44, 62, 80, 0.12);
  padding-top: 6px;
}

.nutrient-item dt {
  font-size: 11px;
  color: #7f8c8d;
}

.nutrient-item dd {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
}

.day-card {
  border: 2px solid #42b983;
  background-color: #eafaf1;
}
</style>
