import { createApp } from 'vue'
import DemoShell from './DemoShell.vue'

// La app real monta App.vue directamente. La demo agrega un marco con el aviso
// de datos de muestra y el botón para reiniciar el estado guardado.
createApp(DemoShell).mount('#app')
