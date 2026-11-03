# SPEC 02 — Home editorial, fechas MM/YYYY y footer con fuente

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-11-03
> **Objective:** Rediseñar el home con una estética editorial serif, mostrar todas las fechas de la serie en MM/YYYY y agregar un footer con la fecha de hoy y la fuente de los datos.

## Por qué existe esta spec

SPEC 01 dejó el proyecto con la base (Tailwind v4, tokens, capa de datos con axios, cálculos y formateo) y una **pantalla de humo** para probar estilos + red + matemática. Esa pantalla cumple su objetivo técnico, pero no es un home: es una grilla de tarjetas con datos de control.

Esta spec hace tres cosas, todas de capa de presentación, sin tocar el modelo de datos ni la lógica de cálculo:

- **Unifica el formato de fecha.** Hoy la UI muestra la clave interna `YYYY-MM` en crudo (`1943-03 → 2026-09`, `último mes: 2026-09`) y el `generatedAt` del dataset como ISO crudo (`2026-10-28T15:49:23.139Z`). Ninguna de las dos formas se leen bien en pantalla. Todas las fechas pasan a mostrarse en **MM/YYYY**; la fecha de hoy en el footer va en **dd/MM/yyyy** porque sí tiene día.
- **Agrega un footer** con la fecha de hoy y la fuente de los datos, que hoy solo aparece en una fila del bloque de control.
- **Rediseña el home** con una dirección visual editorial (serif, aire, jerarquía de titular) en lugar de la grilla de humo, sin agregar ni quitar datos ni secciones.

La clave interna `'YYYY-MM'` **no cambia**: se usa para ordenar, comparar y computar. MM/YYYY es solo presentación.

## Scope

**In:**

- `date-fns` como dependencia, y todo el formateo de fechas de la UI pasa por esa librería (nada de `slice`/`padStart` manual ni `Intl.DateTimeFormat` para fechas).
- Formateadores de fecha en `src/utils/formato.ts`, construidos sobre `date-fns`:
  - `formatearMesAnio(clave: string): string` — `'YYYY-MM'` → `'MM/yyyy'` (ej. `03/1943`).
  - `formatearFecha(fecha: Date): string` — `Date` → `'dd/MM/yyyy'` (ej. `03/11/2026`).
  - `formatearAnioMesDesdeIso(iso: string): string` — ISO `'YYYY-MM-DDTHH:mm:ss.sssZ'` → `'MM/yyyy'` (ej. `10/2026`).
- Aplicación del formato MM/YYYY en **todos** los puntos de la UI donde hoy aparece una fecha: bajada del hero (`03/1943 → 09/2026`), detalle de la tarjeta "Meses en la serie", detalle de "Variación mensual" (`último mes: 09/2026`), detalle de "Variación interanual" (`12 meses hasta 09/2026`), detalle de "Factor acumulado" (`desde 03/1943`), detalle de "Un peso de 1943 vale hoy" (`desde 03/1943`) y fila "Dataset generado" (`10/2026`).
- Footer nuevo al final del flujo natural de la página, siempre visible (también en los estados de carga y error):
  - Fecha de hoy en `dd/MM/yyyy`, calculada en runtime al montar.
  - Fuente: INDEC, recolectada por Hacé Cuentas, con link a la fuente original del dataset y a Hacé Cuentas.
  - Licencia del dataset: CC-BY-4.0, con link.
  - Link al dataset original en `hacecuentas.com`.
- Rediseño visual editorial del home: solo skin. Se mantienen **las mismas 5 tarjetas, las mismas secciones y los mismos datos** que en la pantalla de humo; cambia layout, jerarquía tipográfica, espaciado, tratamiento de bordes y color de acento.
- Tipografía serif editorial **Source Serif 4**, cargada desde Google Fonts con `<link>` en `index.html` (`display=swap` + `preconnect`), con fallback serif del sistema.
- Tokens nuevos en `src/style.css` (`@theme inline`): `--font-serif` y el color de acento editorial, para no hardcodear nada en los componentes.
- Light y dark mode, ambos con `prefers-color-scheme` (el automático se mantiene; no hay switcher).

