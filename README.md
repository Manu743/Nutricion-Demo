# Nutrición · demo para portfolio

Demo interactiva de la app de valores nutricionales de alimentos. Corre **100 % en el navegador**: no necesita Supabase, credenciales ni red. Los datos son una muestra real del PTBDA (Tabla de Composición de Alimentos de Bolivia).

## Qué muestra

- 88 alimentos con las 28 columnas nutricionales del PTBDA, valores por 100 g.
- 19 grupos y 25 subgrupos de alimentos.
- Búsqueda sin acentos ni mayúsculas, vista tabla/tarjetas y columnas configurables (se recuerdan en `localStorage`).
- Dos planes de dieta de ejemplo (2200 kcal y 2050 kcal) con 9 comidas y 37 ítems.
- Tabla detallada por comida y totales con adecuación 90–110 %: una comida queda fuera de rango a propósito para mostrar el estado de alerta.
- Alta, edición y borrado de alimentos, grupos, subgrupos, dietas, comidas e ítems.

## Cómo funciona

La app real habla con Supabase a través de `src/supabaseClient.js`. La demo reemplaza **solo ese archivo** por un cliente local (`src/demo/demoClient.js`) que implementa el subconjunto de la API que usan los composables:

- `from`, `select` (incluidas relaciones embebidas como `grupos(grupo)` y `dieta_items(alimento(composicion(*)))`), `eq`, `order`, `insert`, `update`, `delete`, `single` y `count`.
- Relaciones y borrado en cascada resueltos en memoria, igual que las claves foráneas del esquema real.
- Persistencia en `localStorage` con la clave `nutricion-demo-db-v1`. El botón **Reiniciar datos** vuelve a la semilla.

Los componentes y composables son **los mismos de la app**, sin cambios. Eso hace que la demo muestre el comportamiento real del producto y no una maqueta aparte.

## Comandos

```bash
npm install
npm run serve    # http://localhost:8081
npm run build    # genera dist/ listo para publicar
npm test         # pruebas del cliente de datos y del script de sync (node --test)
npm run sync     # regenera src/ (requiere la app real como carpeta hermana)
npm run seed     # regenera la semilla desde ../../import_data.sql
```

## Publicar

1. `npm run build`
2. Copiar el contenido de `dist/` a cualquier hosting estático (Nginx, Netlify, Vercel, GitHub Pages…).

`publicPath: './'` en `vue.config.js` permite servirlo tanto en la raíz del dominio como en un subdirectorio (`/demos/nutricion/`). No hay variables de entorno ni pasos de backend.

## Mantenimiento

`src` es **generado**: no se edita a mano.

| Origen | Contenido |
| --- | --- |
| `../src` (app real) | Componentes, composables, datos y utilidades. |
| `overlay/main.js` | Monta `DemoShell` en lugar de `App`. |
| `overlay/supabaseClient.js` | Reemplaza Supabase por el cliente local. |
| `overlay/DemoShell.vue` | Barra de demo y botón de reinicio. |
| `overlay/demo/demoClient.js` | Cliente de datos en memoria. |
| `overlay/demo/seedData.js` | Semilla generada desde `import_data.sql`. |

Flujo cuando cambia la app:

```bash
npm run sync   # necesita el repo de la app como hermana; si falta, no toca src/
npm test
npm run build
```

Si además cambian los datos de origen, `npm run seed` regenera la semilla. Ese script lee `import_data.sql` en la raíz, que no se versiona por ser material de trabajo local; si falta, avisa y no toca la semilla actual.

## Estructura

```text
nutricion-demo/
├─ overlay/              # archivos propios de la demo
│  ├─ DemoShell.vue
│  ├─ main.js
│  ├─ supabaseClient.js
│  └─ demo/
│     ├─ demoClient.js
│     └─ seedData.js
├─ scripts/
│  ├─ generate-seed.mjs
│  └─ sync-app.mjs
├─ src/                  # generado desde ../src + overlay
├─ tests/
│  ├─ demoClient.test.mjs
│  └─ syncApp.test.mjs
├─ public/
├─ package.json
└─ vue.config.js
```

## Diferencias con la app real

| | App real | Demo |
| --- | --- | --- |
| Backend | Supabase (Postgres + RLS) | Ninguno: memoria + `localStorage` |
| Datos | Catálogo completo del PTBDA | Muestra curada de 88 alimentos |
| Persistencia | Compartida entre usuarios | Solo en el navegador de cada visitante |
| Autenticación | No implementada | No aplica |
| Variables de entorno | `VUE_APP_SUPABASE_*` | Ninguna |

## Sobre la app

- **Stack:** Vue 3 (`<script setup>`), Vue CLI 5, Supabase JS v2. Sin router ni estado global: una sola pantalla con pestañas.
- **Organización:** componentes de presentación + un composable por dominio (`useFoods`, `useGrupos`, `useSubgrupos`, `useDietas`), datos compartidos en `src/data` y utilidades en `src/utils`.
- **Cálculo nutricional:** todo se deriva en el cliente. `nutrientAmount` escala el valor por 100 g según los gramos y la adecuación se calcula como `total real / recomendado × 100`.
- **Decisiones reutilizables:** `useColumnVisibility` y `useViewMode` encapsulan estado persistido y se comparten entre la lista de alimentos y los totales de dieta; `ColumnVisibilityPanel` y `ViewModeToggle` son sus contrapartes visuales.
- **Búsqueda:** normalización NFD sin diacríticos en `src/utils/textSearch.js`, aplicada en memoria sobre el catálogo ya cargado.
