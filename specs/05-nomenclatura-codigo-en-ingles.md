# SPEC 05 — Nomenclatura del código en inglés con la UI en español

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04
> **Date:** 2026-11-03
> **Objective:** Renombrar a inglés todos los identificadores del código (types, funciones, variables, props, claves de objetos, tokens CSS y archivos) manteniendo intactos los textos visibles del sitio, que siguen en español.

## Por qué existe esta spec

El proyecto mezcla dos idiomas en la misma capa: el código usa nombres en español (`obtenerSerieInflacion`, `calcularResumen`, `titulo`, `factorAcumulado`, `Tendencia`, `--alza`) mientras que la interfaz está en español. Eso obliga a leer el código en un idioma distinto del que se escribe la UI, y vuelve confuso leer los tipos del dominio (`Tendencia = 'sube' | 'baja'`) sin saber si ese string viaja a la pantalla o no: hoy el mismo valor sirve para el color de la flecha y para el texto que lee el lector de pantalla.

Esta spec separa las dos cosas de forma explícita:

- **El código habla inglés:** identificadores, archivos, tokens CSS y comentarios/JSDoc.
- **La UI habla español:** todo string visible (títulos de tarjetas, subtítulos, frases accesibles, mensajes de error en pantalla).

Con la separación, los valores `'up' | 'down'` dejan de ser ambiguos: son identificadores de código, y el texto español "sube"/"baja" se construye en un único lugar de la capa de presentación.

## Scope

**In:**

- **Renombrado de identificadores a inglés** en todo `src/`: tipos e interfaces, funciones, variables, constantes, props de componentes, claves de objetos, tipos union y sus valores literales.
- **Renombrado de archivos** afectados por el renombrado: `src/types/inflacion.ts` → `src/types/inflation.ts`, `src/types/tarjeta.ts` → `src/types/card.ts`, `src/utils/formato.ts` → `src/utils/format.ts`, `src/utils/inflacion.ts` → `src/utils/inflation.ts`, `src/api/inflacion.ts` → `src/api/inflation.ts`, `src/constants/fuente.ts` → `src/constants/source.ts`.
- **Valores de los tipos union en inglés**: `Tendencia = 'sube' | 'baja'` pasa a `Trend = 'up' | 'down'`, y el estado de carga de `App.vue` pasa de `'cargando' | 'error' | 'listo'` a `'loading' | 'error' | 'ready'`.
- **Tokens de color en `src/style.css`**: `--alza` → `--rise` y `--baja` → `--fall`, con sus aliases `@theme inline` (`--color-rise`, `--color-fall`) y las utilidades Tailwind `text-alza` / `text-baja` → `text-rise` / `text-fall`.
- **Un mapa de etiquetas de tendencia en la capa de presentación** (`src/utils/format.ts`): `TREND_LABELS: Record<Trend, string> = { up: 'sube', down: 'baja' }` más `formatTrendLabel(trend)` y `formatTrendDescription(trend, comparison)`, que son el único lugar donde se arma el texto accesible en español ("sube respecto al mes anterior").
- **Traducción de todos los comentarios y JSDoc del código al inglés**, incluidos los comentarios de `src/style.css`.
- **Actualización de los call sites** de cada identificador renombrado (imports, invocaciones, props pasadas desde `App.vue`, uso de `SOURCE` y de los tokens CSS).
- **Barrido final de verificación**: búsqueda de identificadores en español remanentes en `src/`.

**Out of scope (para specs futuras):**

- **Los campos del dataset externo**: `fecha` e `inflacion_mensual_pct` se quedan como están (ver Decisiones).
- Cambios de lógica, de cálculos o de formato numérico: este es un renombrado puro, los valores que muestra la app deben ser idénticos antes y después.
- Corrección de bugs preexistentes (por ejemplo, que `estado` nunca pase a `'error'` ni a `'loading'` en `App.vue`): el renombrado no debe arrastrar arreglos de comportamiento.
- Cambios visuales: mismo HTML, mismo CSS, mismos colores.
- Traducir a español o a inglés los textos visibles de la UI.
- Escribir la regla "código en inglés, UI en español" en `AGENTS.md` o `README.md` (decisión explícita del usuario: no hacerlo).
- Actualizar las specs 01–04, que quedan como registro histórico de los nombres anteriores.
- Renombrar los archivos de componentes (`StatCard.vue`, `TrendArrow.vue`, `AppFooter.vue`): ya están en inglés.
- Vue Router, persistencia, tests automatizados, deploy y CI (el proyecto no tiene runner de tests).

