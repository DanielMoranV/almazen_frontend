# 🔄 Guía de Migración: URLs Amigables para Catálogos Públicos

## 📋 Resumen de la Transformación

Este documento detalla la **transformación completa del sistema de URLs de almacenes** de un sistema basado en IDs numéricos a un sistema profesional con URLs amigables y control de acceso avanzado.

### ❌ ANTES (Sistema Problemático):
```
GET /api/public/warehouses/1/products
GET /api/public/warehouses/2/products
```

### ✅ DESPUÉS (Sistema Seguro y Profesional):
```
GET /api/tienda/ferreteria-acme-principal/productos
GET /api/tienda/farmacia-san-jose-centro/productos?token=secure123
```

---

## 🚀 Frontend Completado

✅ **El frontend ya está completamente implementado con:**

1. **Nuevos servicios API** para URLs amigables
2. **Store Pinia actualizado** con soporte para slugs
3. **Rutas Vue.js nuevas** con retrocompatibilidad
4. **Vista de administración** de catálogos públicos
5. **Sistema de tokens** de acceso en frontend
6. **Vistas públicas actualizadas** (Store.vue y ProductDetail.vue)

---

## 🔧 Backend: Implementación Requerida

### 1. Migración de Base de Datos

**Agregar campos a la tabla `warehouses`:**

```sql
-- Migración: Agregar campos para URLs amigables
ALTER TABLE warehouses ADD COLUMN public_url_slug VARCHAR(100) UNIQUE NULL;
ALTER TABLE warehouses ADD COLUMN is_public_visible BOOLEAN DEFAULT FALSE;
ALTER TABLE warehouses ADD COLUMN public_access_token VARCHAR(64) NULL;
ALTER TABLE warehouses ADD COLUMN public_catalog_config JSON NULL;

-- Índices para optimización
CREATE INDEX warehouses_public_url_slug_idx ON warehouses (public_url_slug);
CREATE INDEX warehouses_company_public_idx ON warehouses (company_id, is_public_visible);
CREATE INDEX warehouses_access_token_idx ON warehouses (public_access_token);

-- Comentarios de documentación
COMMENT ON COLUMN warehouses.public_url_slug IS 'URL amigable única para el catálogo público';
COMMENT ON COLUMN warehouses.is_public_visible IS 'Define si el catálogo es visible públicamente';
COMMENT ON COLUMN warehouses.public_access_token IS 'Token SHA256 para control de acceso (opcional)';
COMMENT ON COLUMN warehouses.public_catalog_config IS 'Configuración personalizable del catálogo (SEO, diseño, contacto)';
```

### 2. Modelo Warehouse (Laravel)

