<template>
  <div class="columns-panel">
    <div class="columns-panel-header">
      <span class="columns-panel-title">Columnas visibles</span>
      <div class="columns-panel-actions">
        <button class="columns-link" @click="$emit('show-all')">Todas</button>
        <button class="columns-link" @click="$emit('hide-all')">Ninguna</button>
      </div>
    </div>
    <label v-for="col in columns" :key="col.key" class="column-check">
      <input
        type="checkbox"
        :checked="visibleColumns.includes(col.key)"
        @change="$emit('toggle', col.key)"
      />
      {{ col.label }}
    </label>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  visibleColumns: { type: Array, required: true }
})

defineEmits(['toggle', 'show-all', 'hide-all'])
</script>

<style scoped>
.columns-panel {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background-color: #fafafa;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.columns-panel-header {
  flex-basis: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.columns-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.columns-panel-actions {
  display: flex;
  gap: 8px;
}

.columns-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: #42b983;
  cursor: pointer;
}

.columns-link:hover {
  text-decoration: underline;
}

.column-check {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #2c3e50;
  cursor: pointer;
  min-width: 110px;
}

.column-check input {
  accent-color: #42b983;
  cursor: pointer;
}
</style>
