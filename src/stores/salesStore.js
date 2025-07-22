import { createSale, deleteSale, fetchSales, getSale, updateSale } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para operaciones de ventas (POS y otros módulos)
 * Gestiona la creación, edición, eliminación y listado de ventas con paginación y filtros.
 */
export const useSalesStore = defineStore('salesStore', {
    state: () => ({
        sales: [],
        allSales: [], // Todos los datos descargados
        filters: {
            status: '',
            customer_id: null,
            document_number: '',
            date_from: '',
            date_to: '',
            user_id: null
        },
        isLoading: false,
        message: '',
        success: false,
        validationErrors: [],
        currentSearchTerm: null
    }),

    getters: {
        salesList: (state) => state.sales,
        allSalesList: (state) => state.allSales,
        isLoadingSales: (state) => state.isLoading,
        getCurrentSearchTerm: (state) => state.currentSearchTerm,
        totalSales: (state) => state.sales.length,
        hasActiveFilters: (state) => {
            return state.filters.status ||
                state.filters.customer_id ||
                state.filters.document_number ||
                state.filters.date_from ||
                state.filters.date_to ||
                state.filters.user_id;
        }
    },

    actions: {
        /**
         * Obtiene todas las ventas sin paginación
         */
        async fetchSales() {
            this.isLoading = true;
            try {
                // Descargar todos los datos sin paginación
                const res = await fetchSales({ paginate: false });
                const processed = handleProcessSuccess(res, this);

                console.log('fetchSales processed:', processed);

                if (processed.success) {
                    this.allSales = processed.data || [];
                    this.applyLocalFilters(); // Aplicar filtros localmente
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Aplica filtros localmente sin llamar a la API
         */
        applyLocalFilters() {
            let filteredSales = [...this.allSales];

            // Aplicar filtros
            if (this.filters.status) {
                filteredSales = filteredSales.filter(sale => sale.status === this.filters.status);
            }

            if (this.filters.customer_id) {
                filteredSales = filteredSales.filter(sale =>
                    sale.customer_id === this.filters.customer_id ||
                    sale.customer?.id === this.filters.customer_id
                );
            }

            if (this.filters.user_id) {
                filteredSales = filteredSales.filter(sale =>
                    sale.user_id === this.filters.user_id ||
                    sale.user?.id === this.filters.user_id
                );
            }

            if (this.filters.document_number) {
                filteredSales = filteredSales.filter(sale =>
                    sale.document_number?.toLowerCase().includes(this.filters.document_number.toLowerCase())
                );
            }

            if (this.filters.date_from) {
                filteredSales = filteredSales.filter(sale =>
                    new Date(sale.sale_date) >= new Date(this.filters.date_from)
                );
            }

            if (this.filters.date_to) {
                filteredSales = filteredSales.filter(sale =>
                    new Date(sale.sale_date) <= new Date(this.filters.date_to)
                );
            }

            this.sales = filteredSales;
            this.currentSearchTerm = this.hasActiveFilters ? 'active' : null;
        },

        /**
         * Actualiza filtros y aplica filtrado local
         */
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
            this.applyLocalFilters();
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
                        // Agregar a allSales y aplicar filtros
                        this.allSales.unshift(saleRecord);
                        this.applyLocalFilters();
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
                        // Actualizar en allSales
                        const allIndex = this.allSales.findIndex(sale => sale.id === updatedSale.id);
                        if (allIndex !== -1) {
                            this.allSales[allIndex] = updatedSale;
                        }

                        // Reaplicar filtros
                        this.applyLocalFilters();
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
         * Elimina una venta con validaciones de negocio
         */
        async removeSale(saleId) {
            this.isLoading = true;
            try {
                const res = await deleteSale(saleId);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    // Remover de allSales
                    this.allSales = this.allSales.filter(sale => sale.id !== saleId);
                    // Reaplicar filtros
                    this.applyLocalFilters();
                }
                return processed;
            } catch (error) {
                // Manejar errores específicos de reglas de negocio
                if (error.response?.status === 400) {
                    this.message = error.response.data?.message || 'No se puede eliminar esta venta';
                    this.success = false;
                    this.validationErrors = [];
                } else {
                    handleProcessError(error, this);
                }
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Limpia filtros y muestra todos los datos
         */
        clearFilters() {
            this.filters = {
                status: '',
                customer_id: null,
                document_number: '',
                date_from: '',
                date_to: '',
                user_id: null
            };
            this.currentSearchTerm = null;
            this.applyLocalFilters(); // Aplicar filtros localmente (sin filtros = mostrar todo)
        },

        /**
         * Limpia el término de búsqueda actual
         */
        clearSearch() {
            this.currentSearchTerm = null;
        }
    }
});
