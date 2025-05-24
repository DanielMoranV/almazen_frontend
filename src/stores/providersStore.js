import { defineStore } from 'pinia';
import { fetchProviders, createProvider, deleteProvider, updateProvider } from '@/api';
import cache from '@/utils/cache';
import { handleError } from '@/utils/handleError';

export const useProvidersStore = defineStore('providersStore', {
    state: () => ({
        providers: [],
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        providersList: (state) => state.providers,
        isLoadingProviders: (state) => state.isLoading
    },
    actions: {
        async fetchProviders() {
            this.isLoading = true;
            try {
                const { data, message, success } = await fetchProviders();
                this.providers = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async createProvider(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createProvider(payload);
                this.providers.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteProvider(id) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteProvider(id);
                this.providers = this.providers.filter((provider) => provider.id !== id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async updateProvider(payload, id) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateProvider(payload, id);
                this.providers = this.providers.map((provider) => (provider.id === id ? data : provider));
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