**Out of scope (para specs futuros):**

- **Gráficos / charts de cualquier tipo.** Descartado explícitamente por el usuario: no hay curva, ni barras, ni sparkline, ni canvas.
- Vue Router y rutas de detalle por mes o por año.
- Calculadora "¿cuánto vale mi peso de X?" o selector de mes/año.
- Tabla anual o listado de los 83 años.
- Series por categoría, IPC por región, EMAE, CBA, dólar blue.
- Theme switcher manual.
- Cambiar la clave interna `'YYYY-MM'`, el modelo de datos o el formato del JSON vendorizado.
- Persistencia en el browser (`localStorage` / IndexedDB).
- Deploy, CI y tests automatizados (el proyecto no tiene runner de tests).

## Data model

Esta spec **no introduce estructuras de datos nuevas**. Reusa `DatasetInflacion`, `MesInflacion`, `ResumenMes` y `ResumenAnio` de `src/types/inflacion.ts` sin modificarlos.

Agrega funciones puras de presentación en `src/utils/formato.ts` (firmas concretas), construidas sobre `date-fns`:

```ts
/**
 * Convierte la clave interna 'YYYY-MM' en 'MM/yyyy' para mostrar.
 * Devuelve '—' si la clave no tiene el formato esperado.
 */
export function formatearMesAnio(clave: string): string;

/** Formatea una fecha como 'dd/MM/yyyy' en zona horaria local. */
export function formatearFecha(fecha: Date): string;

/** Convierte un timestamp ISO en 'MM/yyyy'. Devuelve '—' si no parsea. */
export function formatearAnioMesDesdeIso(iso: string): string;
```

Convención de implementación:

- La clave interna sigue siendo `'YYYY-MM'` en string. Para convertirla a `Date` se usa `parse(clave, 'yyyy-MM', new Date())` de `date-fns`, que da el día 1 del mes a medianoche **local** y sin corrimiento de zona horaria. No se usa `new Date(clave)` (que parsea como UTC y en zonas negativas se corre un día).
- El token del año es `yyyy` (año calendario), no `YYYY` (que en date-fns es año-semanario y está deshabilitado por defecto).
- `format` de date-fns lanza `RangeError` ante una `Invalid Date`, así que cada función valida con `isValid` antes de formatear y devuelve `'—'` si no es válida.
- El timestamp ISO del dataset se convierte con `parseISO(iso)`.
- No se importa el locale `es` de `date-fns/locale`: los tokens usados (`dd`, `MM`, `yyyy`) son numéricos e independientes del locale. El locale solo haría falta para nombres de mes o día (`MMM`, `EEEE`), que esta app no muestra.

Los datos de la fuente que muestra el footer son **constantes estáticas** del componente `AppFooter.vue`, no campos del dataset:

```ts
const FUENTE = {
  origen: "INDEC",
  recolector: "Hacé Cuentas",
  recolectorUrl: "https://hacecuentas.com",
  datasetUrl:
    "https://hacecuentas.com/datasets/inflacion-argentina-historica-mensual.json",
  licencia: "CC-BY-4.0",
  licenciaUrl: "https://creativecommons.org/licenses/by/4.0/",
};
```

Motivo: el footer tiene que poder mostrarse **antes** de que la petición a `/data/inflation.data.json` termine, y también en el estado de error. Si dependiera del dataset, el footer sería invisible justo cuando más hace falta (caída de red).

## Implementation plan

1. **Instalar `date-fns` y agregar los formateadores de fecha.** `pnpm add date-fns` (v4.x; la última publicada es `4.4.0`). En `src/utils/formato.ts` sumar `formatearMesAnio`, `formatearFecha` y `formatearAnioMesDesdeIso` usando `parse`, `parseISO`, `format` e `isValid` de `date-fns`, siguiendo el estilo del archivo (funciones puras, `'—'` para valores no válidos). Verificación: `pnpm build` compila; `formatearMesAnio('1943-03')` devuelve `03/1943`, `formatearFecha(new Date(2026, 10, 3))` devuelve `03/11/2026` y `formatearAnioMesDesdeIso('2026-10-28T15:49:23.139Z')` devuelve `10/2026`; `formatearMesAnio('basura')` devuelve `—` sin lanzar.

