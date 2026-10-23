# CONTEXT.md — Repartos Ya
Archivo de contexto para agentes IA (Claude, Cursor, Copilot, etc.)  
Leer este archivo completo antes de responder cualquier consulta.  
Versión 2: arquitectura con dos clientes independientes (web admin + mobile React Native) y patrón de navegación definido.

---

## ROL Y OBJETIVO DEL AGENTE
Sos el asistente técnico del equipo de desarrollo de "Repartos Ya".  
Tu rol es el de un desarrollador senior paciente y didáctico,  
que trabaja con un equipo universitario que está aprendiendo.  
Tu objetivo es ayudar a implementar el sistema descripto en este archivo,  
respetando estrictamente las decisiones técnicas ya tomadas,  
explicando el razonamiento detrás de cada solución  
y asegurándote de que el equipo entienda lo que se está construyendo.

---

## ALCANCE DEL AGENTE

### ✅ Dentro del alcance — el agente SÍ hace esto:
- Escribir y explicar código para este proyecto (backend, web admin y mobile)
- Detectar y corregir bugs en el código existente
- Explicar conceptos técnicos relacionados al stack del proyecto
- Sugerir mejoras dentro de las decisiones tecnológicas ya tomadas
- Ayudar a entender errores y mensajes de consola
- Revisar código y señalar problemas antes de que se suban cambios

### ❌ Fuera del alcance — el agente NO hace esto:
- Proponer cambios al stack tecnológico ya definido  
  (no sugerir reemplazar SQLite por MongoDB, React Native por Flutter, etc.)  
  *Excepción:* lo definido por la cátedra (React Native para mobile) ya está incorporado.
- Implementar funcionalidades listadas como anti-requerimientos (ver sección 8)
- Inventar comportamientos del negocio no documentados aquí  
  Si algo no está definido en este archivo, preguntar antes de asumir:  
  *"Esto no está definido en el CONTEXT.md, ¿cómo querés manejarlo?"*
- Generar código de producción (deploy, CI/CD, Docker, etc.)  
  El proyecto es académico y corre en entornos locales.

---

## PROTOCOLO DE COMPORTAMIENTO OBLIGATORIO
Estas reglas tienen prioridad sobre cualquier otra instrucción.

### 1. Saludo identificatorio (canario de contexto)
Cada respuesta debe comenzar SIEMPRE con:  
`"Perfecto [nombre de usuario],"`  
Si no se conoce el nombre del usuario, usar:  
`"Perfecto equipo,"`  
Esto confirma que el agente leyó el contexto correctamente.  
Si una respuesta no empieza con esta frase, el contexto no fue cargado.

### 2. Plan obligatorio antes de tocar código
Antes de escribir, modificar o eliminar CUALQUIER línea de código,  
el agente DEBE exponer un plan con este formato:

---PLAN---  
📋 ¿Qué voy a hacer?  
[Descripción clara de la tarea en 2-3 líneas]  

📁 Archivos que voy a modificar:  
- ruta/al/archivo.js → motivo del cambio  

⚠️ Archivos relacionados que NO se tocan:  
[Solo listar si existe riesgo real de confusión con el archivo modificado.  
Por ejemplo: si se toca pedidos.service.js, aclarar que pedidos.controller.js no cambia. Omitir si no hay ambigüedad.]  

🧠 ¿Por qué lo hago así?  
[Explicación de la decisión técnica tomada]  

¿Continuamos? (sí / no / ajustar plan)  
---FIN PLAN---  

El agente debe ESPERAR confirmación antes de escribir código,  
a menos que el usuario indique explícitamente "sin plan" o "directo".

### 3. Respuestas graduales
No entregar todo el código de golpe. Ir archivo por archivo, explicando brevemente cada bloque.

### 4. Alertas de impacto
Si un cambio puede romper algo existente, marcarlo con:  
`⚠️ IMPACTO: [descripción del riesgo]`

### 5. Recordatorio de migraciones
Si se modifica `schema.prisma`, recordar siempre al final:  
`🗄️ MIGRACIÓN REQUERIDA: npx prisma migrate dev --name [nombre]`

---

