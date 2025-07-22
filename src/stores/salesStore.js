import { fetchSales, getSale, createSale, updateSale, deleteSale } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para operaciones de ventas (POS y otros módulos)
 * Gestiona la creación, edición, eliminación y listado de ventas.
 */
export const useSalesStore = defineStore('salesStore', {
    state: () => ({
        sales: [],
        totalSales: 0,
        isLoading: false,
        message: '',
        success: false,
        validationErrors: [],
        currentSearchTerm: null
    }),

    getters: {
        salesList: (state) => state.sales,
        isLoadingSales: (state) => state.isLoading,
        getCurrentSearchTerm: (state) => state.currentSearchTerm
    },

    actions: {
        /**
         * Obtiene todas las ventas
         */
        async fetchSales() {
            this.isLoading = true;
            try {
                const res = await fetchSales();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.sales = processed.data?.sales || [];
                    this.totalSales = this.sales.length;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Obtiene una venta específica
         */
        async getSale(id) {
            this.isLoading = true;
            try {
                const res = await getSale(id);
                return handleProcessSuccess(res, this);
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Crea una venta mediante la API y actualiza el estado.
         * Devuelve la respuesta procesada para que el componente decida qué hacer.
         * @param {Object} payload Datos de la venta.
         * @returns {Promise<Object>} Respuesta de la API procesada.
         */
        async createSale(payload) {
            this.isLoading = true;
            try {
                const res = await createSale(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    const saleRecord = processed.data?.sale || processed.data;
                    if (saleRecord) {
                        this.sales.unshift(saleRecord);
                        this.totalSales++;
                    }
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Actualiza una venta existente
         */
        async updateSale(payload) {
            this.isLoading = true;
            try {
                const res = await updateSale(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    const updatedSale = processed.data?.sale || processed.data;
                    if (updatedSale) {
                        const index = this.sales.findIndex(sale => sale.id === updatedSale.id);
                        if (index !== -1) {
                            this.sales[index] = updatedSale;
                        }
                    }
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Elimina una venta
         */
        async removeSale(saleId) {
            this.isLoading = true;
            try {
                const res = await deleteSale(saleId);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.sales = this.sales.filter(sale => sale.id !== saleId);
                    this.totalSales--;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Limpia el término de búsqueda actual
         */
        clearSearch() {
            this.currentSearchTerm = null;
        }
    }
});
