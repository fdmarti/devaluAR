# SPEC 04 — Flechas de tendencia en las variaciones mensual e interanual

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-11-03
> **Amended:** 2026-11-03 — la flecha pasa a mostrar la **diferencia respecto del mes anterior** (ver "Enmienda" más abajo).
> **Objective:** Mostrar en las tarjetas "Variación mensual" y "Variación interanual" una flecha a la derecha del valor que indique la dirección del cambio respecto del mes anterior, roja hacia arriba si la variación subió y verde hacia abajo si bajó, acompañada de la diferencia respecto del mes anterior.

## Enmienda (2026-11-03)

La primera versión de esta spec mostraba la flecha según el **signo de la variación** (`+1,9 %` → flecha roja hacia arriba). El usuario pidió que la flecha venga **acompañada de la diferencia respecto del mes anterior**: "si en el mes de 09 hay 1,9 y 08 fue de 1,7, debe estar la flecha para arriba y con 0,2".

Consecuencias del cambio, que fijan el resto de la spec:

- La flecha pasa a describir **la variación de la variación**: si la variación mensual subió de 1,7 % a 1,9 %, la diferencia es `+0,2` y la flecha es **roja hacia arriba**. Si bajó, la diferencia es negativa y la flecha es **verde hacia abajo**.
- La base de comparación es **el mes anterior en las dos tarjetas**. Para "Variación mensual" es la variación mensual del mes anterior (1,7 % en 08/2026). Para "Variación interanual" es la variación interanual del mes anterior (33,6 % en 08/2026), no la del mismo mes del año anterior.
- El número que acompaña a la flecha es **la diferencia**, con signo y en el mismo formato que el valor de la card: `+0,2 %`.
- Los textos accesibles pasan a ser "sube/baja respecto al mes anterior" en **las dos** tarjetas.

## Por qué existe esta spec

Hoy las dos tarjetas de variación muestran un número con signo (`+1,9 %`, `+33,3 %`), pero el signo convive con el `+` del formato y con la tipografía serif: `+1,9 %` no dice de un vistazo si el mes fue expansiveivo o contractivo, hay que leer el signo. Un inflationario necesita ver la dirección antes que la magnitud, y es exactamente lo que el color logra en una app financiera.

La diferencia respecto del mes anterior responde a la pregunta que sigue de la anterior: no solo *cuánto* varió el mes, sino **si viene acelerando o frenando**. `+1,9 % ▲ +0,2 %` dice "la inflación mensual es 1,9 % y viene subiendo"; `+33,3 % ▼ −0,3 %` dice "la interanual es 33,3 % pero el mes anterior era 33,6 %".

Además, la app ya tiene un token de color semántico (`--accent`) pero **no tiene ningún color de signo**: verde y rojo no existen en `src/style.css`. Esta spec los introduce.

## Scope

**In:**