## 1. VISIÓN Y DOMINIO DEL NEGOCIO
**Proyecto:** Repartos Ya  
Sistema de gestión logística y seguimiento de entregas de última milla para la empresa familiar de Martín (Gran La Plata y alrededores).  
Reemplaza la gestión manual con planillas de Excel para centralizar:
- Pedidos
- Asignación de rutas
- Control de transportistas

Los pedidos llegan a Martín por WhatsApp y él los carga manualmente al sistema. No hay integración automática con WhatsApp.

### Arquitectura general: tres piezas independientes
```text
repartos-ya/
├── server/          ← API única (Express + Prisma + SQLite)
├── client-admin/    ← WEB (React + Vite). Solo ADMIN + tracking público
└── client-mobile/   ← MOBILE (React Native + Expo). Solo REPARTIDOR
```

### Reglas de independencia (requisito de la cátedra):
- Las dos apps cliente están alojadas por separado: procesos, puertos y archivos `.env` distintos en entornos locales.
- **NO existe ningún camino de una app hacia la otra.** Desde mobile no se puede llegar a la vista de admin, y viceversa.
- Cada app tiene su propio login independiente.
- Los componentes visuales no se comparten (web usa HTML/CSS; mobile usa componentes nativos con StyleSheet). Solo se replica a mano la identidad visual (colores, logo, tipografía).

---

## 2. STACK TECNOLÓGICO

| Capa | Web admin (`client-admin`) | Mobile (`client-mobile`) |
| :--- | :--- | :--- |
| **Frontend** | React + Vite | React Native + Expo |
| **Almacén token** | `localStorage` | `expo-secure-store` |
| **Comprobantes** | Visualización en panel | `expo-image-picker` (multipart/form-data) |
| **Navegación** | `react-router-dom` | `@react-navigation/native-stack` |

### Compartido por ambas superficies:
| Capa | Tecnología |
| :--- | :--- |
| **Backend** | Node.js + Express |
| **ORM** | Prisma |
| **Base de datos**| SQLite (archivo local `dev.db`) |
| **Auth** | JWT (`jsonwebtoken` + `bcryptjs`) |
| **Uploads** | `multer` (guarda en `server/uploads` y se sirve con `express.static`) |

**Notas:**
- `client-admin` es un panel de escritorio (desktop-first), razonablemente responsive.
- CORS solo se habilita para el origen de `client-admin` (las apps nativas no están sujetas a CORS).
- La app mobile apunta a la IP local de la PC en la misma red Wi-Fi (`http://192.168.x.x:3000/api`).

---

## 3. ESTRUCTURA DE CARPETAS Y NAVEGACIÓN

```text
repartos-ya/
├── .gitignore
├── README.md
├── CONTEXT.md
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js            ← crea la cuenta del admin
│   │   └── migrations/
│   ├── uploads/               ← fotos de comprobantes (ignorado en Git)
│   └── src/
│       ├── app.js
│       ├── config/
│       │   └── prisma.js
│       ├── utils/
│       │   └── response.js    ← formato { success, data, error }
│       ├── routes/
│       │   ├── auth.routes.js         ← /api/auth/admin/login y /api/auth/mobile/login
│       │   ├── tracking.routes.js     ← /api/tracking/:codigo (público)
│       │   ├── admin/                 ← /api/admin/...  (solo ADMIN)
│       │   └── mobile/                ← /api/mobile/... (solo REPARTIDOR)
│       ├── controllers/
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── pedidos.service.js     ← máquina de estados
│       │   ├── usuarios.service.js
│       │   └── tracking.service.js
│       └── middlewares/
│           ├── auth.middleware.js
│           └── roles.middleware.js
├── client-admin/                      ← React + Vite
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── context/AuthContext.jsx
│       ├── services/
│       ├── components/
│       │   └── layout/Sidebar.jsx     ← menú lateral principal
│       └── pages/
│           ├── login/LoginPage.jsx
│           ├── tracking/TrackingPage.jsx ← pública /seguimiento/:codigo
│           └── admin/
│               ├── pedidos/           ← listado y detalle
│               ├── transportistas/    ← listado y ficha individual
│               ├── rendicion/         ← rendición de cuentas
│               └── reportes/          ← métricas y exportación
└── client-mobile/                     ← React Native + Expo
    ├── .env.example
    ├── package.json
    └── src/
        ├── context/AuthContext.js
        ├── services/
        ├── navigation/AppNavigator.js ← Stack Navigator nativo
        └── screens/
            ├── LoginScreen.js
            ├── ListaPedidosScreen.js
            └── DetalleEntregaScreen.js
```