2. **Cargar la serif y sumar los tokens.** En `index.html` agregar `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` y el `<link>` de Source Serif 4 con `display=swap` (pesos 400, 600, 700; `wght` variable). En `src/style.css` sumar `--font-serif` a `:root` (con fallback `Georgia, 'Times New Roman', serif`) y exponerlo en `@theme inline` como `--font-serif`. Verificación: `pnpm dev` muestra los titulares en Source Serif 4 (no la fallback) y `pnpm build` pasa.

3. **Definir los tokens del acento editorial.** En `src/style.css` agregar el color de acento (`--accent`) en `:root` y en el bloque `prefers-color-scheme: dark`, y mapearlo en `@theme inline` como `--color-accent`. Si el acento resulta idéntico a `--brand-600`, se documenta la decisión en vez de duplicar el token. Verificación: el acento se ve distinto del celeste de marca o la decisión queda escrita.

4. **Crear `src/components/AppFooter.vue`.** Componente sin props: footer al final del flujo con tres bloques en una grilla responsive (una columna en mobile, tres en `sm:`): (a) "Fecha de hoy" con `formatearFecha(new Date())` calculado en `onMounted`; (b) "Fuente" con `INDEC`, link a `https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31`, link a Hacé Cuentas y link al dataset original; (c) "Licencia" con `CC-BY-4.0` y su link. Estilos con clases Tailwind y los tokens (`text-ink-muted`, `border-line`, `text-accent`). Verificación: el componente aparece con fecha y links correctos.

5. **Rediseñar el hero y las tarjetas en `App.vue`.** Reescribir solo el template y el markup, sin cambiar los `computed` ni la lógica: hero con kicker `devaluar` en versalitas y tracking amplio, titular en serif grande (`--font-serif`, tracking apretado), bajada en `text-ink-muted` con el rango en MM/YYYY. Las 5 tarjetas pasan a una grilla editorial: la primera destacada (grid grande, cifra con `tabular-nums`) y las otras cuatro en grilla secundaria. Verificación: los cinco valores siguen mostrándose y se ven en modo claro y oscuro.

6. **Aplicar MM/YYYY a todas las fechas de la UI.** En `App.vue`, reemplazar los template literals con `YYYY-MM` por llamadas a `formatearMesAnio(...)`: rango del hero, detalle de las 5 tarjetas y fila "Dataset generado" (esta última con `formatearAnioMesDesdeIso(dataset.generatedAt)`). Verificación: un `grep` de `YYYY-MM` y de concatenaciones de `clave` sobre `App.vue` no encuentra restos de fechas crudas.

7. **Rediseñar el bloque de cifras de control.** Mantener los mismos 4 datos (año inicial, dataset generado, licencia, fuente) con el mismo formato `dl` de dos columnas, pero con tratamiento editorial (línea divisoria, etiquetas en versalitas pequeñas, valores con tabular-nums). Verificación: los 4 datos siguen visibles y formateados.

8. **Montar el footer.** Importar `AppFooter` en `src/App.vue` y colocarlo después del `<main>`, dentro del contenedor raíz, para que se vea en los estados de carga y error. Ajustar el layout raíz a `flex min-h-screen flex-col` para que el footer quede al final del flujo. Verificación: el footer aparece con la app cargada, durante la carga y en el estado de error.

9. **Cerrar los estados de carga y error con el mismo lenguaje visual.** Estados de carga y error con la misma paleta y tipografía editorial (cards, bordes suaves, mismo `--font-serif` en los títulos). Verificación: `pnpm dev` con la red apagada muestra el estado de error y el footer.

10. **Build final.** `pnpm build` termina con exit code 0 (incluye `vue-tsc -b`). Si `vue-tsc` reporta `noUnusedLocals` o `erasableSyntaxOnly`, se corrige el código, no la config. Verificación: build limpio.

## Acceptance criteria

