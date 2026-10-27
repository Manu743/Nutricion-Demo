<template>
  <section class="admin-section">
    <h2>Grupos</h2>

    <div class="admin-form">
      <input
        v-model="newNombre"
        type="text"
        placeholder="Nombre del grupo"
        class="admin-input"
      />
      <input
        v-model="newCodigo"
        type="text"
        placeholder="Código"
        class="admin-input admin-input-short"
      />
      <button class="btn-primary" :disabled="!canAdd" @click="handleAdd">
        Agregar
      </button>
    </div>

    <p v-if="message" :class="['admin-message', { success: msgSuccess, error: !msgSuccess }]">
      {{ message }}
    </p>

    <div v-if="loading" class="loading">Cargando grupos...</div>

    <ul v-else class="admin-list">
      <li v-for="grupo in grupos" :key="grupo.id" class="admin-list-item">
        <span class="item-label">
          <strong>{{ grupo.grupo }}</strong> — {{ grupo.codigo }}
        </span>
        <button class="btn-delete" @click="handleDelete(grupo)">Eliminar</button>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGrupos } from '../composables/useGrupos'

const { grupos, loading, load, create, remove } = useGrupos()

const newNombre = ref('')
const newCodigo = ref('')
const message = ref('')
const msgSuccess = ref(false)

const canAdd = computed(() => newNombre.value.trim().length > 0 && newCodigo.value.trim().length > 0)

async function handleAdd() {
  message.value = ''
  try {
    await create({ grupo: newNombre.value.trim(), codigo: newCodigo.value.trim() })
    newNombre.value = ''
    newCodigo.value = ''
    message.value = 'Grupo agregado.'
    msgSuccess.value = true
  } catch (e) {
    message.value = `Error: ${e.message}`
    msgSuccess.value = false
  }
}

async function handleDelete(grupo) {
  message.value = ''
  if (!window.confirm(`¿Eliminar "${grupo.grupo}"?`)) return
  try {
    await remove(grupo)
    message.value = 'Grupo eliminado.'
    msgSuccess.value = true
  } catch (e) {
    message.value = e.message || String(e)
    msgSuccess.value = false
  }
}

// Load on mount
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
  min-width: 150px;
  box-sizing: border-box;
}

.admin-input-short {
  flex: 0.4;
  min-width: 100px;
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