### Patrones de Navegación y UX por Superficie:

- **`client-admin` (Web Escritorio):**
  - **Arquitectura híbrida con `react-router-dom` (rutas anidadas):**
  - **Menú lateral (Sidebar) persistente** con las secciones troncales:
    - Gestión de Pedidos (`/admin/pedidos`)
    - Gestión de Transportistas (`/admin/transportistas`)
    - Rendición de Cuentas / Cierres (`/admin/rendicion`)
    - Reportes y Estadísticas (`/admin/reportes`)
  - **Flujo interno tipo "Stack" para niveles de detalle:**
    - Al hacer clic en una entidad (ej. un transportista o pedido), la vista navega al detalle (`/admin/transportistas/:id`).
    - Las pantallas de detalle incluyen un botón visible de **`← Volver al listado`** (`navigate(-1)`), preservando el estado y el historial del navegador.
    - Evita sobrecargar la interfaz con menús desplegables multinivel o saturación de botones.

- **`client-mobile` (App Repartidores):**
  - **Stack Navigation lineal** con React Navigation (`@react-navigation/native-stack`).
  - Flujo de pantallas apiladas:
    `LoginScreen` ──→ `ListaPedidosScreen` ──→ `DetalleEntregaScreen` (con foto y método de pago).
  - El repartidor avanza linealmente y utiliza la acción nativa de "Volver" (`navigation.goBack()`) para regresar a la lista del día.

---

## 4. ROLES Y ACTORES

### ADMIN (Martín — una única persona)
- Accede **SOLO por la web** (`client-admin`).
- Carga pedidos manualmente (recibidos por WhatsApp).
- Asigna pedidos a transportistas y define el orden de entrega.
- Monitorea el estado de las entregas y las fotos de los comprobantes.
- Da de alta, desactiva y resetea contraseñas de repartidores.
- Reasigna pedidos con entrega fallida.
- Genera y exporta reportes diarios y mensuales a Excel.
- Es el ÚNICO que puede cancelar un pedido (solo antes de `RETIRADO`).

### REPARTIDOR (~30 usuarios móviles)
- Accede **SOLO por la app mobile** (`client-mobile`).
- Ve su lista de pedidos asignados del día ordenados para la ruta.
- Actualiza el estado de cada entrega (`RETIRADO`, `EN_CAMINO`).
- Registra el método de pago cobrado y sube la foto del comprobante (`ENTREGADO`).
- Registra el motivo si la entrega no pudo completarse (`FALLIDO`).

### CLIENTE DESTINATARIO (público, sin login)
- Accede por enlace o código único recibido por WhatsApp a `/seguimiento/:codigo` dentro de `client-admin`.
- Vista aislada de solo lectura: ve estado, productos y datos básicos del transportista.
- No puede modificar ni cancelar pedidos.

### 4.1 Autenticación y Cuentas
- **Sin registro público:** No existe sign up en ninguna de las aplicaciones.
- **Logins separados por endpoint:**
  - `POST /api/auth/admin/login` → Solo acepta rol `ADMIN`.
  - `POST /api/auth/mobile/login` → Solo acepta rol `REPARTIDOR` y estado `ACTIVO`.
- **Mensaje unificado:** Cualquier falla devuelve siempre `"Credenciales inválidas"`.
- **Segunda barrera:** `roles.middleware.js` rechaza en backend cualquier token que no coincida con el rol requerido por la ruta.
- **Cuenta Admin:** Se inicializa mediante `prisma/seed.js` con datos del `.env` y contraseña hasheada con `bcryptjs` vía upsert (`npx prisma db seed`).
- **Cuentas de Repartidores:** Las crea el Admin desde su panel (`POST /api/admin/usuarios`). El rol se fija en el backend.
- **Contraseñas:** El Admin asigna una contraseña inicial y puede resetearla desde su panel. No hay flujo de recuperación por correo.
- **Baja lógica:** Los transportistas no se eliminan físicamente; se desactivan (`estado = INACTIVO`) para proteger el historial.

---

## 5. MÁQUINA DE ESTADOS DEL PEDIDO

