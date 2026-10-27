import test from 'node:test'
import assert from 'node:assert/strict'
import { createDemoClient } from '../overlay/demo/demoClient.js'
import { SEED } from '../overlay/demo/seedData.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: key => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => { values.set(key, String(value)) },
    removeItem: key => { values.delete(key) }
  }
}

function freshClient() {
  const storage = memoryStorage()
  return { storage, client: createDemoClient({ storage }) }
}

const FOODS_SELECT = `
  id_ali,
  alimento,
  codigo,
  codigo_grupo,
  id_subgrupo,
  tipo_alimento,
  notas,
  activo,
  grupos(grupo),
  subgrupos(nombre),
  composicion(*)
`

const MEALS_SELECT = `
  id,
  dieta_id,
  nombre,
  energia_kcal_rec,
  proteina_rec,
  grasa_rec,
  cho_rec,
  dieta_items(
    id,
    id_ali,
    gramos,
    alimento(alimento, composicion(*))
  )
`

test('lista alimentos con grupos, subgrupos y composición anidados', async () => {
  const { client } = freshClient()
  const { data, error } = await client.from('alimento').select(FOODS_SELECT).eq('activo', true)

  assert.equal(error, null)
  assert.equal(data.length, SEED.alimento.length)

  const arroz = data.find(food => food.codigo === 'A1')
  assert.equal(arroz.grupos.grupo, 'CEREALES Y DERIVADOS')
  assert.equal(typeof arroz.subgrupos.nombre, 'string')
  assert.equal(typeof arroz.composicion.energia_kcal, 'number')
  assert.equal(arroz.composicion.id_ali, arroz.id_ali)
})

test('cuenta filas por grupo sin traer datos', async () => {
  const { client } = freshClient()
  const { count, error } = await client
    .from('alimento')
    .select('*', { count: 'exact', head: true })
    .eq('codigo_grupo', 'A')

  assert.equal(error, null)
  assert.equal(count, SEED.alimento.filter(food => food.codigo_grupo === 'A').length)
})

test('crea un alimento con su composición y lo devuelve en el listado', async () => {
  const { client } = freshClient()
  const { data: inserted, error: alimentoError } = await client
    .from('alimento')
    .insert({
      alimento: 'Alimento de prueba',
      codigo: 'DEMO1',
      codigo_grupo: 'A',
      id_subgrupo: 1,
      tipo_alimento: 'normal',
      notas: null,
      activo: true
    })
    .select()
    .single()

  assert.equal(alimentoError, null)
  assert.equal(typeof inserted.id_ali, 'number')

  const { error: compError } = await client
    .from('composicion')
    .insert({ id_ali: inserted.id_ali, energia_kcal: 123, proteina_vegetal: 4.5 })

  assert.equal(compError, null)

  const { data } = await client.from('alimento').select(FOODS_SELECT).eq('activo', true)
  const created = data.find(food => food.codigo === 'DEMO1')
  assert.equal(created.composicion.energia_kcal, 123)
  assert.equal(created.proteina_vegetal, undefined)
})

test('el borrado lógico excluye el alimento de la lista activa', async () => {
  const { client } = freshClient()
  const first = SEED.alimento[0]

  const { error } = await client.from('alimento').update({ activo: false }).eq('id_ali', first.id_ali)
  assert.equal(error, null)

  const { data } = await client.from('alimento').select(FOODS_SELECT).eq('activo', true)
  assert.equal(data.length, SEED.alimento.length - 1)
  assert.equal(data.some(food => food.id_ali === first.id_ali), false)
})

test('crea dieta, comida e ítem y los lee con nutrientes anidados', async () => {
  const { client } = freshClient()
  const { data: dieta } = await client.from('dietas').insert({ nombre: 'Dieta de prueba' }).select().single()
  const { data: comida } = await client
    .from('dieta_comidas')
    .insert({ dieta_id: dieta.id, nombre: 'Desayuno' })
    .select()
    .single()

  const food = SEED.alimento.find(row => row.codigo === 'A1')
  const { data: item } = await client
    .from('dieta_items')
    .insert({ comida_id: comida.id, id_ali: food.id_ali, gramos: 150 })
    .select('id')
    .single()

  assert.equal(typeof item.id, 'number')

  const { data: meals, error } = await client
    .from('dieta_comidas')
    .select(MEALS_SELECT)
    .eq('dieta_id', dieta.id)
    .order('id', { ascending: true })

  assert.equal(error, null)
  assert.equal(meals.length, 1)
  assert.equal(meals[0].dieta_items.length, 1)
  assert.equal(meals[0].dieta_items[0].alimento.alimento, 'Arroz grano largo')
  assert.equal(typeof meals[0].dieta_items[0].alimento.composicion.energia_kcal, 'number')
})

test('actualiza los recomendados de una comida', async () => {
  const { client } = freshClient()
  const { error } = await client
    .from('dieta_comidas')
    .update({ energia_kcal_rec: 600, proteina_rec: 20 })
    .eq('id', 1)

  assert.equal(error, null)

  const { data } = await client.from('dieta_comidas').select('*').eq('id', 1)
  assert.equal(data[0].energia_kcal_rec, 600)
  assert.equal(data[0].proteina_rec, 20)
})

test('persiste los cambios entre instancias (recarga de página)', async () => {
  const { storage, client } = freshClient()
  await client.from('dietas').insert({ nombre: 'Persistente' }).select().single()

  const reloaded = createDemoClient({ storage })
  const { data } = await reloaded.from('dietas').select('*').order('created_at', { ascending: true })

  assert.equal(data.some(dieta => dieta.nombre === 'Persistente'), true)
})

test('elimina una dieta en cascada con sus comidas e ítems', async () => {
  const { client } = freshClient()
  const dietaId = SEED.dietas[0].id

  const { error } = await client.from('dietas').delete().eq('id', dietaId)
  assert.equal(error, null)

  const { data: meals } = await client.from('dieta_comidas').select('*').eq('dieta_id', dietaId)
  assert.equal(meals.length, 0)

  const removedMealIds = new Set(
    SEED.dieta_comidas.filter(meal => meal.dieta_id === dietaId).map(meal => meal.id)
  )
  const orphanItems = SEED.dieta_items.filter(item => removedMealIds.has(item.comida_id))
  assert.ok(orphanItems.length > 0)

  const { data: remainingItems } = await client.from('dieta_items').select('*')
  assert.equal(remainingItems.length, SEED.dieta_items.length - orphanItems.length)

  const { data: dietas } = await client.from('dietas').select('*')
  assert.equal(dietas.length, SEED.dietas.length - 1)
})

test('reinicia los datos al estado semilla', async () => {
  const { client } = freshClient()
  await client.from('dietas').insert({ nombre: 'Temporal' }).select().single()
  client.reset()

  const { data } = await client.from('dietas').select('*')
  assert.equal(data.length, SEED.dietas.length)
  assert.equal(data.some(dieta => dieta.nombre === 'Temporal'), false)
})
