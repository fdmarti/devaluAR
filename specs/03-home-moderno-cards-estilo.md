# SPEC 03 — Home moderno: 3 cards en fila, hero 1943 y footer minimal

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-11-03
> **Objective:** Rediseñar el home con un estilo editorial moderno, dejar tres tarjetas de métricas en una misma fila bajo una cifra protagonista de 1943, y reducir el footer a la fecha de hoy y la licencia.

## Por qué existe esta spec

SPEC 02 dejó el home con estética editorial serif, pero con tres fricciones concretas:

- La grilla de tarjetas está **desbalanceada**: una card-featured con borde inferior y cuatro cards en `sm:grid-cols-2`, o sea que en desktop el bloque se lee como 1 + 4 en dos filas y ninguna de las tres métricas (meses, variación mensual, interanual) tiene el mismo peso visual entre sí.
- La card **"Factor acumulado" duplica** la información de "Un peso de 1943 vale hoy": son el mismo número expresado como factor y como equivalencia de un peso. Mostrarlo dos veces hace que la página parezca tener más datos de los que tiene.
- El **footer tiene tres bloques** (fecha, fuente, licencia) y el bloque de "Cifras de control" del home repite fuente y licencia. Los metadatos están en dos lugares y el footer pesa más de lo que aporta.

Esta spec ataca las tres: un hero con una sola cifra protagonista (cuánto vale hoy un peso de 1943), una fila de tres métricas equivalentes y comparables, los metadatos como fila de cards propia, y un footer de una línea.

## Scope

**In:**

- **Nuevo estilo visual "editorial moderno híbrido"** para todo el home: serif (Source Serif 4) para el titular y las cifras, sans del sistema para etiquetas y UI, cards con borde hairline de 1px, esquinas redondeadas (`rounded-2xl`), superficie apenas teñida (`surface-muted`), mucho aire y sin sombras, degradados ni efectos.
- **Nuevo componente `src/components/StatCard.vue`** con tres props: `titulo: string`, `valor: string`, `subtitulo?: string` (default `''`). Orden visual: título → valor → subtítulo. Si el subtítulo viene vacío, no se renderiza ese elemento.
- **Fila de 3 tarjetas de métricas**, todas con la misma estructura (`StatCard`):
  - "Meses en la serie" → valor `1.003` → subtítulo `03/1943 → 09/2026`.
  - "Variación mensual" → valor `+1,9 %` → subtítulo `último mes: 09/2026`.
  - "Variación interanual" → valor `+33,3 %` → subtítulo `12 meses hasta 09/2026`.
  - Grilla de **una columna en mobile y tres columnas desde `md`** (768px), con `gap-4`.
- **Eliminación de la card "Factor acumulado"** de la UI. El cálculo de `factorAcumulado` **no se toca**: sigue siendo la base de `pesoActualPorPesoHistorico` en `src/utils/inflacion.ts`.
- **"Un peso de 1943 vale hoy" como cifra protagonista (hero), sin card**: etiqueta en versalitas con color de acento, valor en serif grande con `tabular-nums`, detalle `desde 03/1943, en pesos actuales`. Sin caja ni borde: es el foco de la página.
- **Fila propia de metadatos** con 2 `StatCard` bajo un heading "Cifras de control":
  - "Año inicial" → valor `1943` → subtítulo `incompleto · 10 meses`.
  - "Dataset generado" → valor `10/2026` → sin subtítulo.
  - Grilla de una columna en mobile y dos desde `md`.
- **Línea de créditos con links** debajo de los metadatos: `Fuente: INDEC, recolectado por Hacé Cuentas · dataset original`, con los tres links (INDEC, Hacé Cuentas, dataset original) abriendo en pestaña nueva con `rel="noopener noreferrer"`.
- **Footer reducido a una sola línea**: fecha de hoy en `dd/MM/yyyy` a la izquierda y la licencia `CC-BY-4.0` (con link a Creative Commons) a la derecha. Se elimina el bloque "Fuente" del footer.
- **Constantes de fuente compartidas** en `src/constants/fuente.ts` (INDEC, Hacé Cuentas, dataset original, licencia), para que el home y el footer usen la misma fuente de verdad.
- **`formatearEntero(valor: number): string`** en `src/utils/formato.ts` (`Intl.NumberFormat('es-AR')`), para que "Meses en la serie" muestre `1.003` con separador de miles en vez de `1003`.
- Contenedor del home ampliado de `max-w-3xl` a `max-w-4xl`, para que la fila de 3 cards respire.
- Estados de carga y error re-estilizados con el mismo lenguaje visual (card `rounded-2xl`, mismos labels y jerarquías).