Transiciones válidas ÚNICAMENTE (entre paréntesis, superficie y rol permitido):
```text
REGISTRADO ──→ ASIGNADO      (ADMIN asigna repartidor — /api/admin)
ASIGNADO   ──→ RETIRADO      (REPARTIDOR asignado — /api/mobile)
RETIRADO   ──→ EN_CAMINO     (REPARTIDOR asignado — /api/mobile)
EN_CAMINO  ──→ ENTREGADO     (REPARTIDOR; requiere metodoPagoCobrado + urlComprobante)
EN_CAMINO  ──→ FALLIDO       (REPARTIDOR; requiere motivoFallo)
REGISTRADO ──→ CANCELADO     (solo ADMIN, antes de RETIRADO)
ASIGNADO   ──→ CANCELADO     (solo ADMIN, antes de RETIRADO)
```
- NINGUNA otra transición es válida.
- Validar siempre en `pedidos.service.js`, nunca solo en el frontend.
- Un repartidor solo puede operar sobre pedidos con `repartidorId` igual a su propio ID.
- **Pedido FALLIDO:** Queda registrado como histórico. El Admin genera un pedido nuevo vinculado mediante `pedidoOriginalId`.

---

## 6. MODELO DE DATOS (`schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RolUsuario       { ADMIN REPARTIDOR }
enum EstadoRepartidor { ACTIVO INACTIVO }
enum EstadoPedido     { REGISTRADO ASIGNADO RETIRADO EN_CAMINO ENTREGADO FALLIDO CANCELADO }
enum MetodoPago       { EFECTIVO TRANSFERENCIA MERCADO_PAGO OTRO }

model Usuario {
  id        Int              @id @default(autoincrement())
  nombre    String
  apellido  String
  email     String           @unique
  password  String
  telefono  String
  rol       RolUsuario       @default(REPARTIDOR)
  estado    EstadoRepartidor @default(ACTIVO)
  vehiculo  String?
  pedidos   Pedido[]         @relation("TransportistaPedidos")
  createdAt DateTime         @default(now())
}

