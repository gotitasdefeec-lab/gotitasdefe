yarn dev
pnpm dev
bun dev

# Storefront - Tienda Online (Next.js)

Frontend público de la tienda online, conectado al backend y Administrador (admin).

## Funcionalidades clave

- Catálogo de productos con imágenes múltiples
- Galería de producto con lightbox (zoom y navegación)
- SEO básico (meta tags, Open Graph, Twitter Card, canonical)
- Búsqueda y filtrado por categoría
- Carrito de compras y notificaciones visuales

## Requisitos

- Backend corriendo en http://localhost:4000 (ver instrucciones en `mock/backend/SETUP.md` y Administrador)

## Instalación y ejecución

1. Configura el archivo `.env.local` en esta carpeta:

	```env
	NEXT_PUBLIC_API_URL=http://localhost:4000
	```

2. Instala dependencias e inicia el servidor de desarrollo:

	```powershell
	npm install
	npm run dev
	```

3. Accede a la tienda en: http://localhost:3000

## Notas de uso

- Haz clic en la imagen principal de un producto para abrir el lightbox y navegar entre imágenes.
- El SEO básico ya está implementado para mejorar el posicionamiento en buscadores y redes sociales.
- El carrito y las notificaciones funcionan de forma integrada con el backend.

---

Para detalles avanzados, solución de problemas y despliegue, consulta la documentación principal y `mock/backend/SETUP.md`.