**Out of scope (para specs futuros):**

- Gráficos, curvas, barras, sparklines o cualquier librería de charts (ya descartado en SPEC 02, se mantiene).
- Vue Router, rutas de detalle por mes o por año.
- Calculadora de equivalencia, selector de mes/año, tabla anual.
- Series por categoría, IPC por región, EMAE, CBA, dólar blue.
- Theme switcher manual.
- Cambios en el dataset vendorizado, en `src/types/inflacion.ts` o en los cálculos de `src/utils/inflacion.ts`.
- Persistencia en el browser.
- Deploy, CI y tests automatizados (el proyecto no tiene runner de tests).

## Data model

Esta spec **no introduce estructuras de datos nuevas**. Reusa `DatasetInflacion`, `MesInflacion`, `ResumenMes` y `ResumenAnio` de `src/types/inflacion.ts` sin modificarlos.

**Props del nuevo componente** (`src/components/StatCard.vue`):

```ts
const props = defineProps<{
  /** Etiqueta corta de la métrica, en versalitas. */
  titulo: string;
  /** Cifra ya formateada. El componente no formatea nada. */
  valor: string;
  /** Detalle opcional. Si viene vacío, no se renderiza. */
  subtitulo?: string;
}>();
```

El componente es **presentacional puro**: no recibe datos crudos, no llama a los utils y no conoce el dominio. El formateo sigue estando en `App.vue` / `src/utils/formato.ts`.

**Objeto de fuente compartido** (`src/constants/fuente.ts`):

```ts
export const FUENTE = {
  origen: "INDEC",
  origenUrl: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31",
  recolector: "Hacé Cuentas",
  recolectorUrl: "https://hacecuentas.com",
  datasetUrl:
    "https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json",
  licencia: "CC-BY-4.0",
  licenciaUrl: "https://creativecommons.org/licenses/by/4.0/",
};
```

Se mueve desde `AppFooter.vue` (donde estaba hardcodeada) a este módulo, porque ahora **dos** lugares la necesitan: la línea de créditos del home y la licencia del footer.

**Formateador nuevo** (`src/utils/formato.ts`):

```ts
/** Formatea un entero con separador de miles es-AR: `1003` → `1.003`. */
export function formatearEntero(valor: number): string;
```

Convención: devuelve `'—'` si el valor no es finito, igual que el resto de los formateadores del módulo.

**Estructura de la vista en `App.vue`** (computed; son objetos planos con las mismas tres claves que las props de `StatCard`):

```ts
// Cifra protagonista del hero
const cifraHero = {
  titulo: "Un peso de 1943 vale hoy",
  valor: "…",
  subtitulo: "desde 03/1943, en pesos actuales",
};

// Las 3 métricas de la fila
const tarjetas = [
  {
    titulo: "Meses en la serie",
    valor: "1.003",
    subtitulo: "03/1943 → 09/2026",
  },
  {
    titulo: "Variación mensual",
    valor: "+1,9 %",
    subtitulo: "último mes: 09/2026",
  },
  {
    titulo: "Variación interanual",
    valor: "+33,3 %",
    subtitulo: "12 meses hasta 09/2026",
  },
];

// Los 2 metadatos
const metadatos = [
  { titulo: "Año inicial", valor: "1943", subtitulo: "incompleto · 10 meses" },
  { titulo: "Dataset generado", valor: "10/2026", subtitulo: "" },
];
```

## Implementation plan

1. **Agregar `formatearEntero` a `src/utils/formato.ts`.** Función pura con `Intl.NumberFormat('es-AR')`, devuelve `'—'` si el valor no es finito. Verificación: `pnpm build` compila y `formatearEntero(1003)` devuelve `1.003`.