- **Tokens de color de signo** en `src/style.css`: `--alza` (rojo) y `--baja` (verde), con variante distinta para `prefers-color-scheme: dark`, expuestos en el bloque `@theme inline` como `--color-alza` y `--color-baja` (utilidades Tailwind `text-alza` y `text-baja`).
- **Nuevo tipo `Tendencia`** (`'sube' | 'baja'`) en `src/types/inflacion.ts`.
- **Nuevo helper `tendenciaDeVariacion(valor: number): Tendencia | null`** en `src/utils/inflacion.ts`: devuelve `'sube'` si el valor es positivo, `'baja'` si es negativo, y `null` si el valor es `0` o no es finito.
- **Nuevo helper `diferenciaDeVariacion(valorActual: number, valorAnterior: number): number | null`** en `src/utils/inflacion.ts`: devuelve la resta `actual − anterior` en puntos porcentuales, o `null` si alguno de los dos valores no es finito. Si la resta da `0` exacto, devuelve `0` (no `null`): la dirección la decide `tendenciaDeVariacion`, no esta función.
- **Nuevo componente `src/components/TrendArrow.vue`**, presentacional: recibe `tendencia: Tendencia` (obligatoria), `descripcion?: string` y `diferencia?: string`. Dibuja un `svg` inline con `aria-hidden="true"` y `fill="currentColor"`, con el color según `tendencia` (`text-alza` / `text-baja`), y a su lado el número de diferencia ya formateado (`+0,2 %`) en el mismo color. Agrega además un texto `sr-only` con `descripcion` o, si falta, con `"sube"` / `"baja"`.
- **Dos props opcionales en `StatCard.vue`**: `tendencia?: Tendencia`, `tendenciaDescripcion?: string` y `diferencia?: string`. Cuando `tendencia` viene, la card renderiza la flecha y la diferencia a la derecha del valor.
- **Flecha a la derecha del valor**, con tamaño menor al del número: el `svg` mide `0.6em` de alto y de ancho (unidades relativas al `font-size` del valor, que es `text-4xl`), así que la flecha queda ~60 % del tamaño de la cifra y alineada a la línea base.
- **Aplicación en las 2 tarjetas de variación** del home (`App.vue`): "Variación mensual" y "Variación interanual".
- **Textos accesibles por tarjeta**: "sube respecto al mes anterior" / "baja respecto al mes anterior" en **las dos** tarjetas (la comparación es contra el mes anterior en ambas).

**Out of scope (para specs futuros):**

- Flecha en la tarjeta "Meses en la serie" (no es una variación).
- Flecha en la cifra protagonista "Un peso de 1943 vale hoy" (es un factor acumulado: la dirección no significa nada).
- Gráficos, series históricas, sparklines o cualquier librería de charts (ya descartado en SPEC 02 y SPEC 03).
- Selector de mes/año o navegación por fecha: la flecha siempre compara contra el período que la tarjeta ya declara.
- Colores distintos por magnitud de la variación (escala de calor), animaciones o transiciones.
- Tooltip visible al hacer hover.
- Vue Router, persistencia, theme switcher manual, deploy, CI y tests automatizados.

## Data model

**Tipo nuevo** (`src/types/inflacion.ts`):

```ts
/** Dirección de una variación: 'sube' (aumentó) o 'baja' (disminuyó). */
export type Tendencia = "sube" | "baja";
```

**Helper nuevo** (`src/utils/inflacion.ts`):

```ts
export function tendenciaDeVariacion(valor: number): Tendencia | null;
export function diferenciaDeVariacion(valorActual: number, valorAnterior: number): number | null;
```

Reglas de `tendenciaDeVariacion`: `null` para valores no finitos y para `0` exacto; `'sube'` para `> 0`; `'baja'` para `< 0`.

Reglas de `diferenciaDeVariacion`: `null` si alguno de los dos valores no es finito; si no, `actual − anterior` (puede dar `0`).

**Props nuevas de `StatCard.vue`**:

```ts
const props = defineProps<{
  titulo: string;
  valor: string;
  subtitulo?: string;
  /** Dirección de la variación. Si no viene, no se dibuja flecha. */
  tendencia?: Tendencia;
  /** Texto para lectores de pantalla que explica contra qué compara. */
  tendenciaDescripcion?: string;
  /** Diferencia respecto del mes anterior, ya formateada (`+0,2 %`). */
  diferencia?: string;
}>();
```

**Props de `TrendArrow.vue`**:

```ts
const props = defineProps<{
  /** Dirección a dibujar. Determina el color: 'sube' → rojo, 'baja' → verde. */
  tendencia: Tendencia;
  /** Texto accesible. Si falta, se usa 'sube' o 'baja'. */
  descripcion?: string;
  /** Diferencia ya formateada que se dibuja junto a la flecha. */
  diferencia?: string;
}>();
```

**Tokens de color** (`src/style.css`):