- [ ] `pnpm build` termina con exit code 0, incluyendo el typecheck de `vue-tsc -b`.
- [ ] `pnpm dev` sirve la app sin errores en la consola del browser.
- [ ] Ninguna fecha de la serie se muestra en formato `YYYY-MM` en la UI: el rango del hero, los 5 detalles de tarjeta, el detalle de la interanual y la fila "Dataset generado" están todos en `MM/YYYY`.
- [ ] La fila "Dataset generado" muestra `MM/YYYY` (ej. `10/2026`), no el ISO crudo.
- [ ] La fecha de hoy del footer se muestra en `dd/MM/yyyy` y es la del día en que se carga la página.
- [ ] El footer aparece siempre visible: en estado de carga, en estado de error y con los datos listos.
- [ ] El footer nombra la fuente (INDEC), el recolector (Hacé Cuentas) y la licencia (CC-BY-4.0), y los tres links apuntan a `indec.gob.ar`, `hacecuentas.com` (incluido el dataset original) y `creativecommons.org`.
- [ ] Los links del footer se abren en una pestaña nueva con `rel="noopener noreferrer"`.
- [ ] La app **no contiene gráficos**: no hay `canvas`, ni `svg` con paths de datos, ni librería de charts. Los datos solo se muestran como grilla de 5 tarjetas.
- [ ] El home muestra las mismas 5 tarjetas con las mismas etiquetas y valores que antes del rediseño (meses en la serie, variación mensual, variación interanual, factor acumulado, un peso de 1943).
- [ ] Los titulares se renderizan en Source Serif 4 (verificable en el inspector: la familia computada no es la fallback).
- [ ] La app se ve bien en modo claro y en modo oscuro, y el dark mode sigue siguiendo `prefers-color-scheme` sin switcher.
- [ ] La app es usable a 360 px de ancho: no hay scroll horizontal ni texto cortado en las 5 tarjetas.
- [ ] `src/utils/formato.ts` exporta `formatearMesAnio`, `formatearFecha` y `formatearAnioMesDesdeIso`, las tres construidas con `date-fns`, y no usan `enum` ni parameter properties.
- [ ] `date-fns` figura en `dependencies` de `package.json` y ninguna función de fecha de la app usa `Intl.DateTimeFormat`, `toLocaleDateString` ni `slice`/`padStart` manual para armar fechas.

## Decisions

- **Sí:** `date-fns` para todo el formateo de fechas. Es la librería estándar del ecosistema para esto: `format`/`parse`/`parseISO`/`isValid` cubren los tres casos que necesitamos y el formato queda declarado como string de tokens en vez de concatenación manual. Evita reimplementar parsing y manejo de fechas inválidas a mano.
- **Sí:** `parse(clave, 'yyyy-MM', new Date())` para convertir la clave interna `'YYYY-MM'`, en lugar de `new Date(clave)`. `new Date('1943-03')` se parsea como UTC y en zona horaria negativa se corre un día; `parse` con string de formato es explícito y local.
- **Sí:** token `yyyy` (año calendario) y no `YYYY`. En date-fns `YYYY` es el año de numeración semanal y está deshabilitado por defecto; `format(date, 'YYYY')` no es el año que queremos.
- **Sí:** validar con `isValid` antes de formatear. `format` de date-fns lanza `RangeError` ante `Invalid Date`, y el proyecto ya usa `'—'` como placeholder para datos ausentes.
- **No:** importar el locale `es` de `date-fns/locale`. Los tokens usados son numéricos (`dd`, `MM`, `yyyy`) y no dependen del locale; importarlo agregaría peso al bundle sin cambiar ni un carácter de la salida.
- **No:** migrar el formateo de números y porcentajes (`formatearPorcentaje`, `formatearNumeroGrande`) a date-fns. `Intl.NumberFormat` ya es la herramienta correcta para números, y el scope de esta spec son las fechas.
- **Sí:** MM/YYYY solo en la capa de presentación. La clave interna `'YYYY-MM'` se usa para ordenar y comparar; cambiarla tocaría `normalizarSerie`, `calcularResumen`, `calcularResumenAnual` y el type guard del dataset sin ganancia para el usuario.
- **Sí:** un formateador centralizado en `src/utils/formato.ts` en vez de `format` desparramado en el template. Una sola fuente de verdad para el formato de fechas.
- **Sí:** la fecha de hoy en `dd/MM/yyyy`. La regla MM/YYYY aplica a los meses de la serie, que no tienen día; la fecha de hoy sí lo tiene y perderlo sería raro.
- **Sí:** el `generatedAt` del dataset en `MM/YYYY`. El timestamp exacto (hora, milisegundos, Z) no le aporta nada al usuario y rompe el formato pedido.
- **Sí:** la fuente del footer como constantes estáticas en el componente, no tomada del dataset. El footer debe existir en los estados de carga y error.
- **Sí:** Source Serif 4 desde Google Fonts con `<link>` y `preconnect` en `index.html`. `<link>` no bloquea el render; `@import` en el CSS sí. Aceptamos la dependencia de red a cambio del carácter tipográfico.
- **Sí:** fallback serif del sistema (`Georgia, 'Times New Roman', serif`) por si Google Fonts no responde. La página no se rompe nunca.
- **Sí:** el footer va al final del flujo natural, no fijo. Un footer fijo con contenido largo tapa el contenido en mobile.
- **Sí:** se mantiene el dark mode automático. El tema editorial se define para los dos modos; un switcher manual es una decisión de producto posterior.
- **Sí:** solo skin. Las 5 tarjetas, sus etiquetas y el bloque de cifras de control se conservan tal cual; el rediseño cambia presentación, no información.
- **No:** gráficos, curvas, barras o sparklines. Descartado explícitamente por el usuario en el pedido original.
- **No:** tabla de años, selector de mes, ni calculadora de equivalencia. Son features; esta spec es de presentación.
- **No:** un componente `StatCard` separado para las tarjetas. Con una sola grilla de 5 elementos, un componente extra no aporta; si la lista crece, se extrae después.
- **No:** precalcular la fecha de hoy en build time. El footer debe mostrar la fecha en que el usuario abre la página, no la del build.
- **No:** mover los links de fuente al header. El header queda limpio con título y bajada; los links van al footer.

