import { defineStore } from 'pinia';
import { fetchProviders, createProvider, deleteProvider, updateProvider } from '@/api';
import cache from '@/utils/cache';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useProvidersStore = defineStore('providersStore', {
    state: () => ({
        providers: [],
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        providersList: (state) => state.providers,
        isLoadingProviders: (state) => state.isLoading
    },
    actions: {
        async fetchProviders() {
            this.isLoading = true;
            try {
                const res = await fetchProviders();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.providers = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async createProvider(payload) {
            this.isLoading = true;
            try {
                const res = await createProvider(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.providers.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteProvider(id) {
            this.isLoading = true;
            try {
                const res = await deleteProvider(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.providers = this.providers.filter((provider) => provider.id !== id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updateProvider(payload, id) {
            this.isLoading = true;
            try {
                const res = await updateProvider(payload, id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.providers = this.providers.map((provider) => (provider.id === id ? processed.data : provider));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
