// Genera demo/overlay/demo/seedData.js a partir de import_data.sql (PTBDA Bolivia).
//
// import_data.sql no se versiona (ver .gitignore) porque es material de trabajo
// local. Si el archivo no existe, el script lo informa y no toca la semilla.
//
// Uso: npm run seed
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const demoRoot = join(here, '..')
const appRoot = join(demoRoot, '..')
const sourcePath = join(appRoot, 'import_data.sql')
const outputPath = join(demoRoot, 'overlay', 'demo', 'seedData.js')

if (!existsSync(sourcePath)) {
  console.error(`No se encontró ${sourcePath}.`)
  console.error('Copiá import_data.sql a la raíz del proyecto para regenerar la semilla.')
  process.exit(1)
}

const source = readFileSync(sourcePath, 'utf8')

const NUTRIENTS = [
  'energia_kcal', 'humedad', 'proteina_animal', 'proteina_vegetal', 'grasa',
  'cho_simples', 'cho_complejos', 'f_cruda', 'ceniza', 'calcio', 'fosforo',
  'hierro_hem', 'hierro_no_hem', 'zinc', 'sodio', 'potasio', 'magnesio',
  'selenio', 'cobre', 'sodio_meq', 'potasio_meq', 'vit_a', 'tiamina',
  'riboflavina', 'niacina', 'folatos', 'vit_b12', 'vit_c'
]

const grupos = []
const foodsByCode = new Map()
const compByCode = new Map()