2. **Crear `src/constants/fuente.ts` y mover la constante `FUENTE`.** Nuevo módulo con la constante compartida (con los mismos valores actuales de `AppFooter.vue`). `AppFooter.vue` pasa a importarla y borra su copia local. Verificación: el footer sigue mostrando los mismos links y `pnpm build` pasa.

3. **Crear `src/components/StatCard.vue`.** Componente presentacional con `defineProps` de `titulo`, `valor` y `subtitulo?`. Markup: label en `text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-ink-muted`; valor en `font-serif text-4xl font-semibold leading-none tabular-nums`; subtítulo en `mt-3 text-sm leading-relaxed text-ink-muted`. Contenedor: `rounded-2xl border border-line bg-surface-muted p-6`. El subtítulo solo se renderiza si `subtitulo` no está vacío. Verificación: el componente se ve bien con y sin subtítulo, en claro y en oscuro.

4. **Reestructurar los `computed` de `App.vue`.** Reemplazar el computed `tarjetas` (5 elementos con `etiqueta`/`valor`/`detalle`) por tres computed: `cifraHero` (objeto), `tarjetas` (3 elementos con `titulo`/`valor`/`subtitulo`) y `metadatos` (2 elementos). Eliminar de la lista la entrada "Factor acumulado" (el `resumen.value.factorAcumulado` se sigue usando en `src/utils/inflacion.ts`, no se borra el cálculo). "Meses en la serie" pasa a usar `formatearEntero(meses.value.length)`. Verificación: los valores mostrados coinciden con los de hoy, salvo el conteo de meses que ahora muestra `1.003`.

5. **Reescribir el hero de `App.vue`.** Kicker `devaluar` en versalitas con tracking amplio y color de acento; titular en serif (`text-4xl sm:text-5xl`, tracking apretado); bajada en `text-ink-muted` con el rango en `MM/YYYY`; debajo, la cifra protagonista de 1943 como bloque sin caja: label en versalitas con `text-accent`, valor en `font-serif text-5xl sm:text-6xl font-semibold leading-none tabular-nums` y detalle en `text-sm text-ink-muted`. Verificación: la cifra y sus dos textos se ven en claro y en oscuro.

6. **Renderizar la fila de 3 `StatCard`.** Sección con `grid gap-4 md:grid-cols-3` y `v-for` sobre `tarjetas`. Verificación: en ≥768px las 3 están en la misma fila; por debajo se apilan en una columna.

7. **Reemplazar el bloque "Cifras de control".** Se borra el `dl` actual. En su lugar: heading "Cifras de control" (`text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted`), grilla `grid gap-4 md:grid-cols-2` con los 2 `StatCard` de `metadatos`, y debajo la línea de créditos con los tres links (`FUENTE.origen`, `FUENTE.recolector`, dataset original), cada uno con `target="_blank"` y `rel="noopener noreferrer"`, en `text-sm text-ink-muted`. Verificación: los tres links abren y apuntan a `indec.gob.ar`, `hacecuentas.com` y el dataset original.

8. **Reescribir `AppFooter.vue`.** Estructura de una sola línea: `flex flex-col gap-3 border-t border-line px-6 py-6 sm:flex-row sm:items-center sm:justify-between`. Izquierda: fecha de hoy (`formatearFecha(new Date())`, `dd/MM/yyyy`) en `font-serif text-lg tabular-nums`. Derecha: `CC-BY-4.0` con link a `FUENTE.licenciaUrl`. Se borra el bloque "Fuente" y el link al dataset. Verificación: el footer ocupa una línea en desktop, muestra la fecha y la licencia, y no contiene la palabra "INDEC".

9. **Re-estilizar los estados de carga y error.** Mismo lenguaje visual nuevo: contenedor `rounded-2xl border border-line bg-surface-muted p-8`, spinner con `border-t-accent`, botón "Reintentar" con `rounded-lg border border-accent`. Verificación: los dos estados se ven consistentes con el diseño final y el footer sigue visible.

10. **Build final.** `pnpm build` termina con exit code 0 (incluye `vue-tsc -b`). Si `vue-tsc` reporta `noUnusedLocals` o `erasableSyntaxOnly`, se corrige el código, no la config. Verificación: build limpio.

