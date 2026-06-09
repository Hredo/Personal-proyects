# globalhoopstats / Basket-Estadistics

Basketball statistics tracking web application — work in progress.

## Resumen

`globalhoopstats` (carpeta `Basket-Estadistics`) es una aplicación web para recoger, agregar y mostrar estadísticas de baloncesto para jugadores, equipos y staff desde múltiples fuentes (EuroLeague, ACB, NBA y otras). Está construida con Next.js (App Router), TypeScript, Tailwind CSS y Drizzle ORM.

## Últimos cambios (resumen)

- Añadida y mejorada la ruta de búsqueda de jugadores (`src/app/api/players/search/route.ts`) para búsquedas más precisas.
- Nuevos scripts de backfill y sincronización en `scripts/` para facilitar la importación de datos históricos.
- Ajustes en las migraciones de Drizzle y snapshots en `drizzle/` para mejorar la reproducibilidad.
- Documentación ampliada sobre problemas conocidos con OneDrive y recomendaciones para entornos locales.

Si quieres que detalle los cambios uno por uno (commits o PRs), indícame qué nivel de detalle necesitas.

## Tech stack

- Frontend: Next.js (App Router) + React + Tailwind CSS
- Lenguaje: TypeScript (estricto)
- ORM: Drizzle (ver `drizzle.config.ts`)
- Gestor de paquetes: pnpm

## Qué incluye

- Páginas y rutas para `players`, `teams`, `coaches`, `leagues` y `compare` (ver `src/app/`).
- API route para búsqueda de jugadores en `src/app/api/players/search/route.ts`.
- Componentes reutilizables en `src/components/`.
- Adaptadores de datos y utilidades de sincronización en `src/lib/sources/` y `src/lib/sync/`.
- Scripts para chequeos de base de datos, migraciones y sincronización en `scripts/`.

## Estado actual

Proyecto en desarrollo activo. Tareas pendientes destacadas:

- Automatizar por completo el flujo de migraciones y seeds para entornos locales.
- Implementar autenticación y control de acceso para áreas administrativas.
- Mejoras de accesibilidad y pruebas UI.
- Observabilidad y manejo de errores en los jobs de sincronización.

## Inicio rápido (desarrollador)

Pre-requisitos: Node.js (versión LTS recomendada), `pnpm`, y una base de datos relacional compatible con la configuración de Drizzle.

1. Instalar dependencias:

```bash
pnpm install
```

2. Crear el fichero de entorno local:

```powershell
# PowerShell (Windows)
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

3. Configurar la conexión a base de datos en `drizzle.config.ts` y actualizar `.env.local`.

4. Aplicar migraciones (ver `scripts/` para detalles). Ejemplo:

```bash
pnpm tsx scripts/apply-migrations.ts
```

5. Levantar servidor de desarrollo:

```bash
pnpm dev
```

## Scripts útiles

- `pnpm dev` — iniciar servidor de desarrollo
- `pnpm build` — build para producción
- `pnpm lint` — ejecutar ESLint
- `pnpm typecheck` — comprobaciones TypeScript
- `pnpm test` — ejecutar tests (si están configurados)

Revisa la carpeta `scripts/` para utilidades adicionales como `sync.ts`, `backfill-players.ts` y comprobaciones DB.

## Sincronización de datos y fuentes

Los adaptadores se encuentran en `src/lib/sources/`. Las tareas de importación y refresco se orquestan desde los scripts en `scripts/`. Dependiendo de la fuente, puede ser necesario configurar claves/API y ejecutar algunos scripts manualmente.

## Estructura del proyecto (alto nivel)

- `src/app/` — páginas y rutas API (App Router)
- `src/components/` — componentes de UI
- `src/lib/` — utilidades, lógica de sincronización y cliente DB
- `scripts/` — mantenimiento, migraciones y sincronización
- `drizzle/` — migraciones y snapshots SQL

## Notas de desarrollo / caveats

- OneDrive: si trabajas desde OneDrive pueden aparecer errores con `readlink()` y archivos reparse point en `.next/`. Si detectas problemas, borra `.next/` o excluye la carpeta de OneDrive.
- Recomendación: usa una copia local no gestionada por OneDrive para entornos CI/producción.

## Cómo contribuir

- Abre un issue para discutir cambios grandes o problemas con datos.
- Haz PRs pequeñas y focalizadas: mejoras de migraciones, tests para adaptadores, o correcciones UI.
- Para cambios en la DB, aporta migrations reproducibles y, si procede, un script de seed reducido.

## Contacto

- Autor: Hugo Redondo Valdés — Hrvaldes22@gmail.com

## Licencia

Consulta `LICENSE.txt` en la raíz del repositorio para los detalles de licencia.