## Data model

Los tipos renombrados, con sus campos (`src/types/inflation.ts`):

```ts
/** Row as it comes from the hacecuentas.com dataset. */
export interface InflationRow {
  fecha: string; // 'YYYY-MM-DD', last day of the month
  inflacion_mensual_pct: number;
}

/** Wrapper around the full dataset. */
export interface InflationDataset {
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
  data: InflationRow[];
}

/** A normalized month, with the 'YYYY-MM' key used for sorting and comparing. */
export interface InflationMonth {
  key: string; // 'YYYY-MM'
  year: number;
  month: number; // 1-12
  monthlyChange: number; // % mensual
  /** Cumulative factor since the first month of the dataset, inclusive. 1 = unchanged. */
  cumulativeFactor: number;
}

/** Derived calculations for a single month. */
export interface MonthSummary {
  key: string;
  monthlyChange: number;
  /** Cumulative change over the 12 months ending in this month, in %. */
  yearOverYearChange: number;
  /** Cumulative factor from the first month of the dataset to this month. */
  cumulativeFactor: number;
  /** Cumulative change in % from the first month of the dataset to this month. */
  cumulativeChangeFromStart: number;
  /** What one peso of this month is worth today. */
  currentValueOfHistoricalPeso: number;
}

/** Calculations for a calendar year. It may be incomplete. */
export interface YearSummary {
  year: number;
  /** Compound change of the available months of the year, in %. */
  annualChange: number;
  includedMonths: number;
  /** false when the year is missing months (1943 and 2026 are). */
  complete: boolean;
  averageMonthlyChange: number;
}

/** Direction of a change: 'up' (it went up) or 'down' (it went down). */
export type Trend = "up" | "down";
```

El tipo de la tarjeta (`src/types/card.ts`):

```ts
import type { Trend } from "./inflation";

/** Home metric card: already formatted text plus an optional direction. */
export interface StatCardData {
  title: string;
  value: string;
  subtitle: string;
  /** Direction of the change, if it applies. */
  trend?: Trend;
  /** Accessible text explaining what the change is compared against. */
  trendDescription?: string;
  /** Difference against the previous month, already formatted. */
  difference?: string;
}
```

El mapa de etiquetas en español, único punto de traducción de `Trend` a texto (`src/utils/format.ts`):

```ts
import type { Trend } from "../types/inflation";

/** Spanish labels for each trend direction. Used for screen-reader text. */
export const TREND_LABELS: Record<Trend, string> = {
  up: "sube",
  down: "baja",
};

/** 'sube' | 'baja'. */
export function formatTrendLabel(trend: Trend): string;

/** 'sube respecto al mes anterior'. */
export function formatTrendDescription(
  trend: Trend,
  comparison: string,
): string;
```

### Tabla de equivalencias

