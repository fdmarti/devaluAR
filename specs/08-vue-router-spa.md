# SPEC 08 — Instalar Vue Router y convertir la app en SPA

> **Status:** Approved
> **Depends on:** SPEC 06, SPEC 07
> **Date:** 2026-11-05
> **Objective:** Instalar `vue-router` y reorganizar la app en vistas (`Home`, `HistorialPrecios`, `NotFound`) con un layout compartido, rutas `/`, `/historial-precios` y `/:pathMatch(.*)*`, y navegación en el header.

## Scope

**In:**

- Agregar `vue-router` (última versión estable compatible con Vue 3.5) a `dependencies` e instalarlo con pnpm.
- Crear `src/router/routes.ts` con las rutas `/` (Home), `/historial-precios` (HistorialPrecios) y `/:pathMatch(.*)*` (NotFound), usando lazy loading con `() => import(...)`.
- Crear `src/router/index.ts` que instancia el router con `createRouter` + `createWebHistory`, importando las rutas desde `routes.ts`.
- Registrar el router en `src/main.ts` con `app.use(router)`.
- Crear `src/views/Home.vue` moviendo íntegramente el contenido actual de `src/App.vue` (script, template y lógica asociada), manteniendo la carga de datos en `onMounted`.
- Crear `src/views/HistorialPrecios.vue` con un `<h1>Historial de precios</h1>` dentro del layout.
- Crear `src/views/NotFound.vue` con un mensaje de "página no encontrada" y un link a Home.
- Crear `src/layouts/Default.vue` que envuelva `<RouterView />` con `AppHeader` y `AppFooter`, y usarlo como layout en las rutas (o envolver el `<RouterView />` en `App.vue`).
- Refactorizar `src/App.vue` para que solo contenga el layout base (Header + `<RouterView />` + Footer) sin lógica de datos.
- Actualizar `src/components/AppHeader.vue` para incluir links de navegación a `/` y `/historial-precios`, y hacer que el logo "devaluar" redirija a `/`. Agregar indicador de ruta activa con underline separado del texto (underline-offset) en el link correspondiente.
- Actualizar `AGENTS.md` para registrar que el proyecto usa `vue-router`, la estructura `src/router/` (`index.ts` + `routes.ts`) y las convenciones de vistas en `src/views/` y layouts en `src/layouts/`.
- Agregar transiciones entre vistas usando `<Transition>` envolviendo `<RouterView />` en `App.vue` (o en el layout), con una transición de fade/opacity definida en CSS global.
- Asegurar que `pnpm build` pasa (`vue-tsc -b && vite build`).

**Out of scope (para specs futuras):**

- Scroll behavior personalizado, guards de navegación o meta titles por ruta.
- Estado compartido entre vistas (Pinia, etc.).
- Lazy loading avanzado / prefetch.
- Tests automatizados (no hay runner configurado).
- Rutas con parámetros o query params.

## Data model

No se introducen estructuras de datos nuevas. El router se instancia a partir de un array de `RouteRecordRaw`:

```ts
// src/router/routes.ts
import type { RouteRecordRaw } from "vue-router";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/historial-precios",
    name: "historial-precios",
    component: () => import("../views/HistorialPrecios.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFound.vue"),
  },
];
```

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";
import { routes } from "./routes";

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

## Implementation plan

