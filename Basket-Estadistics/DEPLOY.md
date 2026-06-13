# Deploy a Netlify

Esta app es Next.js 15 (App Router) con Postgres (Neon). Netlify la sirve con
`@netlify/plugin-nextjs`, ya declarado en [`netlify.toml`](./netlify.toml).

## HTTPS / TLS

No hay que configurar nada: Netlify provisiona el certificado TLS
automáticamente (Let's Encrypt) tanto para `*.netlify.app` como para cualquier
dominio propio que conectes. El `Strict-Transport-Security` (HSTS) ya va en
[`next.config.mjs`](./next.config.mjs).

## 1. Conectar el repositorio

1. En https://app.netlify.com → **Add new site → Import an existing project**.
2. Elige el repositorio y la rama (`master` para producción).
3. Build command y publish dir se toman de `netlify.toml` (no los cambies).

## 2. Variables de entorno

Configúralas en **Site configuration → Environment variables** (NUNCA subas
`.env`). 

### Obligatorias en producción
| Variable | Notas |
| --- | --- |
| `DATABASE_URL` | Connection string de Neon. **Usa el endpoint _pooled_** (host con `-pooler`) y mantén `?sslmode=require`. |
| `SESSION_SECRET` | ≥32 caracteres, único. Sin él la app **no arranca**. Genera: `node -e "console.log(crypto.randomBytes(32).toString('base64'))"` |

### Muy recomendadas
| Variable | Notas |
| --- | --- |
| `ENCRYPTION_KEY` | ≥32 chars. Cifra las API keys de IA de los usuarios. Si falta, se deriva de `SESSION_SECRET` (rotarlo invalidaría las keys guardadas). |
| `NEXT_PUBLIC_SITE_URL` | URL pública, p.ej. `https://tu-sitio.netlify.app`. Se usa en CORS, enlaces de email y SEO. |

### Opcionales (según funciones)
| Variable | Para qué |
| --- | --- |
| `RESEND_API_KEY` *o* `GMAIL_APP_PASSWORD` | Envío de emails: 2FA, reset de contraseña, contacto, waitlist. Sin ninguno, los emails caen a `console.log`. |
| `AUTH_EMAIL_FROM` | Remitente de los emails de auth. |
| `YOUTUBE_API_KEY` | Highlights en perfiles de jugador. |
| `ADMIN_EMAILS` | Emails admin separados por comas. |
| `CRON_SECRET` | Protege `/api/revalidate`. |
| `HUGGINGFACE_API_KEY` | Reranking de highlights. |

## 3. Aplicar la migración de base de datos

Se añadió la tabla `rate_limits` (rate limiting persistente). Aplícala a Neon
**una vez** antes o justo después del primer deploy. En local, con el
`DATABASE_URL` de producción cargado:

```bash
pnpm db:push        # crea la tabla rate_limits si no existe
```

> El limitador "falla abierto": si la tabla aún no existe la app funciona pero
> no aplica límites, así que esto no bloquea el deploy — pero hazlo cuanto antes.

## 4. Notas de producción

- **Rate limiting**: persistente en Postgres (`src/lib/security/rate-limit.ts`),
  válido en serverless. Los endpoints `account/*` autenticados y las listas
  públicas conservan un limitador en memoria best-effort.
- **Pooled connection**: imprescindible el endpoint `-pooler` de Neon para no
  agotar conexiones desde las funciones serverless.
- Tras el primer deploy, fija `NEXT_PUBLIC_SITE_URL` al dominio definitivo y
  vuelve a desplegar para que CORS y los emails usen la URL correcta.