| Antes                                                       | Después                                          | Dónde                 |
| ----------------------------------------------------------- | ------------------------------------------------ | --------------------- |
| `src/types/inflacion.ts`                                    | `src/types/inflation.ts`                         | archivo               |
| `src/types/tarjeta.ts`                                      | `src/types/card.ts`                              | archivo               |
| `src/utils/formato.ts`                                      | `src/utils/format.ts`                            | archivo               |
| `src/utils/inflacion.ts`                                    | `src/utils/inflation.ts`                         | archivo               |
| `src/api/inflacion.ts`                                      | `src/api/inflation.ts`                           | archivo               |
| `src/constants/fuente.ts`                                   | `src/constants/source.ts`                        | archivo               |
| `FilaInflacion`                                             | `InflationRow`                                   | `types/inflation.ts`  |
| `DatasetInflacion`                                          | `InflationDataset`                               | `types/inflation.ts`  |
| `MesInflacion`                                              | `InflationMonth`                                 | `types/inflation.ts`  |
| `ResumenMes`                                                | `MonthSummary`                                   | `types/inflation.ts`  |
| `ResumenAnio`                                               | `YearSummary`                                    | `types/inflation.ts`  |
| `Tendencia` (`'sube' \| 'baja'`)                            | `Trend` (`'up' \| 'down'`)                       | `types/inflation.ts`  |
| `Tarjeta`                                                   | `StatCardData`                                   | `types/card.ts`       |
| `titulo` / `valor` / `subtitulo`                            | `title` / `value` / `subtitle`                   | `types/card.ts`       |
| `tendencia` / `tendenciaDescripcion` / `diferencia`         | `trend` / `trendDescription` / `difference`      | `types/card.ts`       |
| `clave` / `anio` / `mes`                                    | `key` / `year` / `month`                         | `types/inflation.ts`  |
| `variacionMensual`                                          | `monthlyChange`                                  | `types/inflation.ts`  |
| `factorAcumulado`                                           | `cumulativeFactor`                               | `types/inflation.ts`  |
| `variacionInteranual`                                       | `yearOverYearChange`                             | `types/inflation.ts`  |
| `variacionAcumuladaDesdeInicio`                             | `cumulativeChangeFromStart`                      | `types/inflation.ts`  |
| `pesoActualPorPesoHistorico`                                | `currentValueOfHistoricalPeso`                   | `types/inflation.ts`  |
| `variacionAnual`                                            | `annualChange`                                   | `types/inflation.ts`  |
| `mesesIncluidos`                                            | `includedMonths`                                 | `types/inflation.ts`  |
| `completo`                                                  | `complete`                                       | `types/inflation.ts`  |
| `variacionMensualPromedio`                                  | `averageMonthlyChange`                           | `types/inflation.ts`  |
| `claveDesdeFecha`                                           | `keyFromDate`                                    | `utils/inflation.ts`  |
| `normalizarSerie`                                           | `normalizeSeries`                                | `utils/inflation.ts`  |
| `ultimoMes`                                                 | `latestMonth`                                    | `utils/inflation.ts`  |
| `calcularResumen`                                           | `computeMonthSummary`                            | `utils/inflation.ts`  |
| `tendenciaDeVariacion`                                      | `trendFromValue`                                 | `utils/inflation.ts`  |
| `diferenciaDeVariacion`                                     | `differenceBetween`                              | `utils/inflation.ts`  |
| `calcularResumenAnual`                                      | `computeYearSummary`                             | `utils/inflation.ts`  |
| `formatearPorcentaje`                                       | `formatPercentage`                               | `utils/format.ts`     |
| `formatearEntero`                                           | `formatInteger`                                  | `utils/format.ts`     |
| `formatearNumeroGrande`                                     | `formatLargeNumber`                              | `utils/format.ts`     |
| `formatearMesAnio`                                          | `formatMonthYear`                                | `utils/format.ts`     |
| `formatearFecha`                                            | `formatDate`                                     | `utils/format.ts`     |
| `formatearAnioMesDesdeIso`                                  | `formatYearMonthFromIso`                         | `utils/format.ts`     |
| `notacionCientifica`                                        | `scientificNotation`                             | `utils/format.ts`     |
| `superindice`                                               | `toSuperscript`                                  | `utils/format.ts`     |
| `SUPERINDICES`                                              | `SUPERSCRIPT_CHARS`                              | `utils/format.ts`     |
| `variacionConDiferencia`                                    | `variationWithDifference`                        | `utils/diff.ts`       |
| `obtenerSerieInflacion`                                     | `fetchInflationSeries`                           | `api/inflation.ts`    |
| `FUENTE`                                                    | `SOURCE`                                         | `constants/source.ts` |
| `origen` / `origenUrl`                                      | `origin` / `originUrl`                           | `constants/source.ts` |
| `recolector` / `recolectorUrl`                              | `collector` / `collectorUrl`                     | `constants/source.ts` |
| `licencia` / `licenciaUrl`                                  | `license` / `licenseUrl`                         | `constants/source.ts` |
| `titulo` / `valor` / `subtitulo` (props)                    | `title` / `value` / `subtitle`                   | `StatCard.vue`        |
| `tendencia` / `tendenciaDescripcion` / `diferencia` (props) | `trend` / `trendDescription` / `difference`      | `StatCard.vue`        |
| `tendencia` / `descripcion` / `diferencia` (props)          | `trend` / `description` / `difference`           | `TrendArrow.vue`      |
| `Estado` (`'cargando' \| 'error' \| 'listo'`)               | `LoadStatus` (`'loading' \| 'error' \| 'ready'`) | `App.vue`             |
| `estado`                                                    | `status`                                         | `App.vue`             |
| `mensajeError`                                              | `errorMessage`                                   | `App.vue`             |
| `meses`                                                     | `months`                                         | `App.vue`             |
| `ultimo`                                                    | `latest`                                         | `App.vue`             |
| `resumen`                                                   | `summary`                                        | `App.vue`             |
| `resumenAnterior`                                           | `previousSummary`                                | `App.vue`             |
| `resumenInicial`                                            | `initialSummary`                                 | `App.vue`             |
| `resumenAnioInicial`                                        | `initialYearSummary`                             | `App.vue`             |
| `rango`                                                     | `dateRange`                                      | `App.vue`             |
| `cifraHero`                                                 | `heroFigure`                                     | `App.vue`             |
| `tarjetas`                                                  | `cards`                                          | `App.vue`             |
| `metadatos`                                                 | `metadata`                                       | `App.vue`             |
| `primerMes`                                                 | `firstMonth`                                     | `App.vue`             |
| `anterior`                                                  | `previous`                                       | `App.vue`             |
| `mensual` / `interanual`                                    | `monthly` / `yearOverYear`                       | `App.vue`             |
| `tarjeta` (alias de `v-for`)                                | `card`                                           | `App.vue`             |
| `metadato` (alias de `v-for`)                               | `metadataItem`                                   | `App.vue`             |
| `--alza` / `--baja`                                         | `--rise` / `--fall`                              | `style.css`           |
| `--color-alza` / `--color-baja`                             | `--color-rise` / `--color-fall`                  | `style.css`           |
| `text-alza` / `text-baja`                                   | `text-rise` / `text-fall`                        | `TrendArrow.vue`      |

