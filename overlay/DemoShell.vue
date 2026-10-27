<template>
  <div class="demo-shell">
    <header class="demo-bar">
      <div class="demo-brand">
        <span class="demo-mark" aria-hidden="true">N</span>
        <span class="demo-title">Nutrición</span>
        <span class="demo-badge">demo</span>
      </div>

      <p class="demo-note">
        Datos de muestra del PTBDA Bolivia · sin backend · tus cambios quedan en este navegador
      </p>

      <button class="demo-reset" type="button" @click="handleReset">Reiniciar datos</button>
    </header>

    <App />
  </div>
</template>

<script setup>
import App from './App.vue'
import { resetDemoDatabase } from './supabaseClient'

function handleReset() {
  if (!window.confirm('¿Restaurar los datos de ejemplo? Se descartan los cambios que hiciste en esta demo.')) return
  resetDemoDatabase()
  window.location.reload()
}
</script>

<style scoped>
.demo-bar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 16px;
  height: 60px;
  padding: 0 20px;
  background: #1f2d3d;
  color: #ecf0f1;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.demo-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.demo-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #42b983;
  color: #1f2d3d;
  font-weight: 700;
  font-size: 14px;
}

.demo-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.demo-badge {
  padding: 2px 8px;
  border: 1px solid #42b983;
  border-radius: 999px;
  color: #42b983;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.demo-note {
  margin: 0;
  flex: 1;
  color: #b8c4ce;
  line-height: 1.35;
}

.demo-reset {
  flex-shrink: 0;
  padding: 7px 14px;
  border: 1px solid #46596b;
  border-radius: 6px;
  background: transparent;
  color: #ecf0f1;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.demo-reset:hover {
  background: #2c3e50;
  border-color: #42b983;
}

/* App.vue muestra "Conectado a la base de datos" cuando existe un cliente.
   En la demo no hay base de datos: el aviso de la barra cumple ese rol. */
.demo-shell :deep(.main-screen > .success-message) {
  display: none;
}

/* El margen superior global de #app reserva los 60px de la barra. */
.demo-shell :deep(.main-screen) {
  min-height: calc(100vh - 60px);
}

@media (max-width: 760px) {
  .demo-note {
    display: none;
  }
}

@media (max-width: 480px) {
  .demo-bar {
    gap: 10px;
    padding: 0 12px;
  }

  .demo-reset {
    padding: 6px 10px;
  }
}
</style>
