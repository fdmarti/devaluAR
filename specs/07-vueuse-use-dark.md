# SPEC 07 — Integrar VueUse y migrar el tema a useDark

> **Status:** Approved
> **Depends on:** SPEC 05, SPEC 06
> **Date:** 2026-11-05
> **Objective:** Instalar `@vueuse/core` y reemplazar el composable propio de tema por `useDark`, manteniendo la clase `dark` en `<html>` y el comportamiento de toggle en el Header.

## Scope

**In:**

- Agregar `@vueuse/core` (última versión estable) a `dependencies` en `package.json` e instalarla con pnpm.
- Reemplazar `src/composables/useTheme.ts` por el uso directo de `useDark()` de VueUse en `src/components/Header.vue`.
- Eliminar `src/composables/useTheme.ts` y su import en `Header.vue`.
- Configurar `useDark` con la clase `dark` en `<html>` (comportamiento por defecto de VueUse) y dejar que use la clave de storage por defecto (`vueuse-color-scheme`).
- Adaptar `Header.vue` al API de `useDark`: ref booleano `isDark`, toggle por asignación, icono Sol cuando `!isDark` y Luna cuando `isDark`.
- Remover el script inline anti-FOUC de `index.html`, delegando el tema inicial a VueUse (preferencia del sistema como default).
- Mantener `src/style.css` basado en la clase `dark` en `<html>`.
- Actualizar `AGENTS.md` para registrar que el proyecto usa `@vueuse/core` y que, cuando exista una utilidad equivalente en VueUse, se prefiere sobre implementaciones propias (composables, storage, detección de preferencias del SO, etc.).

**Out of scope (para specs futuras):**

- Migrar otros composables o utilidades existentes a VueUse (useLocalStorage, usePreferredDark, etc.).
- Animaciones de transición entre temas.
- Más de dos temas o tema "system" explícito en el toggle.
- Cambios de favicon o meta `theme-color`.
- Tests automatizados (no hay runner configurado).

## Data model

No se introducen estructuras de datos nuevas. El estado del tema pasa a ser el ref booleano `isDark` provisto por `useDark()` de VueUse, persistido en `localStorage` bajo la clave `vueuse-color-scheme`.

```ts
// src/components/Header.vue
import { useDark } from "@vueuse/core";

const isDark = useDark();
// isDark: Ref<boolean>
```

La clave anterior `theme` deja de usarse; la preferencia guardada previamente se pierde (decisión asumida).

## Implementation plan

1. Agregar `@vueuse/core` a `package.json` (`pnpm add @vueuse/core`) y verificar que el lockfile se actualiza.
2. Refactorizar `src/components/Header.vue`: importar `useDark`, reemplazar `useTheme()` por `const isDark = useDark()`, ajustar el binding del botón (`@click="isDark = !isDark"`), el `aria-label` y la condición de los iconos (`Sun v-if="!isDark"`, `Moon v-else`).
3. Eliminar `src/composables/useTheme.ts` y su import en `Header.vue`.
4. Remover el script inline de `index.html` que aplicaba la clase `dark` antes del primer render.
5. Verificar que `src/style.css` sigue usando `html.dark` para el tema oscuro y que no queda referencia a la clave `theme` ni al composable eliminado.
6. Ejecutar `pnpm build` y comprobar manualmente en `pnpm dev` el toggle, la persistencia tras recarga y el default según el SO.
7. Agregar una sección/nota en `AGENTS.md` (junto a las convenciones de estructura) indicando la disponibilidad de `@vueuse/core` y la preferencia por sus utilidades sobre código custom.

## Acceptance criteria

- [ ] `@vueuse/core` figura en `dependencies` de `package.json` y el lockfile está actualizado.
- [ ] `src/composables/useTheme.ts` no existe y no hay imports rotos.
- [ ] `Header.vue` usa `useDark()` de `@vueuse/core` y el toggle cambia el tema inmediatamente.
- [ ] Tras recargar la página se mantiene el tema elegido manualmente (clave `vueuse-color-scheme`).
- [ ] Con el SO en claro y sin preferencia guardada, la app carga en claro; con el SO en oscuro, en oscuro.
- [ ] El icono muestra Sol en claro y Luna en oscuro.
- [ ] El script inline anti-FOUC fue removido de `index.html`.
- [ ] `pnpm build` pasa sin errores de tipo ni de build.
- [ ] No hay errores en la consola del browser en `pnpm dev`.
- [ ] `AGENTS.md` menciona `@vueuse/core` y la preferencia por sus utilidades sobre implementaciones propias.

## Decisions

- **Sí:** instalar `@vueuse/core` completo. Es la dependencia estándar y deja disponibles otras utilidades para specs futuras.
- **Sí:** reemplazar `useTheme.ts` por `useDark()` directo. Evita mantener una fachada redundante.
- **No:** envolver `useDark` en `useTheme`. Agrega una capa sin valor.
- **Sí:** usar la clave de storage por defecto de VueUse (`vueuse-color-scheme`). Acepta perder la preferencia guardada bajo `theme`.
- **No:** mantener la clave `theme`. Obligaría a configurar `storageKey` manualmente y a mantener compatibilidad con el código viejo que se elimina.
- **Sí:** remover el script anti-FOUC de `index.html`. VueUse resuelve el tema inicial al montar; se acepta un posible flash mínimo.
- **No:** mantener el script inline. Quedaría duplicando la lógica que VueUse ya maneja.
- **Sí:** mantener la clase `dark` en `<html>` y el CSS basado en `html.dark`. Es el patrón que VueUse usa por defecto y el que ya tiene el proyecto.
- **Sí:** documentar VueUse en `AGENTS.md` para que specs futuras y agentes lo tengan en cuenta al proponer soluciones.

## Risks

| Riesgo                                                                              | Mitigación                                                                                            |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Flash de tema incorrecto (FOUC) al cargar al remover el script inline               | Aceptar el flash mínimo; si se vuelve problemático, re-agregar un script mínimo en otra spec.         |
| Pérdida de la preferencia guardada bajo la clave `theme`                            | Decisión asumida; los usuarios vuelven al default del SO hasta que vuelvan a elegir.                  |
| `useDark` aplica la clase `dark` solo cuando es oscuro (sin clase `light` en claro) | `src/style.css` ya se basa en `html.dark`; verificar que no haya reglas que dependan de `html.light`. |
| Incompatibilidad de versión de VueUse con Vue 3.5 / Vite 8                          | Instalar la última estable y validar con `pnpm build`.                                                |

## What is **not** in this spec

- Migrar otras utilidades del proyecto a VueUse.
- Animaciones de transición entre temas.
- Más de dos temas.
- Cambios de favicon o meta `theme-color`.
- Tests automatizados.

Cada uno de esos, si aterriza, va en su propia spec.