Los identificadores que **no** cambian: `http` (`src/api/http.ts`), `LOCALE` (`'es-AR'`), `loadSeriesData` (ya está en inglés), los componentes `AppFooter`, `StatCard`, `TrendArrow` y el export de `src/components/index.ts`.

## Implementation plan

Cada paso deja el proyecto compilando (`pnpm build`, que incluye `vue-tsc -b`) y es commiteable por separado.

1. **Renombrar archivos y rutas de import.** `git mv` de los 6 archivos de la tabla de equivalencias y actualización de todos los paths de import (`./api/inflacion` → `./api/inflation`, `../types/inflacion` → `../types/inflation`, `../utils/formato` → `../utils/format`, `../constants/fuente` → `../constants/source`, etc.) en `App.vue`, `AppFooter.vue`, `StatCard.vue`, `TrendArrow.vue` y `utils/diff.ts`. Verificación: `pnpm build` pasa y la app carga igual que antes.

2. **Renombrar el dominio: tipos, funciones de datos y API.** En `src/types/inflation.ts`: `FilaInflacion` → `InflationRow`, `DatasetInflacion` → `InflationDataset`, `MesInflacion` → `InflationMonth`, `ResumenMes` → `MonthSummary`, `ResumenAnio` → `YearSummary`, `Tendencia` → `Trend` con valores `'up' | 'down'`, y los campos según la tabla. En `src/utils/inflation.ts`: `claveDesdeFecha` → `keyFromDate`, `normalizarSerie` → `normalizeSeries`, `ultimoMes` → `latestMonth`, `calcularResumen` → `computeMonthSummary`, `tendenciaDeVariacion` → `trendFromValue`, `diferenciaDeVariacion` → `differenceBetween`, `calcularResumenAnual` → `computeYearSummary`. En `src/api/inflation.ts`: `obtenerSerieInflacion` → `fetchInflationSeries`. Actualizar los call sites en `App.vue` y `utils/diff.ts`. Verificación: `pnpm build` pasa y los números de la pantalla son idénticos a los de antes del paso.

3. **Renombrar la capa de presentación: formato, diff y tipo de tarjeta.** En `src/utils/format.ts`: `formatearPorcentaje` → `formatPercentage`, `formatearEntero` → `formatInteger`, `formatearNumeroGrande` → `formatLargeNumber`, `formatearMesAnio` → `formatMonthYear`, `formatearFecha` → `formatDate`, `formatearAnioMesDesdeIso` → `formatYearMonthFromIso`, `notacionCientifica` → `scientificNotation`, `superindice` → `toSuperscript`, `SUPERINDICES` → `SUPERSCRIPT_CHARS`. Agregar `TREND_LABELS`, `formatTrendLabel` y `formatTrendDescription`. En `src/utils/diff.ts`: `variacionConDiferencia` → `variationWithDifference`, que devuelve `Pick<StatCardData, 'trend' | 'trendDescription' | 'difference'>` y arma `trendDescription` con `formatTrendDescription(trend, 'respecto al mes anterior')`. En `src/types/card.ts`: `Tarjeta` → `StatCardData` con los campos de la tabla. Verificación: `pnpm build` pasa y el texto accesible sigue siendo "sube respecto al mes anterior".

