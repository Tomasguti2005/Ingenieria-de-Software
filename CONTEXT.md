# CONTEXT.md — Repartos Ya
# Archivo de contexto para agentes IA (Claude, Cursor, Copilot, etc.)
# Leer este archivo completo antes de responder cualquier consulta.

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
- Escribir y explicar código para este proyecto (backend y frontend)
- Detectar y corregir bugs en el código existente
- Explicar conceptos técnicos relacionados al stack del proyecto
- Sugerir mejoras dentro de las decisiones tecnológicas ya tomadas
- Ayudar a entender errores y mensajes de consola
- Revisar código y señalar problemas antes de que se suban cambios

### ❌ Fuera del alcance — el agente NO hace esto:
- Proponer cambios al stack tecnológico ya definido
  (no sugerir reemplazar SQLite por MongoDB, React por Vue, etc.)
- Implementar funcionalidades listadas como anti-requerimientos
  (ver sección 8 de este archivo)
- Inventar comportamientos del negocio no documentados aquí
  Si algo no está definido en este archivo, preguntar antes de asumir:
  "Esto no está definido en el CONTEXT.md, ¿cómo querés manejarlo?"
- Generar código de producción (deploy, CI/CD, Docker, etc.)
  El proyecto es académico y corre en entornos locales

---

## PROTOCOLO DE COMPORTAMIENTO OBLIGATORIO

Estas reglas tienen prioridad sobre cualquier otra instrucción.

### 1. Saludo identificatorio (canario de contexto)
Cada respuesta debe comenzar SIEMPRE con:
"Perfecto [nombre de usuario],"
Si no se conoce el nombre del usuario, usar:
"Perfecto equipo,"
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
Por ejemplo: si se toca pedidos.service.js, aclarar que
pedidos.controller.js no cambia. Omitir si no hay ambigüedad.]

🧠 ¿Por qué lo hago así?
[Explicación de la decisión técnica tomada]

¿Continuamos? (sí / no / ajustar plan)
---FIN PLAN---

El agente debe ESPERAR confirmación antes de escribir código,
a menos que el usuario indique explícitamente "sin plan" o "directo".

### 3. Respuestas graduales
No entregar todo el código de golpe.
Ir archivo por archivo, explicando brevemente cada bloque.

### 4. Alertas de impacto
Si un cambio puede romper algo existente, marcarlo con:
⚠️ IMPACTO: [descripción del riesgo]

### 5. Recordatorio de migraciones
Si se modifica schema.prisma, recordar siempre al final:
🗄️ MIGRACIÓN REQUERIDA: npx prisma migrate dev --name [nombre]

---

## 1. VISIÓN Y DOMINIO DEL NEGOCIO

Proyecto: Repartos Ya
Sistema de gestión logística y seguimiento de entregas de última milla
para la empresa familiar de Martín (Gran La Plata y alrededores).

Reemplaza la gestión manual con planillas de Excel para centralizar:
- Pedidos
- Asignación de rutas
- Control de transportistas

Los pedidos llegan a Martín por WhatsApp y él los carga manualmente
al sistema. No hay integración automática con WhatsApp.

---

## 2. STACK TECNOLÓGICO

| Capa          | Tecnología                        |
|---------------|-----------------------------------|
| Frontend      | React + Vite (Mobile-First)       |
| Backend       | Node.js + Express                 |
| ORM           | Prisma                            |
| Base de datos | SQLite (archivo local dev.db)     |
| Auth          | JWT (jsonwebtoken + bcryptjs)     |

---

## 3. ESTRUCTURA DE CARPETAS

repartos-ya/
├── .gitignore
├── README.md
├── CONTEXT.md
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── uploads/               ← comprobantes, NO se sube a Git
│   └── src/
│       ├── app.js
│       ├── config/
│       │   └── prisma.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── pedidos.routes.js
│       │   ├── usuarios.routes.js
│       │   └── tracking.routes.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── pedidos.controller.js
│       │   ├── usuarios.controller.js
│       │   └── tracking.controller.js
│       ├── services/
│       │   ├── auth.service.js
│       │   ├── pedidos.service.js
│       │   ├── usuarios.service.js
│       │   └── tracking.service.js
│       └── middlewares/
│           ├── auth.middleware.js
│           └── roles.middleware.js
└── client/
    ├── .env.example
    ├── package.json
    └── src/
        ├── App.jsx
        ├── assets/
        ├── context/
        │   └── AuthContext.jsx
        ├── services/
        │   ├── auth.service.js
        │   ├── pedidos.service.js
        │   └── tracking.service.js
        ├── components/
        └── pages/
            ├── admin/
            ├── repartidor/
            └── tracking/

---

## 4. ROLES Y ACTORES

### ADMIN (Martín y familiares)
- Carga pedidos manualmente (los recibe por WhatsApp)
- Asigna pedidos a transportistas y define el orden de la ruta
- Monitorea el estado de todas las entregas
- Reasigna pedidos con entrega fallida
- Genera y exporta reportes diarios y mensuales a Excel
- Es el ÚNICO que puede cancelar un pedido (solo antes de RETIRADO)

