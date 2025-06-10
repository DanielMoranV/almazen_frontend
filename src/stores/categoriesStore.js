import { defineStore } from 'pinia';
import { fetchCategories, createCategory, deleteCategory, updateCategory } from '@/api';
import cache from '@/utils/cache';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useCategoriesStore = defineStore('categoriesStore', {
    state: () => ({
        categories: [],
        category: cache.getItem('category') || null,
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        categoriesList: (state) => state.categories,
        isLoadingCategories: (state) => state.isLoading
    },
    actions: {
        async fetchCategories() {
            this.resetState();
            try {
                const res = await fetchCategories();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.categories = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async createCategory(payload) {
            this.resetState();
            try {
                const res = await createCategory(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.categories.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async removeCategory(id) {
            this.resetState();
            try {
                const res = await deleteCategory(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.categories = this.categories.filter((category) => category.id !== id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updateCategory(payload) {
            this.resetState();
            try {
                const res = await updateCategory(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.categories = this.categories.map((category) => (category.id === payload.id ? processed.data : category));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        resetState() {
            this.isLoading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        }
    }
});
