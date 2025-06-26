import { defineStore } from 'pinia';
import { fetchProducts, createProduct, deleteProduct, updateProduct } from '@/api';
import cache from '@/utils/cache';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useProductsStore = defineStore('productsStore', {
    state: () => ({
        products: [],
        searchTerm: '',
        searchTimeout: null,
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        productsList: (state) => state.products,
        isLoadingProducts: (state) => state.isLoading,
        getCurrentSearchTerm: (state) => state.searchTerm,
        totalProducts: (state) => state.products.length
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
        }
    }
});
