import { bulkUpdateStocks, deleteStock, fetchProductStocks, fetchStocks, getBulkPreview, getStock, updateStock } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useProductStocksStore = defineStore('productStocksStore', {
    state: () => ({
        // Vista consolidada de productos con stock
        productStocks: [],
        // Gestión individual de stocks
        stocks: [],
        selectedStock: null,
        // Gestión masiva
        bulkPreview: null,
        // Filtros y búsqueda
        searchTerm: '',
        filters: {
            warehouse: null,
            category: null,
            status: null
        },
        // Estados de la aplicación
        message: '',
        success: false,
        isLoading: false,
        isLoadingStock: false,
        isLoadingBulk: false,
        validationErrors: [],
        // Paginación
        pagination: {
            current_page: 1,
            per_page: 15,
            total: 0,
            last_page: 1
        }
    }),

    getters: {
        // Vista consolidada
        stocksList: (state) => state.productStocks,
        isLoadingStocks: (state) => state.isLoading,
        totalProducts: (state) => state.productStocks.length,
        totalQuantity() {
            return this.filteredStocks.reduce((sum, product) => sum + (product.total_stock || 0), 0);
        },
        totalCostValue() {
            return this.filteredStocks.reduce((sum, product) => sum + (product.total_cost_value || 0), 0);
        },
        totalSaleValue() {
            return this.filteredStocks.reduce((sum, product) => sum + (product.total_sale_value || 0), 0);
        },
        lowStockProducts: (state) => {
            return state.productStocks.filter((product) => {
                // Verificar si algún almacén tiene stock bajo
                return (
                    product.stock_by_warehouse?.some((warehouse) => {
                        const minStock = warehouse.min_stock || 10;
                        return warehouse.total_stock > 0 && warehouse.total_stock <= minStock;
                    }) || false
                );
            }).length;
        },
        outOfStockProducts: (state) => {
            return state.productStocks.filter((product) => (product.total_stock || 0) === 0).length;
        },
        filteredStocks: (state) => {
            let result = state.productStocks;

            // Filtrar por término de búsqueda
            if (state.searchTerm) {
                const query = state.searchTerm.toLowerCase();
                result = result.filter((product) => product.name?.toLowerCase().includes(query) || product.sku?.toLowerCase().includes(query) || product.barcode?.toLowerCase().includes(query));
            }

            // Filtrar por almacén
            if (state.filters.warehouse) {
                result = result
                    .filter((product) => product.stock_by_warehouse?.some((warehouse) => warehouse.warehouse_id === state.filters.warehouse))
                    .map((product) => {
                        // Crear una copia del producto con solo el almacén seleccionado
                        const filteredWarehouse = product.stock_by_warehouse?.find((warehouse) => warehouse.warehouse_id === state.filters.warehouse);

                        if (filteredWarehouse) {
                            // Usar los valores específicos del almacén si están disponibles
                            // o calcularlos basados en la proporción del stock
                            const warehouseStock = filteredWarehouse.total_stock || 0;
                            const totalProductStock = product.total_stock || 1; // Evitar división por cero

                            // Si el almacén tiene sus propios valores de costo y venta, usarlos
                            const costValue = filteredWarehouse.total_cost_value !== undefined ? filteredWarehouse.total_cost_value : (product.total_cost_value || 0) * (warehouseStock / totalProductStock);

                            const saleValue = filteredWarehouse.total_sale_value !== undefined ? filteredWarehouse.total_sale_value : (product.total_sale_value || 0) * (warehouseStock / totalProductStock);

                            return {
                                ...product,
                                stock_by_warehouse: [filteredWarehouse],
                                total_stock: warehouseStock,
                                total_cost_value: costValue,
                                total_sale_value: saleValue
                            };
                        }
                        return product;
                    });
            }

            // Filtrar por estado de stock
            if (state.filters.status) {
                switch (state.filters.status) {
                    case 'in_stock':
                        result = result.filter((product) => {
                            const totalStock = state.filters.warehouse ? product.stock_by_warehouse?.[0]?.total_stock || 0 : product.total_stock || 0;
                            return totalStock > 10;
                        });
                        break;
                    case 'low_stock':
                        result = result.filter((product) => {
                            const totalStock = state.filters.warehouse ? product.stock_by_warehouse?.[0]?.total_stock || 0 : product.total_stock || 0;
                            return totalStock > 0 && totalStock <= 10;
                        });
                        break;
                    case 'out_of_stock':
                        result = result.filter((product) => {
                            const totalStock = state.filters.warehouse ? product.stock_by_warehouse?.[0]?.total_stock || 0 : product.total_stock || 0;
                            return totalStock === 0;
                        });
                        break;
                }
            }

            return result;
        },

        // Gestión individual
        individualStocks: (state) => state.stocks,
        currentStock: (state) => state.selectedStock,

        // Gestión masiva
        bulkPreviewData: (state) => state.bulkPreview,

        // Estados de carga
        isLoadingIndividual: (state) => state.isLoadingStock,
        isLoadingBulkOperations: (state) => state.isLoadingBulk
    },

    actions: {
        async fetchProductStocks(params = {}) {
            this.isLoading = true;
            try {
                const queryParams = {
                    search: this.searchTerm,
                    paginate: params.paginate || false,
                    per_page: params.per_page || 15,
                    ...params
                };

                const res = await fetchProductStocks(queryParams);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    // Manejar respuesta paginada o no paginada
                    if (processed.data && Array.isArray(processed.data)) {
                        this.productStocks = processed.data;
                    } else if (processed.data && processed.data.data) {
                        // Respuesta paginada
                        this.productStocks = processed.data.data || [];
                        this.pagination = {
                            current_page: processed.data.current_page || 1,
                            per_page: processed.data.per_page || 15,
                            total: processed.data.total || 0,
                            last_page: processed.data.last_page || 1
                        };
                    } else {
                        this.productStocks = [];
                    }
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        setSearchTerm(term) {
            this.searchTerm = term;
        },

        setWarehouseFilter(warehouseId) {
            this.filters.warehouse = warehouseId;
        },

        setCategoryFilter(categoryId) {
            this.filters.category = categoryId;
        },

        setStatusFilter(status) {
            this.filters.status = status;
        },

        clearFilters() {
            this.searchTerm = '';
            this.filters = {
                warehouse: null,
                category: null,
                status: null
            };
        },

        clearMessage() {
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        },

        // Individual Stock Management
        async fetchStocks(params = {}) {
            this.isLoading = true;
            try {
                const res = await fetchStocks(params);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.stocks = processed.data || [];
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async getStockById(stockId) {
            this.isLoadingStock = true;
            try {
                const res = await getStock(stockId);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.selectedStock = processed.data;
                    return processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingStock = false;
            }
        },

        async updateStockById(stockId, payload) {
            this.isLoadingStock = true;
            try {
                const res = await updateStock(stockId, payload);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    // Update stock in stocks array if it exists
                    const index = this.stocks.findIndex((stock) => stock.id === stockId);
                    if (index !== -1) {
                        this.stocks[index] = { ...this.stocks[index], ...processed.data };
                    }

                    // Update selectedStock if it's the same
                    if (this.selectedStock && this.selectedStock.id === stockId) {
                        this.selectedStock = { ...this.selectedStock, ...processed.data };
                    }

                    return processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingStock = false;
            }
        },

        async deleteStockById(stockId) {
            this.isLoadingStock = true;
            try {
                const res = await deleteStock(stockId);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    // Remove from stocks array
                    this.stocks = this.stocks.filter((stock) => stock.id !== stockId);

                    // Clear selectedStock if it's the deleted one
                    if (this.selectedStock && this.selectedStock.id === stockId) {
                        this.selectedStock = null;
                    }

                    return true;
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingStock = false;
            }
        },

        // Bulk Operations
        async getBulkPreviewData(productId, params = {}) {
            this.isLoadingBulk = true;
            try {
                const res = await getBulkPreview(productId, params);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.bulkPreview = processed.data;
                    return processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingBulk = false;
            }
        },

        async bulkUpdateProductStocks(productId, payload) {
            this.isLoadingBulk = true;
            try {
                const res = await bulkUpdateStocks(productId, payload);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    // Refresh product stocks after bulk update
                    await this.fetchProductStocks();
                    return processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingBulk = false;
            }
        },

        clearBulkPreview() {
            this.bulkPreview = null;
        },

        clearSelectedStock() {
            this.selectedStock = null;
        }
    }
});