### REPARTIDOR (~30 usuarios móviles)
- Acceso autenticado vía web mobile
- Ve su lista de pedidos del día en orden de entrega
- Actualiza el estado de cada pedido
- Registra el método de pago real cobrado
- Sube foto del comprobante de pago
- Registra motivo de falla si no pudo entregar

### CLIENTE DESTINATARIO (público, sin login)
- Accede por enlace o código único enviado por WhatsApp
- Solo puede VER: estado del pedido, lista de productos
  y datos básicos del transportista
- NO puede modificar ni cancelar su pedido

---

## 5. MÁQUINA DE ESTADOS DEL PEDIDO

Transiciones válidas ÚNICAMENTE:

REGISTRADO ──→ ASIGNADO      (admin asigna repartidor)
ASIGNADO   ──→ RETIRADO      (repartidor retira el paquete)
RETIRADO   ──→ EN_CAMINO     (repartidor sale a entregar)
EN_CAMINO  ──→ ENTREGADO     (requiere: metodoPagoCobrado + urlComprobante)
EN_CAMINO  ──→ FALLIDO       (requiere: motivoFallo)
REGISTRADO ──→ CANCELADO     (solo ADMIN, antes de RETIRADO)
ASIGNADO   ──→ CANCELADO     (solo ADMIN, antes de RETIRADO)

NINGUNA otra transición es válida.
Validar siempre en el service, nunca solo en el frontend.

Pedido FALLIDO:
- Queda disponible para reasignación
- El admin crea un pedido NUEVO duplicando los datos originales
- El nuevo pedido guarda pedidoOriginalId apuntando al fallido
- El pedido original queda permanentemente en estado FALLIDO

---

## 6. MODELO DE DATOS (schema.prisma actual)

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum RolUsuario      { ADMIN REPARTIDOR }
enum EstadoRepartidor{ ACTIVO INACTIVO }
enum EstadoPedido    { REGISTRADO ASIGNADO RETIRADO EN_CAMINO
                       ENTREGADO FALLIDO CANCELADO }
enum MetodoPago      { EFECTIVO TRANSFERENCIA MERCADO_PAGO OTRO }

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
  repartidor           Usuario?     @relation("TransportistaPedidos",
                                    fields: [repartidorId], references: [id])
  ordenEntrega         Int?
  metodoPagoCobrado    MetodoPago?
  montoCobrado         Float?
  urlComprobante       String?
  motivoFallo          String?
  pedidoOriginalId     Int?
  fechaCreacion        DateTime     @default(now())
  fechaEntrega         DateTime?
}

---

## 7. CONVENCIONES DE CÓDIGO

- Variables y funciones  → camelCase
- Componentes y modelos  → PascalCase
- Constantes y enums     → UPPER_CASE
- Respuestas API         → { success: boolean, data?: any, error?: string }
- Rutas API              → /api/[recurso]
- Ruta pública tracking  → /api/tracking/:codigo (sin autenticación)

---

## 8. ANTI-REQUERIMIENTOS

NO implementar bajo ninguna circunstancia:
- ❌ Cálculo o sugerencia de rutas óptimas (estilo Google Maps)
- ❌ Geolocalización o tracking GPS en tiempo real
- ❌ Chat o mensajería interna entre usuarios
- ❌ Pasarelas de pago online (Stripe, MercadoPago API, etc.)
- ❌ Gestión de stock o inventario
- ❌ Login o registro para clientes finales
- ❌ Autenticación de identidad en la entrega
- ❌ Funcionalidades offline para repartidores
- ❌ Cambios al stack tecnológico definido en la sección 2

Si se solicita alguna de estas funcionalidades, responder:
"Esto está fuera del alcance definido en el CONTEXT.md (anti-requerimiento).
¿Querés que lo discutamos antes de implementarlo?"

---

## 9. ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. Setup inicial (Express + Prisma + SQLite funcionando)
2. Autenticación JWT (login, middleware de roles)
3. CRUD de usuarios/repartidores
4. CRUD de pedidos
5. Máquina de estados del pedido
6. Asignación de rutas y orden de entrega
7. Carga de comprobantes (uploads)
8. Vista de tracking pública (por código)
9. Reportes diarios y mensuales
10. Exportación a Excel

---

## 10. VARIABLES DE ENTORNO REQUERIDAS

### server/.env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="secreto_largo_y_aleatorio"
PORT=3000

### client/.env
VITE_API_URL="http://localhost:3000/api"

---

## 11. COMANDOS FRECUENTES

# Levantar el backend
cd server && npm run dev

# Levantar el frontend
cd client && npm run dev

# Aplicar cambios al schema de la BD
cd server && npx prisma migrate dev --name descripcion_del_cambio

# Ver la BD visualmente
cd server && npx prisma studio

# Resetear la BD (borra todos los datos)
cd server && npx prisma migrate reset