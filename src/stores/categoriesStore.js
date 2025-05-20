import { defineStore } from 'pinia';
import { fetchCategories, createCategory, deleteCategory, updateCategory } from '@/api';
import cache from '@/utils/cache';
import { handleError } from '@/utils/handleError';

export const useCategoriesStore = defineStore('categoriesStore', {
    state: () => ({
        categories: [],
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        categoriesList: (state) => state.categories,
        isLoadingCategories: (state) => state.isLoading
    },
    actions: {
        async fetchCategories() {
            this.isLoading = true;

            try {
                const { data, message, success } = await fetchCategories();
                this.categories = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async createCategory(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createCategory(payload);
                this.categories.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async deleteCategory(id) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteCategory(id);
                this.categories = this.categories.filter((c) => c.id !== id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async updateCategory(payload, id) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateCategory(payload, id);
                this.categories = this.categories.map((c) => (c.id === id ? data : c));
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
