# SPEC 01 — Base: Tailwind v4 + capa de datos de inflación

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-11-03
> **Objective:** Dejar el proyecto Vue con Tailwind CSS v4 configurado y una capa de datos que sirva la serie histórica mensual de inflación argentina (1943-03 → 2026-09) desde un JSON vendorizado, con sus derivados calculados.

## Por qué existe esta spec

El proyecto es un scaffold de Vite sin nada construido. `devaluar` va a ser una SPA que muestra cuánta inflación acumuló el peso argentino a lo largo de los años. Antes de poder diseñar esa pantalla hace falta la base: estilos y datos.

Decisiones no obvias que toma esta spec:

- **El JSON se vendoriza al repo en vez de consumirse en vivo.** `hacecuentas.com` no envía `Access-Control-Allow-Origin` (verificado: `curl -H "Origin: ..."` no devuelve el header; el `OPTIONS` responde 200 sin headers CORS). Un `fetch`/axios desde el browser sería bloqueado. `pindec.dev` sí manda `Access-Control-Allow-Origin: *`, pero solo tiene datos desde 2016; el dataset de hacecuentas arranca en 1943-03, que es lo que hace útil la app.
- **El JSON vendorizado se sirve desde `public/` y se pide con axios.** `public/data/inflation.data.json` se sirve en `/data/inflation.data.json` tanto en dev como en build. Así axios sigue siendo el mecanismo real de obtención de datos (como se pidió), sin depender de CORS.
- **La spec define el qué, no el diseño.** El home es un spec posterior. Acá hay una pantalla de humo que prueba estilos + red + matemática, y se reemplaza después.

## Scope

**In:**

- Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/vite`) con el plugin de Vite, tokens de color y tipografía en `src/style.css` vía `@theme`, y soporte de `prefers-color-scheme`.
- Limpieza del scaffold: borrado de `src/components/HelloWorld.vue` y `src/assets/`.
- `axios` instalado y una capa `src/api/` con instancia HTTP y endpoint tipado para la serie de inflación.
- Script `pnpm data:update` que descarga el dataset de `hacecuentas.com` y lo escribe en `public/data/inflation.data.json`, validando la forma antes de escribir.
- Script `pnpm data:verify` que valida el JSON vendorizado e imprime las cifras de control.
- Tipos TypeScript del dataset y de las series normalizadas.
- Módulo de cálculo: índice acumulado, variación interanual, variación anual y equivalencia de un monto histórico al valor actual.
- Módulo de formateo de porcentajes y de números grandes (la inflación acumulada desde 1943 es de orden `10¹⁸`, necesita notación legible).
- Pantalla de humo en `App.vue` con estados de carga, error y éxito, **no** el home.
- `index.html` con `lang="es-AR"`, título y meta description.

**Out of scope (para specs futuros):**

- La pantalla home (diseño, layout, navegación, sección hero).
- Vue Router y cualquier ruta.
- Gráficos (SVG, canvas o librería).
- Series por categoría, IPC por región, EMAE, CBA, dólar blue.
- La API `pindec.dev`.
- Cualquier fuente de datos adicional a la de `hacecuentas.com`.
- Theme switcher manual (el dark mode es automático por `prefers-color-scheme`).
- Deploy / CI.

## Data model

El dataset de origen (`https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json`) tiene esta forma:

```jsonc
{
  "name": "Inflación mensual histórica de Argentina (IPC)",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "licenseName": "CC-BY-4.0",
  "creator": "Hacé Cuentas",
  "source": "INDEC (vía ArgentinaDatos)",
  "generatedAt": "2026-10-28T15:49:23.139Z",
  "rowCount": 1003,
  "data": [{ "fecha": "1943-03-31", "inflacion_mensual_pct": 1.6 }],
}
```

Verificado sobre el archivo real: **1003 filas**, de `1943-03-31` a `2026-09-30`, **sin huecos** (cada fila es el mes siguiente a la anterior), 77.930 bytes. Solo trae variación mensual; **no** trae índice ni interanual — hay que derivarlos.

Tipos nuevos en `src/types/inflacion.ts`:

```ts
/** Fila cruda tal como viene del dataset de hacecuentas.com. */
export interface FilaInflacion {
  fecha: string; // 'YYYY-MM-DD', último día del mes
  inflacion_mensual_pct: number;
}

/** Envoltorio del dataset completo. */
export interface DatasetInflacion {
  name: string;
  description: string;
  license: string;
  licenseName: string;
  creator: string;
  creatorUrl: string;
  source: string;
  sourceUrl: string;
  generatedAt: string;
  fields: string[];
  rowCount: number;
  data: FilaInflacion[];
}

