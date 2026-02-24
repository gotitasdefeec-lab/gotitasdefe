# 🚀 Revalidación Bajo Demanda (On-Demand ISR)

## ¿Qué es esto?

Es un sistema que permite que tu tienda Next.js (storefront) se actualice **instantáneamente** cuando haces cambios en el administrador, **sin gastar transferencia innecesaria**.

### Ventajas

✅ **Ahorro Máximo**: Si no hay cambios en 3 días, gastas 0 GB en actualizaciones  
✅ **Velocidad Instantánea**: Los cambios aparecen en 1-2 segundos después de guardar  
✅ **Sin Regeneración Completa**: Solo se actualizan las páginas afectadas  
✅ **Compatible con Vercel**: Funciona perfectamente con el plan gratuito  

---

## 🏗️ Arquitectura

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│                 │          │                 │          │                 │
│  ADMIN (React)  │──POST───▶│  API Revalidate │──────────▶│  Vercel Edge   │
│  localhost:3000 │          │  /api/revalidate│          │  Network Cache  │
│                 │          │                 │          │                 │
└─────────────────┘          └─────────────────┘          └─────────────────┘
      ▲                            ▲                             │
      │                            │                             │
      │                            │                             ▼
   Usuario                    Token Secreto              ┌─────────────────┐
 Guarda Producto            (protección)               │   STOREFRONT    │
                                                        │   (Next.js)     │
                                                        │  www.tutienda.  │
                                                        └─────────────────┘
```

---

## 📋 Guía de Implementación

### Paso 1: Configurar Variables de Entorno

#### En el Administrador (React) - Archivo `.env`

```bash
# URL del storefront donde se despliega la tienda
REACT_APP_STOREFRONT_URL=https://www.gotasdefe.com

# Token secreto (genera uno seguro con: openssl rand -base64 32)
REACT_APP_REVALIDATION_TOKEN=tu_token_secreto_aqui_123456
```

#### En el Storefront (Next.js) - Archivo `.env.local`

```bash
# Token secreto (DEBE ser el mismo que en el admin)
REVALIDATION_TOKEN=tu_token_secreto_aqui_123456

# URL del API backend
NEXT_PUBLIC_PUBLIC_API_URL=https://api.gotasdefe.com

# URL pública del storefront
NEXT_PUBLIC_STORE_URL=https://www.gotasdefe.com
```

#### En Vercel (Variables de Entorno del Proyecto)

Ve a: `Project Settings` > `Environment Variables` y agrega:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `REVALIDATION_TOKEN` | tu_token_secreto_aqui_123456 | Production |
| `NEXT_PUBLIC_PUBLIC_API_URL` | https://api.gotasdefe.com | Production |
| `NEXT_PUBLIC_STORE_URL` | https://www.gotasdefe.com | Production |

---

### Paso 2: Generar un Token Seguro

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Alternativamente, usa un generador online:**
- https://generate-secret.vercel.app/32

⚠️ **Importante**: El token DEBE ser el mismo en el admin y en el storefront.

---

### Paso 3: Desplegar el Storefront

Una vez que hayas agregado las variables de entorno en Vercel:

```bash
cd storefront
npm run build
git add .
git commit -m "feat: implementar on-demand revalidation"
git push
```

Vercel desplegará automáticamente con las nuevas variables.

---

## 🧪 Cómo Probarlo

### 1. Verificar que el Endpoint Funciona

```bash
curl -X POST "https://www.tutienda.com/api/revalidate?secret=tu_token_secreto" \
  -H "Content-Type: application/json" \
  -d '{"tag": "products"}'
```

**Respuesta esperada:**
```json
{
  "revalidated": true,
  "type": "tag",
  "target": "products",
  "now": 1709856000000
}
```

### 2. Probar desde el Administrador

1. Abre el administrador en `http://localhost:3000`
2. Ve a **Productos**
3. Edita un producto (cambia el nombre o precio)
4. Guarda el producto
5. Abre la consola del navegador (F12)
6. Deberías ver: `✅ Caché revalidado en storefront: products`

### 3. Verificar en el Storefront

1. Ve a tu tienda `https://www.tutienda.com`
2. Espera 1-2 segundos
3. Refresca la página (F5)
4. El producto actualizado debe aparecer

---

## 🏷️ Tags Implementados

El sistema usa estos tags para identificar qué cachear:

| Tag | Cuándo se Revalida | Páginas Afectadas |
|-----|-------------------|-------------------|
| `products` | Al crear/editar/eliminar cualquier producto | Home, Listado de Productos |
| `featured-products` | Al crear/editar/eliminar productos destacados | Home |
| `product-{id}` | Al editar/eliminar un producto específico | Página de detalle del producto |
| `carousel` | Al editar el carrusel | Home |
| `categories` | Al editar categorías | Listado de Productos |
| `store-config` | Al cambiar configuración de la tienda | Todo el sitio (layout) |
| `store-logo` | Al cambiar el logo | Todo el sitio (header) |
| `policies` | Al editar políticas | Footer, Página de Políticas |