4. **Renombrar las constantes de fuente.** En `src/constants/source.ts`: `FUENTE` → `SOURCE`, `origen` → `origin`, `origenUrl` → `originUrl`, `recolector` → `collector`, `recolectorUrl` → `collectorUrl`, `licencia` → `license`, `licenciaUrl` → `licenseUrl`. Actualizar el uso en `App.vue` (línea de créditos) y `AppFooter.vue`. Verificación: `pnpm build` pasa, el footer sigue mostrando `CC-BY-4.0` y la línea de créditos sigue enlazando a INDEC, Hacé Cuentas y el dataset original.

5. **Renombrar los tokens de color y sus utilidades.** En `src/style.css`: `--alza` → `--rise`, `--baja` → `--fall`, `--color-alza` → `--color-rise`, `--color-baja` → `--color-fall`, con los mismos valores en `:root` y en el bloque `prefers-color-scheme: dark`. En `TrendArrow.vue`: `text-alza` → `text-rise` y `text-baja` → `text-fall`. Verificación: `pnpm build` pasa y la flecha sigue en rojo hacia arriba y verde hacia abajo en claro y en oscuro.

6. **Renombrar las props de los componentes.** En `StatCard.vue`: `titulo` → `title`, `valor` → `value`, `subtitulo` → `subtitle`, `tendencia` → `trend`, `tendenciaDescripcion` → `trendDescription`, `diferencia` → `difference`. En `TrendArrow.vue`: `tendencia` → `trend`, `descripcion` → `description`, `diferencia` → `difference`. Actualizar los bindings del template de `App.vue`. El fallback `sr-only` de `TrendArrow.vue` usa `formatTrendLabel(props.trend)` para seguir leyendo "sube"/"baja" en español. Verificación: `pnpm build` pasa y las cards renderizan igual.

7. **Renombrar los identificadores internos de `App.vue`.** Tipo `Estado` → `LoadStatus` con valores `'loading' | 'error' | 'ready'`; `estado` → `status`, `mensajeError` → `errorMessage`, `meses` → `months`, `ultimo` → `latest`, `resumen` → `summary`, `resumenAnterior` → `previousSummary`, `resumenInicial` → `initialSummary`, `resumenAnioInicial` → `initialYearSummary`, `rango` → `dateRange`, `cifraHero` → `heroFigure`, `tarjetas` → `cards`, `metadatos` → `metadata`, `primerMes` → `firstMonth`, `anterior` → `previous`, `mensual` → `monthly`, `interanual` → `yearOverYear`, y los alias de `v-for` `tarjeta` → `card` y `metadato` → `metadataItem`. Verificación: `pnpm build` pasa y el home renderiza exactamente lo mismo.

8. **Traducir comentarios, JSDoc y comentarios de CSS al inglés.** Todos los bloques de documentación de `src/types/inflation.ts`, `src/types/card.ts`, `src/utils/inflation.ts`, `src/utils/format.ts`, `src/utils/diff.ts`, `src/api/inflation.ts`, `src/api/http.ts`, `src/constants/source.ts`, `src/components/*.vue`, `src/App.vue` y los comentarios de `src/style.css`. No se toca ningún string visible en pantalla. Verificación: `pnpm build` pasa y la app se ve igual.

9. **Barrido final y verificación visual.** `grep` sobre `src/` de todos los nombres viejos de la tabla de equivalencias: los únicos hits permitidos son los strings visibles en español (títulos de tarjetas, "sube respecto al mes anterior", "último mes: 09/2026", etc.) y los dos campos crudos del dataset (`fecha`, `inflacion_mensual_pct`). `pnpm build` termina con exit code 0. `pnpm dev` sirve la app sin errores en la consola del browser, en claro y en oscuro, a 360 px y a 1024 px.

## Acceptance criteria

