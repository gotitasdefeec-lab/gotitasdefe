# 🚚 Sistema de Tarifas de Envío

## Flujo completo (Admin → Storefront)

### 1. **Administrador** configura las tarifas

**Ubicación:** Panel Admin → Configuración de Tienda → pestaña "Envíos"

El administrador puede:
- ✅ Definir **política de envíos** (texto informativo)
- ✅ Establecer **costo estándar** de envío (si no aplica ninguna tarifa)
- ✅ Activar **envío gratis** a partir de un monto mínimo
- ✅ Crear **transportistas** (carriers) y activar/desactivar
- ✅ Crear **tarifas por región** con:
  - **Ámbito:** País / Provincia / Ciudad
  - **Región:** Ecuador, Pichincha, Quito, etc.
  - **Transportista:** opcional (puedes asociar uno o dejar "Sin transportista")
  - **Precio:** usa coma o punto para decimales (ej: 3,50 o 3.50)
  - `$0.00` = envío gratis para esa región

**Ejemplo de configuración:**
```
Transportistas:
- Servientrega (activo)
- Correo Nacional (activo)

Tarifas:
- País: Ecuador → $3.50 (Servientrega)
- Provincia: Pichincha → $2.00 (Correo Nacional)
- Ciudad: Quito → $0.00 (envío gratis)

Envío gratis desde: $50.00 (activado)
```

### 2. **Backend** guarda las tarifas en la base de datos

**Tablas Prisma:**
- `store_shipping` (tabla principal)
  - `policy` (texto)
  - `standardCost` (float)
  - `freeShippingMin` (float)
  - `carriers` (JSON array con `[{ id, name, enabled }]`)
  - `rates` (JSON array con `[{ id, scope, region, price, carrierId }]`)

**Endpoint público:**
- `GET /public/store/config` devuelve toda la configuración, incluyendo `shipping` con carriers y rates.

### 3. **Storefront** carga las tarifas en el checkout

**Ubicación:** `/checkout` en el storefront (Next.js)

**Lógica:**
1. Al cargar la página, llama a `storeService.getStoreConfig()`.
2. Parsea `config.shipping.rates` y `config.shipping.carriers`.
3. Construye una lista de `ShippingMethodOption[]`:
   ```ts
   {
     id: 'rate-1',
     name: 'Servientrega - Ecuador',
     description: 'Envío Nacional a Ecuador',
     cost: 3.50,
     eta: '3-5 días'
   }
   ```
4. Muestra las opciones en el componente `<ShippingMethodSelector>`.
5. El usuario selecciona un método → el costo se suma al **Subtotal** → **Total final**.

### 4. **Cálculo del envío en el checkout**

```ts
// Pseudocódigo
const subtotal = getTotalPrice();
const selectedMethod = shippingMethods.find(m => m.id === formData.shippingMethodId);
const baseShipping = selectedMethod?.cost ?? config.standardCost;

// Si supera el umbral de envío gratis, costo = 0
const shipping = subtotal >= freeShippingMin ? 0 : baseShipping;

const total = subtotal + shipping + tax;
```

**Caso envío gratis:**
- Si el subtotal ≥ `freeShippingMin` (ej: $50), el costo de envío es $0 **independientemente** del método seleccionado.
- Se muestra un mensaje verde: "✓ ¡Envío gratis! Tu pedido supera $50.00"

**Caso con tarifa:**
- Si el subtotal < $50, se cobra el costo del método seleccionado.
- Si no hay métodos definidos, usa el `standardCost`.

### 5. **Ejemplo end-to-end**

**Escenario:** Cliente en Quito compra $45 en productos.

1. Admin ya configuró:
   - Tarifa: Ciudad Quito → $0.00
   - Tarifa: Provincia Pichincha → $2.00
   - Tarifa: País Ecuador → $3.50
   - Envío gratis desde: $50
2. Cliente en checkout ve:
   ```
   ○ Servientrega - Ecuador ($3.50, 3-5 días)
   ○ Correo Nacional - Pichincha ($2.00, 2-3 días)
   ● Envío estándar - Quito (Gratis, 1-2 días) ← seleccionado
   ```
3. Cliente selecciona "Envío estándar - Quito" (gratis).
4. Resumen:
   ```
   Subtotal: $45.00
   Envío:    $0.00 (gratis por región Quito)
   Total:    $45.00
   ```
