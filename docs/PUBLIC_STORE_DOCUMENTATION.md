# 🛍️ Tienda Pública - AlmaZen Frontend

## Descripción General

Se ha implementado una **página catálogo tipo store de acceso público** que permite promocionar productos de almacenes específicos sin necesidad de autenticación. Esta implementación utiliza el endpoint público `/api/public/warehouses/{warehouseId}/products` proporcionado.

## 🚀 Características Principales

### ✅ Funcionalidades Implementadas

1. **Catálogo de Productos**
   - Vista de productos en grid responsive
   - Información completa de cada producto (nombre, precio, stock, SKU, etc.)
   - Manejo inteligente de lotes con fechas de vencimiento
   - Imágenes de productos con fallback a placeholder

2. **Sistema de Búsqueda y Filtros**
   - Búsqueda por nombre, SKU, código de barras y marca
   - Filtro por categorías
   - Búsqueda con debounce para optimizar peticiones
   - Filtros colapsables en móviles

3. **Navegación y Detalles**
   - Vista detallada de productos individuales
   - Navegación entre catálogo y detalles
   - Breadcrumbs y botón de regreso

4. **Paginación y Performance**
   - Paginación completa con controles
   - Carga por páginas (12 productos por defecto)
   - Rate limiting del lado del cliente
   - Cache de productos visitados

5. **SEO y Optimización**
   - Meta tags dinámicos
   - Open Graph tags para redes sociales
   - Structured Data (Schema.org) para productos y tienda
   - URLs semánticas

6. **Diseño Responsive**
   - Mobile-first approach
   - Grid adaptivo
   - Componentes optimizados para móviles
   - Diseño moderno con PrimeVue

## 📂 Estructura de Archivos

```
src/
├── api/
│   └── public.js              # Servicios API públicos
├── stores/
│   └── publicStore.js         # Store Pinia para estado público
├── views/
│   └── public/
│       ├── Store.vue          # Vista principal del catálogo
│       └── ProductDetail.vue  # Vista de detalle de producto
└── router/
    └── index.js              # Rutas públicas configuradas
```

## 🌐 Rutas Configuradas

### Rutas Públicas (sin autenticación)

1. **Catálogo de la Tienda**
   ```
   /store/:warehouseId
   ```
   - Muestra el catálogo completo de productos
   - Filtros y búsqueda
   - Paginación

2. **Detalle de Producto**
   ```
   /store/:warehouseId/product/:productId
   ```
   - Vista detallada del producto
   - Información completa incluyendo lotes
   - Structured data para SEO

## 🛠️ Servicios API

### `src/api/public.js`

Servicios para consumir el endpoint público:

```javascript
// Obtener productos del almacén
fetchPublicProducts(warehouseId, params)

// Obtener información del almacén
fetchPublicWarehouse(warehouseId)

// Obtener categorías disponibles
fetchPublicCategories(warehouseId)

// Rate limiting automático
withRateLimit(apiFunction, ...args)
```

### Parámetros Soportados

- `search` - Búsqueda por nombre, SKU, código de barras o marca
- `category_id` - Filtrar por categoría específica
- `per_page` - Productos por página (por defecto: 12)
- `page` - Número de página

## 💾 Store de Estado (Pinia)

### `src/stores/publicStore.js`

Gestión centralizada del estado público:

```javascript
// Inicializar almacén
await initializeWarehouse(warehouseId)

// Buscar productos
await fetchProducts(warehouseId, options)

// Gestión de filtros
updateSearch(query)
updateCategory(categoryId)
clearFilters()

// Utilidades
formatPrice(price)
formatDate(dateString)
getStockStatus(stock)
```

## 🎨 Características de Diseño

### Sistema de Colores y Estados

- **Stock disponible**: Verde (más de 5 unidades)
- **Stock bajo**: Amarillo (1-5 unidades)  
- **Agotado**: Rojo (0 unidades)
- **Próximo a vencer**: Badge amarillo (≤7 días)
- **Vencido**: Badge rojo

