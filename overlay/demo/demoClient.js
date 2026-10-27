// Cliente de datos para la demo: reproduce el subconjunto de la API de Supabase
// que usan los composables de la app (from / select / eq / order / insert /
// update / delete / single / count), pero resuelve todo en memoria y persiste
// en localStorage. No hay red ni credenciales: la demo es 100% estática.
import { SEED } from './seedData.js'

const STORAGE_KEY = 'nutricion-demo-db-v1'

const TABLES = [
  'grupos',
  'subgrupos',
  'alimento',
  'composicion',
  'dietas',
  'dieta_comidas',
  'dieta_items'
]

// Clave primaria que la app espera de cada tabla (alimento usa id_ali).
const PRIMARY_KEY = {
  grupos: 'id',
  subgrupos: 'id',
  alimento: 'id_ali',
  composicion: 'id',
  dietas: 'id',
  dieta_comidas: 'id',
  dieta_items: 'id'
}

// Relaciones embebidas que la app pide en sus select.
const RELATIONS = {
  alimento: {
    grupos: { table: 'grupos', local: 'codigo_grupo', foreign: 'codigo', many: false },
    subgrupos: { table: 'subgrupos', local: 'id_subgrupo', foreign: 'id', many: false },
    composicion: { table: 'composicion', local: 'id_ali', foreign: 'id_ali', many: false }
  },
  subgrupos: {
    grupos: { table: 'grupos', local: 'codigo_grupo', foreign: 'codigo', many: false }
  },
  dietas: {
    dieta_comidas: { table: 'dieta_comidas', local: 'id', foreign: 'dieta_id', many: true }
  },
  dieta_comidas: {
    dieta_items: { table: 'dieta_items', local: 'id', foreign: 'comida_id', many: true }
  },
  dieta_items: {
    alimento: { table: 'alimento', local: 'id_ali', foreign: 'id_ali', many: false }
  }
}

// Borrado en cascada equivalente al ON DELETE CASCADE del esquema real.
const CASCADES = {
  dietas: [{ table: 'dieta_comidas', foreign: 'dieta_id' }],
  dieta_comidas: [{ table: 'dieta_items', foreign: 'comida_id' }]
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function seedDatabase() {
  const db = {}
  for (const table of TABLES) db[table] = clone(SEED[table] || [])
  return db
}

function createMemoryStorage() {
  const values = new Map()
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => { values.set(key, String(value)) },
    removeItem: key => { values.delete(key) }
  }
}

