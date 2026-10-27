<template>
  <section class="admin-section">
    <h2>Subgrupos</h2>

    <div class="admin-form">
      <select v-model="newGrupoCodigo" class="admin-select" required>
        <option value="" disabled>Grupo</option>
        <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.codigo">
          {{ grupo.grupo }}
        </option>
      </select>
      <input
        v-model="newNombre"
        type="text"
        placeholder="Nombre del subgrupo"
        class="admin-input"
      />
      <button class="btn-primary" :disabled="!canAdd" @click="handleAdd">
        Agregar
      </button>
    </div>

    <div class="filter-row">
      <select
        v-model="filterGrupoCodigo"
        class="admin-select"
      >
        <option value="">Todos los grupos</option>
        <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.codigo">
          {{ grupo.grupo }}
        </option>
      </select>
    </div>

    <p v-if="message" :class="['admin-message', { success: msgSuccess, error: !msgSuccess }]">
      {{ message }}
    </p>

    <div v-if="loading" class="loading">Cargando subgrupos...</div>

    <ul v-else class="admin-list">
      <li v-for="sub in subgrupos" :key="sub.id" class="admin-list-item">
        <span class="item-label">
          <strong>{{ sub.nombre }}</strong>
          <span class="item-parent"> — {{ sub.grupos?.grupo || '?' }}</span>
        </span>
        <button class="btn-delete" @click="handleDelete(sub)">Eliminar</button>
      </li>
      <li v-if="!loading && subgrupos.length === 0" class="empty-state">
        No hay subgrupos registrados.
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSubgrupos } from '../composables/useSubgrupos'

defineProps({
  grupos: { type: Array, default: () => [] }
})

const { subgrupos, loading, load, create, remove } = useSubgrupos()

const newNombre = ref('')
const newGrupoCodigo = ref('')
const filterGrupoCodigo = ref('')
const message = ref('')
const msgSuccess = ref(false)

const canAdd = computed(() => newNombre.value.trim().length > 0 && newGrupoCodigo.value)

async function handleAdd() {
  message.value = ''
  try {
    await create({
      nombre: newNombre.value.trim(),
      codigo_grupo: newGrupoCodigo.value
    })
    newNombre.value = ''
    message.value = 'Subgrupo agregado.'
    msgSuccess.value = true
  } catch (e) {
    message.value = `Error: ${e.message}`
    msgSuccess.value = false
  }
}

async function handleDelete(sub) {
  message.value = ''
  if (!window.confirm(`¿Eliminar "${sub.nombre}"?`)) return
  try {
    await remove(sub.id)
    message.value = 'Subgrupo eliminado.'
    msgSuccess.value = true
  } catch (e) {
    message.value = e.message || String(e)
    msgSuccess.value = false
  }
}

watch(filterGrupoCodigo, (codigoGrupo) => {
  load(codigoGrupo || undefined)
})

onMounted(() => {
  load()
})
</script>

<style scoped>
.admin-section {
  margin: 20px 0;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-section h2 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: bold;
}

.admin-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.filter-row {
  margin-bottom: 12px;
}

.admin-input,
.admin-select {
  padding: 10px 12px;
  font-size: 14px;
  border: 2px solid #ddd;
  border-radius: 5px;
  transition: border-color 0.3s;
  min-width: 150px;
  box-sizing: border-box;
}

.admin-input:focus,
.admin-select:focus {
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

.admin-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
}

.admin-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.admin-list-item:hover {
  background-color: #f0f8ff;
}

.item-label {
  font-size: 14px;
  color: #2c3e50;
}

.item-parent {
  color: #7f8c8d;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
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
</style>
