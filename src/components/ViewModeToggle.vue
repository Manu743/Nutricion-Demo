<template>
  <div class="view-mode-toggle" role="group" aria-label="Modo de visualización">
    <button
      class="view-mode-btn"
      :class="{ active: modelValue === 'table' }"
      :aria-pressed="modelValue === 'table'"
      @click="$emit('update:modelValue', 'table')"
    >
      Tabla
    </button>
    <button
      class="view-mode-btn"
      :class="{ active: modelValue === 'cards' }"
      :aria-pressed="modelValue === 'cards'"
      @click="$emit('update:modelValue', 'cards')"
    >
      Tarjetas
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: 'table' }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.view-mode-toggle {
  display: inline-flex;
  border: 1px solid #ddd;
  border-radius: 5px;
  overflow: hidden;
  background-color: white;
}

.view-mode-btn {
  padding: 9px 12px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: #2c3e50;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  white-space: nowrap;
}

.view-mode-btn + .view-mode-btn {
  border-left: 1px solid #ddd;
}

.view-mode-btn:hover {
  color: #42b983;
}

.view-mode-btn.active {
  background-color: #42b983;
  color: white;
}
</style>
