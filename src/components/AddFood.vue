<template>
  <section class="add-food-section">
    <h2>Agregar alimento</h2>
    <form @submit.prevent="submitForm" class="add-food-form">
      <!-- Sección: Datos básicos -->
      <div class="form-group">
        <h3>Datos del alimento</h3>
        <div class="form-row">
          <div class="form-field">
            <label>Código</label>
            <input v-model="form.codigo" type="text" placeholder="Ej: A1" />
          </div>
          <div class="form-field flex-2">
            <label>Nombre del alimento *</label>
            <input v-model="form.alimento" type="text" placeholder="Nombre" required />
          </div>
          <div class="form-field">
            <label>Grupo *</label>
            <select v-model="form.codigo_grupo" required @change="onGrupoChange">
              <option value="" disabled>Grupo</option>
              <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.codigo">
                {{ grupo.codigo }} - {{ grupo.grupo }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label>Subgrupo</label>
            <select v-model="form.id_subgrupo">
              <option :value="null">Sin subgrupo</option>
              <option v-for="sub in filteredSubgrupos" :key="sub.id" :value="sub.id">
                {{ sub.nombre }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label>Tipo</label>
            <select v-model="form.tipo_alimento">
              <option value="normal">Normal</option>
              <option value="nuevo">(*) Nuevo</option>
              <option value="fortificado">(**) Fortificado</option>
              <option value="extra_fortificado">(***) Extra Fort.</option>
              <option value="ver_descripcion">(°) Ver desc.</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Sección: Macronutrientes -->
      <div class="form-group">
        <h3>Macronutrientes (por 100g)</h3>
        <div class="form-row">
          <div class="form-field">
            <label>Energía (kcal)</label>
            <input v-model.number="form.energia_kcal" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Humedad (g)</label>
            <input v-model.number="form.humedad" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Proteína animal (g)</label>
            <input v-model.number="form.proteina_animal" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Proteína vegetal (g)</label>
            <input v-model.number="form.proteina_vegetal" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Grasa (g)</label>
            <input v-model.number="form.grasa" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>CHO simples (g)</label>
            <input v-model.number="form.cho_simples" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>CHO complejos (g)</label>
            <input v-model.number="form.cho_complejos" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Fibra cruda (g)</label>
            <input v-model.number="form.f_cruda" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Ceniza (g)</label>
            <input v-model.number="form.ceniza" type="number" step="0.01" min="0" />
          </div>
        </div>
      </div>

      <!-- Sección: Minerales -->
      <div class="form-group">
        <h3>Minerales</h3>
        <div class="form-row">
          <div class="form-field">
            <label>Calcio (mg)</label>
            <input v-model.number="form.calcio" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Fósforo (mg)</label>
            <input v-model.number="form.fosforo" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Hierro hem (mg)</label>
            <input v-model.number="form.hierro_hem" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Hierro no hem (mg)</label>
            <input v-model.number="form.hierro_no_hem" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Zinc (mg)</label>
            <input v-model.number="form.zinc" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Sodio (mg)</label>
            <input v-model.number="form.sodio" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Potasio (mg)</label>
            <input v-model.number="form.potasio" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Magnesio (mg)</label>
            <input v-model.number="form.magnesio" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Selenio (mg)</label>
            <input v-model.number="form.selenio" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Cobre (mg)</label>
            <input v-model.number="form.cobre" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Sodio (mEq)</label>
            <input v-model.number="form.sodio_meq" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Potasio (mEq)</label>
            <input v-model.number="form.potasio_meq" type="number" step="0.01" min="0" />
          </div>
        </div>
      </div>

      <!-- Sección: Vitaminas -->
      <div class="form-group">
        <h3>Vitaminas</h3>
        <div class="form-row">
          <div class="form-field">
            <label>Vit. A (μg)</label>
            <input v-model.number="form.vit_a" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Tiamina (mg)</label>
            <input v-model.number="form.tiamina" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Riboflavina (mg)</label>
            <input v-model.number="form.riboflavina" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Niacina (mg)</label>
            <input v-model.number="form.niacina" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Folatos (mcg)</label>
            <input v-model.number="form.folatos" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Vit. B12 (mg)</label>
            <input v-model.number="form.vit_b12" type="number" step="0.01" min="0" />
          </div>
          <div class="form-field">
            <label>Vit. C (mg)</label>
            <input v-model.number="form.vit_c" type="number" step="0.01" min="0" />
          </div>
        </div>
      </div>

      <!-- Notas -->
      <div class="form-notes">
        <label>Notas</label>
        <textarea
          v-model="form.notas"
          placeholder="Notas adicionales (opcional)"
          rows="2"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-clear" @click="resetFields">Limpiar</button>
        <button type="submit" class="btn-submit">Agregar alimento</button>
      </div>

      <p v-if="message" :class="['form-message', { success: isSuccess, error: !isSuccess }]">
        {{ message }}
      </p>
    </form>
  </section>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useSubgrupos } from '../composables/useSubgrupos'

const props = defineProps({
  grupos: { type: Array, default: () => [] },
  subgrupos: { type: Array, default: () => [] }
})

const emit = defineEmits(['add-food'])

const { subgrupos: loadedSubgrupos, load: loadSubgrupos } = useSubgrupos()

const form = reactive({
  // Datos básicos
  codigo: '',
  alimento: '',
  codigo_grupo: '',
  id_subgrupo: null,
  tipo_alimento: 'normal',
  // Macronutrientes
  energia_kcal: null,
  humedad: null,
  proteina_animal: null,
  proteina_vegetal: null,
  grasa: null,
  cho_simples: null,
  cho_complejos: null,
  f_cruda: null,
  ceniza: null,
  // Minerales
  calcio: null,
  fosforo: null,
  hierro_hem: null,
  hierro_no_hem: null,
  zinc: null,
  sodio: null,
  potasio: null,
  magnesio: null,
  selenio: null,
  cobre: null,
  sodio_meq: null,
  potasio_meq: null,
  // Vitaminas
  vit_a: null,
  tiamina: null,
  riboflavina: null,
  niacina: null,
  folatos: null,
  vit_b12: null,
  vit_c: null,
  // Otros
  notas: ''
})

const message = ref('')
const isSuccess = ref(false)

const filteredSubgrupos = computed(() => {
  if (!form.codigo_grupo) return []
  const source = loadedSubgrupos.value.length > 0 ? loadedSubgrupos.value : props.subgrupos
  return source.filter(s => s.codigo_grupo === form.codigo_grupo)
})

function onGrupoChange() {
  form.id_subgrupo = null
}

function resetFields() {
  Object.keys(form).forEach(key => {
    if (key === 'codigo_grupo' || key === 'id_subgrupo' || key === 'tipo_alimento') {
      form[key] = key === 'id_subgrupo' ? null : key === 'tipo_alimento' ? 'normal' : ''
    } else if (typeof form[key] === 'number') {
      form[key] = null
    } else {
      form[key] = ''
    }
  })
  message.value = ''
}

function submitForm() {
  if (!form.alimento.trim() || !form.codigo_grupo) {
    message.value = 'Completa el nombre del alimento y el grupo antes de enviar.'
    isSuccess.value = false
    return
  }

  const foodData = {
    codigo: form.codigo.trim() || null,
    alimento: form.alimento.trim(),
    codigo_grupo: form.codigo_grupo,
    id_subgrupo: form.id_subgrupo != null ? Number(form.id_subgrupo) : null,
    tipo_alimento: form.tipo_alimento,
    energia_kcal: form.energia_kcal,
    humedad: form.humedad,
    proteina_animal: form.proteina_animal,
    proteina_vegetal: form.proteina_vegetal,
    grasa: form.grasa,
    cho_simples: form.cho_simples,
    cho_complejos: form.cho_complejos,
    f_cruda: form.f_cruda,
    ceniza: form.ceniza,
    calcio: form.calcio,
    fosforo: form.fosforo,
    hierro_hem: form.hierro_hem,
    hierro_no_hem: form.hierro_no_hem,
    zinc: form.zinc,
    sodio: form.sodio,
    potasio: form.potasio,
    magnesio: form.magnesio,
    selenio: form.selenio,
    cobre: form.cobre,
    sodio_meq: form.sodio_meq,
    potasio_meq: form.potasio_meq,
    vit_a: form.vit_a,
    tiamina: form.tiamina,
    riboflavina: form.riboflavina,
    niacina: form.niacina,
    folatos: form.folatos,
    vit_b12: form.vit_b12,
    vit_c: form.vit_c,
    notas: form.notas.trim() || null
  }

  emit('add-food', foodData)

  message.value = `Alimento "${foodData.alimento}" enviado correctamente.`
  isSuccess.value = true

  setTimeout(() => {
    message.value = ''
  }, 3000)
}

loadSubgrupos()
</script>

<style scoped>
.add-food-section {
  margin: 20px 0;
}

.add-food-section h2 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #2c3e50;
  font-weight: bold;
}

