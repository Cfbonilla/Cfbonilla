# Sistema de entradas para eventos

Flujo:

```
Registro de usuario → Detalles de asistencia → Código único + QR → Validación por organizadores
```

## Cómo funciona

| Paso | Dónde | Qué pasa |
|------|-------|----------|
| 1. Registro | `/` (paso 1) | Nombre, correo, teléfono, documento. |
| 2. Asistencia | `/` (paso 2) | Tipo de entrada, acompañantes, restricciones alimentarias, comentarios. |
| 3. Código único | `/ticket.html?code=…` | Se genera un código como `EVT-7KQ2M-X9HPA` y su QR. El asistente lo guarda, lo imprime o lo captura. |
| 4. Validación | `/admin.html` | El organizador escanea el QR con la cámara (o escribe el código). Respuestas: ✅ acceso permitido · ⚠️ ya usada (con hora y quién la validó) · ❌ código no registrado. |

### Qué evita duplicados y fraude
- **Códigos únicos**: aleatorios criptográficamente (≈49 bits), con restricción `UNIQUE` en la base de datos y reintento automático si hubiera colisión.
- **Una persona, una entrada**: el correo y el documento son únicos (no distingue mayúsculas; el documento ignora puntos, guiones y espacios).
- **Una sola entrada por código**: el check-in es atómico; si dos puertas escanean el mismo QR a la vez, solo una lo acepta.
- **Panel protegido** con token de organizador. Cada validación registra quién la hizo.
- Sin alfabeto ambiguo (no hay `0/O`, `1/I/L`) para poder dictar el código.

## Ejecutar

Requiere Node.js 22.5 o superior (usa SQLite integrado; no hace falta instalar una base de datos).

```bash
cd evento-entradas
npm install
ADMIN_TOKEN="una-clave-segura" EVENT_NAME="Mi Evento 2026" npm start
```

- Registro: http://localhost:3000/
- Organizadores: http://localhost:3000/admin.html

| Variable | Por defecto | Uso |
|----------|-------------|-----|
| `ADMIN_TOKEN` | aleatorio (se imprime al iniciar) | Clave del panel de organizadores |
| `EVENT_NAME` | `Mi Evento` | Nombre mostrado en el formulario y la entrada |
| `PORT` | `3000` | Puerto HTTP |
| `DB_FILE` | `data/evento.db` | Archivo de la base de datos SQLite |

Pruebas: `npm test`

> La cámara del navegador solo funciona con **HTTPS** (o `localhost`). Para usarlo en el evento, despliégalo en un servicio con HTTPS (Render, Railway, Fly.io, un VPS con Caddy, etc.).

## API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/register` | — | Registra y devuelve el código |
| GET | `/api/tickets/:code` | — | Datos públicos de la entrada |
| GET | `/api/tickets/:code/qr.png` | — | Imagen QR |
| POST | `/api/checkin` | `x-admin-token` | Valida `{ code, staff }` |
| GET | `/api/attendees` | `x-admin-token` | Lista + estadísticas |
| GET | `/api/attendees.csv` | `x-admin-token` | Exporta a Excel/CSV |

## Ideas siguientes
- Enviar la entrada por correo automáticamente (SMTP / Resend / SendGrid).
- Recibir registros desde Google Forms vía webhook (Apps Script → `POST /api/register`).
- Cupo máximo por tipo de entrada y cierre de inscripciones.
- Varios eventos en la misma base de datos.