- [ ] `pnpm build` termina con exit code 0, incluyendo el typecheck de `vue-tsc -b`.
- [ ] `pnpm dev` sirve la app sin errores en la consola del browser.
- [ ] Los 6 archivos renombrados existen con su nombre nuevo y los 6 nombres viejos no existen en `src/`.
- [ ] Ningún tipo, función, variable, prop, clave de objeto, alias de `v-for` o token CSS del proyecto usa palabras en español.
- [ ] El único español que queda en `src/` son strings visibles para el usuario y los dos campos crudos del dataset (`fecha`, `inflacion_mensual_pct`).
- [ ] `src/types/inflation.ts` exporta `InflationRow`, `InflationDataset`, `InflationMonth`, `MonthSummary`, `YearSummary` y `Trend`.
- [ ] `Trend` vale `'up' | 'down'`; no queda el string `'sube'` ni `'baja'` como valor de tipo.
- [ ] `src/types/card.ts` exporta `StatCardData` con los campos `title`, `value`, `subtitle`, `trend`, `trendDescription`, `difference`.
- [ ] `src/utils/format.ts` exporta `TREND_LABELS`, `formatTrendLabel` y `formatTrendDescription`, y el mapa traduce `up` → "sube" y `down` → "baja".
- [ ] El texto accesible de la flecha sigue siendo "sube respecto al mes anterior" / "baja respecto al mes anterior", en español.
- [ ] El texto visible de las 3 tarjetas de métricas, de las 2 de control, del hero y del footer es idéntico al de antes del renombrado.
- [ ] Los valores numéricos mostrados son idénticos antes y después del renombrado (mismo dataset, mismos cálculos).
- [ ] La flecha de la tarjeta "Variación mensual" sigue siendo roja hacia arriba y la de "Variación interanual" verde hacia abajo, en claro y en oscuro.
- [ ] `src/style.css` define `--rise` y `--fall` en `:root` y en `prefers-color-scheme: dark`, y los expone en `@theme inline` como `--color-rise` y `--color-fall`.
- [ ] `src/constants/source.ts` exporta `SOURCE` con las claves `origin`, `originUrl`, `collector`, `collectorUrl`, `datasetUrl`, `license`, `licenseUrl`.
- [ ] El footer muestra la fecha de hoy y la licencia `CC-BY-4.0` con su link.
- [ ] Todos los comentarios y JSDoc de `src/` están en inglés.
- [ ] Ningún cálculo, formato ni condición cambió: el diff es solo de nombres (salvo los literales `'up'`/`'down'`, que se mapean al español en la capa de presentación).
- [ ] La app sigue siendo usable a 360 px de ancho, en modo claro y en modo oscuro.

## Decisions

- **Sí:** renombrar identificadores **y** archivos. El nombre del archivo es tan parte del código como el nombre de la función; mezclar `formato.ts` con `inflation.ts` deja el idioma a medias.
- **No:** renombrar solo los identificadores y dejar `formato.ts` / `inflacion.ts` / `fuente.ts` / `tarjeta.ts`. El idioma del repositorio queda incoherente y el siguiente archivo nuevo vuelve a la duda.
- **Sí:** los valores de los tipos union pasan a inglés (`'up' | 'down'`, `'loading' | 'error' | 'ready'`). Un string literal de un union es un identificador, no un texto de producto.
- **No:** dejar `'sube' | 'baja'` porque "también son texto". El texto visible se construye aparte, en un solo lugar.
- **Sí:** los campos del dataset crudo (`fecha`, `inflacion_mensual_pct`) **se quedan en español**. Vienen del contrato externo de hacecuentas.com: renombrarlos obliga a un mapeo en el borde y no aporta nada. Es la única excepción consciente a la regla de identificadores en inglés.
- **No:** renombrar los campos del dataset y mapearlos al recibir el JSON. Agrega una capa de traducción para un beneficio nulo.
- **Sí:** comentarios, JSDoc y comentarios de CSS en inglés. El código se lee en un solo idioma; los textos de producto siguen en español.
- **Sí:** los mensajes de error que se muestran en pantalla siguen en español. Son texto de producto, no documentación.
- **Sí:** el mapa `TREND_LABELS` vive en `src/utils/format.ts`, que es la capa de presentación. `utils/inflation.ts` sigue hablando solo el idioma del dato (`'up'`, `'down'`) y `format.ts` es el único lugar que sabe decir "sube" en español.
- **No:** el mapa en `src/utils/inflation.ts`. Ese módulo calcula sobre el dato y no debería conocer el idioma del producto.
- **No:** el mapa en `App.vue`. La frase accesible se arma en `utils/diff.ts`, que ya la produce; poner el mapa en otro archivo obligaría a pasar el mapa por parámetro.
- **No:** derivar el texto del valor del union (`trend === 'up' ? 'sube' : 'baja'`) inline en cada componente. Se duplicaría en `TrendArrow.vue` y en `utils/diff.ts`.
- **Sí:** `--rise` / `--fall` para los tokens de color. "rise"/"fall" describen la dirección del dato sin juicio de valor, igual que `--alza`/`--baja` lo hacían.
- **No:** `--up` / `--down`. "up/down" sugiere un valor numérico; el token es una dirección.
- **No:** cambiar los valores hexadecimales de `--rise` y `--fall`. Solo cambia el nombre.
- **Sí:** esta spec **no** escribe la regla "código en inglés, UI en español" en `AGENTS.md` ni en `README.md`, por decisión explícita del usuario. La regla queda registrada acá y aplica de ahora en adelante para todo el código nuevo y para las specs futuras.
- **Sí:** las specs 01–04 quedan sin tocar, con los nombres viejos. Son el registro histórico de cómo se construyó el sitio.
- **No:** arreglar el bug de que `estado` nunca pase a `'loading'` ni a `'error'`. El renombrado no debe mezclar un cambio de comportamiento con un cambio de nombres: si falla, se revierte el rename y el bug queda para otra spec.
- **Sí:** renombrar las props de los componentes (`titulo` → `title`). Son parte del contrato entre `App.vue` y el componente, no texto visible.
- **No:** dejar las props en español "porque son las que ve el usuario". El usuario ve el _valor_ de la prop, no su nombre.

