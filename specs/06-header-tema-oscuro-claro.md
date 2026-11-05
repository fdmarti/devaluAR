# SPEC 06 — Header con toggle de tema oscuro/claro

> **Status:** Approved
> **Depends on:** SPEC 05
> **Date:** 2026-11-05
> **Objective:** Agregar una barra superior con un toggle de icono (sol/luna) que permite cambiar entre tema claro y oscuro, persistiendo la elección del usuario en localStorage y usando la preferencia del sistema operativo como valor por defecto.

## Scope

**In:**

- Nuevo componente `src/components/Header.vue` con el logo "devaluar" a la izquierda y el toggle de tema a la derecha.
- Nueva carpeta `src/components/Icons/` con los componentes `Sun.vue` y `Moon.vue`, cada uno con su SVG inline.
- Nuevo composable `src/composables/useTheme.ts` que gestiona el tema activo (`'light' | 'dark'`), la detección de la preferencia del sistema operativo y la persistencia en `localStorage` (clave `theme`).
- Integración del `Header` en `src/App.vue`, encima del `<main>`.
- Migración de `src/style.css` del esquema `@media (prefers-color-scheme: dark)` a un esquema basado en la clase `dark` en `<html>`, manteniendo el fallback a la preferencia del sistema cuando no hay elección guardada.
- Script inline en `index.html` para aplicar la clase `dark` antes del primer render y evitar el flash de tema incorrecto (FOUC).

**Out of scope (para specs futuras):**

- Animaciones de transición entre temas.
- Más de dos temas (ej. "system" como opción explícita en el toggle).
- Cambios de color del favicon o de meta tags `theme-color`.
- Tests automatizados (no hay runner configurado).

## Data model

```ts
// src/composables/useTheme.ts
type Theme = "light" | "dark";

const STORAGE_KEY = "theme"; // localStorage
```

No se introducen otras estructuras de datos. El estado del tema vive en el composable y se sincroniza con la clase `dark` del elemento `<html>`.

## Implementation plan

1. Crear `src/components/Icons/Sun.vue` y `src/components/Icons/Moon.vue` con sus SVG inline (accesibles, `aria-hidden="true"`).
2. Crear `src/composables/useTheme.ts` con: lectura inicial (localStorage → preferencia del SO), función `toggle()`, efecto que agrega/quita la clase `dark` en `<html>` y persiste la elección.
3. Refactorizar `src/style.css`: reemplazar `@media (prefers-color-scheme: dark) { :root { ... } }` por `html.dark { ... }`, y agregar un bloque `@media (prefers-color-scheme: dark) { :root:not(.light) { ... } }` para el caso sin elección guardada (o equivalente).
4. Agregar el script inline en `index.html` que, antes de cargar la app, lea `localStorage.getItem('theme')` (o `prefers-color-scheme`) y agregue `dark` a `<html>` si corresponde.
5. Crear `src/components/Header.vue` con logo y botón que usa `useTheme`, mostrando `Sun.vue` cuando el tema activo es claro y `Moon.vue` cuando es oscuro.
6. Registrar `Header` en `src/components/index.ts` (si aplica) e integrarlo en `src/App.vue` encima de `<main>`.
7. Verificar build (`pnpm build`) y comportamiento manual en ambos temas.

## Acceptance criteria

- [ ] La app carga en tema claro cuando el SO está en claro y no hay preferencia guardada.
- [ ] La app carga en tema oscuro cuando el SO está en oscuro y no hay preferencia guardada.
- [ ] Al hacer clic en el toggle, el tema cambia inmediatamente y el icono pasa de sol a luna (o viceversa).
- [ ] Tras recargar la página, se mantiene el tema elegido manualmente.
- [ ] No hay flash de tema incorrecto al cargar la página.
- [ ] `pnpm build` pasa sin errores de tipo ni de build.

## Decisions

- **Sí:** persistir la elección en `localStorage` con clave `theme`. Permite recordar la preferencia del usuario.
- **No:** usar una librería externa de temas (vueuse, etc.). El alcance es pequeño y se resuelve con un composable propio.
- **Sí:** iconos como componentes Vue en `src/components/Icons/`. Coincide con la estructura pedida por el usuario y permite reuso.
- **Sí:** clase `dark` en `<html>` en lugar de `data-theme`. Es el patrón más compatible con Tailwind v4 y con `color-scheme`.
- **No:** animación de transición entre temas. Se deja para una spec futura para mantener el cambio mínimo.

## Risks

| Riesgo                                                      | Mitigación                                                                                                        |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Flash de tema incorrecto (FOUC) al cargar                   | Script inline en `index.html` que aplica la clase antes de montar Vue.                                            |
| Inconsistencia entre `color-scheme` CSS y la clase aplicada | Mantener `color-scheme: light dark` solo cuando no hay clase; forzar `color-scheme: dark`/`light` según la clase. |
| `localStorage` no disponible (modo privado)                 | Envolver lectura/escritura en try/catch y caer al default del SO.                                                 |

## What is **not** in this spec

- Animaciones de transición entre temas.
- Más de dos temas.
- Cambios de favicon o meta `theme-color`.
- Tests automatizados.

Cada uno de esos, si aterriza, va en su propia spec.
