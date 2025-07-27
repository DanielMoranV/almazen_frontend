import { createProduct, deleteProduct, fetchProducts, searchProductsForSale, updateProduct } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useProductsStore = defineStore('productsStore', {
    state: () => ({
        products: [],
        searchTerm: '',
        searchTimeout: null,
        message: '',
        success: false,
        isLoading: false,
        validationErrors: [],

        // Estados específicos para búsqueda de productos para ventas
        saleProducts: [],
        saleSearchTerm: '',
        saleSearchTimeout: null,
        isLoadingSaleSearch: false,
        saleSearchMessage: '',
        selectedWarehouse: null
    }),

    getters: {
        productsList: (state) => state.products,
        isLoadingProducts: (state) => state.isLoading,
        getCurrentSearchTerm: (state) => state.searchTerm,
        totalProducts: (state) => state.products.length,

        // Getters para búsqueda de productos para ventas
        saleProductsList: (state) => state.saleProducts,
        isLoadingSaleProducts: (state) => state.isLoadingSaleSearch,
        getSaleSearchTerm: (state) => state.saleSearchTerm,
        getSaleSearchMessage: (state) => state.saleSearchMessage,
        getSelectedWarehouse: (state) => state.selectedWarehouse,
        totalSaleProducts: (state) => state.saleProducts.length,

        // Getter para productos con stock disponible agrupados por almacén
        productsWithStock: (state) => {
            return state.saleProducts.map((product) => ({
                ...product,
                totalAvailableStock: product.available_stock?.reduce((total, warehouse) => total + warehouse.total_stock, 0) || 0
            }));
        },

        // Getter para obtener productos por almacén específico
        productsByWarehouse: (state) => (warehouseId) => {
            return state.saleProducts.filter((product) => product.available_stock?.some((warehouse) => warehouse.warehouse_id === warehouseId && warehouse.total_stock > 0));
        }
    },
    actions: {
        async fetchProducts() {
            this.isLoading = true;
            try {
                const params = {};

                // Solo agregar parámetros si hay búsqueda
                if (this.searchTerm) {
                    params.search = this.searchTerm;
                }

                const res = await fetchProducts(params);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.products = Array.isArray(processed.data) ? processed.data : [];
                }
            } catch (error) {
                handleProcessError(error, this);
                this.products = [];
            } finally {
                this.isLoading = false;
            }
        },

        async searchProducts(searchTerm = '') {
            // Debounce para evitar demasiadas llamadas
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(async () => {
                this.searchTerm = searchTerm;
                await this.fetchProducts();
            }, 300);
        },

        clearSearch() {
            this.searchTerm = '';
            this.fetchProducts();
        },
        async createProduct(payload) {
            this.isLoading = true;
            try {
                const res = await createProduct(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.products.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteProduct(id) {
            this.isLoading = true;
            try {
                const res = await deleteProduct(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.products = this.products.filter((product) => product.id !== id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updateProduct(payload) {
            this.isLoading = true;
            try {
                const res = await updateProduct(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.products = this.products.map((product) => (product.id === payload.id ? processed.data : product));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // ====== ACCIONES PARA BÚSQUEDA DE PRODUCTOS PARA VENTAS ======

        /**
         * Busca productos disponibles para venta con stock
         * @param {string} searchTerm - Término de búsqueda (código de barras, SKU o nombre)
         * @param {number|null} warehouseId - ID del almacén específico (opcional)
         */
        async searchProductsForSale(searchTerm, warehouseId = null) {
            if (!searchTerm || searchTerm.trim() === '') {
                this.saleProducts = [];
                this.saleSearchMessage = 'Ingrese un término de búsqueda';
                return;
            }

            this.isLoadingSaleSearch = true;
            this.saleSearchMessage = '';

            try {
                const params = { search: searchTerm.trim() };

                // Agregar filtro por almacén si se especifica
                if (warehouseId) {
                    params.warehouse_id = warehouseId;
                }

                const res = await searchProductsForSale(params);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.saleProducts = Array.isArray(processed.data) ? processed.data : [];
                    this.saleSearchTerm = searchTerm;
                    this.selectedWarehouse = warehouseId;

                    // Establecer mensaje según resultados
                    if (this.saleProducts.length === 0) {
                        this.saleSearchMessage = 'No se encontraron productos con stock disponible';
                    } else {
                        this.saleSearchMessage = `Se encontraron ${this.saleProducts.length} producto(s) disponible(s)`;
                    }
                } else {
                    this.saleProducts = [];
                    this.saleSearchMessage = processed.message || 'Error en la búsqueda';
                }
            } catch (error) {
                handleProcessError(error, this);
                this.saleProducts = [];
                this.saleSearchMessage = 'Error al buscar productos';
            } finally {
                this.isLoadingSaleSearch = false;
            }
        },

        /**
         * Busca productos para venta con debounce
         * @param {string} searchTerm - Término de búsqueda
         * @param {number|null} warehouseId - ID del almacén
         * @param {number} delay - Retraso en ms para el debounce (por defecto 300ms)
         */
        async searchProductsForSaleWithDebounce(searchTerm, warehouseId = null, delay = 300) {
            // Limpiar timeout anterior si existe
            if (this.saleSearchTimeout) {
                clearTimeout(this.saleSearchTimeout);
            }

            // Establecer nuevo timeout
            this.saleSearchTimeout = setTimeout(async () => {
                await this.searchProductsForSale(searchTerm, warehouseId);
            }, delay);
        },

        /**
         * Limpia los resultados de búsqueda de productos para venta
         */
        clearSaleSearch() {
            this.saleProducts = [];
            this.saleSearchTerm = '';
            this.saleSearchMessage = '';
            this.selectedWarehouse = null;

            if (this.saleSearchTimeout) {
                clearTimeout(this.saleSearchTimeout);
                this.saleSearchTimeout = null;
            }
        },

        /**
         * Establece el almacén seleccionado para filtrar productos
         * @param {number|null} warehouseId - ID del almacén
         */
        setSelectedWarehouse(warehouseId) {
            this.selectedWarehouse = warehouseId;

            // Si hay un término de búsqueda activo, volver a buscar con el nuevo almacén
            if (this.saleSearchTerm) {
                this.searchProductsForSale(this.saleSearchTerm, warehouseId);
            }
        },

        /**
         * Obtiene información detallada de un producto específico para venta
         * @param {number} productId - ID del producto
         * @param {number|null} warehouseId - ID del almacén específico
         * @returns {Object|null} - Datos del producto o null si no se encuentra
         */
        getSaleProductById(productId, warehouseId = null) {
            const product = this.saleProducts.find((p) => p.id === productId);
            if (!product) return null;

            // Si se especifica un almacén, filtrar solo ese almacén
            if (warehouseId) {
                const warehouseStock = product.available_stock?.find((warehouse) => warehouse.warehouse_id === warehouseId);

                if (warehouseStock) {
                    return {
                        ...product,
                        available_stock: [warehouseStock]
                    };
                }
                return null;
            }

            return product;
        },

        /**
         * Obtiene el stock disponible de un producto en un almacén específico
         * @param {number} productId - ID del producto
         * @param {number} warehouseId - ID del almacén
         * @returns {Object|null} - Información del stock o null si no se encuentra
         */
        getProductWarehouseStock(productId, warehouseId) {
            const product = this.saleProducts.find((p) => p.id === productId);
            if (!product) return null;

            return product.available_stock?.find((warehouse) => warehouse.warehouse_id === warehouseId) || null;
        },

        /**
         * Verifica si un producto tiene lotes próximos a vencer
         * @param {number} productId - ID del producto
         * @param {number} daysThreshold - Días límite para considerar próximo a vencer (por defecto 30)
         * @returns {boolean} - true si tiene lotes próximos a vencer
         */
        hasExpiringBatches(productId, daysThreshold = 30) {
            const product = this.saleProducts.find((p) => p.id === productId);
            if (!product || !product.requires_batches) return false;

            return product.available_stock?.some((warehouse) => warehouse.batches?.some((batch) => batch.days_to_expire !== null && batch.days_to_expire <= daysThreshold && !batch.is_expired)) || false;
        }
    }
});
