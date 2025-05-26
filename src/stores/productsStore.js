import { defineStore } from 'pinia';
import { fetchProducts, createProduct, deleteProduct, updateProduct } from '@/api';
import cache from '@/utils/cache';
import { handleError } from '@/utils/handleError';

export const useProductsStore = defineStore('productsStore', {
    state: () => ({
        products: [],
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        productsList: (state) => state.products,
        isLoadingProducts: (state) => state.isLoading
    },
    actions: {
        async fetchProducts() {
            this.isLoading = true;

            try {
                const { data, message, success } = await fetchProducts();
                this.products = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async createProduct(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createProduct(payload);
                this.products.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteProduct(id) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteProduct(id);
                this.products = this.products.filter((product) => product.id !== id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async updateProduct(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateProduct(payload, payload.id);
                this.products = this.products.map((product) => (product.id === payload.id ? data : product));
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