## Risks

| Riesgo                                                                                  | Mitigación                                                                                                                                            |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un renombrado masivo rompe imports o referencias coladas                                | `vue-tsc -b` corre en cada `pnpm build`: los errores de tipo y de import aparecen en el paso donde se hacen. El plan no tiene un "gran commit final". |
| Quedan identificadores en español mezclados (por ejemplo, un alias de `v-for` olvidado) | Paso 9: barrido con `grep` sobre la tabla de equivalencias y criterio de "solo strings visibles y campos crudos".                                     |
| Traducir los comentarios al inglés introduce un cambio de sentido en la documentación   | La traducción es literal y no agrega ni quita información; los JSDoc son de una o dos líneas y se revisan contra el original.                         |
| El valor `'up'`/`'down'` se filtra a la pantalla en algún punto                         | Toda la cadena de texto accesible pasa por `formatTrendLabel` / `formatTrendDescription`; el criterio de aceptación lo verifica.                      |
| Los cálculos numéricos cambian por un renombrado mal hecho                              | Los valores mostrados se comparan contra los de antes del renombrado; los cuerpos de las funciones solo cambian en los nombres.                       |
| El nombre `SOURCE.source` queda confuso si se traduce `origen` a `source`               | La clave se llama `origin` (el origen del dato es INDEC) y `collector` (quien recolectó), no `source`.                                                |
| El alcance crece a "traducir todo el proyecto" y se vuelve inviable de revisar          | La spec acota el renombrado a `src/` y prohíbe cambios de lógica, formato o UI.                                                                       |

## Qué **no** entra en esta spec

- Traducir o cambiar los textos visibles de la UI.
- Renombrar `fecha` e `inflacion_mensual_pct` (contrato externo del dataset).
- Modificar cálculos, formatos numéricos o lógica de negocio.
- Arreglar bugs preexistentes (por ejemplo, que el estado de error nunca se active).
- Cambios visuales, de layout o de color.
- Escribir la regla en `AGENTS.md` o `README.md`.
- Actualizar las specs 01–04.
- Renombrar `StatCard.vue`, `TrendArrow.vue`, `AppFooter.vue`.
- Vue Router, persistencia, tests automatizados, deploy y CI.

Cada uno de esos, si aterriza, va en su propia spec.

## Regla permanente (para el código de ahora en más)

A partir de esta spec, en `devaluAR`:

- **Todo identificador va en inglés**: tipos, interfaces, funciones, variables, constantes, props, claves de objetos, valores de tipos union, tokens CSS y nombres de archivo.
- **Los comentarios y JSDoc van en inglés.**
- **Todo texto visible para el usuario va en español**, incluidos los mensajes de error en pantalla y los textos accesibles.
- La única excepción consciente son los dos campos crudos del dataset externo (`fecha`, `inflacion_mensual_pct`).