### Componentes Responsive

- **Desktop**: Grid de 3-4 columnas
- **Tablet**: Grid de 2 columnas
- **Mobile**: Grid de 1 columna
- **Filtros colapsables** en pantallas pequeñas

## 🚀 Cómo Usar

### 1. Acceso Directo por URL

```
https://tu-dominio.com/store/{ID_ALMACEN}
```

### 2. Parámetros de URL Opcionales

```
/store/123?search=producto&category_id=5&page=2
```

### 3. Navegación

1. **Catálogo Principal**: Vista grid con todos los productos
2. **Filtros**: Panel colapsable con búsqueda y categorías
3. **Paginación**: Controles en la parte inferior
4. **Detalle**: Click en cualquier producto para ver detalles completos

## 🔧 Configuración del Backend

Asegúrate de que tu backend tenga configurado:

1. **Endpoint público activo**: `/api/public/warehouses/{warehouseId}/products`
2. **CORS habilitado** para el dominio del frontend
3. **Rate limiting**: 120 peticiones por minuto (recomendado)
4. **Endpoints adicionales** (opcionales):
   - `/api/public/warehouses/{warehouseId}` - Info del almacén
   - `/api/public/warehouses/{warehouseId}/categories` - Categorías

## 🎯 Optimizaciones Implementadas

### Performance

- **Lazy loading** de imágenes
- **Debounce** en búsquedas (300ms)
- **Cache** de productos visitados
- **Rate limiting** del lado del cliente
- **Paginación** eficiente

### SEO

- **Meta tags dinámicos** basados en contenido
- **Structured Data** (JSON-LD) para productos
- **Open Graph** para redes sociales
- **URLs semánticas**
- **Canonical URLs**

### UX/UI

- **Estados de carga** con skeletons
- **Estados vacíos** informativos  
- **Transiciones suaves**
- **Feedback visual** de estados
- **Navegación intuitiva**

## 🌟 Ejemplos de Uso

### URL de Ejemplo
```
https://mi-tienda.com/store/warehouse-123
```

### Búsqueda con Filtros
```
https://mi-tienda.com/store/warehouse-123?search=laptop&category_id=2
```

### Producto Específico
```
https://mi-tienda.com/store/warehouse-123/product/456
```

## 🚦 Estados y Manejo de Errores

### Estados de Loading

- **Productos**: Skeleton cards durante la carga
- **Categorías**: Loading discreto
- **Búsqueda**: Indicador en tiempo real

### Manejo de Errores

- **Rate limit exceeded**: Mensaje con tiempo de espera
- **Producto no encontrado**: Redirección automática al catálogo
- **Error de red**: Mensajes informativos con opciones de reintento
- **Almacén inexistente**: Redirección a página de error

## 📱 Compatibilidad

### Navegadores Soportados

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

### Dispositivos

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (320px - 767px)

## 🔒 Consideraciones de Seguridad

- **Sin autenticación** requerida (público)
- **Rate limiting** implementado
- **Validación** de parámetros de entrada
- **Sanitización** de contenido mostrado
- **HTTPS** recomendado en producción

## 📈 Métricas y Analytics

### Datos Disponibles

- **Productos más vistos**
- **Búsquedas más frecuentes**
- **Categorías más populares**
- **Tiempo en páginas**
- **Conversiones de vista a detalle**

### Integración Recomendada

- Google Analytics 4
- Google Tag Manager
- Schema.org para rich snippets

---

## 🎉 ¡Listo para Usar!

La tienda pública está completamente implementada y lista para promocionar tus productos. Solo necesitas:

1. **Configurar el endpoint** en tu backend
2. **Desplegar** el frontend actualizado
3. **Compartir las URLs** de tus almacenes

### URLs de Acceso Directo

```
/store/{ID_ALMACEN_1} - Almacén Principal
/store/{ID_ALMACEN_2} - Almacén Sucursal
/store/{ID_ALMACEN_N} - Almacén N
```

¡Tu catálogo público ya está disponible para tus clientes! 🚀