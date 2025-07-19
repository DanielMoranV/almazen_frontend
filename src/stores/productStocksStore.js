import { defineStore } from 'pinia';
import { fetchProductStocks } from '@/api';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useProductStocksStore = defineStore('productStocksStore', {
    state: () => ({
        productStocks: [],
        searchTerm: '',
        filters: {
            warehouse: null,
            category: null,
            status: null
        },
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        stocksList: (state) => state.productStocks,
        isLoadingStocks: (state) => state.isLoading,
        totalProducts: (state) => state.productStocks.length,
        totalQuantity: (state) => {
            return state.productStocks.reduce((sum, product) => sum + product.total_stock, 0);
        },
        lowStockProducts: (state) => {
            return state.productStocks.filter(product => {
                return product.total_stock > 0 && product.total_stock <= 10; // Assuming 10 as low stock threshold
            }).length;
        },
        outOfStockProducts: (state) => {
            return state.productStocks.filter(product => product.total_stock === 0).length;
        },
        filteredStocks: (state) => {
            let result = state.productStocks;
            
            // Filter by search term
            if (state.searchTerm) {
                const query = state.searchTerm.toLowerCase();
                result = result.filter(product => 
                    product.name.toLowerCase().includes(query) || 
                    product.sku.toLowerCase().includes(query) ||
                    (product.barcode && product.barcode.toLowerCase().includes(query))
                );
            }
            
            // Filter by warehouse
            if (state.filters.warehouse) {
                result = result.filter(product => 
                    product.warehouses.some(warehouse => warehouse.id === state.filters.warehouse)
                );
            }
            
            // Filter by status
            if (state.filters.status) {
                switch (state.filters.status) {
                    case 'in_stock':
                        result = result.filter(product => product.total_stock > 10);
                        break;
                    case 'low_stock':
                        result = result.filter(product => product.total_stock > 0 && product.total_stock <= 10);
                        break;
                    case 'out_of_stock':
                        result = result.filter(product => product.total_stock === 0);
                        break;
                }
            }
            
            return result;
        }
    },

    actions: {
        async fetchProductStocks(params = {}) {
            this.isLoading = true;
            try {
                const queryParams = {
                    search: this.searchTerm,
                    ...params
                };
                
                const res = await fetchProductStocks(queryParams);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    this.productStocks = processed.data || [];
                }
                
                return processed;
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
        }
    }
});