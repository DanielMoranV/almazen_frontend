import { createSale, deleteSale, fetchSales, getSale, updateSale } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';

// Fechas por defecto para filtros (hoy y mañana)
const today = new Date();
const defaultDateFrom = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const defaultDateTo = tomorrow.toISOString().split('T')[0];
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
            date_from: defaultDateFrom,
            date_to: defaultDateTo,
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
            return state.filters.status || state.filters.customer_id || state.filters.document_number || state.filters.date_from || state.filters.date_to || state.filters.user_id;
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
                filteredSales = filteredSales.filter((sale) => sale.status === this.filters.status);
            }

            if (this.filters.customer_id) {
                filteredSales = filteredSales.filter((sale) => sale.customer_id === this.filters.customer_id || sale.customer?.id === this.filters.customer_id);
            }

            if (this.filters.user_id) {
                filteredSales = filteredSales.filter((sale) => sale.user_id === this.filters.user_id || sale.user?.id === this.filters.user_id);
            }

            if (this.filters.document_number) {
                filteredSales = filteredSales.filter((sale) => sale.document_number?.toLowerCase().includes(this.filters.document_number.toLowerCase()));
            }

            if (this.filters.date_from) {
                filteredSales = filteredSales.filter((sale) => new Date(sale.sale_date) >= new Date(this.filters.date_from));
            }

            if (this.filters.date_to) {
                filteredSales = filteredSales.filter((sale) => new Date(sale.sale_date) <= new Date(this.filters.date_to));
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
         * Soporta múltiples métodos de pago según la nueva documentación.
         * @param {Object} payload Datos de la venta con payment_methods.
         * @returns {Promise<Object>} Respuesta de la API procesada.
         */
        async createSale(payload) {
            this.isLoading = true;
            try {
                // Validar estructura de payment_methods si existe
                if (payload.payment_methods && Array.isArray(payload.payment_methods)) {
                    const validation = this.validatePaymentMethods(payload.payment_methods, payload.total_amount);
                    if (!validation.valid) {
                        throw new Error(validation.message);
                    }
                }

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
                        const allIndex = this.allSales.findIndex((sale) => sale.id === updatedSale.id);
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
                    this.allSales = this.allSales.filter((sale) => sale.id !== saleId);
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
        },

        /**
         * Valida los métodos de pago para una venta
         * @param {Array} paymentMethods Array de métodos de pago
         * @param {Number} totalAmount Total de la venta
         * @returns {Object} Resultado de validación
         */
        validatePaymentMethods(paymentMethods, totalAmount) {
            if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
                return { valid: false, message: 'Debe especificar al menos un método de pago' };
            }

            if (paymentMethods.length > 10) {
                return { valid: false, message: 'Máximo 10 métodos de pago por venta' };
            }

            // Validar suma de pagos
            const paymentSum = paymentMethods.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
            const tolerance = 0.01; // Tolerancia de 1 centavo

            if (Math.abs(paymentSum - totalAmount) > tolerance) {
                return {
                    valid: false,
                    message: `La suma de los pagos (${paymentSum.toFixed(2)}) debe coincidir con el total (${totalAmount.toFixed(2)})`
                };
            }

            // Validar cada método de pago
            const cashMethods = paymentMethods.filter((pm) => pm.type === 'CASH' || pm.method_code === 'CASH');
            if (cashMethods.length > 1) {
                return { valid: false, message: 'Solo se permite un método de pago en efectivo por venta' };
            }

            // Validar estructura de cada método
            for (let i = 0; i < paymentMethods.length; i++) {
                const pm = paymentMethods[i];

                if (!pm.method_id) {
                    return { valid: false, message: `Método de pago ${i + 1}: ID requerido` };
                }

                if (!pm.amount || pm.amount <= 0) {
                    return { valid: false, message: `Método de pago ${i + 1}: Monto debe ser mayor a cero` };
                }

                // Validar formato de monto (máximo 2 decimales)
                const amountStr = parseFloat(pm.amount).toFixed(2);
                if (!/^\d+(\.\d{1,2})?$/.test(amountStr)) {
                    return { valid: false, message: `Método de pago ${i + 1}: Formato de monto inválido` };
                }

                // Validar referencia si es requerida
                if (pm.requires_reference && !pm.reference) {
                    return { valid: false, message: `Método de pago ${i + 1}: Requiere número de referencia` };
                }

                // Validar formato de referencia
                if (pm.reference && !/^[a-zA-Z0-9\s\-_#]*$/.test(pm.reference)) {
                    return { valid: false, message: `Método de pago ${i + 1}: Formato de referencia inválido` };
                }
            }

            return { valid: true, message: 'Métodos de pago válidos' };
        },

        /**
         * Formatea los métodos de pago para la API
         * @param {Array} paymentMethods Métodos de pago del componente
         * @returns {Array} Métodos formateados para la API
         */
        formatPaymentMethodsForAPI(paymentMethods) {
            return paymentMethods.map((pm) => ({
                method_id: pm.method_id || pm.id,
                amount: parseFloat(pm.amount).toFixed(2),
                reference: pm.reference || null
            }));
        },

        /**
         * Construye el payload completo para venta con múltiples métodos de pago
         * @param {Object} saleData Datos básicos de la venta
         * @param {Array} paymentMethods Métodos de pago
         * @returns {Object} Payload completo para la API
         */
        buildSalePayloadWithPayments(saleData, paymentMethods) {
            const payload = {
                ...saleData,
                payment_methods: this.formatPaymentMethodsForAPI(paymentMethods)
            };

            // Remover payment_method antiguo si existe
            delete payload.payment_method;

            return payload;
        }
    }
});
