# 🎟️ Registro de entrada a eventos

Sistema web para registrar a los asistentes de un evento (por defecto, los trabajadores de **Navidad Paraíso 2026**), entregarles una **entrada con código QR único** y que los organizadores la **validen en la puerta**. Tiene estilo *pixel art* de 8 bits navideño (nieve, luces, árboles, elefantes y personas con gorro navideño), los **colores de la empresa** y modo claro/oscuro.

```
 TRABAJADOR                                        ORGANIZADOR
 ──────────                                        ───────────
 1. Llena sus datos   ─┐
 2. Llena acompañantes ├─► 3. Recibe su entrada ─► 4. Escanea el QR en la puerta
                       │      (código + QR)            ✔ permitido / ⚠ ya usada / ✖ no existe
```

---

## Índice

1. [Qué hay en esta carpeta](#1-qué-hay-en-esta-carpeta)
2. [Instalación paso a paso (Windows y Mac)](#2-instalación-paso-a-paso)
3. [Configuración: nombre del evento y contraseña](#3-configuración)
4. [Cómo lo usan los trabajadores](#4-cómo-lo-usan-los-trabajadores)
5. [Cómo lo usan los organizadores](#5-cómo-lo-usan-los-organizadores)
6. [Empezar de cero (borrar todos los datos)](#6-empezar-de-cero)
7. [Dónde se guardan los datos y copias de seguridad](#7-dónde-se-guardan-los-datos)
8. [Publicarlo en internet para el evento real](#8-publicarlo-en-internet)
9. [Personalizar colores y textos](#9-personalizar-colores-y-textos)
10. [Problemas frecuentes](#10-problemas-frecuentes)
11. [Información técnica](#11-información-técnica)

---

## 1. Qué hay en esta carpeta

```
evento-entradas/
├── configuracion.txt    ← AQUÍ cambias el nombre del evento y la contraseña
├── server.js            ← el "motor" del sistema (no hace falta tocarlo)
├── db.js                ← guarda y consulta los registros
├── package.json         ← lista de piezas que necesita (las instala "npm install")
├── public/              ← las páginas que se ven en el navegador
│   ├── index.html       ← formulario de registro (para trabajadores)
│   ├── ticket.html      ← la entrada con el QR
│   ├── admin.html       ← panel de organizadores
│   ├── styles.css       ← colores de la empresa y diseño pixel art
│   ├── theme.js         ← botón de modo claro / oscuro y nieve que cae
│   └── sprites/         ← personajes pixel art (árbol, elefantes, personas, regalo, luces)
├── tools/
│   └── generar-sprites.js ← dibuja los personajes (para editarlos o crear nuevos)
├── test/                ← pruebas automáticas
└── data/                ← se crea sola al encender: aquí está la base de datos
```

---

## 2. Instalación paso a paso

Solo necesitas hacerlo una vez por computadora.

### Paso 1 · Instalar Node.js
1. Entra en **https://nodejs.org**.
2. Descarga la versión **LTS** (botón verde) e instálala con las opciones por defecto (siguiente, siguiente, finalizar).
3. **Reinicia la computadora** (evita el error "npm no se reconoce").

> Necesitas Node.js **22.5 o superior**. Para comprobar tu versión, en la terminal escribe `node -v`.

### Paso 2 · Descargar el sistema
**Opción A · Sin saber Git (recomendada):**
1. Descarga el ZIP: https://github.com/Cfbonilla/Cfbonilla/archive/refs/heads/Christmas-Entry-System.zip
2. Clic derecho sobre el ZIP → **Extraer todo**.
3. Dentro encontrarás la carpeta **`evento-entradas`**. Muévela donde quieras (por ejemplo, al Escritorio).

**Opción B · Con Git:**
```bash
git clone -b Christmas-Entry-System https://github.com/Cfbonilla/Cfbonilla.git
cd Cfbonilla/evento-entradas
```

### Paso 3 · Abrir una terminal dentro de la carpeta `evento-entradas`
- **Windows:** abre la carpeta `evento-entradas`, haz clic en la **barra de dirección** (arriba, donde dice la ruta), escribe `cmd` y presiona **Enter**. Se abre una ventana negra.
- **Mac:** clic derecho sobre la carpeta `evento-entradas` → **Nuevo terminal en la carpeta**. (Si no aparece: Ajustes del Sistema → Teclado → Funciones rápidas → Servicios → activa "Nuevo terminal en la carpeta").

Comprueba que estás en el lugar correcto: escribe `dir` (Windows) o `ls` (Mac). Debes ver `server.js` y `package.json`.

### Paso 4 · Instalar las piezas (solo la primera vez)
```bash
npm install
```
Espera a que termine (aparece un mensaje como `added ... packages`). Puede tardar 1 minuto.

### Paso 5 · Encender el sistema
```bash
npm start
```
Verás:
```
Registro:      http://localhost:3000/
Organizadores: http://localhost:3000/admin.html
```
Si no configuraste contraseña, también verás `Token temporal de organizador: ...` → **cópialo**, es la contraseña del panel (cambia cada vez que enciendes).

### Paso 6 · Abrir las páginas
Con la ventana negra **abierta**, abre el navegador (Chrome, Edge, Firefox, Safari):
- **http://localhost:3000/** → formulario de registro.
- **http://localhost:3000/admin.html** → panel de organizadores.

### Paso 7 · Apagar
Cierra la ventana negra o presiona **Ctrl + C** dentro de ella. Los registros quedan guardados.

**Cada vez que quieras volver a usarlo:** repite los pasos 3, 5 y 6 (el `npm install` ya no hace falta).

---

## 3. Configuración

Abre el archivo **`configuracion.txt`** con el Bloc de notas (Windows) o TextEdit (Mac):

```ini
EVENT_NAME=Navidad Paraíso 2026     ← nombre que aparece en las páginas
ADMIN_TOKEN=                        ← contraseña del panel (vacía = se genera una nueva cada vez)
MAX_COMPANIONS=5                    ← máximo de acompañantes por trabajador
PORT=3000                           ← puerto (normalmente no se toca)
```

Ejemplo con contraseña fija:
```ini
ADMIN_TOKEN=Paraiso-Puerta-2026
```
Guarda el archivo y **vuelve a encender** el sistema (Ctrl + C y luego `npm start`) para que tome los cambios.

> ⚠️ No compartas `configuracion.txt` ni lo subas a GitHub con tu contraseña escrita.

---

## 4. Cómo lo usan los trabajadores

1. Abren el enlace de registro (en su celular o computadora).
2. **Nivel 1 · Tus datos:** nombre, número de cédula, área de trabajo y estado civil.
3. **Nivel 2 · Acompañantes:** eligen cuántos (0 a 5) y escriben el nombre de cada uno.
4. Pulsan **★ Obtener entrada** y aparece su **entrada con QR** y un código como `EVT-7CGUC-46MBQ`.
5. Deben **guardarla**: captura de pantalla, guardar el enlace o **⎙ Imprimir / PDF**.

Reglas automáticas:
- **Una cédula = una entrada.** Si alguien intenta registrarse dos veces, el sistema lo bloquea (aunque escriba la cédula con puntos o guiones).
- En la entrada, la cédula aparece oculta (`••••7890`) por privacidad.
- Si un trabajador **pierde su código**, el organizador lo busca por nombre o cédula en el panel y se lo dicta.

El botón **☾ Oscuro / ☀ Claro** (arriba a la derecha) cambia el tema; el navegador lo recuerda.

---

## 5. Cómo lo usan los organizadores

1. Entran en **`/admin.html`**, escriben la **contraseña** y su **nombre o puerta** (ej. "Puerta 1 - Ana"). Ese nombre queda guardado en cada entrada que validen.
2. **Validar con cámara:** pulsan **📷 Activar cámara**, dan permiso y apuntan al QR.
   **Validar a mano:** escriben el código en la casilla y pulsan **Validar**.
3. El resultado aparece en color:

| Color | Mensaje | Qué hacer |
|-------|---------|-----------|
| 🟩 Verde | **Acceso permitido** + nombre, cédula, área y acompañantes | Dejar pasar al trabajador y a sus acompañantes |
| 🟨 Amarillo | **¡Atención! Esta entrada ya fue usada** + hora y quién la validó | No dejar pasar; puede ser una captura compartida |
| 🟥 Rojo | **Código no registrado** | No dejar pasar |

4. Arriba se ven los **contadores**: registrados, ya ingresaron, personas en total.
5. La tabla **Registrados** muestra a todos; usa el **buscador** (nombre, cédula, área o código).
6. **⬇ Excel (CSV)** descarga la lista completa (se abre directamente con Excel).

**Varias puertas a la vez:** cada organizador abre `/admin.html` en su propio celular con la misma contraseña. Si dos puertas escanean el mismo QR al mismo tiempo, solo una lo acepta. La lista se actualiza sola cada 15 segundos.

> 📷 La cámara del celular solo funciona si la página se abre con **https://** (o en `localhost`). En la red local sin https, usa la validación a mano, o publica el sistema en internet (sección 8).

---

## 6. Empezar de cero

Para un evento nuevo o para borrar los registros de prueba hay **dos formas**:

### Forma 1 · Con el botón (recomendada)
1. Entra en **`/admin.html`** con la contraseña.
2. Baja hasta **⚠ Zona de peligro**.
3. Deja marcada la casilla **"Descargar copia de seguridad (Excel) antes de borrar"** (recomendado).
4. Pulsa **✖ Borrar todos los datos**.
5. Escribe **`BORRAR`** (en mayúsculas) y acepta.
6. Aparece **"★ ¡Nueva partida! ★"** y los contadores quedan en **0**.

Después de borrar, los QR entregados anteriormente dejan de funcionar y las mismas cédulas se pueden volver a registrar. **No se puede deshacer** (por eso la copia de seguridad).

### Forma 2 · Borrando el archivo de datos
1. Apaga el sistema (Ctrl + C o cierra la ventana negra).
2. Dentro de `evento-entradas`, borra la carpeta **`data`** (o mueve su contenido a otro lugar si quieres guardarlo).
3. Vuelve a encender con `npm start`. La base de datos se crea vacía.

---

## 7. Dónde se guardan los datos

- Todo se guarda en **`evento-entradas/data/evento.db`** (una base de datos SQLite, un solo archivo).
- **Copia de seguridad:** con el sistema apagado, copia la carpeta `data` a otro lugar (USB, nube). Para restaurarla, vuelve a ponerla en su sitio.
- **Copia en Excel:** botón **⬇ Excel (CSV)** del panel, en cualquier momento. Recomendado al terminar el evento.
- Si descargas una **versión nueva** del sistema, copia tu carpeta `data` (y tu `configuracion.txt`) a la versión nueva para conservar los registros.

---

## 8. Publicarlo en internet

En tu computadora solo funciona para ti. Para que los trabajadores se registren desde su celular hay que publicarlo. Recomendado: **Railway** (guarda los datos de forma permanente; tiene periodo de prueba y luego un costo mensual bajo, revisa precios actuales en su web).

1. Entra en **https://railway.com** e inicia sesión con tu cuenta de **GitHub**.
2. **New Project → Deploy from GitHub repo →** elige **`Cfbonilla/Cfbonilla`**.
3. Abre el servicio creado → pestaña **Settings**:
   - **Source → Branch:** `Christmas-Entry-System` (o `main` si ya unificaste la rama).
   - **Root Directory:** `evento-entradas`
4. Pestaña **Variables** → agrega:
   | Variable | Valor |
   |----------|-------|
   | `ADMIN_TOKEN` | una contraseña segura inventada por ti |
   | `EVENT_NAME` | `Navidad Paraíso 2026` |
   | `DB_FILE` | `/data/evento.db` |
5. Clic derecho sobre el servicio → **Attach Volume** → **Mount path:** `/data`. (Sin esto, los registros se borrarían al reiniciar).
6. **Settings → Networking → Generate Domain**. Obtendrás un enlace como `https://navidad-paraiso.up.railway.app`.
7. Prueba: regístrate desde tu celular y valida con otro celular en `https://…/admin.html`.

Luego comparte el enlace por WhatsApp/correo, o conviértelo en un QR para un afiche.

---

## 9. Personalizar colores y textos

- **Nombre del evento:** `configuracion.txt` → `EVENT_NAME`.
- **Título "Registro de entrada a eventos":** está en `public/index.html`, `public/ticket.html` y `public/admin.html` (busca `<h1>`).
- **Colores de la empresa:** al inicio de `public/styles.css`:
  ```css
  --red: #af1831;     /* encabezado, botones, detalles */
  --gray: #54565a;    /* textos secundarios; tarjetas en modo oscuro */
  --white: #ffffff;   /* fondo en modo claro */
  --black: #000000;   /* bordes, textos; fondo en modo oscuro */
  ```
  Debajo hay dos bloques, **Tema claro** y **Tema oscuro**, que deciden dónde se usa cada color.
  Los únicos colores fuera de la paleta son el verde y el amarillo de los mensajes de validación (acceso permitido / entrada ya usada), para que en la puerta se distingan de un vistazo.
- **Personajes navideños:** son dibujos de texto en `tools/generar-sprites.js` (cada letra es un color, `.` es transparente). Puedes cambiar los colores de la ropa, añadir personas o elefantes, y después ejecutar:
  ```bash
  node tools/generar-sprites.js
  ```
  Para cambiar qué personajes aparecen en cada página, edita el bloque `<div class="scene">` de `index.html`, `ticket.html` o `admin.html`.
- **Nieve:** si prefieres que no caiga nieve, borra `<div class="snow" …></div>` del encabezado de cada página. (Se desactiva sola si el dispositivo tiene activado "reducir movimiento").
- **Después de Navidad:** quita la escena (`lights`, `scene`, `ground`) y la nieve para un look neutro.
- **Estados civiles:** `server.js` → `MARITAL_STATUSES`.
- **Fuentes pixel:** "Press Start 2P" y "VT323" de Google Fonts (necesitan internet; sin internet se usa una fuente monoespaciada).

Después de cualquier cambio, apaga y vuelve a encender (`npm start`) y recarga el navegador.

---

## 10. Problemas frecuentes

| Problema | Solución |
|----------|----------|
| `"npm" no se reconoce como un comando` | Node.js no está instalado o falta reiniciar. Reinstala desde nodejs.org y reinicia la PC. |
| `npm ERR! enoent ... package.json` | La terminal no está en la carpeta `evento-entradas`. Repite el paso 3. |
| `EADDRINUSE` / puerto en uso | El sistema ya está encendido en otra ventana. Ciérrala, o cambia `PORT=3001` en `configuracion.txt`. |
| `node:sqlite` no encontrado | Tu Node.js es antiguo. Instala la versión LTS actual. |
| La página no carga | La ventana negra debe seguir abierta. Revisa que la dirección sea `http://localhost:3000`. |
| "Contraseña incorrecta" en el panel | Si no fijaste `ADMIN_TOKEN`, la contraseña cambia en cada encendido: cópiala de la ventana negra. |
| La cámara no abre | Necesita `https://` o `localhost`, y permiso de cámara en el navegador. Usa la validación manual. |
| "Esta cédula ya está registrada" | Esa persona ya tiene entrada. Búscala en el panel por cédula para darle su código. |
| Se ven letras normales en vez de pixel | Las fuentes se descargan de internet; revisa la conexión. |

---

## 11. Información técnica

- **Tecnología:** Node.js + Express, SQLite integrado (`node:sqlite`), QR generado en el servidor (`qrcode`), lector QR en el navegador (`html5-qrcode`).
- **Códigos:** formato `EVT-XXXXX-XXXXX`, aleatorios criptográficamente (≈49 bits), sin caracteres ambiguos (`0/O`, `1/I/L`), con restricción `UNIQUE` y reintento ante colisión.
- **Duplicados:** la cédula se normaliza (sin puntos, guiones ni espacios) y es única.
- **Check-in atómico:** un `UPDATE … WHERE checked_in_at IS NULL` garantiza que un QR se acepte una sola vez.
- **Seguridad:** panel protegido por token (comparación en tiempo constante); el CSV neutraliza fórmulas de Excel; el borrado exige la palabra `BORRAR`.
- **Pruebas:** `npm test`

### Variables de entorno
Se leen de `configuracion.txt`; las variables del sistema (p. ej. en Railway) tienen prioridad.

| Variable | Por defecto | Uso |
|----------|-------------|-----|
| `EVENT_NAME` | `Navidad Paraíso 2026` | Nombre del evento |
| `ADMIN_TOKEN` | aleatorio (se muestra al iniciar) | Contraseña del panel |
| `MAX_COMPANIONS` | `5` | Máximo de acompañantes |
| `PORT` | `3000` | Puerto HTTP |
| `DB_FILE` | `data/evento.db` | Archivo de la base de datos |

### API
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/config` | — | Nombre del evento y opciones del formulario |
| POST | `/api/register` | — | Registra y devuelve el código |
| GET | `/api/tickets/:code` | — | Datos públicos de la entrada (cédula enmascarada) |
| GET | `/api/tickets/:code/qr.png` | — | Imagen QR |
| POST | `/api/checkin` | `x-admin-token` | Valida `{ code, staff }` |
| GET | `/api/attendees` | `x-admin-token` | Lista + estadísticas |
| GET | `/api/attendees.csv` | `x-admin-token` | Exporta a Excel |
| POST | `/api/reset` | `x-admin-token` | Borra todo. Requiere `{ "confirm": "BORRAR" }` |