**Extender el modelo `app/Models/Warehouse.php`:**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Warehouse extends Model
{
    protected $fillable = [
        // ... campos existentes
        'public_url_slug',
        'is_public_visible',
        'public_access_token',
        'public_catalog_config'
    ];

    protected $casts = [
        'is_public_visible' => 'boolean',
        'public_catalog_config' => 'array'
    ];

    protected $hidden = [
        'public_access_token' // No exponer tokens en respuestas JSON por defecto
    ];

    // 🆕 NUEVOS MÉTODOS

    /**
     * Generar slug automáticamente basado en nombre de empresa y almacén
     */
    public function generatePublicSlug(): string
    {
        $companyName = $this->company->name ?? '';
        $warehouseName = $this->name ?? 'almacen';
        
        $slug = $this->normalizeSlugText($companyName . ' ' . $warehouseName);
        
        // Garantizar unicidad
        $originalSlug = $slug;
        $counter = 1;
        
        while (static::where('public_url_slug', $slug)->where('id', '!=', $this->id)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        
        return $slug;
    }

    /**
     * Normalizar texto para slug
     */
    private function normalizeSlugText(string $text): string
    {
        return Str::of($text)
            ->lower()
            ->ascii() // Remover acentos
            ->replaceMatches('/[^a-z0-9\s-]/', '') // Solo letras, números, espacios y guiones
            ->replaceMatches('/\s+/', '-') // Espacios a guiones
            ->replaceMatches('/-+/', '-') // Múltiples guiones a uno
            ->trim('-') // Remover guiones al inicio y final
            ->limit(100, ''); // Máximo 100 caracteres
    }

    /**
     * Generar token de acceso seguro SHA256
     */
    public function generateAccessToken(): string
    {
        return hash('sha256', uniqid($this->id . $this->company_id . microtime(), true));
    }

    /**
     * Verificar disponibilidad de slug
     */
    public static function isSlugAvailable(string $slug, int $excludeId = null): bool
    {
        $query = static::where('public_url_slug', $slug);
        
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        
        return !$query->exists();
    }

    /**
     * Validar formato de slug
     */
    public static function isValidSlug(string $slug): bool
    {
        return preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/', $slug) && 
               strlen($slug) >= 3 && 
               strlen($slug) <= 100;
    }

    /**
     * Buscar almacén por slug
     */
    public static function findBySlug(string $slug): ?static
    {
        return static::where('public_url_slug', $slug)
                    ->where('is_public_visible', true)
                    ->first();
    }

    /**
     * Obtener URL pública completa del frontend
     */
    public function getPublicUrl(): ?string
    {
        if (!$this->public_url_slug || !$this->is_public_visible) {
            return null;
        }

        $baseUrl = config('app.frontend_url', config('app.url'));
        $url = $baseUrl . '/tienda/' . $this->public_url_slug;
        
        if ($this->public_access_token) {
            $url .= '?token=' . $this->public_access_token;
        }
        
        return $url;
    }

    /**
     * Obtener URL de la API pública
     */
    public function getPublicApiUrl(): ?string
    {
        if (!$this->public_url_slug || !$this->is_public_visible) {
            return null;
        }

        $baseUrl = config('app.url');
        return $baseUrl . '/api/tienda/' . $this->public_url_slug;
    }

    /**
     * Scope: Solo almacenes públicos
     */
    public function scopePublicVisible($query)
    {
        return $query->where('is_public_visible', true);
    }

    /**
     * Scope: Solo almacenes con slug configurado
     */
    public function scopeWithSlug($query)
    {
        return $query->whereNotNull('public_url_slug');
    }
}
```

### 3. Controlador PublicCatalogController

**Crear `app/Http/Controllers/PublicCatalogController.php`:**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class PublicCatalogController extends Controller
{
    /**
     * Obtener información del catálogo
     */
    public function getCatalogInfo(Request $request, string $slug): JsonResponse
    {
        try {
            $warehouse = $this->findWarehouseBySlug($slug);
            
            // Verificar token si es requerido
            if ($warehouse->public_access_token && !$this->validateAccessToken($request, $warehouse)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token de acceso requerido',
                    'requires_token' => true
                ], 403);
            }

            // Rate limiting: 60 requests por minuto para info
            if (RateLimiter::tooManyAttempts("catalog-info:{$request->ip()}", 60)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demasiadas peticiones. Inténtalo más tarde.'
                ], 429);
            }

            RateLimiter::hit("catalog-info:{$request->ip()}");

            return response()->json([
                'success' => true,
                'data' => [
                    'warehouse' => $warehouse->load('company'),
                    'company' => $warehouse->company,
                    'config' => $warehouse->public_catalog_config ?? $this->getDefaultConfig(),
                    'requires_token' => !is_null($warehouse->public_access_token)
                ]
            ]);

        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    /**
     * Obtener productos del catálogo
     */
    public function getCatalogProducts(Request $request, string $slug): JsonResponse
    {
        try {
            $warehouse = $this->findWarehouseBySlug($slug);
            
            // Verificar token si es requerido
            if ($warehouse->public_access_token && !$this->validateAccessToken($request, $warehouse)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token de acceso inválido',
                    'requires_token' => true
                ], 403);
            }

            // Rate limiting: 120 requests por minuto para productos
            if (RateLimiter::tooManyAttempts("catalog-products:{$request->ip()}", 120)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Demasiadas peticiones. Inténtalo más tarde.'
                ], 429);
            }

            RateLimiter::hit("catalog-products:{$request->ip()}");

            $validated = $request->validate([
                'search' => 'nullable|string|max:100',
                'category_id' => 'nullable|integer|exists:categories,id',
                'sort' => 'nullable|in:name,price,created_at',
                'order' => 'nullable|in:asc,desc',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1'
            ]);

            // Cache key con parámetros
            $cacheKey = "catalog:{$slug}:" . md5(serialize($validated));
            
            $result = Cache::remember($cacheKey, 300, function () use ($warehouse, $validated) {
                return $this->getProductsQuery($warehouse, $validated);
            });

            return response()->json([
                'success' => true,
                'data' => $result,
                'warehouse' => $warehouse->load('company'),
                'company' => $warehouse->company
            ]);

        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    /**
     * Obtener producto específico
     */
    public function getCatalogProduct(Request $request, string $slug, int $productId): JsonResponse
    {
        try {
            $warehouse = $this->findWarehouseBySlug($slug);
            
            // Verificar token si es requerido
            if ($warehouse->public_access_token && !$this->validateAccessToken($request, $warehouse)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token de acceso inválido'
                ], 403);
            }

            $product = Product::with(['categories', 'unit', 'stocks.batch'])
                ->whereHas('stocks', function ($query) use ($warehouse) {
                    $query->where('warehouse_id', $warehouse->id);
                })
                ->where('company_id', $warehouse->company_id)
                ->findOrFail($productId);

            return response()->json([
                'success' => true,
                'data' => $this->formatProduct($product, $warehouse)
            ]);

        } catch (\Exception $e) {
            return $this->handleError($e);
        }
    }

    /**
     * Buscar almacén por slug
     */
    private function findWarehouseBySlug(string $slug): Warehouse
    {
        $warehouse = Warehouse::where('public_url_slug', $slug)
            ->where('is_public_visible', true)
            ->with('company')
            ->first();

        if (!$warehouse) {
            abort(404, 'Catálogo no encontrado');
        }

        return $warehouse;
    }

    /**
     * Validar token de acceso
     */
    private function validateAccessToken(Request $request, Warehouse $warehouse): bool
    {
        $token = $request->query('token');
        
        if (!$token || $token !== $warehouse->public_access_token) {
            return false;
        }

        return true;
    }

    /**
     * Generar query de productos con filtros
     */
    private function getProductsQuery(Warehouse $warehouse, array $filters): array
    {
        $query = Product::with(['categories', 'unit', 'stocks.batch'])
            ->whereHas('stocks', function ($q) use ($warehouse) {
                $q->where('warehouse_id', $warehouse->id);
            })
            ->where('company_id', $warehouse->company_id);

        // Filtro de búsqueda
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%")
                  ->orWhere('barcode', 'LIKE', "%{$search}%")
                  ->orWhere('brand', 'LIKE', "%{$search}%");
            });
        }

        // Filtro de categoría
        if (!empty($filters['category_id'])) {
            $query->whereHas('categories', function ($q) use ($filters) {
                $q->where('categories.id', $filters['category_id']);
            });
        }

        // Ordenamiento
        $sortField = $filters['sort'] ?? 'name';
        $sortOrder = $filters['order'] ?? 'asc';
        
        if ($sortField === 'price') {
            $query->join('stocks', 'products.id', '=', 'stocks.product_id')
                  ->where('stocks.warehouse_id', $warehouse->id)
                  ->orderBy('stocks.sale_price', $sortOrder)
                  ->select('products.*');
        } else {
            $query->orderBy($sortField, $sortOrder);
        }

        // Paginación
        $perPage = min($filters['per_page'] ?? 12, 100);
        $products = $query->paginate($perPage);

        return [
            'data' => $products->items(),
            'total' => $products->total(),
            'per_page' => $products->perPage(),
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage()
        ];
    }

    /**
     * Formatear producto para respuesta
     */
    private function formatProduct(Product $product, Warehouse $warehouse): array
    {
        $stock = $product->stocks->where('warehouse_id', $warehouse->id)->first();
        
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'brand' => $product->brand,
            'image_url' => $product->image_url,
            'categories' => $product->categories,
            'unit' => $product->unit,
            'stock_info' => $stock ? [
                'available_quantity' => $stock->quantity,
                'sale_price' => $stock->sale_price,
                'batch' => $stock->batch ? [
                    'batch_code' => $stock->batch->batch_code,
                    'expiry_date' => $stock->batch->expiry_date,
                    'days_to_expire' => $stock->batch->expiry_date ? 
                        now()->diffInDays($stock->batch->expiry_date, false) : null
                ] : null
            ] : null
        ];
    }

    /**
     * Configuración por defecto
     */
    private function getDefaultConfig(): array
    {
        return [
            'seo_title' => '',
            'seo_description' => '',
            'header_color' => '#2563eb',
            'custom_css' => '',
            'show_stock_quantity' => true,
            'show_prices' => true,
            'allow_quotes' => true,
            'contact_info' => [
                'phone' => '',
                'whatsapp' => '',
                'email' => ''
            ]
        ];
    }

    /**
     * Manejar errores
     */
    private function handleError(\Exception $e): JsonResponse
    {
        if ($e->getCode() === 404) {
            return response()->json([
                'success' => false,
                'message' => 'Catálogo no encontrado'
            ], 404);
        }

        \Log::error('Error in PublicCatalogController: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Error interno del servidor'
        ], 500);
    }
}
```

### 4. Controlador WarehouseCatalogController

**Crear `app/Http/Controllers/WarehouseCatalogController.php`:**

```php
<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class WarehouseCatalogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Listar catálogos públicos de la empresa del usuario
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $companyId = $user->company_id;

        $warehouses = Warehouse::where('company_id', $companyId)
            ->with(['company'])
            ->withSlug()
            ->get()
            ->map(function ($warehouse) {
                return [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'company' => $warehouse->company,
                    'public_url_slug' => $warehouse->public_url_slug,
                    'is_public_visible' => $warehouse->is_public_visible,
                    'public_access_token' => $warehouse->public_access_token,
                    'public_catalog_config' => $warehouse->public_catalog_config,
                    'public_url' => $warehouse->getPublicUrl()
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $warehouses,
                'total' => $warehouses->count()
            ]
        ]);
    }

    /**
     * Verificar disponibilidad de slug
     */
    public function checkSlug(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => 'required|string|min:3|max:100',
            'warehouse_id' => 'nullable|integer'
        ]);

        $slug = $validated['slug'];
        $warehouseId = $validated['warehouse_id'] ?? null;

        if (!Warehouse::isValidSlug($slug)) {
            return response()->json([
                'success' => false,
                'available' => false,
                'message' => 'Formato de slug inválido. Solo letras minúsculas, números y guiones.'
            ]);
        }

        $available = Warehouse::isSlugAvailable($slug, $warehouseId);

        $response = [
            'success' => true,
            'available' => $available,
            'message' => $available ? 'Slug disponible' : 'Slug ya está en uso'
        ];

        if (!$available) {
            // Generar sugerencia
            $originalSlug = $slug;
            $counter = 1;
            
            do {
                $suggestedSlug = $originalSlug . '-' . $counter;
                $counter++;
            } while (!Warehouse::isSlugAvailable($suggestedSlug, $warehouseId) && $counter < 10);
            
            $response['suggested_slug'] = $suggestedSlug;
        }

        return response()->json($response);
    }

    /**
     * Obtener configuración de catálogo
     */
    public function getCatalogConfig(int $warehouseId): JsonResponse
    {
        $user = Auth::user();
        
        $warehouse = Warehouse::where('id', $warehouseId)
            ->where('company_id', $user->company_id)
            ->with('company')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'warehouse' => $warehouse,
                'config' => $warehouse->public_catalog_config ?? []
            ]
        ]);
    }

    /**
     * Actualizar configuración de catálogo
     */
    public function updateCatalogConfig(Request $request, int $warehouseId): JsonResponse
    {
        $user = Auth::user();
        
        $warehouse = Warehouse::where('id', $warehouseId)
            ->where('company_id', $user->company_id)
            ->firstOrFail();

        $validated = $request->validate([
            'public_url_slug' => 'nullable|string|min:3|max:100',
            'is_public_visible' => 'boolean',
            'public_catalog_config' => 'nullable|array',
            'public_catalog_config.seo_title' => 'nullable|string|max:60',
            'public_catalog_config.seo_description' => 'nullable|string|max:160',
            'public_catalog_config.header_color' => 'nullable|string|regex:/^#[0-9A-F]{6}$/i',
            'public_catalog_config.custom_css' => 'nullable|string|max:10000',
            'public_catalog_config.show_stock_quantity' => 'boolean',
            'public_catalog_config.show_prices' => 'boolean',
            'public_catalog_config.allow_quotes' => 'boolean',
            'public_catalog_config.contact_info' => 'nullable|array'
        ]);

        // Validar slug si se proporcionó
        if (!empty($validated['public_url_slug'])) {
            if (!Warehouse::isValidSlug($validated['public_url_slug'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Formato de slug inválido'
                ], 422);
            }

            if (!Warehouse::isSlugAvailable($validated['public_url_slug'], $warehouseId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El slug ya está en uso'
                ], 422);
            }
        }

        $warehouse->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Configuración actualizada correctamente',
            'data' => [
                'warehouse' => $warehouse->fresh(),
                'config' => $warehouse->public_catalog_config
            ]
        ]);
    }

    /**
     * Regenerar token de acceso
     */
    public function regenerateAccessToken(int $warehouseId): JsonResponse
    {
        $user = Auth::user();
        
        $warehouse = Warehouse::where('id', $warehouseId)
            ->where('company_id', $user->company_id)
            ->firstOrFail();

        $newToken = $warehouse->generateAccessToken();
        $warehouse->update(['public_access_token' => $newToken]);

        return response()->json([
            'success' => true,
            'message' => 'Token regenerado correctamente',
            'data' => [
                'token' => $newToken,
                'public_url' => $warehouse->getPublicUrl()
            ]
        ]);
    }

    /**
     * Eliminar token de acceso (hacer público total)
     */
    public function removeAccessToken(int $warehouseId): JsonResponse
    {
        $user = Auth::user();
        
        $warehouse = Warehouse::where('id', $warehouseId)
            ->where('company_id', $user->company_id)
            ->firstOrFail();

        $warehouse->update(['public_access_token' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Token eliminado. El catálogo es ahora completamente público',
            'data' => [
                'public_url' => $warehouse->getPublicUrl()
            ]
        ]);
    }
}
```

### 5. Rutas API

**Actualizar `routes/api.php`:**

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicCatalogController;
use App\Http\Controllers\WarehouseCatalogController;

// 🆕 NUEVAS RUTAS: Catálogos Públicos con URLs Amigables
Route::prefix('tienda')->group(function () {
    Route::get('{slug}/info', [PublicCatalogController::class, 'getCatalogInfo'])
        ->middleware('throttle:60,1');
    
    Route::get('{slug}/productos', [PublicCatalogController::class, 'getCatalogProducts'])
        ->middleware('throttle:120,1');
    
    Route::get('{slug}/productos/{productId}', [PublicCatalogController::class, 'getCatalogProduct'])
        ->middleware('throttle:60,1');
});

// 🆕 NUEVAS RUTAS: Administración de Catálogos (Autenticadas)
Route::middleware('auth:api')->group(function () {
    Route::get('warehouses/public-catalogs', [WarehouseCatalogController::class, 'index']);
    Route::post('warehouses/check-slug', [WarehouseCatalogController::class, 'checkSlug']);
    Route::get('warehouses/{warehouseId}/catalog-config', [WarehouseCatalogController::class, 'getCatalogConfig']);
    Route::put('warehouses/{warehouseId}/catalog-config', [WarehouseCatalogController::class, 'updateCatalogConfig']);
    Route::post('warehouses/{warehouseId}/regenerate-token', [WarehouseCatalogController::class, 'regenerateAccessToken']);
    Route::delete('warehouses/{warehouseId}/access-token', [WarehouseCatalogController::class, 'removeAccessToken']);
});

// 🔄 RUTAS LEGACY: Mantener para retrocompatibilidad (DEPRECATED)
Route::prefix('public/warehouses')->group(function () {
    Route::get('{warehouseId}/products', [PublicStoreController::class, 'getProducts'])
        ->middleware('throttle:120,1'); // Endpoint legacy existente
    
    Route::get('{warehouseId}/products/{productId}', [PublicStoreController::class, 'getProduct'])
        ->middleware('throttle:60,1'); // Endpoint legacy existente
});
```

### 6. Configuración Adicional

**Actualizar `config/cors.php`:**

```php
<?php

return [
    'paths' => [
        'api/*',
        'tienda/*', // 🆕 Agregar nuevas rutas públicas
        'public/*'
    ],
    // ... resto de la configuración
];
```

**Agregar variable de entorno en `.env`:**

```env
# URL del frontend para generar enlaces
FRONTEND_URL=https://tu-frontend.com
```

---

## 📊 Ejemplo Completo de Uso

### Configurar un Catálogo:

```php
// 1. Crear almacén con catálogo público
$warehouse = Warehouse::find(1);
$warehouse->update([
    'public_url_slug' => $warehouse->generatePublicSlug(),
    'is_public_visible' => true,
    'public_access_token' => $warehouse->generateAccessToken(),
    'public_catalog_config' => [
        'seo_title' => 'Ferretería ACME - Los Mejores Productos',
        'seo_description' => 'Encuentra herramientas y materiales de construcción',
        'header_color' => '#2563eb',
        'show_prices' => true,
        'show_stock_quantity' => true,
        'allow_quotes' => true,
        'contact_info' => [
            'phone' => '+51 999 888 777',
            'whatsapp' => '+51 999 888 777',
            'email' => 'ventas@ferreteriaacme.com'
        ]
    ]
]);
```

### URLs Generadas:

- **Público Total**: `https://miapp.com/tienda/ferreteria-acme-principal`
- **Con Token**: `https://miapp.com/tienda/ferreteria-acme-principal?token=abc123...`
- **API Info**: `https://miapp.com/api/tienda/ferreteria-acme-principal/info`
- **API Productos**: `https://miapp.com/api/tienda/ferreteria-acme-principal/productos`

---

## 🔍 Testing y Validación

### Casos de Prueba Esenciales:

```php
// tests/Feature/PublicCatalogTest.php
class PublicCatalogTest extends TestCase
{
    /** @test */
    public function puede_acceder_a_catalogo_publico_con_slug()
    {
        $warehouse = Warehouse::factory()->create([
            'public_url_slug' => 'test-warehouse',
            'is_public_visible' => true
        ]);

        $response = $this->get("/api/tienda/test-warehouse/productos");
        
        $response->assertStatus(200)
                ->assertJsonStructure(['success', 'data']);
    }

    /** @test */
    public function requiere_token_para_catalogo_protegido()
    {
        $warehouse = Warehouse::factory()->create([
            'public_url_slug' => 'protected-warehouse',
            'is_public_visible' => true,
            'public_access_token' => 'secret-token'
        ]);

        // Sin token - debe fallar
        $response = $this->get("/api/tienda/protected-warehouse/productos");
        $response->assertStatus(403);

        // Con token - debe funcionar
        $response = $this->get("/api/tienda/protected-warehouse/productos?token=secret-token");
        $response->assertStatus(200);
    }

    /** @test */
    public function slug_debe_ser_unico()
    {
        Warehouse::factory()->create(['public_url_slug' => 'existing-slug']);
        
        $this->assertFalse(Warehouse::isSlugAvailable('existing-slug'));
        $this->assertTrue(Warehouse::isSlugAvailable('new-slug'));
    }
}
```

---

## 🚦 Checklist de Implementación

### Backend Laravel:

- [ ] **Migración de base de datos ejecutada**
- [ ] **Modelo Warehouse extendido**
- [ ] **PublicCatalogController implementado**
- [ ] **WarehouseCatalogController implementado**
- [ ] **Rutas API configuradas**
- [ ] **Rate limiting configurado**
- [ ] **CORS actualizado**
- [ ] **Tests implementados**
- [ ] **Documentación API actualizada**

### Frontend Vue.js (✅ Completado):

- [x] **Servicios API actualizados**
- [x] **Store Pinia extendido**
- [x] **Rutas Vue.js configuradas**
- [x] **Vista de administración creada**
- [x] **Vistas públicas actualizadas**
- [x] **Sistema de tokens implementado**
- [x] **Retrocompatibilidad mantenida**

---

## 🎯 Resultados Esperados

Al completar esta implementación tendrás:

### ✅ URLs Profesionales:
- `https://miapp.com/tienda/ferreteria-acme-centro`
- `https://miapp.com/tienda/farmacia-san-jose`

### ✅ Control de Acceso:
- Catálogos públicos totales
- Catálogos protegidos con token
- Catálogos privados (invisible)

### ✅ Administración Completa:
- Panel de gestión de catálogos
- Generación automática de slugs
- Configuración personalizable
- Gestión de tokens

### ✅ Seguridad:
- URLs no predecibles
- Tokens SHA256 seguros
- Rate limiting implementado
- Validaciones robustas

### ✅ SEO y UX:
- URLs amigables para buscadores
- Meta tags personalizables
- Configuración de diseño
- Información de contacto

---

**🚀 ¡El frontend está listo! Solo falta implementar el backend siguiendo esta guía.** 

Una vez completado, tendrás un sistema de catálogos públicos profesional, seguro y completamente configurable. 🎉