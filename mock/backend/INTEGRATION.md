# Conectar el Admin Frontend con el Backend Real

Este documento explica cómo migrar del mock server (json-server) al backend NestJS real.

## Arquitectura

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│  React Admin Panel  │ ◄─────► │   NestJS Backend     │ ◄─────► │   PostgreSQL    │
│  (puerto 3000)      │  HTTP   │   (puerto 4000)      │  Prisma │   (puerto 5432) │
└─────────────────────┘         └──────────────────────┘         └─────────────────┘
```

## Pasos de migración

### 1. Asegurar que el backend esté corriendo

Opción A - Docker (recomendado):
```powershell
cd c:\Users\Alex\Desktop\administrador-backend
docker-compose up -d
```

Opción B - Local:
```powershell
cd c:\Users\Alex\Desktop\administrador-backend
npm run start:dev
```

Verifica que esté funcionando:
- http://localhost:4000/api/docs (Swagger debe cargar)

### 2. Actualizar configuración del frontend

Edita `c:\Users\Alex\Desktop\administrador\.env.local`:

```env
# Cambiar de json-server a backend real
REACT_APP_API_URL=http://localhost:4000

# Credenciales admin (opcional, para fallback)
REACT_APP_ADMIN_EMAIL=admin@tienda.com
REACT_APP_ADMIN_PASSWORD=admin123
```

### 3. Detener json-server

Si tienes el mock server corriendo, detén el proceso:
- Ctrl+C en la terminal donde corre `npm run mock:server`

### 4. Iniciar el frontend

```powershell
cd c:\Users\Alex\Desktop\administrador
npm start
```

### 5. Login

- URL: http://localhost:3000/login
- Email: admin@tienda.com
- Password: admin123

## Diferencias clave

| Aspecto | Mock (json-server) | Backend Real (NestJS) |
|---------|-------------------|----------------------|
| Puerto | 4000 | 4000 |
| Base de datos | JSON file | PostgreSQL |
| Auth | Simulado en frontend | JWT con tokens reales |
| Validación | Solo frontend | Frontend + Backend |
| Persistencia | Archivo `mock/db.json` | Base de datos PostgreSQL |
| Migraciones | Manual | Prisma migrations |
| Docs | N/A | Swagger en /api/docs |

## Endpoints compatibles

El backend mantiene **100% compatibilidad** con los endpoints que el frontend ya usa:

### Auth
- `POST /auth/login` → Devuelve `{ token, user }`

### Products
- `GET /products` → Lista todos
- `GET /products/:id` → Por ID
- `POST /products` → Crear
- `PUT /products/:id` → Actualizar
- `DELETE /products/:id` → Eliminar

### Inventory
- `GET /inventory` → Lista todo
- `GET /inventory?productId=X` → Por producto
- `PUT /inventory/:id` → Actualizar stock
- `PATCH /inventory/:id/movement` → Registrar movimiento

### Sales
- `GET /sales` → Lista todos
- `GET /sales/:id` → Por ID
- `POST /sales` → Crear
- `PATCH /sales/:id` → Actualizar (parcial)
- `DELETE /sales/:id` → Eliminar

### Customers
- `GET /customers` → Lista todos
- `GET /customers/:id` → Por ID
- `POST /customers` → Crear
- `PUT /customers/:id` → Actualizar
- `DELETE /customers/:id` → Eliminar

### Store Config
- `GET /storeGeneral`, `PUT /storeGeneral`
- `GET /storeSocial`, `PUT /storeSocial`
- `GET /storeSchedule`, `PUT /storeSchedule`
- `GET /storePayment`, `PUT /storePayment`
- `GET /storeShipping`, `PUT /storeShipping`
- `GET /storeTheme`, `PUT /storeTheme`
- `GET /storeLogo`, `PUT /storeLogo`
- `GET /storeFavicon`, `PUT /storeFavicon`

## Cambios NO necesarios en el frontend

El código del frontend **NO requiere cambios**. El backend implementa exactamente los mismos endpoints con los mismos formatos de respuesta.

Solo necesitas:
1. Cambiar `REACT_APP_API_URL` en `.env.local`
2. Usar el backend en lugar de json-server

## Ventajas del backend real

✅ **Validación robusta** - DTOs con class-validator  
✅ **Autenticación JWT** - Tokens seguros con expiración  
✅ **Base de datos relacional** - PostgreSQL con integridad referencial  
✅ **Migraciones** - Prisma gestiona cambios de schema  
✅ **Documentación automática** - Swagger/OpenAPI  
✅ **Lógica de negocio** - Transacciones, eventos, hooks  
✅ **Escalabilidad** - Deploy en Railway, Render, Fly.io  
✅ **Testing** - E2E, unit tests con Jest  

## Próximos pasos

1. **Añadir autenticación real en frontend**  
   - Guardar token JWT en localStorage
   - Incluir token en headers: `Authorization: Bearer <token>`
   - Manejar refresh tokens

2. **Implementar roles y permisos**  
   - Admin vs. Usuario
   - Guards en backend por rol
   - Deshabilitar acciones en frontend según rol

3. **Subir a producción**  
   - Deploy backend en Railway/Render
   - Deploy frontend en Vercel/Netlify
   - Configurar CORS para dominios de producción
   - Usar PostgreSQL gestionado (Neon, Supabase)

4. **Construir la tienda pública**  
   - Crear frontend de tienda (Next.js o React)
   - Consumir los mismos endpoints (products, categories)
   - Checkout y carrito de compras
   - Integración con pasarelas de pago

## Solución de problemas

**Error "Network Error" en frontend:**
- Verifica que el backend esté corriendo en puerto 4000
- Revisa CORS en `src/main.ts` del backend
- Confirma que `REACT_APP_API_URL` está configurado

**Error 401 Unauthorized:**
- El token JWT expiró o es inválido
- Haz logout y login nuevamente
- Verifica que `JWT_SECRET` no haya cambiado

**Datos no aparecen:**
- Ejecuta el seed: `npx prisma db seed`
- Verifica conexión a PostgreSQL
- Revisa logs del backend

**Puerto 4000 ocupado:**
- json-server puede estar usando el puerto
- Cambia `PORT` en `.env` del backend
- O detén json-server primero
