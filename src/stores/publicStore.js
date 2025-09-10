import { fetchPublicProduct, fetchPublicProducts, fetchCatalogInfo, fetchCatalogProducts, fetchCatalogProduct } from '@/api';
import { defineStore } from 'pinia';

export const usePublicStore = defineStore('publicStore', {
    state: () => ({
        // Productos
        products: [],
        totalProducts: 0,
        currentPage: 1,
        perPage: 50,
        isLoading: false,

        // Filtros
        searchQuery: '',
        selectedCategory: null,

        // Categorías (extraídas de los productos)
        categories: [],

        // Almacén (viene en la respuesta de productos)
        currentWarehouse: null,

        // Empresa (viene en la respuesta de productos)
        currentCompany: null,

        // 🆕 Nuevo: Configuración del catálogo
        catalogConfig: null,
        catalogSlug: null,
        accessToken: null,
        isTokenRequired: false,

        // Paginación
        totalPages: 1,
        lastPage: null,

        // Errores
        error: null,
        message: ''
    }),

    getters: {
        // Estados de carga y datos
        hasProducts: (state) => state.products.length > 0,
        isLoadingProducts: (state) => state.isLoading,

        // Paginación
        showPagination: (state) => state.totalPages > 1,
        canGoNext: (state) => state.currentPage < state.totalPages,
        canGoPrev: (state) => state.currentPage > 1,

        // Filtros
        hasFilters: (state) => {
            return !!(state.searchQuery.trim() || state.selectedCategory);
        },

        // Categorías únicas extraídas de productos
        availableCategories: (state) => state.categories,

        // Productos filtrados localmente (sin hacer peticiones adicionales)
        filteredProducts: (state) => {
            if (!state.products.length) return [];

            return state.products.filter((product) => {
                // Filtro por categoría local
                if (state.selectedCategory) {
                    const hasCategory = product.categories?.some((cat) => cat.id === state.selectedCategory);
                    if (!hasCategory) return false;
                }

                return true;
            });
        },

        // Estadísticas de categorías con conteo de productos
        categoryStats: (state) => {
            const stats = new Map();

            state.products.forEach((product) => {
                if (product.categories && product.categories.length > 0) {
                    product.categories.forEach((category) => {
                        const current = stats.get(category.id) || {
                            ...category,
                            productCount: 0,
                            inStockCount: 0,
                            totalStock: 0
                        };

                        current.productCount++;
                        const stock = parseFloat(product.stock_info?.available_quantity || 0);
                        if (stock > 0) {
                            current.inStockCount++;
                            current.totalStock += stock;
                        }

                        stats.set(category.id, current);
                    });
                }
            });

            return Array.from(stats.values()).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        },

        // Warehouse info
        warehouseInfo: (state) => state.currentWarehouse,

        // Company info
        companyInfo: (state) => state.currentCompany,

        // Estadísticas de stock
        stockStats: (state) => {
            if (!state.products.length) return { inStock: 0, lowStock: 0, outOfStock: 0 };

            return state.products.reduce(
                (stats, product) => {
                    const stock = parseFloat(product.stock_info?.available_quantity || 0);
                    if (stock <= 0) stats.outOfStock++;
                    else if (stock <= 5) stats.lowStock++;
                    else stats.inStock++;
                    return stats;
                },
                { inStock: 0, lowStock: 0, outOfStock: 0 }
            );
        }
    },

    actions: {
        // 🆕 Nuevo: Cargar información del catálogo por slug
        async loadCatalogInfo(slug, accessToken = null) {
            this.isLoading = true;
            this.error = null;

            try {
                const params = {};
                if (accessToken) {
                    params.token = accessToken;
                }

                const response = await fetchCatalogInfo(slug, params);
                const data = response.data;

                // Actualizar información del catálogo
                this.currentWarehouse = data.warehouse;
                this.currentCompany = data.company;
                this.catalogConfig = data.config || {};
                this.catalogSlug = slug;
                this.isTokenRequired = data.requires_token || false;

                return data;
            } catch (error) {
                this.error = error;

                if (error.response?.status === 403) {
                    this.message = 'Token de acceso requerido o inválido';
                    this.isTokenRequired = true;
                } else if (error.response?.status === 404) {
                    this.message = 'Catálogo no encontrado';
                } else {
                    this.message = error.message || 'Error al cargar información del catálogo';
                }

                console.error('Error fetching catalog info:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        // 🆕 Nuevo: Cargar productos usando slug amigable
        async loadCatalogProducts(slug, options = {}) {
            this.isLoading = true;
            this.error = null;

            try {
                const params = {};

                // Token de acceso si es requerido
                if (this.accessToken || options.token) {
                    params.token = this.accessToken || options.token;
                }

                // Filtros de búsqueda
                if (this.searchQuery.trim()) {
                    params.search = this.searchQuery.trim();
                }

                if (this.selectedCategory) {
                    params.category_id = this.selectedCategory;
                }

                // Paginación
                if (options.usePagination && (options.page || this.currentPage > 1)) {
                    params.page = options.page || this.currentPage;
                    params.per_page = options.perPage || this.perPage;
                }

                // Ordenamiento
                if (options.sort) {
                    params.sort = options.sort;
                }

                const response = await fetchCatalogProducts(slug, params);
                const data = response.data;

                this.products = data.data || [];
                this.totalProducts = data.total || data.data?.length || 0;
                this.totalPages = Math.ceil(this.totalProducts / this.perPage);
                this.currentPage = data.current_page || 1;
                this.lastPage = data.last_page || null;

                // Extraer información del almacén y empresa si no están disponibles
                if (data.warehouse && !this.currentWarehouse) {
                    this.currentWarehouse = data.warehouse;
                }

                if (data.company && !this.currentCompany) {
                    this.currentCompany = data.company;
                }

                // Actualizar slug del catálogo
                this.catalogSlug = slug;

                // Extraer categorías únicas de los productos
                this.extractCategories();

                return data;
            } catch (error) {
                this.error = error;
                this.products = [];
                this.totalProducts = 0;
                this.totalPages = 1;

                if (error.response?.status === 403) {
                    this.message = 'Token de acceso requerido o inválido';
                    this.isTokenRequired = true;
                } else if (error.response?.status === 404) {
                    this.message = 'Catálogo no encontrado';
                } else if (error.response?.status === 429) {
                    this.message = 'Demasiadas peticiones. Por favor, espera un momento e inténtalo de nuevo.';
                } else {
                    this.message = error.message || 'Error al cargar productos';
                }

                console.error('Error fetching catalog products:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        // 🆕 Nuevo: Buscar producto específico por slug
        async findProductBySlug(slug, productId, accessToken = null) {
            try {
                // Primero intentar encontrar el producto en los datos ya cargados
                const existingProduct = this.products.find((p) => p.id == productId);
                if (existingProduct) {
                    return existingProduct;
                }

                // Usar el endpoint específico para obtener un producto individual
                const params = {};
                if (accessToken || this.accessToken) {
                    params.token = accessToken || this.accessToken;
                }

                const response = await fetchCatalogProduct(slug, productId, params);
                const data = response.data;

                if (data.data) {
                    return data.data;
                }

                return null;
            } catch (error) {
                console.error('Error fetching product by slug:', error);
                if (error.response?.status === 404) {
                    return null;
                } else if (error.response?.status === 403) {
                    this.isTokenRequired = true;
                    throw new Error('Token de acceso requerido');
                }
                throw error;
            }
        },

        // 🆕 Nuevo: Inicializar catálogo por slug
        async initializeCatalog(slug, accessToken = null) {
            this.reset();
            this.catalogSlug = slug;

            if (accessToken) {
                this.accessToken = accessToken;
            }

            // Primero obtener información del catálogo
            await this.loadCatalogInfo(slug, accessToken);

            // Luego cargar los productos
            await this.loadCatalogProducts(slug, { token: accessToken });
        },

        // 🆕 Nuevo: Validar y actualizar token de acceso
        setAccessToken(token) {
            this.accessToken = token;
            this.isTokenRequired = false;
        },

        // 🆕 Nuevo: Generar URL pública del catálogo
        getCatalogUrl(slug = null) {
            const currentSlug = slug || this.catalogSlug;
            if (!currentSlug) return null;

            const baseUrl = window.location.origin;
            let url = `${baseUrl}/tienda/${currentSlug}`;

            if (this.accessToken) {
                url += `?token=${this.accessToken}`;
            }

            return url;
        },

        // 🆕 Nuevo: Generar URL de producto específico
        getProductUrl(productId, slug = null) {
            const currentSlug = slug || this.catalogSlug;
            if (!currentSlug) return null;

            const baseUrl = window.location.origin;
            let url = `${baseUrl}/tienda/${currentSlug}/productos/${productId}`;

            if (this.accessToken) {
                url += `?token=${this.accessToken}`;
            }

            return url;
        },

        // LEGACY: Cargar productos públicos (mantener para retrocompatibilidad)
        async loadPublicProducts(warehouseId, options = {}) {
            this.isLoading = true;
            this.error = null;

            try {
                const params = {};

                // Obtener company_id desde options (viene de la URL)
                const companyId = options.companyId;

                if (!companyId) {
                    throw new Error('ID de empresa requerido para cargar los productos.');
                }

                params.company_id = companyId;

                // Solo agregar paginación si se especifica explícitamente
                if (options.usePagination && (options.page || this.currentPage > 1)) {
                    params.page = options.page || this.currentPage;
                    params.per_page = options.perPage || this.perPage;
                }

                // Aplicar filtros
                if (this.searchQuery.trim()) {
                    params.search = this.searchQuery.trim();
                }

                if (this.selectedCategory) {
                    params.category_id = this.selectedCategory;
                }

                // Soporte para filtro de producto específico
                if (options.productId) {
                    params.product_id = options.productId;
                }

                const response = await fetchPublicProducts(warehouseId, params);
                const data = response.data;

                this.products = data.data || [];
                this.totalProducts = data.total || data.data?.length || 0;
                this.totalPages = Math.ceil(this.totalProducts / this.perPage);
                this.currentPage = data.current_page || 1;
                this.lastPage = data.last_page || null;

                // Extraer información del almacén si está disponible
                if (data.warehouse && !this.currentWarehouse) {
                    this.currentWarehouse = data.warehouse;
                }

                // Extraer información de la empresa si está disponible
                if (data.company && !this.currentCompany) {
                    this.currentCompany = data.company;
                }

                // Extraer categorías únicas de los productos
                this.extractCategories();

                return data;
            } catch (error) {
                this.error = error;
                this.products = [];
                this.totalProducts = 0;
                this.totalPages = 1;

                // Manejo específico de errores según la documentación de la API
                if (error.response?.status === 404) {
                    this.message = 'Almacén no encontrado o no disponible';
                } else if (error.response?.status === 429) {
                    this.message = 'Demasiadas peticiones. Por favor, espera un momento e inténtalo de nuevo.';
                } else if (error.response?.status >= 500) {
                    this.message = 'Error del servidor. Por favor, inténtalo más tarde.';
                } else {
                    this.message = error.message || 'Error al cargar productos';
                }

                console.error('Error fetching public products:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        // Extraer categorías únicas de los productos
        extractCategories() {
            const uniqueCategories = new Map();
            this.products.forEach((product) => {
                if (product.categories && product.categories.length > 0) {
                    product.categories.forEach((category) => {
                        uniqueCategories.set(category.id, {
                            ...category,
                            productCount: (uniqueCategories.get(category.id)?.productCount || 0) + 1
                        });
                    });
                }
            });

            // Ordenar categorías alfabéticamente
            this.categories = Array.from(uniqueCategories.values()).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        },

        // Buscar producto específico por ID
        async findProductById(warehouseId, productId, companyId) {
            try {
                // Primero intentar encontrar el producto en los datos ya cargados
                const existingProduct = this.products.find((p) => p.id == productId);
                if (existingProduct) {
                    return existingProduct;
                }

                if (!companyId) {
                    throw new Error('ID de empresa requerido para buscar el producto.');
                }

                // Usar el endpoint específico para obtener un producto individual
                const response = await fetchPublicProduct(warehouseId, productId, { company_id: companyId });
                const data = response.data;

                if (data.data && data.data.data) {
                    return data.data.data; // La estructura incluye data.data.data según la documentación
                }

                return null;
            } catch (error) {
                console.error('Error fetching product by ID:', error);
                if (error.response?.status === 404) {
                    // Producto no encontrado en este almacén
                    return null;
                }
                throw error;
            }
        },

        // Actualizar filtros
        updateSearch(query) {
            this.searchQuery = query;
            this.currentPage = 1;
        },

        updateCategory(categoryId) {
            this.selectedCategory = categoryId;
            this.currentPage = 1;
        },

        // Filtrar productos localmente por categoría (sin petición al servidor)
        filterByCategory(categoryId) {
            this.selectedCategory = categoryId;
            // No hacemos petición al servidor, solo filtramos localmente
        },

        // Obtener productos de una categoría específica
        getProductsByCategory(categoryId) {
            if (!categoryId) return this.products;
            return this.products.filter((product) => product.categories?.some((cat) => cat.id === categoryId));
        },

        // Alternar filtro de categoría
        toggleCategoryFilter(categoryId) {
            if (this.selectedCategory === categoryId) {
                this.selectedCategory = null;
            } else {
                this.selectedCategory = categoryId;
            }
        },

        updatePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
            }
        },

        // Limpiar filtros
        clearFilters() {
            this.searchQuery = '';
            this.selectedCategory = null;
            this.currentPage = 1;
        },

        // Reset del estado
        reset() {
            this.products = [];
            this.totalProducts = 0;
            this.currentPage = 1;
            this.totalPages = 1;
            this.searchQuery = '';
            this.selectedCategory = null;
            this.categories = [];
            this.currentWarehouse = null;
            this.currentCompany = null;
            this.catalogConfig = null;
            this.catalogSlug = null;
            this.accessToken = null;
            this.isTokenRequired = false;
            this.error = null;
            this.message = '';
            this.isLoading = false;
        },

        // Inicializar tienda pública
        async initializeStore(warehouseId, companyId) {
            this.reset();

            if (!companyId) {
                throw new Error('ID de empresa requerido para acceder al catálogo.');
            }

            await this.loadPublicProducts(warehouseId, { companyId });
        },

        // Utilidades
        formatPrice(price) {
            return new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN'
            }).format(price);
        },

        formatDate(dateString) {
            if (!dateString) return null;
            const date = new Date(dateString);
            const now = new Date();
            const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'Vencido';
            if (diffDays === 0) return 'Vence hoy';
            if (diffDays === 1) return 'Vence mañana';
            if (diffDays <= 7) return `Vence en ${diffDays} días`;

            return date.toLocaleDateString('es-ES');
        },

        getStockStatus(stock) {
            if (stock <= 0) return 'out-of-stock';
            if (stock <= 5) return 'low-stock';
            return 'in-stock';
        },

        // Helpers para acceder a la estructura correcta de datos
        getProductStock(product) {
            return parseFloat(product.stock_info?.available_quantity || 0);
        },

        getProductPrice(product) {
            return parseFloat(product.stock_info?.sale_price || 0);
        },

        getProductCategory(product) {
            return product.categories && product.categories.length > 0 ? product.categories[0] : null;
        },

        getProductBatch(product) {
            return product.stock_info?.batch || null;
        },

        getProductUnit(product) {
            return product.unit || { name: 'Unidad', symbol: 'und' };
        },

        // Generar URL de avatar placeholder
        generateProductAvatar(productName) {
            if (!productName) return '/placeholder-product.jpg';

            // Usar DiceBear API para generar avatares con colores consistentes
            const seed = encodeURIComponent(productName.replace(/\s+/g, ''));
            return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&chars=2&backgroundColor=e3f2fd,f3e5f5,e8f5e8,fff3e0,fce4ec&textColor=1976d2,7b1fa2,388e3c,f57c00,c2185b&fontSize=40`;
        },

        // Obtener imagen del producto con fallback
        getProductImage(product) {
            return product.image_url || this.generateProductAvatar(product.name);
        },

        // Búsqueda inteligente basada en el tipo de entrada
        detectSearchType(query) {
            if (!query) return null;

            const trimmedQuery = query.trim();

            // Detectar si es un código de barras (solo números, 8+ dígitos)
            if (/^\d{8,}$/.test(trimmedQuery)) {
                return 'barcode';
            }

            // Detectar si es un SKU (contiene letras y números con guiones o similar)
            if (/^[A-Z0-9\-_]+$/i.test(trimmedQuery) && trimmedQuery.includes('-')) {
                return 'sku';
            }

            // Por defecto es búsqueda de texto (nombre o marca)
            return 'text';
        },

        // Búsqueda optimizada según el tipo detectado
        async intelligentSearch(warehouseId, query, options = {}) {
            const companyId = options.companyId;

            if (!companyId) {
                throw new Error('ID de empresa requerido para realizar la búsqueda.');
            }

            const searchType = this.detectSearchType(query);
            const params = {
                company_id: companyId,
                search: query.trim()
            };

            // Solo agregar paginación si se especifica
            if (options.usePagination) {
                params.per_page = options.perPage || 20;
                params.page = options.page || 1;
            }

            // Si detectamos que es un código de barras, usar búsqueda exacta
            // que según la documentación tiene máxima prioridad

            try {
                const response = await fetchPublicProducts(warehouseId, params);
                return response.data;
            } catch (error) {
                console.error('Error in intelligent search:', error);
                throw error;
            }
        }
    }
});
