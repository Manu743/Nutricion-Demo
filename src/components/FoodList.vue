<template>
  <section class="food-list-section">
    <div class="search-container">
      <div class="filter-row">
        <select
          :value="selectedGrupo"
          class="filter-select"
          @change="$emit('update:selectedGrupo', $event.target.value)"
        >
          <option value="">Todos los grupos</option>
          <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.codigo">
            {{ grupo.codigo }} - {{ grupo.grupo }}
          </option>
        </select>

        <input
          :value="searchQuery"
          type="text"
          placeholder="Buscar alimento..."
          class="search-bar"
          @input="$emit('update:searchQuery', $event.target.value)"
        />

        <button
          class="columns-toggle"
          :class="{ active: showPanel }"
          @click="showPanel = !showPanel"
        >
          Columnas
        </button>

        <ViewModeToggle v-model="viewMode" />

        <span class="food-count">{{ foods.length }} alimentos</span>
      </div>

      <ColumnVisibilityPanel
        v-if="showPanel"
        :columns="columnDefs"
        :visible-columns="visibleColumns"
        @toggle="toggleColumn"
        @show-all="showAllColumns"
        @hide-all="hideAllColumns"
      />
    </div>

    <div v-if="loading" class="loading">Cargando datos...</div>

    <div v-else-if="viewMode === 'table'" class="table-container">
      <table class="nutrition-table">
        <thead>
          <tr>
            <th class="sticky-col">Alimento</th>
            <th v-for="col in visibleColDefs" :key="col.key">{{ col.label }}</th>
            <th class="action-col">✕</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="food in foods" :key="food.id_ali">
            <td class="sticky-col food-name">{{ food.alimento }}</td>
            <td v-for="col in visibleColDefs" :key="col.key">
              {{ col.raw ? (food[col.key] || '-') : fmt(food[col.key]) }}
            </td>
            <td class="action-col">
              <button class="btn-delete" title="Eliminar" @click="confirmDelete(food)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="cards-grid">
      <article v-for="food in foods" :key="food.id_ali" class="food-card">
        <div class="food-card-header">
          <div>
            <h3 class="food-card-title">{{ food.alimento }}</h3>
            <p class="food-card-meta">{{ foodMeta(food) }}</p>
          </div>
          <button class="btn-delete" title="Eliminar" @click="confirmDelete(food)">✕</button>
        </div>
        <dl v-if="visibleNutrientCols.length" class="food-card-nutrients">
          <div v-for="col in visibleNutrientCols" :key="col.key" class="nutrient-item">
            <dt>{{ col.label }}</dt>
            <dd>
              {{ fmt(food[col.key]) }}<span v-if="col.unit"> {{ col.unit }}</span>
            </dd>
          </div>
        </dl>
        <p class="food-card-note">Valores por 100 g</p>
      </article>
    </div>

    <p v-if="!loading && foods.length === 0" class="no-results">
      No se encontraron alimentos que coincidan con tu búsqueda.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { NUTRIENT_COLUMNS, formatNutrient } from '../data/nutritionalColumns'
import { useColumnVisibility } from '../composables/useColumnVisibility'
import { useViewMode } from '../composables/useViewMode'
import ColumnVisibilityPanel from './ColumnVisibilityPanel.vue'
import ViewModeToggle from './ViewModeToggle.vue'

defineProps({
  foods: { type: Array, default: () => [] },
  grupos: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  selectedGrupo: { type: [String, Number], default: '' }
})

const emit = defineEmits([
  'update:searchQuery',
  'update:selectedGrupo',
  'delete-food'
])

const columnDefs = NUTRIENT_COLUMNS

const {
  showPanel,
  visibleColumns,
  visibleColDefs,
  toggleColumn,
  showAllColumns,
  hideAllColumns
} = useColumnVisibility(columnDefs, 'foodList.visibleColumns')

const { viewMode } = useViewMode('foodList.viewMode')

const visibleNutrientCols = computed(() => visibleColDefs.value.filter(col => !col.raw))

const fmt = formatNutrient

function foodMeta(food) {
  const parts = []
  if (visibleColumns.value.includes('codigo') && food.codigo) parts.push(food.codigo)
  if (visibleColumns.value.includes('codigo_grupo') && food.grupo) parts.push(food.grupo)
  return parts.join(' · ')
}

function confirmDelete(food) {
  if (window.confirm(`¿Eliminar "${food.alimento}"?`)) {
    emit('delete-food', food.id_ali)
  }
}
</script>

<style scoped>
.food-list-section {
  margin: 20px 0;
}

.search-container {
  margin-bottom: 15px;
  padding: 12px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.search-bar {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 5px;
}

.search-bar:focus,
.filter-select:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 5px rgba(66, 185, 131, 0.3);
}

.filter-select {
  padding: 10px 12px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 5px;
  background-color: white;
  min-width: 200px;
}

.food-count {
  font-size: 13px;
  color: #7f8c8d;
  white-space: nowrap;
}

.columns-toggle {
  padding: 10px 14px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 5px;
  background-color: white;
  color: #2c3e50;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.columns-toggle:hover,
.columns-toggle.active {
  border-color: #42b983;
  color: #42b983;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #7f8c8d;
  background-color: white;
  border-radius: 8px;
}

.table-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.nutrition-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  min-width: 1600px;
}

.nutrition-table th,
.nutrition-table td {
  padding: 8px 5px;
  text-align: right;
  border: 1px solid #e0e0e0;
  white-space: nowrap;
}

.nutrition-table th {
  background-color: #42b983;
  color: white;
  font-weight: bold;
  font-size: 10px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nutrition-table td.food-name,
.nutrition-table th:first-child {
  text-align: left;
  position: sticky;
  left: 0;
  z-index: 5;
}

.nutrition-table th:first-child {
  z-index: 15;
  background-color: #3aa876;
}

.nutrition-table td.food-name {
  background-color: white;
  font-weight: 500;
  min-width: 150px;
}

.nutrition-table tbody tr:nth-child(even) td {
  background-color: #f9f9f9;
}

.nutrition-table tbody tr:nth-child(even) td.food-name {
  background-color: #f9f9f9;
}

.nutrition-table tbody tr:hover td {
  background-color: #f0f8ff;
}

.nutrition-table tbody tr:hover td.food-name {
  background-color: #f0f8ff;
}

.action-col {
  text-align: center;
  position: sticky;
  right: 0;
  background-color: white;
  z-index: 5;
}

.nutrition-table tbody tr:nth-child(even) .action-col {
  background-color: #f9f9f9;
}

.nutrition-table tbody tr:hover .action-col {
  background-color: #f0f8ff;
}

.btn-delete {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  padding: 2px 6px;
  cursor: pointer;
  color: #c0392b;
  font-size: 12px;
}

.btn-delete:hover {
  background-color: #fde8e8;
  border-color: #c0392b;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 14px;
  background-color: white;
  border-radius: 8px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.food-card {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 14px;
}

.food-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.food-card-title {
  margin: 0;
  font-size: 14px;
  color: #2c3e50;
}

.food-card-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #7f8c8d;
}

.food-card-nutrients {
  margin: 12px 0 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 14px;
}

.nutrient-item {
  border-top: 1px solid #f0f0f0;
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

.food-card-note {
  margin: 10px 0 0;
  font-size: 11px;
  color: #a0a0a0;
  text-align: right;
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
  }

  .search-bar,
  .filter-select,
  .columns-toggle {
    width: 100%;
    min-width: unset;
  }
}
</style>