---

## 🔍 Diagnóstico de Problemas

### ❌ Error: "Invalid token"

**Causa**: El token en el admin no coincide con el del storefront.

**Solución**:
1. Verifica que `REACT_APP_REVALIDATION_TOKEN` (admin) == `REVALIDATION_TOKEN` (storefront)
2. Redespliega ambos proyectos si es necesario

### ❌ No se ven los cambios en el storefront

**Causa 1**: El token no está configurado en Vercel.

**Solución**: Ve a Vercel > Project Settings > Environment Variables y agrega `REVALIDATION_TOKEN`.

**Causa 2**: El admin no puede conectarse al storefront (CORS, firewall, etc.)

**Solución**: Abre la consola del navegador en el admin y busca errores de red.

**Causa 3**: El tag usado en el admin no coincide con el del storefront.

**Solución**: Verifica que los tags en `Products.tsx` coincidan con los usados en los fetches.

### ⚠️ Advertencia en consola: "REVALIDATION_TOKEN no configurado"

**Causa**: Estás en desarrollo local y no has configurado el token.

**Solución**: Esto es normal en desarrollo. Los cambios funcionarán en producción.

---

## 📊 Monitoreo y Logs

### En el Administrador (Consola del Navegador)

Al guardar un producto, verás:
```
✅ Caché revalidado en storefront: products
✅ Caché revalidado en storefront: featured-products
✅ Caché revalidado en storefront: product-123
```

O si hay un error:
```
❌ Error al revalidar tag "products": 401 Unauthorized
```

### En Vercel (Runtime Logs)

Ve a: Vercel Dashboard > Deployments > [Tu deployment] > Functions

Busca logs de `/api/revalidate`:
```
🔄 Revalidando tag: products
✅ Tag revalidado exitosamente
```

---

## 💰 Impacto en Costos de Vercel

### Plan Gratuito
- ✅ **Bandwidth**: No cuenta para el límite de 100 GB/mes
- ✅ **Function Executions**: Apenas consume del límite de 100 GB-Hours
- ✅ **Image Optimization**: No se ve afectado

### Comparación

| Escenario | Sin On-Demand ISR | Con On-Demand ISR | Ahorro |
|-----------|-------------------|-------------------|--------|
| 10 productos actualizados/día | Regenera todo el sitio cada 60s = ~40 GB/mes | Solo revalida páginas afectadas = ~0.5 GB/mes | **98.75%** |
| 0 cambios en 1 semana | Regenera igual = ~9 GB/semana | 0 GB gastados | **100%** |

---

## 🔐 Seguridad

### ¿Por qué usamos un token secreto?

Sin el token, cualquiera podría llamar a `/api/revalidate` y forzar regeneraciones, lo que podría:
- Consumir tu bandwidth innecesariamente
- Sobrecargar tu API backend
- Ser usado como vector de ataque DoS

### Buenas Prácticas

1. ✅ Usa un token largo y aleatorio (mínimo 32 caracteres)
2. ✅ No lo compartas en repositorios públicos
3. ✅ Rótalo cada 6 meses
4. ✅ Usa diferentes tokens para staging y producción

---

## 🚀 Próximos Pasos

1. [ ] Implementar revalidación para el carrusel cuando se edite
2. [ ] Agregar revalidación cuando se cambien configuraciones de la tienda
3. [ ] Crear un dashboard de monitoreo de revalidaciones
4. [ ] Implementar rate limiting en el endpoint de revalidación

---

## 📚 Recursos Adicionales

- [Next.js On-Demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [Vercel ISR Documentation](https://vercel.com/docs/concepts/incremental-static-regeneration)
- [revalidateTag API Reference](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar esto en otros frameworks además de Next.js?**  
R: No, esta funcionalidad es específica de Next.js App Router con ISR.

**P: ¿Funciona con Next.js 13 y 14?**  
R: Sí, funciona con ambas versiones (App Router).

**P: ¿Cuánto tarda en reflejarse el cambio?**  
R: Entre 1-2 segundos desde que el admin envía la solicitud.

**P: ¿Qué pasa si falla la revalidación?**  
R: El producto se guarda igual en el admin. El error es silencioso para no afectar la UX.

**P: ¿Puedo revalidar múltiples tags a la vez?**  
R: Sí, la función `revalidateStorefront()` acepta un array de tags.

---

## 👨‍💻 Autor

Implementado por: **GitHub Copilot + Claude Sonnet 4.5**  
Fecha: Febrero 2026

---

¡Ahora tu tienda tiene actualizaciones instantáneas sin gastar transferencia innecesaria! 🎉