## Acceptance criteria

- [ ] `pnpm build` termina con exit code 0, incluyendo el typecheck de `vue-tsc -b`.
- [ ] `pnpm dev` sirve la app sin errores en la consola del browser.
- [ ] La card "Factor acumulado" **no aparece** en ningún estado de la UI.
- [ ] "Un peso de 1943 vale hoy" aparece como cifra protagonista del hero, sin caja ni borde a su alrededor, con su valor y su detalle `desde 03/1943, en pesos actuales`.
- [ ] Existen exactamente 3 tarjetas de métricas y las 3 se renderizan con el componente `StatCard`.
- [ ] Las 3 tarjetas están en la misma fila a 768px de ancho o más, y se apilan en una columna por debajo.
- [ ] Las 3 tarjetas tienen la misma estructura visual: título arriba, valor en serif con `tabular-nums`, subtítulo abajo.
- [ ] `StatCard` acepta `titulo` y `valor` obligatorios y `subtitulo` opcional; con `subtitulo` vacío no se renderiza ningún elemento de subtítulo.
- [ ] "Meses en la serie" muestra el valor `1.003` con separador de miles.
- [ ] "Variación mensual" muestra `+1,9 %` y "Variación interanual" muestra `+33,3 %` con los datos al `09/2026`.
- [ ] El bloque de metadatos tiene exactamente 2 tarjetas: "Año inicial" (`1943`, subtítulo `incompleto · 10 meses`) y "Dataset generado" (`10/2026`).
- [ ] La fuente aparece en el home como línea de créditos con tres links (INDEC, Hacé Cuentas, dataset original) que abren en pestaña nueva con `rel="noopener noreferrer"`.
- [ ] El footer contiene **solo** la fecha de hoy y la licencia: muestra `dd/MM/yyyy` y `CC-BY-4.0` con link a `creativecommons.org`, y no contiene el bloque "Fuente" ni la palabra "INDEC".
- [ ] La fecha de hoy del footer es la del día en que se carga la página.
- [ ] Ninguna fecha de la serie se muestra en `YYYY-MM`: rango del hero, subtítulos de las 3 tarjetas y "Dataset generado" están en `MM/YYYY`.
- [ ] La app no contiene gráficos: no hay `canvas`, ni `svg` con paths de datos, ni librería de charts.
- [ ] `src/components/StatCard.vue` existe y `App.vue` no define el markup de las cards inline.
- [ ] `src/constants/fuente.ts` existe y es la única fuente de las URLs de INDEC, Hacé Cuentas, dataset y licencia.
- [ ] `src/utils/formato.ts` exporta `formatearEntero` y ninguna función de fecha de la app usa `Intl.DateTimeFormat`, `toLocaleDateString` ni `slice`/`padStart` manual.
- [ ] `index.html` sigue cargando **solo** Source Serif 4: no se agregó ninguna webfont nueva.
- [ ] La app se ve bien en modo claro y en modo oscuro, y el dark mode sigue siguiendo `prefers-color-scheme` sin switcher.
- [ ] La app es usable a 360 px de ancho: no hay scroll horizontal ni texto cortado en las cards ni en el footer.

## Decisions