/** Un mes normalizado, con la clave 'YYYY-MM' para ordenar y comparar. */
export interface MesInflacion {
  clave: string; // 'YYYY-MM'
  anio: number;
  mes: number; // 1-12
  variacionMensual: number; // % mensual
  /** Factor acumulado desde el primer mes del dataset, inclusive. 1 = sin cambios. */
  factorAcumulado: number;
}

/** Cálculos derivados de un mes concreto. */
export interface ResumenMes {
  clave: string;
  variacionMensual: number;
  /** Variación acumulada de los 12 meses que terminan en este mes, en %. */
  variacionInteranual: number;
  /** Factor acumulado desde el primer mes del dataset hasta este mes. */
  factorAcumulado: number;
  /** Variación acumulada en % desde el primer mes del dataset hasta este mes. */
  variacionAcumuladaDesdeInicio: number;
  /** Cuánto vale hoy un peso de este mes. */
  pesoActualPorPesoHistorico: number;
}

/** Cálculos de un año calendario. Puede estar incompleto. */
export interface ResumenAnio {
  anio: number;
  /** Variación compuesta de los meses disponibles del año, en %. */
  variacionAnual: number;
  mesesIncluidos: number;
  /** false si al año le faltan meses (1943 y 2026 lo están). */
  completo: boolean;
  variacionMensualPromedio: number;
}
```

Convención: la clave de mes es `'YYYY-MM'` en string, nunca un `Date`. La `fecha` del dataset es el último día del mes variable (`31`, `30`, `28`), así que parsear con `new Date(fecha)` arrastra zona horaria; la clave se deriva con `fecha.slice(0, 7)` y los números con `Number(fecha.slice(5, 7))`.

## Implementation plan

1. **Instalar dependencias.** `pnpm add axios` y `pnpm add -D tailwindcss @tailwindcss/vite` (versiones: axios `^1.21.0`, tailwindcss `^4.3.4`, `@tailwindcss/vite` `^4.3.4` — el plugin declara peer `vite: ^5.2.0 || ^6 || ^7 || ^8`, compatible con el Vite 8.3.5 del proyecto). Verificación: `pnpm dev` sigue levantando.

2. **Configurar Tailwind.** Agregar `import tailwindcss from '@tailwindcss/vite'` y `tailwindcss()` al array `plugins` de `vite.config.ts`. Reemplazar `src/style.css` por el bloque `@import "tailwindcss";` + variables semánticas en `:root` + `@media (prefers-color-scheme: dark)` + `@theme inline` mapeando `--color-surface`, `--color-surface-muted`, `--color-ink`, `--color-ink-muted`, `--color-line`, la escala `--color-brand-{50..900}` (celeste argentino) y `--font-sans`. Borrar `src/components/HelloWorld.vue` y `src/assets/hero.png`, `src/assets/vite.svg`, `src/assets/vue.svg`. `App.vue` queda con un placeholder mínimo con clases Tailwind. Verificación: `pnpm dev` muestra la página con los tokens aplicados y `pnpm build` pasa el typecheck.

3. **Definir los tipos.** Crear `src/types/inflacion.ts` con las interfaces de la sección de data model. Sin lógica. Verificación: `pnpm build` sigue compilando.

4. **Crear la capa HTTP.** `src/api/http.ts`: instancia de axios con `baseURL: import.meta.env.VITE_API_BASE_URL ?? ''`, `timeout: 10000`, y `Accept: application/json`. `src/api/inflacion.ts`: `obtenerSerieInflacion(): Promise<DatasetInflacion>` que hace `GET /data/inflation.data.json`, valida la forma con un type guard (`data` es array no vacío, `rowCount === data.length`, cada fila tiene `fecha` con formato `YYYY-MM-DD` y `inflacion_mensual_pct` numérico) y tira `Error` con mensaje en español si no valida. Verificación: la función se puede llamar desde `App.vue` y muestra datos.

5. **Vendorizar el dataset.** Crear `scripts/update-inflation.mjs` (Node ESM, usa el `fetch` global de Node 26, sin dependencias): descarga la URL, valida la misma forma que el type guard, escribe `public/data/inflation.data.json` con `JSON.stringify(payload, null, 2)` e imprime `filas: 1003, rango: 1943-03-31 → 2026-09-30, bytes: N`. Crear `scripts/verify-inflation.mjs` que lee el JSON vendorizado, valida `rowCount`, verifica que no haya huecos entre meses consecutivos e imprime las cifras de control. Agregar a `package.json` los scripts `"data:update": "node scripts/update-inflation.mjs"` y `"data:verify": "node scripts/verify-inflation.mjs"`. Verificación: `pnpm data:update` crea el archivo y `pnpm data:verify` imprime sin huecos.

6. **Implementar los cálculos.** `src/utils/inflacion.ts` con funciones puras: `normalizarSerie(dataset): MesInflacion[]` (ordena por `clave`, calcula `factorAcumulado` acumulando `1 + pct/100`), `calcularResumen(meses, clave): ResumenMes | null` (interanual = producto de los 12 meses que terminan en la clave, `pesoActualPorPesoHistorico = factorUltimo / factorDelMes`), `calcularResumenAnual(meses, anio): ResumenAnio` (compuesto sobre los meses disponibles del año, con `completo` en `false` si son menos de 12) y `ultimoMes(meses): MesInflacion | undefined`. Guardas: si `variacionMensual <= -100` el factor acumulado se vuelve 0 o negativo — en ese caso la función debe devolver `NaN` en vez de propagar un factor inválido. Verificación: `calcularResumen` del último mes devuelve `variacionInteranual ≈ 33.3 %` con los datos al 2026-09-30.

7. **Implementar el formateo.** `src/utils/formato.ts` con `formatearPorcentaje(valor, decimales = 1): string` (usando `Intl.NumberFormat('es-AR')`, con signo explícito) y `formatearNumeroGrande(valor): string` (notación compacta con `Intl.NumberFormat('es-AR', { notation: 'compact' })`; para valores mayores a `1e15` cae a notación científica con `toExponential`, porque `4.08e+18` no se lee bien como compacto). Verificación: `formatearNumeroGrande(4.0788e18)` devuelve una string legible, no `4.0788e+18` crudo.

8. **Pantalla de humo.** Reescribir `App.vue`: al montar llama a `obtenerSerieInflacion()`, guarda `estado: 'cargando' | 'error' | 'listo'`, y renderiza (a) estado de carga con un spinner de Tailwind, (b) estado de error con el mensaje del error y un botón "Reintentar", (c) estado de éxito con una tarjeta por dato: cantidad de meses, rango de fechas, variación mensual del último mes, variación interanual del último mes, factor acumulado desde 1943 y su equivalente en notación compacta. Estilos con clases Tailwind usando los tokens (`bg-surface text-ink border-line`). Verificación: `pnpm dev` muestra los cinco valores con los números esperados.

9. **Ajustar `index.html`.** `lang="es-AR"`, `<title>devaluar — Inflación histórica del peso argentino</title>`, meta description, `<meta name="color-scheme" content="light dark">`. Mantener el favicon actual. Verificación: la pestaña del browser muestra el título nuevo.

10. **Build final.** `pnpm build` debe terminar sin errores (incluye `vue-tsc -b`). Si `vue-tsc` reporta errores de `noUnusedLocals` o `erasableSyntaxOnly`, se corrigen en el paso, no se relaja la config.

## Acceptance criteria

- [ ] `pnpm build` termina con exit code 0, incluyendo el typecheck de `vue-tsc -b`.
- [ ] `pnpm dev` sirve la app sin errores en la consola del browser.
- [ ] `src/style.css` contiene `@import "tailwindcss"` y un bloque `@theme inline`; no queda CSS anidado del template de Vite.
- [ ] `src/components/HelloWorld.vue` y `src/assets/` no existen en el repo.
- [ ] `pnpm data:update` descarga el dataset y escribe `public/data/inflation.data.json` con 1003 filas, primera `1943-03-31`, última `2026-09-30`.
- [ ] `pnpm data:verify` confirma que `rowCount === data.length` y que no hay meses faltantes entre la primera y la última fila.
- [ ] La pantalla de humo muestra, con los datos al 2026-09-30: variación mensual del último mes `1.9 %`, variación interanual `33.3 %`, y factor acumulado desde 1943 del orden de `4.08 × 10¹⁶`.
- [ ] La pantalla de humo muestra un estado de error con mensaje en español si la petición falla, y un botón que reintenta.
- [ ] `obtenerSerieInflacion()` rechaza un payload mal formado (por ejemplo `rowCount` distinto de `data.length`) lanzando un `Error`.
- [ ] `calcularResumenAnual(meses, 1943)` devuelve `completo: false` y `mesesIncluidos: 10`.
- [ ] Los archivos `.ts` del proyecto usan `import type` para imports de solo tipos, y no usan `enum` ni parameter properties.

## Decisions

- **Sí:** vendorizar el JSON a `public/data/inflation.data.json`. `hacecuentas.com` no sirve headers CORS, así que un request browser-to-server falla. Vendorizar elimina la dependencia de CORS y de un tercero en runtime, y deja el repo como fuente de verdad auditable.
- **No:** consumir el dataset crudo en runtime desde `hacecuentas.com`. Bloqueado por CORS. Queda documentado que un backend o un proxy con CORS lo habilitaría.
- **No:** usar `pindec.dev` como fuente. Sí tiene CORS, pero solo arranca en 2016 y agrega una dependencia de otro proyecto. Queda para un spec futuro si hacen falta series por categoría o región.
- **Sí:** servir el JSON desde `public/` y pedirlo con axios a `/data/inflation.data.json`. Cumple el requisito de usar axios para los llamados, mantiene el bundle liviano (los 78 KB no entran al bundle de JS) y funciona igual en dev y en build.
- **Sí:** un script `data:update` que refresca el archivo, en lugar de un job de CI que redeploya. El sitio se actualiza a diario; un snapshot versionado en el repo es suficiente y auditable.
- **No:** cachear el dataset en `localStorage` o IndexedDB. Son 78 KB y se cachean por HTTP; el estado de la app es derivable, no persistente.
- **Sí:** calcular los derivados en el cliente, en funciones puras bajo `src/utils/`. El dataset son 1003 filas: transformarlo en el cliente es instantáneo y evita duplicar la lógica en un backend.
- **No:** precargar el dataset como módulo importado desde `src/data/`. Metería 78 KB (o ~100 KB prettified) en el bundle de JS y anularía el uso de axios.
- **Sí:** derivar el interanual y el acumulado desde el valor mensual, con el producto de `(1 + pct/100)`. El dataset no los trae y no hay fuente alternativa con esa granularidad desde 1943.
- **No:** interpolar valores faltantes. Verificado: la serie es continua, sin huecos. No hay nada que interpolar.
- **Sí:** guardar el dataset como JSON prettified con 2 espacios. Los diffs en git quedan legibles cuando se actualiza.
- **Sí:** marcar 1943 y 2026 como años incompletos con `completo: false` en vez de promediar o anualizar como si fueran años completos. 1943 tiene 10 meses (desde marzo) y 2026 tiene 9 (hasta septiembre).
- **Sí:** tokens de color semánticos (`surface`, `ink`, `line`, `brand-*`) en `@theme inline` en vez de colores hardcodeados en los componentes. Mantiene la convención que ya establecía `AGENTS.md` y permite que el dark mode funcione con un solo `@media`.
- **No:** un theme switcher manual. `prefers-color-scheme` cubre el caso y el switcher es una decisión de producto posterior.
- **No:** Vue Router todavía. Una sola vista no lo necesita; agregarlo ahora es speculative.
- **No:** librería de gráficos. La spec de la pantalla home va a decidir entre SVG propio y otra cosa; adelantarlo acá sería decidir sin contexto.

## Risks

| Riesgo                                                                            | Mitigación                                                                                                                               |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `hacecuentas.com` cambia la forma del JSON o deja de publicar                     | `data:update` valida antes de escribir y falla con exit code distinto de 0; el JSON viejo no se pisa. `data:verify` confirma integridad. |
| El snapshot envejece (el dataset se actualiza a diario)                           | `generatedAt` viaja en el payload y se puede mostrar en la UI. El refresh es un comando.                                                 |
| Derivar 83 años de producto acumulado acumula error de punto flotante             | Error relativo despreciable (≈ `10⁻¹³` sobre `1003` multiplicaciones). El factor total verificado es `4.0788 × 10¹⁶`.                    |
| La inflación acumulada (`10¹⁸ %`) no se puede leer en crudo                       | `formatearNumeroGrande` fuerza notación compacta/científica.                                                                             |
| `noUnusedLocals` / `erasableSyntaxOnly` rompen el build                           | El typecheck corre dentro de `pnpm build`; se corrige el código, no la config.                                                           |
| `prefers-color-scheme` y `@theme inline` no resuelven los tokens en algún browser | Tailwind v4 compila las utilities a `var(--color-x)`; los tests manuales en dev y preview lo cubren.                                     |

## Qué **no** entra en esta spec

- La pantalla home: diseño, hero, navegación, layout.
- Vue Router y las rutas `/mes/:anio-mes`.
- Todo gráfico: curva de inflación acumulada, barras por año.
- Canasta básica, dólar blue, UVA, EMAE, IPC por región.
- La API `pindec.dev`.
- Cualquier persistencia en el browser.
- Theme switcher manual.
- Deploy, CI, y tests automatizados (el proyecto no tiene runner de tests; la verificación es por scripts y a mano).

Cada uno de esos, si aterriza, va en su propia spec.
