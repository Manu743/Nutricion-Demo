<template>
  <div class="main-screen">
    <h1>Valores Nutricionales de Alimentos</h1>

    <p v-if="!supabaseConnected" class="warning-message">
      ⚠️ Sin conexión a Supabase. Los datos se muestran localmente.
    </p>
    <p v-else class="success-message">✓ Conectado a la base de datos</p>

    <p v-if="errorMsg" class="error-detail">
      ❌ Error: {{ errorMsg }}
    </p>

    <nav class="nav-tabs">
      <button
        :class="['nav-tab', { active: tab === 'list' }]"
        @click="tab = 'list'"
      >
        Lista de alimentos
      </button>
      <button
        :class="['nav-tab', { active: tab === 'add' }]"
        @click="tab = 'add'"
      >
        Agregar alimento
      </button>
      <button
        :class="['nav-tab', { active: tab === 'grupos' }]"
        @click="tab = 'grupos'"
      >
        Grupos
      </button>
      <button
        :class="['nav-tab', { active: tab === 'subgrupos' }]"
        @click="tab = 'subgrupos'"
      >
        Subgrupos
      </button>
      <button
        :class="['nav-tab', { active: tab === 'dietas' }]"
        @click="tab = 'dietas'"
      >
        Dietas
      </button>
    </nav>

    <!-- Food List Tab -->
    <FoodList
      v-show="tab === 'list'"
      :foods="foods"
      :grupos="grupos"
      :loading="foodsLoading"
      :search-query="searchQuery"
      :selected-grupo="selectedGrupo"
      @update:search-query="searchQuery = $event"
      @update:selected-grupo="selectedGrupo = $event"
      @delete-food="handleDeleteFood"
    />

    <!-- Add Food Tab -->
    <div v-show="tab === 'add'">
      <AddFood
        :grupos="grupos"
        :subgrupos="allSubgrupos"
        @add-food="handleAddFood"
      />
      <p v-if="addFoodMessage" :class="[addFoodError ? 'warning-message' : 'success-message']">
        {{ addFoodMessage }}
      </p>
    </div>

    <!-- Grupos Admin Tab -->
    <GruposAdmin v-show="tab === 'grupos'" />

    <!-- Subgrupos Admin Tab -->
    <SubgruposAdmin v-show="tab === 'subgrupos'" :grupos="grupos" />

    <!-- Dietas Tab -->
    <DietaPlanner v-show="tab === 'dietas'" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { supabase } from './supabaseClient'
import FoodList from './components/FoodList.vue'
import AddFood from './components/AddFood.vue'
import GruposAdmin from './components/GruposAdmin.vue'
import SubgruposAdmin from './components/SubgruposAdmin.vue'
import DietaPlanner from './components/DietaPlanner.vue'
import { useFoods } from './composables/useFoods'
import { useGrupos } from './composables/useGrupos'
import { useSubgrupos } from './composables/useSubgrupos'

const { foods, loading: foodsLoading, error: foodsError, list: listFoods, applyFilters, create: createFood, softDelete } = useFoods()
const { grupos, error: gruposError, load: loadGrupos } = useGrupos()
const { subgrupos: allSubgrupos, error: subgruposError, load: loadSubgrupos } = useSubgrupos()

const tab = ref('list')
const searchQuery = ref('')
const selectedGrupo = ref('')
const addFoodMessage = ref('')
const addFoodError = ref(false)
const supabaseConnected = ref(false)
const errorMsg = ref('')

async function fetchData() {
  errorMsg.value = ''
  await loadGrupos()
  await loadSubgrupos()
  await listFoods({
    grupo: selectedGrupo.value || undefined,
    search: searchQuery.value || undefined
  })
  supabaseConnected.value = !!supabase
  // Show first error if any
  if (gruposError.value) errorMsg.value = gruposError.value
  else if (subgruposError.value) errorMsg.value = subgruposError.value
  else if (foodsError.value) errorMsg.value = foodsError.value
}

// El catálogo ya está en memoria: buscar y filtrar no vuelve a consultar la base.
watch([searchQuery, selectedGrupo], () => {
  applyFilters({
    grupo: selectedGrupo.value || undefined,
    search: searchQuery.value || undefined
  })
})

async function handleAddFood(newFood) {
  addFoodMessage.value = ''
  addFoodError.value = false
  try {
    if (supabase && supabaseConnected.value) {
      await createFood(newFood)
      await listFoods({
        grupo: selectedGrupo.value || undefined,
        search: searchQuery.value || undefined
      })
      addFoodMessage.value = 'Alimento agregado con éxito a la base de datos.'
    } else {
      addFoodMessage.value = 'Supabase no está disponible. No se guardó el alimento.'
      addFoodError.value = true
    }
  } catch (e) {
    addFoodMessage.value = `Error al guardar el alimento: ${e.message || e}`
    addFoodError.value = true
  }
}

async function handleDeleteFood(id) {
  try {
    await softDelete(id)
    addFoodMessage.value = 'Alimento eliminado.'
    addFoodError.value = false
  } catch (e) {
    addFoodMessage.value = `Error al eliminar: ${e.message || e}`
    addFoodError.value = true
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  color: #2c3e50;
  margin-top: 60px;
}

.main-screen {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.warning-message,
.success-message,
.error-detail {
  padding: 10px 12px;
  margin: 0 0 15px 0;
  font-size: 14px;
  border-left: 4px solid;
  border-radius: 3px;
}

.warning-message {
  background-color: #ffeaa7;
  color: #d63031;
  border-color: #d63031;
}

.success-message {
  background-color: #d4edda;
  color: #27ae60;
  border-color: #27ae60;
}

.error-detail {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #721c24;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.nav-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.nav-tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.nav-tab:hover {
  color: #2c3e50;
  background-color: #f0f8ff;
}

.nav-tab.active {
  color: #42b983;
  border-bottom-color: #42b983;
  font-weight: 600;
}
</style>
