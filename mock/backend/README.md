

# Backend Administrador (NestJS)

API backend para el Administrador, el sistema de administración de la tienda, construido con NestJS, Prisma y PostgreSQL.

## Funcionalidades principales

- CRUD de productos, inventario y ventas
- Permitir productos sin SKU (SKU opcional)
- Soporte para varias imágenes por producto (`images: string[]`)
- Eliminación de productos con ventas asociadas
- Validaciones y notificaciones de errores
- Autenticación JWT
- Documentación automática Swagger/OpenAPI
- Integración con el Administrador y tienda (storefront)
- Docker y Docker Compose para despliegue fácil

## Stack tecnológico

- **Framework**: NestJS + TypeScript
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT (passport-jwt)
- **API Docs**: Swagger/OpenAPI
- **Contenedores**: Docker + Docker Compose

## Requisitos

- Node.js 18+ (o Docker)
- PostgreSQL 15+ (o usar Docker Compose)
- npm o yarn

## Instalación y uso

Consulta el archivo `SETUP.md` en esta carpeta para instrucciones detalladas de instalación, migraciones y conexión con el frontend y la tienda.

## Notas de integración

- El backend expone endpoints RESTful para el Administrador y la tienda online (storefront).
- El campo `images` en productos permite subir y mostrar varias imágenes.
- El SKU es opcional y puedes eliminar productos aunque tengan ventas asociadas.
- El sistema de autenticación y roles está listo para producción.

## Documentación y pruebas

- Swagger docs: http://localhost:4000/api/docs
- Login por defecto: admin@tienda.com / admin123

---

Para detalles avanzados, solución de problemas y despliegue, consulta `SETUP.md`.
npx prisma migrate dev
npx prisma db seed
```

4. Start the development server:

```powershell
npm run start:dev
```

### Option 2: Docker Compose (Recommended)

Start PostgreSQL and the backend together:

```powershell
docker-compose up -d
```

This will:
- Create a PostgreSQL container
- Run database migrations
- Seed initial data from `mock/db.json`
- Start the NestJS server on port 4000

## Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (DB GUI)
- `npm run prisma:seed` - Seed database with initial data
- `npm test` - Run tests

## API Documentation

Once the server is running, access Swagger UI at:

**http://localhost:4000/api/docs**

## API Endpoints

### Authentication

- `POST /auth/login` - Admin login

### Products

- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product

### Inventory

- `GET /inventory` - List all inventory
- `GET /inventory?productId=X` - Get inventory by product ID
- `PUT /inventory/:id` - Update stock
- `PATCH /inventory/:id/movement` - Register stock movement

### Sales

- `GET /sales` - List all sales
- `GET /sales/:id` - Get sale by ID
- `POST /sales` - Create new sale
- `PATCH /sales/:id` - Update sale (partial)
- `DELETE /sales/:id` - Delete sale

### Customers

- `GET /customers` - List all customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

### Store Configuration

- `GET /storeGeneral` - Get store general info
- `PUT /storeGeneral` - Update store general info
- `GET /storeSocial` - Get store social links
- `PUT /storeSocial` - Update store social links
- `GET /storeSchedule` - Get store schedule
- `PUT /storeSchedule` - Update store schedule
- `GET /storePayment` - Get payment methods
- `PUT /storePayment` - Update payment methods
- `GET /storeShipping` - Get shipping info
- `PUT /storeShipping` - Update shipping info
- `GET /storeTheme` - Get theme colors
- `PUT /storeTheme` - Update theme colors
- `GET /storeLogo` - Get store logo
- `PUT /storeLogo` - Update store logo
- `GET /storeFavicon` - Get store favicon
- `PUT /storeFavicon` - Update store favicon

## Connecting the Frontend Admin

In your frontend admin project (`administrador`), update `.env.local`:

```env
REACT_APP_API_URL=http://localhost:4000
```

The backend endpoints match exactly what the frontend expects from `json-server`, so you can switch seamlessly:

- Stop `json-server` (mock server)
- Start this NestJS backend
- Frontend will work without code changes

## Database Schema

The Prisma schema includes:

- **Admin** - Admin users with hashed passwords
- **Product** - Products catalog
- **Inventory** - Stock management with movements/history
- **Sale** - Orders/sales with items and attachments
- **Customer** - Customer information
- **Category** - Product categories
- **StoreGeneral, StoreSocial, StoreSchedule, etc.** - Store configuration

## Seeding Data

The seed script (`prisma/seed.ts`) imports data from the frontend `mock/db.json`:

- Admin user: `admin@tienda.com` / `admin123`
- Sample products, customers, sales
- Store configuration defaults

Run seed anytime:

```powershell
npx prisma db seed
```

## Migration to Another Machine

1. Clone this repository
2. Install Node.js 18+ and PostgreSQL 15+ (or use Docker)
3. Copy `.env.example` to `.env` and configure DATABASE_URL
4. Run:

```powershell
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:prod
```

Or use Docker:

```powershell
docker-compose up -d
```

## Production Deployment

### Environment Variables

Set these in production:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="<strong-random-secret>"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=production
CORS_ORIGINS="https://yourdomain.com,https://admin.yourdomain.com"
```

### Deploy Platforms

**Railway / Render / Fly.io:**

1. Add PostgreSQL service (Railway Postgres, Render PostgreSQL, etc.)
2. Set environment variables
3. Deploy from GitHub or Docker
4. Run migrations: `npx prisma migrate deploy`
5. Seed: `npx prisma db seed`

**Vercel / Netlify (serverless):**

Use a managed PostgreSQL (Neon, Supabase, PlanetScale) and deploy as a serverless function (requires adapter).

## Project Structure

```
administrador-backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Initial data seeder
├── src/
│   ├── auth/               # Authentication module
│   ├── products/           # Products CRUD
│   ├── inventory/          # Inventory management
│   ├── sales/              # Sales/orders
│   ├── customers/          # Customer management
│   ├── store/              # Store configuration
│   ├── prisma/             # Prisma service (global)
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── .env.example            # Environment template
├── docker-compose.yml      # Docker setup
├── Dockerfile              # Container image
├── package.json
└── README.md
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days (configurable)
- All endpoints except `/auth/login` require Bearer token
- CORS restricted to configured origins
- Input validation on all DTOs

## Troubleshooting

**Dependencies not found during compilation:**

The TypeScript errors you see before running `npm install` are expected. Install dependencies first:

```powershell
npm install
npx prisma generate
```

**Database connection error:**

Check your `DATABASE_URL` in `.env`. Ensure PostgreSQL is running and accessible.

**Port already in use:**

Change `PORT` in `.env` or stop the conflicting process (e.g., `json-server`).

**Seed fails:**

Reset the database:

```powershell
npx prisma migrate reset
npx prisma db seed
```

## License

MIT

## Support

For questions or issues, check the API documentation at `http://localhost:4000/api/docs` or review the Swagger schemas.