5. Cliente completa el pedido → el backend crea la venta y reduce inventario.

---

## Archivos modificados

### Admin (React + MUI)
- `src/pages/StoreSettings.tsx`
  - Pestaña "Envíos" con gestión de transportistas y tarifas
  - Validación, búsqueda, ordenamiento, duplicar, eliminar con confirmación
- `src/services/storeShippingService.ts`
  - GET/PUT `/storeShipping`
- `src/types/storeShipping.ts`
  - Interfaces `ShippingCarrier`, `ShippingRate`, `StoreShipping`

### Backend (NestJS + Prisma)
- `mock/backend/prisma/schema.prisma`
  - Modelo `StoreShipping` con columnas JSON `carriers` y `rates`
- `mock/backend/src/store/store.service.ts`
  - `getShipping()` normaliza arrays vacíos
  - `updateShipping()` valida y guarda carriers/rates
- `mock/backend/src/public/public.controller.ts`
  - `GET /public/store/config` expone shipping público
- `mock/backend/prisma/seed.ts`
  - Datos de ejemplo: Correo Nacional, Rápido Express, 3 tarifas

### Storefront (Next.js 14)
- `storefront/src/app/checkout/page.tsx`
  - Carga `storeService.getStoreConfig()`
  - Parsea `rates` y `carriers` → `ShippingMethodOption[]`
  - Calcula shipping dinámicamente según selección y umbral
- `storefront/src/components/checkout/ShippingMethodSelector.tsx`
  - Radio buttons para cada método, muestra precio o "Gratis"
- `storefront/src/types/index.ts`
  - Extendido `StoreConfig.shipping` con carriers, rates, freeShippingMin

---

## Cómo probarlo

### 1. Backend corriendo
```powershell
cd mock\backend
npx prisma db seed    # carga transportistas y tarifas de ejemplo
npm run start:dev     # http://localhost:4000
```

### 2. Admin corriendo
```powershell
cd c:\Users\Alex\Desktop\administrador
npm start             # http://localhost:3000
```
- Login: `admin@tienda.com` / `admin123`
- Ve a **Configuración de Tienda → Envíos**
- Agrega/edita transportistas y tarifas
- Guarda cambios

### 3. Storefront corriendo
```powershell
cd storefront
npm run dev           # http://localhost:3001
```
- Agrega productos al carrito
- Ve a `/checkout`
- Verifica que aparezcan las tarifas del admin
- Selecciona un método → verifica que el costo se sume al total
- Si superas el umbral de envío gratis, verifica que el costo sea $0

---

## Mejoras futuras (roadmap)

- **Cálculo automático por dirección:** detectar ciudad/provincia del cliente y preseleccionar la tarifa más barata para esa región.
- **Múltiples zonas por tarifa:** permitir que una tarifa aplique a varias ciudades (ej: "Quito, Guayaquil, Cuenca").
- **Rangos de peso/subtotal:** tarifas escalonadas (ej: $0-$20 → $5, $20-$50 → $3, $50+ → gratis).
- **Tracking de envío:** integración con APIs de carriers para mostrar estado del pedido.
- **Modelo relacional:** migrar carriers y rates de JSON a tablas separadas para queries más potentes.
- **Importar/Exportar CSV:** subir tarifas masivas desde un archivo Excel.
- **Prioridad de tarifas:** si el cliente está en "Quito" (ciudad), ¿usar tarifa de ciudad, provincia o país? (actualmente usa la primera que coincida).

---

## Notas técnicas

- **Decimales:** los inputs de precio aceptan coma o punto (3,50 o 3.50). Se normalizan a `parseFloat` al guardar.
- **Validación:** región es requerida; precio puede ser 0 (envío gratis).
- **Transportistas deshabilitados:** no aparecen en el selector del checkout, solo los `enabled: true`.
- **Fallback:** si no hay tarifas configuradas, el storefront usa `standardCost` (costo estándar).
- **Persistencia:** todo se guarda en la tabla `store_shipping` de PostgreSQL vía Prisma.

---

**¿Preguntas?** Revisa el código en:
- Admin: `src/pages/StoreSettings.tsx` (pestaña Envíos)
- Storefront: `storefront/src/app/checkout/page.tsx`
- Backend: `mock/backend/src/store/store.service.ts`