for (const line of source.split(/\r?\n/)) {
  let match = line.match(/INSERT INTO grupos \(codigo, grupo\) VALUES \('([^']*)', '([^']*)'\)/)
  if (match) {
    grupos.push({ id: grupos.length + 1, codigo: match[1], grupo: match[2] })
    continue
  }

  match = line.match(/INSERT INTO alimento \(codigo, alimento, codigo_grupo, activo\) VALUES \('([^']*)', '([^']*)', '([^']*)', true\)/)
  if (match && !foodsByCode.has(match[1])) {
    foodsByCode.set(match[1], { codigo: match[1], alimento: match[2], codigo_grupo: match[3] })
    continue
  }

  match = line.match(/INSERT INTO composicion \([\s\S]*?\) VALUES \(\(SELECT id_ali FROM alimento WHERE codigo = '([^']*)'\), (.*)\);/)
  if (match) {
    const values = match[2].split(', ').map(value => Number(value))
    const row = {}
    NUTRIENTS.forEach((key, index) => {
      row[key] = Number.isFinite(values[index]) ? values[index] : null
    })
    compByCode.set(match[1], row)
  }
}

const SUBGROUPS = [
  ['Cereales en grano', 'A'],
  ['Harinas, féculas y derivados', 'A'],
  ['Panes y pastas', 'A'],
  ['Tubérculos y raíces', 'B'],
  ['Hortalizas de hoja', 'B'],
  ['Hortalizas de fruto', 'B'],
  ['Hortalizas de bulbo y raíz', 'B'],
  ['Frutas frescas', 'C'],
  ['Frutas cítricas', 'C'],
  ['Aceites y grasas', 'D'],
  ['Pescados y mariscos', 'E'],
  ['Carnes rojas', 'F'],
  ['Aves', 'F'],
  ['Vísceras y embutidos', 'F'],
  ['Leche y derivados', 'G'],
  ['Quesos', 'G'],
  ['Bebidas', 'H'],
  ['Huevos', 'J'],
  ['Azúcares y dulces', 'K'],
  ['Misceláneos', 'L'],
  ['Frutas nativas', 'P'],
  ['Conservas', 'R'],
  ['Platos preparados', 'S'],
  ['Leguminosas', 'T'],
  ['Régimenes especiales', 'N']
]

const subgrupos = SUBGROUPS.map(([nombre, codigo_grupo], index) => ({
  id: index + 1,
  nombre,
  codigo_grupo
}))

// Curaduría: alimentos reconocibles que cubren todos los grupos del PTBDA.
// El segundo valor es el id del subgrupo.
const CURATED = [
  ['A1', 1], ['A5', 1], ['A11', 1], ['A17', 1], ['A14', 1], ['A35', 1], ['A12', 1], ['A7', 1],
  ['A45', 2], ['A41', 2], ['A119', 3], ['A50', 3],
  ['B67', 4], ['B71', 4], ['B73', 4], ['B47', 4], ['B85', 4], ['B75', 4],
  ['B25', 5], ['B19', 5], ['B35', 5], ['B38', 6], ['B43', 6], ['B40', 6],
  ['B49', 7], ['B87', 7], ['B81', 7],
  ['C61', 8], ['C36', 8], ['C55', 8], ['C60', 8], ['C35', 8], ['C32', 8], ['C11', 8], ['C84', 8], ['C52', 8],
  ['C47', 9], ['C24', 9],
  ['D2', 10], ['D1', 10], ['D3', 10], ['D9', 10],
  ['E23', 11], ['E18', 11],
  ['F2', 12], ['F8', 12], ['F6', 12], ['F43', 12], ['F55', 12],
  ['F68', 13], ['F70', 13], ['F11', 14],
  ['G13', 15], ['G37', 15], ['G15', 15], ['G26', 16], ['G18', 16],
  ['H1', 17], ['H12', 17], ['H39', 17],
  ['J4', 18], ['J5', 18],
  ['K1', 19], ['K2', 19], ['K29', 19],
  ['L9', 20], ['L34', 20],
  ['P-MARACUYA', 21], ['P-GUANABANA', 21], ['P-PITAHAYA', 21], ['P-ZAPOTE', 21],
  ['R24', 22], ['R42', 22], ['R4', 22],
  ['S82', 23], ['S84', 23], ['S63', 23], ['S47', 23], ['S34', 23],
  ['T13', 24], ['T4', 24], ['T2', 24], ['T20', 24], ['T15', 24], ['T32', 24], ['T9', 24],
  ['N7', 25], ['N2', 25]
]

// Los alimentos nativos y algunos platos no tienen código legible en el Excel:
// se resuelven por nombre.
const RESOLVED_BY_NAME = {
  'P-MARACUYA': { group: 'P', includes: 'maracuya' },
  'P-GUANABANA': { group: 'P', includes: 'guanabana' },
  'P-PITAHAYA': { group: 'P', includes: 'pitahaya' },
  'P-ZAPOTE': { group: 'P', includes: 'zapote' },
  S34: { group: 'S', includes: 'arroz con leche' }
}

const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const resolvedCodes = {}
for (const [alias, target] of Object.entries(RESOLVED_BY_NAME)) {
  for (const food of foodsByCode.values()) {
    if (food.codigo_grupo !== target.group) continue
    if (normalize(food.alimento).includes(target.includes)) {
      resolvedCodes[alias] = food.codigo
      break
    }
  }
}

const missing = []
const selected = []
for (const [rawCode, subgrupoId] of CURATED) {
  const code = resolvedCodes[rawCode] || rawCode
  const food = foodsByCode.get(code)
  if (!food || !compByCode.has(code)) {
    missing.push(`${rawCode} -> ${code}`)
    continue
  }
  selected.push({ code, subgrupoId, food, composition: compByCode.get(code) })
}

if (missing.length) {
  console.error(`Faltan alimentos en import_data.sql: ${missing.join(', ')}`)
  process.exit(1)
}

const alimento = []
const composicion = []
selected.forEach((entry, index) => {
  const id = index + 1
  alimento.push({
    id_ali: id,
    codigo: entry.code,
    alimento: entry.food.alimento.replace(/\s+/g, ' ').trim(),
    codigo_grupo: entry.food.codigo_grupo,
    id_subgrupo: entry.subgrupoId,
    tipo_alimento: 'normal',
    notas: null,
    activo: true
  })
  composicion.push({ id, id_ali: id, ...entry.composition })
})

const byCode = new Map(alimento.map(row => [row.codigo, row]))

const DIETS = [
  {
    nombreBase: 'Plan diario',
    meals: [
      { nombre: 'Desayuno', foodFactor: 1, items: [['A119', 60], ['G13', 200], ['J4', 50], ['C61', 100], ['K1', 5]] },
      { nombre: 'Media mañana', foodFactor: 1, items: [['C36', 150], ['T15', 20]] },
      { nombre: 'Almuerzo', foodFactor: 1, items: [['A1', 120], ['F2', 100], ['B67', 80], ['B87', 50], ['B38', 50], ['D2', 8]] },
      // Recomendado 15% por encima del total real: deja una comida en rojo
      // para mostrar cómo se comporta la adecuación fuera de rango.
      { nombre: 'Merienda', foodFactor: 1.15, items: [['G37', 150], ['A11', 25], ['K29', 8]] },
      { nombre: 'Cena', foodFactor: 1, items: [['F68', 100], ['B25', 50], ['A119', 60], ['G26', 25], ['D3', 5]] }
    ]
  },
  {
    nombreBase: 'Plan vegetariano',
    meals: [
      { nombre: 'Desayuno', foodFactor: 1, items: [['A11', 50], ['G13', 200], ['C61', 100], ['T15', 15]] },
      { nombre: 'Almuerzo', foodFactor: 1, items: [['T13', 120], ['A5', 100], ['B87', 50], ['B43', 80], ['D2', 8]] },
      { nombre: 'Merienda', foodFactor: 1, items: [['A119', 60], ['G26', 40], ['B38', 50]] },
      { nombre: 'Cena', foodFactor: 1, items: [['T32', 100], ['B67', 120], ['B19', 60], ['D2', 8]] }
    ]
  }
]

const dietas = []
const dieta_comidas = []
const dieta_items = []
let mealId = 0
let itemId = 0
const createdAt = Date.parse('2026-01-15T08:00:00Z')

DIETS.forEach((diet, dietIndex) => {
  const dietId = dietIndex + 1
  let dietKcal = 0

  dietas.push({
    id: dietId,
    nombre: diet.nombreBase,
    created_at: new Date(createdAt + dietIndex * 3600000).toISOString()
  })

  diet.meals.forEach(meal => {
    mealId += 1
    const totals = { energia_kcal: 0, proteina: 0, grasa: 0, cho: 0 }

    for (const [code, gramos] of meal.items) {
      const food = byCode.get(code)
      if (!food) throw new Error(`Alimento no seleccionado: ${code}`)

      const composition = compByCode.get(code)
      const factor = gramos / 100
      totals.energia_kcal += (composition.energia_kcal || 0) * factor
      dietKcal += (composition.energia_kcal || 0) * factor
      totals.proteina += ((composition.proteina_animal || 0) + (composition.proteina_vegetal || 0)) * factor
      totals.grasa += (composition.grasa || 0) * factor
      totals.cho += ((composition.cho_simples || 0) + (composition.cho_complejos || 0)) * factor

      itemId += 1
      dieta_items.push({
        id: itemId,
        comida_id: mealId,
        id_ali: food.id_ali,
        gramos,
        created_at: new Date(createdAt).toISOString()
      })
    }

    const factor = meal.foodFactor || 1
    dieta_comidas.push({
      id: mealId,
      dieta_id: dietId,
      nombre: meal.nombre,
      energia_kcal_rec: Math.round(totals.energia_kcal * factor / 5) * 5,
      proteina_rec: Math.round(totals.proteina * factor),
      grasa_rec: Math.round(totals.grasa * factor),
      cho_rec: Math.round(totals.cho * factor),
      created_at: new Date(createdAt).toISOString()
    })
  })

  const roundedKcal = Math.round(dietKcal / 50) * 50
  dietas[dietas.length - 1].nombre = `${diet.nombreBase} · ${roundedKcal} kcal`
})

const payload = {
  grupos,
  subgrupos,
  alimento,
  composicion,
  dietas,
  dieta_comidas,
  dieta_items
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(
  outputPath,
  '// Datos de demostración generados desde import_data.sql (PTBDA Bolivia).\n' +
    '// No editar a mano: regenerar con `npm run seed`.\n' +
    `export const SEED = ${JSON.stringify(payload)}\n`
)

console.log(
  `Semilla generada: ${alimento.length} alimentos, ${grupos.length} grupos, ` +
    `${subgrupos.length} subgrupos, ${dietas.length} dietas, ` +
    `${dieta_comidas.length} comidas, ${dieta_items.length} ítems.`
)