.add-food-form {
  display: grid;
  gap: 12px;
}

.form-group {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 12px;
}

.form-group h3 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #42b983;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 6px;
}

.form-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-field {
  display: flex;
  flex-direction: column;
  min-width: 100px;
  flex: 1;
}

.form-field.flex-2 {
  flex: 2;
}

.form-field label {
  font-size: 11px;
  color: #7f8c8d;
  margin-bottom: 3px;
  font-weight: 500;
}

.form-field input,
.form-field select {
  padding: 8px 6px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 3px rgba(66, 185, 131, 0.3);
}

.form-field input::placeholder {
  color: #aaa;
}

.form-notes {
  display: flex;
  flex-direction: column;
}

.form-notes label {
  font-size: 11px;
  color: #7f8c8d;
  margin-bottom: 3px;
  font-weight: 500;
}

.form-notes textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  box-sizing: border-box;
}

.form-notes textarea:focus {
  outline: none;
  border-color: #42b983;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-clear {
  padding: 10px 20px;
  background-color: #95a5a6;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-clear:hover {
  background-color: #7f8c8d;
}

.btn-submit {
  padding: 10px 20px;
  background-color: #42b983;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-submit:hover {
  background-color: #369f6e;
}

.form-message {
  margin: 8px 0 0 0;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 4px;
}

.form-message.success {
  background-color: #d4edda;
  color: #1f7a3a;
  border: 1px solid #1f7a3a;
}

.form-message.error {
  background-color: #ffeaa7;
  color: #c0392b;
  border: 1px solid #c0392b;
}
</style>
