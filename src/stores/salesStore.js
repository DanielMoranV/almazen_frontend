import { createSale } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para operaciones de ventas (POS y otros módulos)
 * Gestiona la creación de ventas y expone estado de carga y mensajes.
 */
export const useSalesStore = defineStore('salesStore', {
    state: () => ({
        sales: [],
        isLoading: false,
        message: '',
        success: false,
        validationErrors: []
    }),

    getters: {
        salesList: (state) => state.sales,
        isLoadingSales: (state) => state.isLoading
    },

    actions: {
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
                    // En la mayoría de endpoints sale devuelta en processed.data.sale o processed.data
                    const saleRecord = processed.data?.sale || processed.data;
                    if (saleRecord) {
                        this.sales.unshift(saleRecord);
                    }
                }
                return processed; // devolver para uso en el componente
            } catch (error) {
                handleProcessError(error, this);
                throw error; // relanzar para que el componente maneje errores específicos
            } finally {
                this.isLoading = false;
            }
        }
    }
});
