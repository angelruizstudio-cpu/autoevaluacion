# Autoevaluación de liderazgo — Next.js + Vercel + Supabase

Instrumento bilingüe (ES/EN) de autoevaluación de estilos de liderazgo
según el modelo de los seis estilos de Daniel Goleman, aplicado al
contexto de iglesia y ministerio. Acceso por enlace de un solo uso.

## Puesta en marcha

1. **Supabase** — ejecuta `schema-liderazgo.sql` en el SQL Editor.
   Verifica que las cuatro tablas queden con `rowsecurity = true`:

   ```sql
   select tablename, rowsecurity from pg_tables where schemaname='public';
   ```

2. **Variables de entorno** — copia `.env.example` a `.env.local`:

   ```bash
   cp .env.example .env.local
   openssl rand -base64 32     # pégalo en SESSION_SECRET
   ```

   `SUPABASE_SERVICE_ROLE_KEY` sale de Supabase → Settings → API →
   `service_role`. **Nunca** le pongas el prefijo `NEXT_PUBLIC_`.

3. **Local**

   ```bash
   npm install
   npm run dev
   ```

4. **Vercel** — importa el repo, agrega las variables en
   Settings → Environment Variables (Production y Preview), y despliega.
   Apaga *Deployment Protection → Vercel Authentication*, o nadie podrá
   abrir los enlaces.

5. **Enviar invitaciones** — entra a `/admin` con `ADMIN_PASSWORD`,
   ponle nombre a la ronda y pega los participantes (una persona por
   línea: nombre, correo, ministerio, idioma; sirve pegar desde Excel).
   El panel crea el ciclo, genera los tokens y manda los correos por
   Resend. Necesita `RESEND_API_KEY` y `CORREO_DESDE` con un dominio
   verificado en Resend.

   Si prefieres mandar los correos por tu cuenta, el script sigue ahí:

   ```bash
   npm run enlaces -- "Liderazgo ICP — Otoño 2026" participantes.csv
   ```

## Cómo funciona el enlace de un solo uso

| Momento | Qué pasa |
|---|---|
| Se genera | Token de 256 bits. La base guarda **solo el SHA-256**. |
| Se abre `/e/<token>` | Se marca `iniciado_en` y se abre una cookie firmada de 2 h. **No se quema todavía.** |
| Se envían respuestas | `UPDATE ... WHERE consumido_en IS NULL` quema el token en la misma transacción que guarda la evaluación. |
| Se abre otra vez | Cero filas devueltas → `/enlace-no-valido`. |

Separar "abrir" de "consumir" evita el caso más común de soporte: a
alguien se le cae la conexión a mitad del cuestionario y pierde su turno.

## Decisiones de seguridad

- **Puntaje recalculado en el servidor.** El navegador solo manda las 30
  respuestas crudas. Si confiáramos en los porcentajes del cliente,
  cualquiera podría inyectar el perfil que quisiera.
- **RLS activo sin políticas.** `anon` y `authenticated` no leen nada.
  Todo pasa por el servidor con `service_role`.
- **Mensaje de error genérico.** `/enlace-no-valido` no distingue entre
  token inexistente, usado o vencido. Distinguir convierte la ruta en un
  oráculo de enumeración.
- **Tokens hasheados.** Ni el administrador puede reconstruir el enlace
  de alguien desde la base de datos.
- **Umbral de anonimato.** La vista `consolidado_ministerio` oculta
  grupos con menos de 3 participantes: el promedio de dos personas es
  identificable, y eso rompe la confianza en el instrumento.
- **`noindex`** en el layout. Es un instrumento privado.

## Falta por hacer

- **Rate limiting de verdad en `/e/[token]`.** Ya hay un límite por IP
  en `lib/limite.ts` (10 intentos por 10 minutos, responde 429), pero
  la cuenta vive en la memoria del proceso: en Vercel cada instancia
  lleva la suya y un reinicio la borra. Sirve de piso, no de techo.
  **Antes de mandar el primer enlace**, activa Vercel → Firewall
  (límite por IP), o pásalo a Upstash Redis si lo quieres en código.
- **Consolidado en el panel.** `/admin` muestra quién abrió y quién
  completó, pero el promedio por ministerio sigue en el SQL Editor:

  ```sql
  select * from consolidado_ministerio where ciclo_id = '<uuid>';
  ```

## Estructura

```
app/
  e/[token]/route.ts        valida el token, abre la sesión
  api/enviar/route.ts       recalcula el puntaje, quema el token
  evaluacion/               el cuestionario (client component)
  resultado/[id]/           resultado, enlace permanente por UUID
  admin/                    panel: crea la ronda, genera tokens, manda correos
  Rueda.tsx                 la rueda SVG de seis sectores
lib/
  content.ts                los 30 ítems y los 6 estilos, ES/EN
  correo.ts                 plantilla ES/EN y envío por lotes con Resend
  limite.ts                 límite de intentos por IP (en memoria)
  puntuacion.ts             el modelo de puntaje (compartido)
  sesion.ts                 JWT de sesión (participante y admin) y hash de token
  supabase-admin.ts         cliente service_role, solo servidor
scripts/
  generar-enlaces.mjs       generación en lote a CSV, sin correo (alternativa al panel)
```