## Risks

| Riesgo                                                     | Mitigación                                                                                                                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Fonts no carga (offline, ad blocker, China)         | Fallback serif del sistema; `display=swap` evita texto invisible. El diseño no depende de la webfont para ser legible.                                                                 |
| La webfont agrega un request bloqueante de render          | `preconnect` a `fonts.googleapis.com` y `fonts.gstatic.com`, y `display=swap` en el `<link>`.                                                                                          |
| El estilo editorial se ve bien en claro y mal en oscuro    | Ambos modos se definen en `src/style.css` con `prefers-color-scheme` y se revisan a mano en dev.                                                                                       |
| Fechas mostradas en `MM/yyyy` se confunden con porcentajes | El separador `/` es visualmente distinto del `%`; las cifras de la serie siempre llevan su unidad explícita.                                                                           |
| `date-fns` engorda el bundle                               | Se importan funciones puntuales (`format`, `parse`, `parseISO`, `isValid`) desde `date-fns`, que es tree-shakeable. La app es una SPA de una sola vista, el delta es de unos pocos kB. |
| `format` lanza `RangeError` ante una fecha inválida        | Cada formateador valida con `isValid` y devuelve `'—'`; el estado de error de la app no se cae por una fecha mala.                                                                     |
| El footer con 3 bloques se rompe en pantallas angostas     | Grilla de una columna en mobile y `sm:grid-cols-3` en desktop; se verifica a 360 px.                                                                                                   |

## Qué **no** entra en esta spec

- Gráficos, curvas de inflación, barras por año, sparklines o cualquier librería de charts.
- Vue Router y las rutas `/mes/:anio-mes`.
- Calculadora de equivalencia, selector de mes/año o tabla anual.
- Series por categoría, IPC por región, EMAE, CBA, dólar blue.
- La API `pindec.dev` y cualquier fuente de datos adicional.
- Cambios al modelo de datos, a la clave interna `'YYYY-MM'` o al JSON vendorizado.
- Persistencia en el browser.
- Theme switcher manual.
- Deploy, CI y tests automatizados (el proyecto no tiene runner de tests; la verificación es por scripts y a mano).

Cada uno de esos, si aterriza, va en su propia spec.
