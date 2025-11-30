# NestJS Backend for E-commerce Admin Panel

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	- Project: NestJS backend with TypeScript
	- Modules: auth (JWT), products, inventory, sales, customers, store config
	- Database: PostgreSQL with Prisma ORM
	- API Docs: Swagger/OpenAPI
	- Features: CORS, validation, environment config

- [x] Scaffold the Project
	- Initialized NestJS project structure
	- Setup Prisma with PostgreSQL schema
	- Created all modules (auth, products, inventory, sales, customers, store)

- [x] Customize the Project
	- Implemented auth module with JWT
	- Created CRUD endpoints for products, inventory, sales, customers
	- Setup store configuration endpoints
	- Added DTOs and validation
	- Configured Swagger documentation at /api/docs

- [x] Install Required Extensions
	- No extensions required (standard Node.js/TypeScript project)

- [ ] Compile the Project
	- Run: npm install
	- Run: npx prisma generate
	- Run: npx prisma migrate dev
	- Run: npx prisma db seed

- [ ] Create and Run Task
	- Development: npm run start:dev
	- Production build: npm run build
	- Production start: npm run start:prod
	- Or use Docker: docker-compose up -d

- [ ] Launch the Project
	- Server runs on http://localhost:4000
	- Swagger docs at http://localhost:4000/api/docs
	- Default login: admin@tienda.com / admin123

- [x] Ensure Documentation is Complete
	- README.md includes full setup, deployment, and connection guide
	- All API endpoints documented in Swagger