1. Agregar `vue-router` con `pnpm add vue-router` y verificar lockfile.
2. Crear `src/router/routes.ts` con las tres rutas (lazy imports) y `src/router/index.ts` con `createRouter`/`createWebHistory`, exportando `router`.
3. Registrar el router en `src/main.ts` (`import { router } from './router'`, `app.use(router)`).
4. Crear `src/views/Home.vue` moviendo todo el `<script setup>`, `<template>` y lógica de `App.vue` actual; ajustar imports relativos (`../api/...`, `../components`, etc.).
5. Crear `src/views/HistorialPrecios.vue` con `<h1>Historial de precios</h1>` dentro del layout.
6. Crear `src/views/NotFound.vue` con mensaje y `<RouterLink to="/">`.
7. Crear `src/layouts/Default.vue` (o simplificar): envolver `<slot />`/`<RouterView />` con `AppHeader` y `AppFooter`. Integrar en `App.vue`.
8. Refactorizar `src/App.vue` para usar `AppHeader` + `<RouterView />` + `AppFooter` (sin lógica de datos).
9. Actualizar `AppHeader.vue`: agregar `<RouterLink to="/">` al logo y links a `/` y `/historial-precios`.
10. Actualizar `AGENTS.md`: agregar `vue-router` a la sección de librerías y documentar la estructura `src/router/`, `src/views/` y `src/layouts/`.
11. Envolver `<RouterView />` en `<Transition name="fade" mode="out-in">` en `App.vue` (o en el layout) y definir las clases `.fade-enter-active`, `.fade-leave-active`, `.fade-enter-from`, `.fade-leave-to` en `src/style.css`.
12. Ejecutar `pnpm build` y verificar navegación manual en `pnpm dev` (incluyendo recarga en `/historial-precios` y ruta inexistente).

## Acceptance criteria

- [ ] `vue-router` figura en `dependencies` de `package.json` y el lockfile está actualizado.
- [ ] `src/router/index.ts` y `src/router/routes.ts` existen y el router se registra en `main.ts`.
- [ ] Navegar a `/` muestra la vista Home con toda la funcionalidad original (carga de datos, cards, etc.).
- [ ] Navegar a `/historial-precios` muestra `HistorialPrecios.vue` con el `<h1>Historial de precios</h1>`.
- [ ] Una ruta inexistente muestra `NotFound.vue` con link a Home.
- [ ] El header incluye links a Home e Historial de precios, y el logo redirige a `/`.
- [ ] Recargar la página en `/historial-precios` no rompe (SPA fallback correcto en dev).
- [ ] `pnpm build` pasa sin errores de tipo ni de build.
- [ ] No hay errores en la consola del browser en `pnpm dev`.
- [ ] `AGENTS.md` menciona `vue-router` y la estructura `src/router/`, `src/views/` y `src/layouts/`.
- [ ] La navegación entre vistas muestra una transición de fade (sin errores en consola).

## Decisions

- **Sí:** `createWebHistory` para URLs limpias. Estándar para SPA moderna; en prod se asume fallback configurado en el hosting (fuera de alcance de esta spec).
- **Sí:** separar `routes.ts` de `index.ts`. Mantiene la configuración del router desacoplada de la definición de rutas y facilita tests futuros.
- **Sí:** lazy loading con `() => import(...)`. Reduce el bundle inicial; las vistas se cargan bajo demanda.
- **Sí:** layout compartido (`Default.vue`) envolviendo `<RouterView />` en `App.vue`. Evita duplicar Header/Footer en cada vista.
- **Sí:** mover todo `App.vue` a `Home.vue`. Preserva la funcionalidad existente sin reescribirla.
- **No:** Pinia o estado global. Esta spec solo configura routing; el estado sigue local en `Home.vue`.
- **Sí:** transición de fade entre vistas usando `<Transition>` envolviendo `<RouterView />` y clases en `src/style.css`. Mejora la UX con cambios mínimos.
- **No:** guards/meta/scroll behavior. No son necesarios para el alcance actual.

## Risks

| Riesgo                                                           | Mitigación                                                                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Imports relativos rotos al mover `App.vue` a `views/Home.vue`    | Revisar cada import (`../api`, `../components`, `../utils`, `../types`, `../constants`) y ajustar la profundidad. |
| `AppHeader` usa `RouterLink` antes de registrar el router        | El router se registra en `main.ts` antes de montar `App`, por lo que `RouterLink` está disponible globalmente.    |
| Recarga en ruta profunda en dev                                  | Vite dev server sirve `index.html` para rutas no encontradas por defecto; verificar manualmente.                  |
| Incompatibilidad de versión de `vue-router` con Vue 3.5 / Vite 8 | Instalar la última estable y validar con `pnpm build`.                                                            |

## What is **not** in this spec

- Scroll behavior, guards o meta por ruta.
- Estado global (Pinia).
- Rutas con parámetros o query params.
- Tests automatizados.

Cada uno de esos, si aterriza, va en su propia spec.
