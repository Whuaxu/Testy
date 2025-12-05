# Chat Application

Aplicación de chat en tiempo real entre usuarios con intercambio de mensajes centralizado en servidor.

## Tecnologías

- **Backend**: LoopBack 4 (Node.js)
- **Frontend**: Angular 19
- **Base de datos**: MongoDB
- **Cache**: Redis
- **Tiempo real**: WebSockets (Socket.io)
- **Contenedores**: Docker & Docker Compose

## Características

- ✅ Autenticación de usuarios con JWT
- ✅ Registro e inicio de sesión
- ✅ Persistencia de mensajes en MongoDB
- ✅ Recuperación de mensajes al entrar en una conversación
- ✅ Lista de conversaciones existentes
- ✅ Mensajes en tiempo real con WebSockets
- ✅ Indicador de estado online/offline
- ✅ Indicador de escritura
- ✅ Backend y frontend dockerizados

## Estructura del Proyecto

```
├── chat-backend/          # API Backend (LoopBack 4)
│   ├── src/
│   │   ├── controllers/   # Controladores REST
│   │   ├── models/        # Modelos de datos
│   │   ├── repositories/  # Repositorios
│   │   ├── services/      # Servicios (Auth, JWT)
│   │   ├── websocket/     # Servidor WebSocket
│   │   └── datasources/   # Conexiones a BD
│   └── Dockerfile
├── chat-frontend/         # Frontend (Angular)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Componentes
│   │   │   ├── services/    # Servicios
│   │   │   ├── guards/      # Guards de rutas
│   │   │   └── models/      # Interfaces
│   │   └── environments/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml     # Orquestación de contenedores
└── README.md
```

## Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 18+ (para desarrollo local)

## Instalación y Ejecución

### Con Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <repository-url>
cd <repository-name>

# Construir e iniciar todos los servicios
docker-compose up --build

# La aplicación estará disponible en:
# - Frontend: http://localhost
# - Backend API: http://localhost:3000
# - WebSocket: ws://localhost:3001
# - API Explorer: http://localhost:3000/explorer
```

### Desarrollo Local

#### Backend

```bash
cd chat-backend
npm install
npm run build
npm start
```

#### Frontend

```bash
cd chat-frontend
npm install
npm start
```

## API Endpoints

### Autenticación
- `POST /users/register` - Registrar nuevo usuario
- `POST /users/login` - Iniciar sesión
- `GET /users/me` - Obtener usuario actual

### Usuarios
- `GET /users` - Listar usuarios (requiere autenticación)
- `GET /users/{id}` - Obtener usuario por ID

### Conversaciones
- `GET /conversations` - Listar conversaciones del usuario
- `POST /conversations` - Crear/obtener conversación
- `GET /conversations/{id}` - Obtener conversación
- `GET /conversations/{id}/messages` - Obtener mensajes de conversación

### Mensajes
- `POST /messages` - Enviar mensaje
- `GET /messages/{id}` - Obtener mensaje
- `POST /messages/{id}/read` - Marcar mensaje como leído

## WebSocket Events

### Cliente → Servidor
- `join-conversation` - Unirse a una sala de conversación
- `leave-conversation` - Salir de una sala de conversación
- `send-message` - Enviar mensaje
- `typing` - Indicador de escritura
- `message-read` - Marcar mensaje como leído

### Servidor → Cliente
- `online-users` - Lista de usuarios conectados
- `user-online` - Usuario se conectó
- `user-offline` - Usuario se desconectó
- `new-message` - Nuevo mensaje recibido
- `message-notification` - Notificación de mensaje
- `user-typing` - Usuario escribiendo
- `message-status-update` - Actualización de estado de mensaje

## Variables de Entorno

### Backend
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servidor REST | 3000 |
| WS_PORT | Puerto del servidor WebSocket | 3001 |
| HOST | Host del servidor | 0.0.0.0 |
| MONGODB_URL | URL de MongoDB | mongodb://localhost:27017/chatdb |
| REDIS_URL | URL de Redis | redis://localhost:6379 |
| JWT_SECRET | Secreto para JWT | (cambiar en producción) |
| JWT_EXPIRES_IN | Expiración del token (segundos) | 86400 |
| CORS_ORIGIN | Origen CORS permitido | * |

## Licencia

MIT