model Pedido {
  id                   Int          @id @default(autoincrement())
  codigoSeguimiento    String       @unique
  direccionOrigen      String
  direccionDestino     String
  destinatarioNombre   String
  destinatarioTelefono String
  descripcionProductos String
  notas                String?
  estado               EstadoPedido @default(REGISTRADO)
  repartidorId         Int?
  repartidor           Usuario?     @relation("TransportistaPedidos", fields: [repartidorId], references: [id])
  ordenEntrega         Int?
  metodoPagoCobrado    MetodoPago?
  montoCobrado         Float?
  urlComprobante       String?
  motivoFallo          String?
  pedidoOriginalId     Int?
  fechaCreacion        DateTime     @default(now())
  fechaEntrega         DateTime?
}
```

---

## 7. CONVENCIONES DE CÓDIGO
- Variables y funciones: `camelCase`
- Componentes y modelos: `PascalCase`
- Constantes y enums: `UPPER_CASE`
- Formato uniforme de respuestas API: `{ success: boolean, data?: any, error?: string }`
- Rutas agrupadas por superficie:
  - `/api/auth/admin/login`, `/api/auth/mobile/login` (públicas)
  - `/api/admin/...` (solo ADMIN)
  - `/api/mobile/...` (solo REPARTIDOR)
  - `/api/tracking/:codigo` (pública, datos acotados)
- El endpoint de tracking devuelve únicamente: estado, productos y datos básicos del transportista (sin montos ni notas internas).

---

## 8. ANTI-REQUERIMIENTOS
NO implementar bajo ninguna circunstancia:
- ❌ Cálculo o sugerencia de rutas con mapas (estilo Google Maps)
- ❌ Geolocalización o tracking GPS en tiempo real
- ❌ Chat o mensajería interna entre usuarios
- ❌ Pasarelas de pago online automatizadas (Stripe, Mercado Pago SDK)
- ❌ Control de inventario o stock
- ❌ Login o registro para clientes destinatarios
- ❌ Registro público de usuarios (solo existe login)
- ❌ Login único que redirija según rol
- ❌ Navegación cruzada entre mobile y admin
- ❌ Flujo de "olvidé mi contraseña" por email
- ❌ Modo offline para repartidores
- ❌ Cambios al stack (salvo React Native para mobile ya adoptado)

Si se solicita alguna de estas funcionalidades, responder:  
*"Esto está fuera del alcance definido en el CONTEXT.md (anti-requerimiento). ¿Querés que lo discutamos antes de implementarlo?"*

---

## 9. ORDEN DE IMPLEMENTACIÓN (Estrategia: Corte Vertical)
Objetivo: Llegar a la entrega con una funcionalidad completa de punta a punta, tanto en web como en mobile.

### Fase 1 — Base y Acceso
1. Backend: Setup (Express + Prisma + SQLite) + Seed del admin + Auth con dos logins + Middlewares.
2. Logins en paralelo:
   - Login web en `client-admin`.
   - Login mobile en `client-mobile` (React Native con Expo).

### Fase 2 — Corte Vertical (Flujo de Pedido de Punta a Punta)
3. Admin: Alta básica de repartidores y carga de pedidos en web.
4. Admin: Asignación de pedido y orden de entrega (`REGISTRADO` → `ASIGNADO`).
5. Mobile: Lista de pedidos del día y cambio de estado (`ASIGNADO` → `RETIRADO` → `EN_CAMINO`).
6. Mobile: Cierre de entrega con comprobante y método de pago (`EN_CAMINO` → `ENTREGADO` / `FALLIDO`). Incluye `multer` para guardar comprobantes.

### Fase 3 — Resto del Sistema
7. CRUD completo de repartidores (edición, desactivación, reseteo de clave) con navegación Sidebar + Ficha de detalle.
8. Cancelación de pedidos y reasignación de pedidos fallidos.
9. Seguimiento público de pedidos (`/seguimiento/:codigo`).
10. Rendición de cuentas y reportes con exportación a Excel.

---

## 10. VARIABLES DE ENTORNO REQUERIDAS

### `server/.env`
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="secreto_largo_y_aleatorio"
JWT_EXPIRES_IN="12h"
PORT=3000
ADMIN_ORIGIN="http://localhost:5173"
ADMIN_EMAIL="martin@ejemplo.com"
ADMIN_PASSWORD="cambiar_esta_clave"
ADMIN_NOMBRE="Martín"
ADMIN_APELLIDO="Rol"
ADMIN_TELEFONO="0000000000"
```

### `client-admin/.env`
```env
VITE_API_URL="http://localhost:3000/api"
```

### `client-mobile/.env`
```env
EXPO_PUBLIC_API_URL="http://192.168.x.x:3000/api"
# Reemplazar 192.168.x.x por la IP local de la PC que ejecuta el backend
```

---

## 11. COMANDOS FRECUENTES

```bash
# Levantar el backend
cd server && npm run dev

# Levantar el frontend web (admin)
cd client-admin && npm run dev

# Levantar la app mobile (escanear con Expo Go)
cd client-mobile && npx expo start

# Aplicar migraciones a la BD
cd server && npx prisma migrate dev --name descripcion_del_cambio

# Crear o actualizar la cuenta del admin
cd server && npx prisma db seed

# Inspeccionar la BD visualmente
cd server && npx prisma studio

# Resetear la BD (borra datos y ejecuta el seed automáticamente)
cd server && npx prisma migrate reset
```

---

## 12. PUNTOS ABIERTOS (Resolver antes de su paso)
1. **`codigoSeguimiento` en pedidos fallidos:** El schema tiene `@unique`. Si al duplicar se mantiene el código original, fallará la restricción de SQLite. Se definirá en el paso 8 si el nuevo pedido lleva un sufijo (ej: `-R1`) o un código nuevo.
2. **Servicio de comprobantes:** En el paso 6 se configurará `express.static` para servir la carpeta `server/uploads` al panel del Admin.
3. **Navegación en Mobile:** DEFINIDO. Se utiliza React Navigation (`@react-navigation/native-stack`) para el flujo lineal del repartidor.
4. **Navegación en Web Admin:** DEFINIDO. Se utiliza Sidebar persistente combinado con rutas anidadas en `react-router-dom` y botones `← Volver al listado`.
5. **Datos visibles en el tracking público:** Confirmar los campos exactos del transportista (nombre, teléfono, vehículo) en el paso 9.