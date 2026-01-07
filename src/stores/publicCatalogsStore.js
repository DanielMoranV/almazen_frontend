import { checkSlugAvailability, fetchPublicCatalogs, getCatalogConfig, regenerateAccessToken, removeAccessToken, updateCatalogConfig } from '@/api';
import { defineStore } from 'pinia';

export const usePublicCatalogsStore = defineStore('publicCatalogsStore', {
    state: () => ({
        catalogs: [],
        stats: {
            total_warehouses: 0,
            public_catalogs: 0,
            private_catalogs: 0,
            with_access_token: 0
        },
        isLoading: false,
        error: null,
        currentConfig: null,
        currentWarehouse: null,
        currentUrls: null,
        currentSlugSuggestions: [],
        newlyGeneratedToken: null,
        slugValidation: {
            isChecking: false,
            isAvailable: null,
            message: '',
            suggestions: []
        }
    }),

    getters: {
        catalogStats: (state) => state.stats,
        isValidatingSlug: (state) => state.slugValidation.isChecking,
        slugValidationResult: (state) => ({
            isAvailable: state.slugValidation.isAvailable,
            message: state.slugValidation.message,
            suggestions: state.slugValidation.suggestions
        })
    },

    actions: {
        /**
         * Carga la lista de todos los catálogos públicos y sus estadísticas.
         */
        async loadPublicCatalogs() {
            this.isLoading = true;
            this.error = null;
            try {
                const response = await fetchPublicCatalogs();
                // CORRECCIÓN: Se asume que la respuesta de axios es response.data = { catalogs, stats }
                if (response.data) {
                    this.catalogs = response.data.catalogs || [];
                    this.stats = response.data.stats || this.stats;

                    console.log('Loaded public catalogs:', this.catalogs);
                    console.log('API Response for public catalogs:', response.data);
                } else {
                    this.catalogs = [];
                }
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al cargar catálogos';
                this.catalogs = [];
                console.error('Error loading public catalogs:', error);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Obtiene la configuración completa de un catálogo para un almacén específico.
         */
        async loadCatalogConfig(warehouseId) {
            this.isLoading = true;
            this.error = null;
            this.currentConfig = null;
            this.currentWarehouse = null;
            try {
                const response = await getCatalogConfig(warehouseId);
                // CORRECCIÓN: Se accede a response.data directamente.
                const responseData = response.data;
                this.currentWarehouse = responseData.warehouse;
                this.currentConfig = responseData.warehouse.public_catalog_config || this.getDefaultConfig();
                this.currentUrls = responseData.urls;
                this.currentSlugSuggestions = responseData.slug_suggestions;
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al cargar la configuración del catálogo';
                console.error(`Error loading catalog config for warehouse ${warehouseId}:`, error);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Actualiza la configuración de un catálogo.
         */
        async updateCatalogConfig(warehouseId, configPayload) {
            this.isLoading = true;
            this.error = null;
            this.clearNewToken();

            try {
                const response = await updateCatalogConfig(warehouseId, configPayload);
                // CORRECCIÓN: Se accede a response.data directamente.
                const responseData = response.data;

                this.currentWarehouse = responseData.warehouse;
                this.currentConfig = responseData.warehouse.public_catalog_config;
                this.currentUrls = responseData.urls;

                if (responseData.access_token) {
                    this.newlyGeneratedToken = responseData.access_token;
                }

                await this.loadPublicCatalogs();
                return response.data;
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al actualizar la configuración';
                console.error('Error updating catalog config:', error);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Verifica la disponibilidad de un slug en tiempo real.
         */
        async checkSlugAvailability(slug, warehouseId = null) {
            if (!slug || slug.trim().length < 3) {
                this.slugValidation = { isChecking: false, isAvailable: false, message: 'El slug debe tener al menos 3 caracteres', suggestions: [] };
                return;
            }

            this.slugValidation.isChecking = true;
            try {
                const response = await checkSlugAvailability(slug.trim(), warehouseId);
                // CORRECCIÓN: Se accede a response.data directamente.
                const responseData = response.data;
                this.slugValidation.isAvailable = responseData.available;
                this.slugValidation.message = responseData.message;
                this.slugValidation.suggestions = responseData.suggestions || [];
            } catch (error) {
                this.slugValidation = { isChecking: false, isAvailable: false, message: 'Error al verificar el slug', suggestions: [] };
                console.error('Error checking slug availability:', error);
            } finally {
                this.slugValidation.isChecking = false;
            }
        },

        /**
         * Regenera el token de acceso para un catálogo.
         */
        async regenerateAccessToken(warehouseId) {
            this.isLoading = true;
            this.error = null;
            this.clearNewToken();

            try {
                const response = await regenerateAccessToken(warehouseId);
                // CORRECCIÓN: Se accede a response.data directamente.
                this.newlyGeneratedToken = response.data.access_token;
                await this.loadPublicCatalogs();
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al regenerar el token';
                console.error('Error regenerating access token:', error);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Elimina el token de acceso de un catálogo.
         */
        async removeAccessToken(warehouseId) {
            this.isLoading = true;
            this.error = null;
            try {
                await removeAccessToken(warehouseId);
                await this.loadPublicCatalogs();
                await this.loadCatalogConfig(warehouseId);
            } catch (error) {
                this.error = error.response?.data?.message || 'Error al eliminar el token';
                console.error('Error removing access token:', error);
            } finally {
                this.isLoading = false;
            }
        },

        clearNewToken() {
            this.newlyGeneratedToken = null;
        },

        getDefaultConfig() {
            return {
                seo_title: '',
                seo_description: '',
                header_color: '#FFFFFF',
                show_stock_quantity: true,
                show_prices: true,
                allow_quotes: false
            };
        },

        reset() {
            this.$reset();
        }
    }
});