- **Sí:** "editorial moderno híbrido" como dirección. Se conserva Source Serif 4 para titular y cifras (identidad ya establecida en SPEC 02) y se pasa a sans del sistema para etiquetas y UI. Hairlines, `rounded-2xl`, superficie teñida y aire. Es el camino de menor riesgo para algo que se percibe "más moderno" sin perder el carácter.
- **No:** agregar Inter ni otra webfont. Un request extra y una fuente más para el sistema solo justifican el costo si se abandona la serif, y eso no se pidió.
- **No:** sombras, degradados, glassmorphism ni animaciones. El estilo pedido es editorial; esos efectos empujan hacia el dashboard.
- **Sí:** `StatCard.vue` con props en español (`titulo`, `valor`, `subtitulo`). El código de UI y los comentarios del proyecto están en español, y `App.vue` hoy usa `etiqueta`/`detalle`. Coherencia > imponer una convención ajena.
- **Sí:** `subtitulo?: string` con default `''` en vez de un slot. Es lo que necesitan los 5 usos (3 métricas + 2 metadatos); el contenido rico (los links de la fuente) va en la línea de créditos, no dentro de una card.
- **No:** slot en `StatCard` para contenido rico. Se descartó al ubicar la fuente en la línea de créditos.
- **Sí:** orden título → valor → subtítulo dentro de la card. Es el orden que ya usa el home actual y el que mejor escanea una fila: primero de qué se trata, luego la cifra, después el detalle.
- **Sí:** "Un peso de 1943 vale hoy" como hero sin caja, y no como una cuarta card. La cifra es la respuesta a la pregunta que el usuario se hace al entrar; por eso es la jerarquía uno. Las otras tres son contexto comparable y por eso van en fila.
- **Sí:** las 3 métricas de la fila incluyen "Meses en la serie". Aunque no es una variación, comparte la estructura exacta (título, cifra, detalle) y funciona como "de qué estamos hablando" dentro de la fila.
- **Sí:** las 3 cards en `md:grid-cols-3` (768px) y no en `sm` (640px). A 640px cada card queda con ~200px útiles y los valores en serif de `text-4xl` se aprietan; a 768px respiran. En mobile se apilan en una columna.
- **Sí:** quitar la card "Factor acumulado" en lugar de ocultarla con un flag. El dato sigue calculándose (`factorAcumulado` alimenta `pesoActualPorPesoHistorico`); lo que se elimina es su presentación duplicada.
- **Sí:** `formatearEntero` para el conteo de meses. `1003` sin separador se lee como un código; `1.003` se lee como una cantidad.
- **Sí:** las constantes de fuente en `src/constants/fuente.ts`. Pasaron de estar en un componente a ser usadas por dos vistas; duplicarlas sería una fuente de verdad rota.
- **Sí:** la licencia se muestra en el footer **y** la fuente en el home. Son dos metadatos distintos con dos ubicaciones distintas: la licencia acompaña a la fecha (los metadatos del sitio), la fuente acompaña a los datos (la atribución).
- **Sí:** contenedor `max-w-4xl`. Con tres cards en fila, `max-w-3xl` (768px) deja cards de ~240px, justas para `text-4xl`.
- **No:** reformatear el dataset, los tipos o los cálculos. Esta spec es de presentación pura.

## Risks

| Riesgo                                                                               | Mitigación                                                                                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `1.003` en la card "Meses en la serie" puede leerse como decimal en algunos sistemas | Se usa `Intl.NumberFormat('es-AR')`, que produce el separador de miles local (`1.003`). Verificado en dev.        |
| La fila de 3 cards se aprieta a 768px                                                | Se rompe en `md`, no en `sm`; el valor usa `text-4xl` y `tabular-nums`. Se verifica a 768px, 1024px y 360px.      |
| Sacar "Fuente" del footer deja la atribución lejos                                   | La línea de créditos con los tres links queda visible en el home, arriba del footer.                              |
| El hero sin caja puede leerse como texto suelto                                      | El valor usa serif de 56–60px con `tabular-nums` y el label en versalitas con acento: la jerarquía es inequívoca. |
| `subtitulo` con default `''` y `v-if`                                                | El `v-if="subtitulo"` sobre el `<p>` evita que quede un hueco vacío en la card "Dataset generado".                |

## Qué **no** entra en esta spec

- Gráficos, curvas de inflación, barras por año, sparklines o cualquier librería de charts.
- Vue Router y las rutas `/mes/:anio-mes`.
- Calculadora de equivalencia, selector de mes/año o tabla anual.
- Series por categoría, IPC por región, EMAE, CBA, dólar blue.
- La API `pindec.dev` y cualquier fuente de datos adicional.
- Cambios al modelo de datos, a la clave interna `'YYYY-MM'`, a los cálculos o al JSON vendorizado.
- Persistencia en el browser.
- Theme switcher manual.
- Webfonts nuevas (Inter y compañía).
- Deploy, CI y tests automatizados (el proyecto no tiene runner de tests; la verificación es por scripts y a mano).

Cada uno de esos, si aterriza, va en su propia spec.