// Parte un select por comas de primer nivel: "a, b(c, d(e)), f" => ["a", "b(c, d(e))", "f"].
function splitTopLevel(source) {
  const parts = []
  let depth = 0
  let current = ''

  for (const char of source) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function parseSelect(select) {
  if (!select || !select.trim() || select.trim() === '*') return null

  return splitTopLevel(select).map(part => {
    const open = part.indexOf('(')
    if (open === -1) return { name: part.trim() }
    const name = part.slice(0, open).trim()
    const inner = part.slice(open + 1, part.lastIndexOf(')'))
    return { name, children: parseSelect(inner) }
  })
}

function projectRow(db, table, row, fields) {
  if (!fields) return clone(row)

  const result = {}
  for (const field of fields) {
    if (field.name === '*') {
      Object.assign(result, clone(row))
      continue
    }

    const relation = RELATIONS[table]?.[field.name]
    if (!relation) {
      result[field.name] = row[field.name] === undefined ? null : clone(row[field.name])
      continue
    }

    const relatedRows = db[relation.table].filter(candidate =>
      String(candidate[relation.foreign]) === String(row[relation.local])
    )

    if (relation.many) {
      result[field.name] = relatedRows.map(related =>
        projectRow(db, relation.table, related, field.children)
      )
      continue
    }

    const related = relatedRows[0] || null
    result[field.name] = related ? projectRow(db, relation.table, related, field.children) : null
  }
  return result
}

function nextId(db, table) {
  const key = PRIMARY_KEY[table]
  return db[table].reduce((max, row) => Math.max(max, Number(row[key]) || 0), 0) + 1
}

function uniqueViolation(db, table, row) {
  if (table === 'grupos' && row.codigo) {
    return db.grupos.some(candidate => candidate.codigo === row.codigo)
      ? `duplicate key value violates unique constraint "grupos_codigo_key"`
      : null
  }
  if (table === 'alimento' && row.codigo) {
    return db.alimento.some(candidate => candidate.codigo === row.codigo && candidate.activo)
      ? `duplicate key value violates unique constraint "alimento_codigo_key"`
      : null
  }
  return null
}

class DemoQuery {
  constructor(state, table) {
    this.state = state
    this.table = table
    this.mode = 'select'
    this.filters = []
    this.orders = []
    this.returning = false
    this.fields = undefined
    this.countMode = false
    this.headOnly = false
    this.singleRow = false
    this.payload = null
  }

  select(columns = '*', options = {}) {
    if (this.mode === 'select') {
      this.fields = parseSelect(columns)
      if (options.count) this.countMode = true
      this.headOnly = Boolean(options.head)
    } else {
      this.returning = true
      this.fields = parseSelect(columns)
    }
    return this
  }

  insert(payload) {
    this.mode = 'insert'
    this.payload = payload
    return this
  }

  update(payload) {
    this.mode = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.mode = 'delete'
    return this
  }

  eq(column, value) {
    this.filters.push({ column, value })
    return this
  }

  order(column, options = {}) {
    this.orders.push({ column, ascending: options.ascending !== false })
    return this
  }

  single() {
    this.singleRow = true
    return this
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected)
  }

  matches(row) {
    return this.filters.every(filter => String(row[filter.column]) === String(filter.value))
  }

  sorted(rows) {
    if (!this.orders.length) return rows
    return [...rows].sort((a, b) => {
      for (const order of this.orders) {
        const left = a[order.column]
        const right = b[order.column]
        if (left === right) continue
        const result = left > right ? 1 : -1
        return order.ascending ? result : -result
      }
      return 0
    })
  }

  async execute() {
    try {
      if (this.mode === 'select') return this.executeSelect()
      if (this.mode === 'insert') return this.executeInsert()
      if (this.mode === 'update') return this.executeUpdate()
      return this.executeDelete()
    } catch (error) {
      return { data: null, error: { message: error.message || String(error) } }
    }
  }

  executeSelect() {
    const rows = this.state.db[this.table].filter(row => this.matches(row))
    if (this.countMode && this.headOnly) {
      return { data: null, error: null, count: rows.length }
    }
    const data = this.sorted(rows).map(row => projectRow(this.state.db, this.table, row, this.fields))
    if (this.singleRow) {
      if (data.length !== 1) {
        return {
          data: null,
          error: { message: 'JSON object requested, multiple (or no) rows returned' }
        }
      }
      return { data: data[0], error: null, count: this.countMode ? rows.length : null }
    }
    return { data, error: null, count: this.countMode ? rows.length : null }
  }

  executeInsert() {
    const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
    const created = []

    for (const row of rows) {
      const violation = uniqueViolation(this.state.db, this.table, row)
      if (violation) return { data: null, error: { message: violation } }

      const key = PRIMARY_KEY[this.table]
      const record = { ...row }
      if (record[key] === undefined || record[key] === null) record[key] = nextId(this.state.db, this.table)
      if (record.created_at === undefined) record.created_at = new Date().toISOString()

      this.state.db[this.table].push(record)
      created.push(record)
    }

    this.state.persist()
    if (!this.returning) return { data: null, error: null }

    const data = created.map(record => projectRow(this.state.db, this.table, record, this.fields))
    if (this.singleRow) {
      if (data.length !== 1) {
        return { data: null, error: { message: 'JSON object requested, multiple rows returned' } }
      }
      return { data: data[0], error: null }
    }
    return { data, error: null }
  }

  executeUpdate() {
    const rows = this.state.db[this.table].filter(row => this.matches(row))
    for (const row of rows) Object.assign(row, this.payload)
    this.state.persist()
    return { data: null, error: null }
  }

  executeDelete() {
    const removed = this.state.db[this.table].filter(row => this.matches(row))
    const key = PRIMARY_KEY[this.table]
    const removedIds = new Set(removed.map(row => String(row[key])))

    this.cascadeDelete(this.table, removed)

    this.state.db[this.table] = this.state.db[this.table].filter(
      row => !removedIds.has(String(row[key]))
    )

    this.state.persist()
    return { data: null, error: null }
  }

  cascadeDelete(table, rows) {
    const key = PRIMARY_KEY[table]

    for (const cascade of CASCADES[table] || []) {
      const parentIds = new Set(rows.map(row => String(row[key])))
      const children = this.state.db[cascade.table].filter(
        row => parentIds.has(String(row[cascade.foreign]))
      )
      if (!children.length) continue

      this.cascadeDelete(cascade.table, children)

      const childKey = PRIMARY_KEY[cascade.table]
      const childIds = new Set(children.map(row => String(row[childKey])))
      this.state.db[cascade.table] = this.state.db[cascade.table].filter(
        row => !childIds.has(String(row[childKey]))
      )
    }
  }
}

export function createDemoClient(options = {}) {
  const storage = options.storage || globalThis.localStorage || createMemoryStorage()

  const state = {
    db: null,
    persist() {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(this.db))
      } catch (error) {
        // Modo privado o cuota agotada: la demo sigue funcionando en memoria.
      }
    }
  }

  function load() {
    try {
      const stored = storage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const complete = TABLES.every(table => Array.isArray(parsed[table]))
        if (complete) return parsed
      }
    } catch (error) {
      // Datos corruptos: se regeneran desde el estado semilla.
    }
    return seedDatabase()
  }

  state.db = load()

  return {
    from(table) {
      if (!TABLES.includes(table)) throw new Error(`Tabla desconocida en la demo: ${table}`)
      return new DemoQuery(state, table)
    },
    reset() {
      storage.removeItem(STORAGE_KEY)
      state.db = seedDatabase()
    }
  }
}