```css
:root {
  --alza: #b91c1c; /* rojo: la variación subió */
  --baja: #15803d; /* verde: la variación bajó */
}

@media (prefers-color-scheme: dark) {
  :root {
    --alza: #f87171;
    --baja: #4ade80;
  }
}

@theme inline {
  --color-alza: var(--alza);
  --color-baja: var(--baja);
}
```

Convención de nombres: `alza`/`baja` describen la **dirección del dato**, no si la noticia es buena o mala. Una suba de inflación es mala y se dibuja en rojo; una baja (deflación) es buena y se dibuja en verde.

**Estructura de las tarjetas en `App.vue`** (computed `tarjetas`): los objetos de las 2 variaciones ganan tres claves.

```ts
{
  titulo: 'Variación mensual',
  valor: '+1,9 %',
  subtitulo: 'último mes: 09/2026',
  tendencia: 'sube', // undefined si la diferencia es 0
  tendenciaDescripcion: 'sube respecto al mes anterior',
  diferencia: '+0,2 %',
}
```

**Origen de los datos** (`App.vue`): para calcular la diferencia hay que conocer el mes anterior.

- Variación mensual: `variacionMensual` del mes actual − `variacionMensual` del mes anterior.
- Variación interanual: `variacionInteranual` del mes actual − `variacionInteranual` del mes anterior (33,3 % en 09/2026 contra 33,6 % en 08/2026).

Ambos valores anteriores salen de `calcularResumen(meses, claveDelMesAnterior)`, que ya devuelve `variacionInteranual` para cualquier mes de la serie. Si el mes anterior no existe en la serie, o si alguno de los dos valores no es finito, no hay diferencia: no se dibuja flecha ni número.

El cálculo de la diferencia vive en `src/utils/inflacion.ts` (`diferenciaDeVariacion`), no en `App.vue`: es semántica del dato. El formateo (`+0,2 %`) vive en `src/utils/formato.ts` (`formatearPorcentaje`), que ya produce exactamente ese formato con signo.

## Implementation plan

1. **Agregar los tokens de color a `src/style.css`.** Definir `--alza` y `--baja` en `:root`, sobrescribirlos en el bloque `@media (prefers-color-scheme: dark)` y exponerlos en `@theme inline` como `--color-alza` / `--color-baja`. Verificación: `pnpm build` compila y las clases `text-alza` y `text-baja` existen (se comprueba aplicando una en el markup y viendo el color).

2. **Agregar el tipo `Tendencia` y el helper.** En `src/types/inflacion.ts`, exportar `export type Tendencia = 'sube' | 'baja'`. En `src/utils/inflacion.ts`, agregar `tendenciaDeVariacion(valor: number): Tendencia | null` con las reglas de `null` para `0` y no finitos. Verificación: `pnpm build` pasa; `tendenciaDeVariacion(1.9)` → `'sube'`, `(-0.4)` → `'baja'`, `0` → `null`, `NaN` → `null`.

3. **Crear `src/components/TrendArrow.vue`.** Componente presentacional. Contenedor `inline-flex shrink-0 items-center gap-1` con la clase de color según `tendencia`; dentro, un `svg` con `aria-hidden="true"`, `viewBox="0 0 24 24"`, `fill="currentColor"` y un path de flecha (triángulo hacia arriba si `'sube'`, hacia abajo si `'baja'`), de tamaño `h-[0.6em] w-[0.6em]`; a su lado, un `span` con el texto de `diferencia` (en el mismo color, en un tamaño menor al del valor de la card) y un `span` con clase `sr-only` que contiene `descripcion` o el texto por defecto. Verificación: el componente se ve en claro y en oscuro, con el color correcto para cada dirección.

4. **Modificar `src/components/StatCard.vue`.** Agregar las props opcionales `tendencia`, `tendenciaDescripcion` y `diferencia`. Cambiar el `<p>` del valor a un contenedor `flex items-baseline gap-2` que envuelve la cifra en un `span` y renderiza `<TrendArrow>` con `v-if="tendencia"`, pasándole `diferencia`. El `font-size` de la cifra no cambia. Verificación: la card con `tendencia="sube"` y `diferencia="+0,2 %"` muestra la flecha roja y el `+0,2 %` a la derecha del número; sin `tendencia` no renderiza nada extra.

