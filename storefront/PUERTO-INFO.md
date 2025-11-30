# 🛍️ E-commerce Storefront

Storefront moderna para clientes que se conecta al panel de administrador.

## 🚀 Puertos de la Aplicación

- **Admin Panel**: http://localhost:3000 (React)
- **Storefront**: http://localhost:3001 (Next.js) ← **Esta aplicación**
- **Backend API**: http://localhost:4000 (NestJS)

## 📱 Inicio Rápido

1. **Asegúrate que el backend esté corriendo:**
   ```bash
   cd ../mock/backend
   npm run start:dev
   ```
   ✅ Backend disponible en: http://localhost:4000

2. **Inicia la storefront:**
   ```bash
   npm run dev
   ```
   🛍️ Storefront disponible en: http://localhost:3001

3. **El admin panel debe estar corriendo en:**
   ```bash
   cd ../
   npm start
   ```
   ⚙️ Admin disponible en: http://localhost:3000

## 🔧 Configuración de Puertos

### Desarrollo:
- `npm run dev` → Puerto 3001
- `npm run start` → Puerto 3001 (producción)

### Variables de Entorno:
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
PORT=3001
```

## 🌐 Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Storefront    │    │   Backend API   │
│   (React)       │    │   (Next.js)     │    │   (NestJS)      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 4000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   PostgreSQL DB   │
                       │   Port: 5433      │
                       └───────────────────┘
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo (puerto 3001)
npm run dev

# Construcción para producción
npm run build

# Inicio en producción (puerto 3001)
npm run start

# Linting
npm run lint
```

## 🔗 Enlaces Importantes

### Durante el desarrollo:
- **👥 Clientes**: http://localhost:3001 (Storefront)
- **👨‍💼 Administradores**: http://localhost:3000 (Admin Panel)
- **🔧 API Docs**: http://localhost:4000/api/docs (Swagger)

### Funcionalidades:
- ✅ Catálogo de productos sincronizado con admin
- ✅ Carrito de compras funcional
- ✅ Búsqueda y filtros avanzados
- ✅ Diseño responsive
- 🔄 Autenticación de clientes (en desarrollo)
- 🔄 Proceso de checkout (en desarrollo)

¡La storefront está configurada para correr en el puerto 3001 sin conflictos! 🎉