<template>
  <section class="admin-section">
    <h2>Dietas</h2>

    <div class="admin-form">
      <input
        v-model="newNombre"
        type="text"
        class="admin-input"
        placeholder="Nombre de la dieta (ej. Plan de un día)"
        @keyup.enter="handleCreate"
      />
      <button class="btn-primary" :disabled="!canCreate" @click="handleCreate">
        Crear dieta
      </button>
    </div>

    <p v-if="message" :class="['admin-message', { success: msgSuccess, error: !msgSuccess }]">
      {{ message }}
    </p>

    <div v-if="loading" class="loading">Cargando dietas...</div>

    <ul v-else class="admin-list">
      <li v-for="dieta in dietas" :key="dieta.id" class="admin-list-item">
        <span class="item-label">
          <strong>{{ dieta.nombre }}</strong>
        </span>
        <div class="item-actions">
          <button
            class="btn-open"
            :class="{ active: selectedId === dieta.id }"
            @click="toggleSelect(dieta)"
          >
            {{ selectedId === dieta.id ? 'Cerrar' : 'Abrir' }}
          </button>
          <button class="btn-delete" @click="handleDelete(dieta)">Eliminar</button>
        </div>
      </li>
    </ul>

    <p v-if="!loading && dietas.length === 0" class="no-results">
      No hay dietas creadas todavía.
    </p>

    <DietaEditor v-if="selectedDieta" :key="selectedDieta.id" :dieta="selectedDieta" />
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDietas } from '../composables/useDietas'
import DietaEditor from './DietaEditor.vue'

const { dietas, loading, load, create, remove } = useDietas()

const newNombre = ref('')
const message = ref('')
const msgSuccess = ref(false)
const selectedId = ref(null)

const canCreate = computed(() => newNombre.value.trim().length > 0)
const selectedDieta = computed(() =>
  dietas.value.find(dieta => dieta.id === selectedId.value) || null
)

function toggleSelect(dieta) {
  selectedId.value = selectedId.value === dieta.id ? null : dieta.id
}

async function handleCreate() {
  const nombre = newNombre.value.trim()
  if (!nombre) return
  message.value = ''
  try {
    const dieta = await create({ nombre })
    newNombre.value = ''
    selectedId.value = dieta.id
    message.value = 'Dieta creada.'
    msgSuccess.value = true
  } catch (e) {
    message.value = `Error: ${e.message || e}`
    msgSuccess.value = false
  }
}

async function handleDelete(dieta) {
  message.value = ''
  if (!window.confirm(`¿Eliminar la dieta "${dieta.nombre}" y todas sus comidas?`)) return
  try {
    await remove(dieta.id)
    if (selectedId.value === dieta.id) selectedId.value = null
    message.value = 'Dieta eliminada.'
    msgSuccess.value = true
  } catch (e) {
    message.value = e.message || String(e)
    msgSuccess.value = false
  }
}

load()
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

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-open {
  background: none;
  border: 1px solid #42b983;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  color: #42b983;
  font-size: 13px;
  transition: background-color 0.2s;
}

.btn-open:hover,
.btn-open.active {
  background-color: #42b983;
  color: white;
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

.no-results {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-size: 14px;
}
</style>