5. **Agregar el helper `diferenciaDeVariacion`.** En `src/utils/inflacion.ts`, agregar `diferenciaDeVariacion(valorActual: number, valorAnterior: number): number | null`, que devuelve `actual − anterior` y `null` si alguno no es finito. Verificación: `pnpm build` pasa; `diferenciaDeVariacion(1.9, 1.7)` → `0.2`, `(33.29, 33.55)` → `-0.26`, `(1.9, NaN)` → `null`.

6. **Cablear las 2 tarjetas en `src/App.vue`.** En el computed `tarjetas`, para "Variación mensual" y "Variación interanual", obtener el `ResumenMes` del mes anterior con `calcularResumen(meses, claveAnterior)`, calcular la diferencia con `diferenciaDeVariacion`, derivar la `tendencia` con `tendenciaDeVariacion(diferencia)` y formatear la diferencia con `formatearPorcentaje`. Setear `tendenciaDescripcion` con "sube/baja respecto al mes anterior" según la dirección. Pasar las tres props al `StatCard`. Verificación: las 2 tarjetas de variación muestran flecha y diferencia; "Meses en la serie" no.

7. **Build y verificación visual.** `pnpm build` termina con exit code 0 (incluye `vue-tsc -b`). Revisar en claro y en oscuro, a 360 px y a 1024 px.

## Acceptance criteria

- [ ] `pnpm build` termina con exit code 0, incluyendo el typecheck de `vue-tsc -b`.
- [ ] `pnpm dev` sirve la app sin errores en la consola del browser.
- [ ] La tarjeta "Variación mensual" muestra una flecha **roja hacia arriba** y el texto **`+0,2 %`** a la derecha de `+1,9 %` con los datos al `09/2026` (1,9 % en 09 contra 1,7 % en 08).
- [ ] La tarjeta "Variación interanual" muestra una flecha **verde hacia abajo** y el texto **`-0,3 %`** a la derecha de `+33,3 %` (33,3 % en 09 contra 33,6 % en 08).
- [ ] El número de diferencia va **junto a la flecha**, con el mismo color que ella, y es más chico que la cifra principal.
- [ ] La flecha está a la derecha del valor, en la misma línea base, y es visiblemente más chica que la cifra (≈60 % del `font-size` del valor).
- [ ] La tarjeta "Meses en la serie" **no** muestra ninguna flecha ni diferencia.
- [ ] El hero "Un peso de 1943 vale hoy" **no** muestra ninguna flecha.
- [ ] La dirección de la flecha la determina **el signo de la diferencia**, no el de la variación: si la diferencia es positiva, flecha **roja hacia arriba**; si es negativa, flecha **verde hacia abajo**.
- [ ] Si la diferencia es exactamente `0`, no se dibuja ninguna flecha ni número, y el valor se muestra igual.
- [ ] Si el mes anterior no existe en la serie, o si alguno de los dos valores no es finito (la card muestra `—`), no se dibuja ninguna flecha ni número.
- [ ] El `svg` de la flecha tiene `aria-hidden="true"` y no es anunciado por los lectores de pantalla.
- [ ] Junto a la flecha hay un texto `sr-only` con el texto "sube respecto al mes anterior" (variación mensual) o "baja respecto al mes anterior" (variación interanual), con "sube"/"baja" según el signo de la diferencia.
- [ ] `src/style.css` define `--alza` y `--baja` en `:root`, con otros valores en el bloque `prefers-color-scheme: dark`, y ambos están expuestos en `@theme inline` como `--color-alza` y `--color-baja`.
- [ ] La flecha y el número de diferencia se ven legibles (contraste suficiente) en modo claro y en modo oscuro.
- [ ] El rojo de la flecha es distinguible del `--accent` ocre de la app.
- [ ] `src/components/TrendArrow.vue` existe y `StatCard.vue` no contiene el `path` del `svg` inline.
- [ ] `src/types/inflacion.ts` exporta el tipo `Tendencia` y `src/utils/inflacion.ts` exporta `tendenciaDeVariacion` y `diferenciaDeVariacion`.
- [ ] `StatCard.vue` acepta `tendencia`, `tendenciaDescripcion` y `diferencia` como opcionales; sin `tendencia` no renderiza flecha, diferencia ni texto `sr-only`.
- [ ] `StatCard.vue` sigue siendo presentacional: no importa `src/utils/inflacion.ts` ni formatea números.
- [ ] La app es usable a 360 px de ancho: la flecha y la diferencia no hacen overflow ni cortan el valor.
- [ ] La app no contiene gráficos: no hay `canvas`, ni `svg` con paths de datos, ni librería de charts (el `svg` de la flecha es decorativo y no dibuja datos).

## Decisions

- **Sí:** flecha **roja hacia arriba / verde hacia abajo**. Es el convenio financiero: el rojo marca "subió" y el verde "bajó", que es exactamente lo que el usuario pidió. El color depende solo del signo de la **diferencia** (enmienda del 2026-11-03), no del signo de la variación.
- **No:** verde hacia arriba / rojo hacia abajo. Invertiría el convenio y haría que una suba de inflación se lea como una buena noticia.
- **Sí:** los tokens se llaman `alza` y `baja` y no `positivo`/`negativo`. `positivo` se lee como "bueno", que es falso para una suba de inflación. `alza`/`baja` describen la dirección del dato, sin juicio de valor.
- **No:** un solo rojo y verde para claro y oscuro. El `accent` ya tiene dos valores (ocre quemado / ocre claro); un `#b91c1c` sobre `#0b1120` no tiene el mismo contraste que sobre `#ffffff`.
- **Sí:** `svg` inline en vez de carácter `▲`/`▼`. El unicode depende de la fuente para el tamaño y la forma, y no se puede colorear de forma confiable. El `svg` con `fill="currentColor"` hereda el color del token y mide `0.6em`, o sea que escala solo con el `font-size` del valor.
- **Sí:** la flecha mide `0.6em`, o sea ~60 % del tamaño de la cifra (`text-4xl` → ~22 px). Suficientemente chica para no competir con el número, suficientemente grande para verse a 360 px.
- **Sí:** la flecha va en un contenedor `flex items-baseline` junto a la cifra, no dentro del texto. Así la alineación con la línea base no depende de cómo el navegador trate un `svg` inline.
- **Sí:** la prop se llama `tendencia` con valores `'sube' | 'baja'`. Es el dominio del dato, no del color: `StatCard` no sabe de rojo ni de verde, solo dibuja lo que le dicen. El color lo decide `TrendArrow`.
- **Sí:** `tendenciaDescripcion` es una prop aparte y no se deriva dentro de `StatCard`. Es presentacional puro: no puede saber contra qué compara.
- **Sí:** el texto `sr-only` va dentro de `TrendArrow`, junto al `svg`. Semanticamente la flecha y su texto son la misma cosa; separarlos dejaría el texto flotando en la card.
- **Sí:** `aria-hidden="true"` en el `svg`. El lector de pantalla ya lee el valor; el `svg` no aporta nada y sí ensucia la lectura.
- **Sí:** `tendenciaDeVariacion` devuelve `null` para `0`. Una diferencia de 0 puntos no es ni suba ni baja: dibujar una flecha afirmaría una dirección que no existe.
- **Sí (enmienda):** la base de comparación es **el mes anterior en las dos tarjetas**. La variación interanual se compara contra la variación interanual del mes anterior (33,3 % en 09 contra 33,6 % en 08), no contra el mismo mes del año anterior. Así las dos cards se leen igual y la flecha siempre responde "frente al mes que viene".
- **Sí (enmienda):** el número de diferencia se muestra **junto a la flecha**, en el mismo color que ella, con el mismo formato del valor de la card (`+0,2 %`, `-0,3 %`): `formatearPorcentaje` ya produce exactamente eso.
- **Sí (enmienda):** la dirección de la flecha la decide el signo de la **diferencia**, no el de la variación. Es lo que pidió el usuario: "si el número es positivo, la flecha debe ser roja para arriba; si es negativo, verde para abajo".
- **No:** `StatCard` recibe el número crudo y decide la dirección. Rompería el acuerdo de SPEC 03 (el componente no formatea nada y no conoce el dominio) y obligaría al componente a saber de inflación.
- **No:** el helper vive en `src/utils/formato.ts`. `formato.ts` es de presentación (es-AR, `Intl`, `date-fns`); "qué significa que una variación suba" y "cuánto cambió respecto del mes anterior" es semántica del dato.
- **No:** el cálculo de la diferencia vive en `App.vue`. `App.vue` consume helpers de `utils/inflacion.ts` (como `calcularResumen`); la resta entre dos variaciones es semántica del dato y va junto a las demás.
- **No:** flecha en "Meses en la serie" ni en el hero 1943. No son variaciones; una dirección ahí sería ruido.
- **No:** escala de color por magnitud (verde claro → rojo intenso según el %). Un solo color por signo es lo que se pidió y evita que el ojo tenga que interpretar dos variables a la vez.
- **No:** animaciones de transición de la flecha. La app no usa animaciones salvo el spinner de carga.

## Risks

| Riesgo                                                                              | Mitigación                                                                                                                                            |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| El rojo de `--alza` puede confundirse con el `--accent` ocre                        | Se eligen tonos claramente distintos: rojo `#b91c1c` / `#f87171` contra ocre `#b45309` / `#f0b45e`. Se verifica en claro y en oscuro.                 |
| `0,6em` depende del `font-size` del valor y puede desalinearse si cambia `text-4xl` | La flecha vive en un `flex items-baseline`, así que se alinea con la línea base aunque cambie el tamaño del número. Se verifica en claro y en oscuro. |
| El texto `sr-only` puede quedar visible si falta la utilidad `sr-only` de Tailwind  | Tailwind v4 la provee de fábrica; se verifica que el texto no sea visible en pantalla.                                                                |
| Un mes con deflación mostraría verde, lo que puede leerse como "buena noticia"      | Es el comportamiento pedido y coincide con el convenio financiero. La flecha comunica dirección, no juicio.                                           |
| La card con flecha puede desbordar a 360 px                                         | El valor usa `break-words` y la flecha es `shrink-0`; se verifica a 360 px.                                                                           |
| La flecha puede quedar desalineada al agregar el número de diferencia al lado       | El número va **dentro** del contenedor `inline-flex` de `TrendArrow`, que a su vez está en el `flex items-baseline` de la card. La alineación no depende del `svg` inline. |
| Que la diferencia se calcule contra un mes que no existe en la serie                 | `diferenciaDeVariacion` devuelve `null` si algún valor no es finito, y `App.vue` no dibuja flecha ni número cuando no hay diferencia calculable.        |

## Qué **no** entra en esta spec

- Flecha en "Meses en la serie" o en el hero "Un peso de 1943 vale hoy".
- Gráficos, curvas de inflación, barras, sparklines o cualquier librería de charts.
- Tooltips visibles al hacer hover.
- Animaciones de la flecha.
- Escala de color por magnitud de la variación.
- Selector de mes/año, Vue Router, rutas de detalle.
- Calculadora de equivalencia, tabla anual.
- Cambios al dataset vendorizado, a los cálculos de inflación o al modelo de datos más allá del tipo `Tendencia`.
- Persistencia en el browser.
- Theme switcher manual.
- Deploy, CI y tests automatizados (el proyecto no tiene runner de tests; la verificación es por scripts y a mano).

Cada uno de esos, si aterriza, va en su propia spec.
