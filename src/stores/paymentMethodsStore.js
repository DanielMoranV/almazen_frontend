import { createPaymentMethod, deletePaymentMethod, fetchPaymentMethods, getPaymentMethod, updatePaymentMethod } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para gestión de métodos de pago
 * Permite crear, editar, eliminar y consultar métodos de pago con sus configuraciones
 */
export const usePaymentMethodsStore = defineStore('paymentMethodsStore', {
    state: () => ({
        paymentMethods: [],
        filters: {
            active_only: null,
            type: '',
            requires_cash_register: null
        },
        isLoading: false,
        message: '',
        success: false,
        validationErrors: []
    }),

    getters: {
        paymentMethodsList: (state) => state.paymentMethods,
        isLoadingPaymentMethods: (state) => state.isLoading,
        totalPaymentMethods: (state) => state.paymentMethods.length,

        // Métodos de pago por tipo
        cashMethods: (state) => state.paymentMethods.filter((pm) => pm.type === 'CASH'),
        cardMethods: (state) => state.paymentMethods.filter((pm) => pm.type === 'CARD'),
        transferMethods: (state) => state.paymentMethods.filter((pm) => pm.type === 'TRANSFER'),
        creditMethods: (state) => state.paymentMethods.filter((pm) => pm.type === 'CREDIT'),

        // Métodos activos
        activeMethods: (state) => state.paymentMethods.filter((pm) => pm.is_active),

        // Métodos que requieren caja registradora
        cashRegisterMethods: (state) => state.paymentMethods.filter((pm) => pm.requires_cash_register),

        hasActiveFilters: (state) => {
            return state.filters.active_only !== null || state.filters.type || state.filters.requires_cash_register !== null;
        }
    },

    actions: {
        /**
         * Obtiene todos los métodos de pago
         */
        async fetchPaymentMethods(params = {}) {
            this.isLoading = true;
            try {
                // Limpiar parámetros vacíos o nulos para evitar errores de validación en backend
                const mergedParams = { ...this.filters, ...params };
                const finalParams = Object.fromEntries(Object.entries(mergedParams).filter(([key, v]) => v !== null && v !== undefined && v !== ''));
                const res = await fetchPaymentMethods(finalParams);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.paymentMethods = processed.data || [];
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Obtiene un método de pago específico con estadísticas
         */
        async getPaymentMethod(id) {
            this.isLoading = true;
            try {
                const res = await getPaymentMethod(id);
                return handleProcessSuccess(res, this);
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Crea un nuevo método de pago
         */
        async createPaymentMethod(payload) {
            this.isLoading = true;
            try {
                const res = await createPaymentMethod(payload);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    const newMethod = processed.data;
                    if (newMethod) {
                        this.paymentMethods.unshift(newMethod);
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
         * Actualiza un método de pago existente
         */
        async updatePaymentMethod(payload, id) {
            this.isLoading = true;
            try {
                const res = await updatePaymentMethod(payload, id);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    const updatedMethod = processed.data;
                    if (updatedMethod) {
                        const index = this.paymentMethods.findIndex((pm) => pm.id === updatedMethod.id);
                        if (index !== -1) {
                            this.paymentMethods[index] = updatedMethod;
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
         * Elimina un método de pago
         */
        async removePaymentMethod(id) {
            this.isLoading = true;
            try {
                const res = await deletePaymentMethod(id);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.paymentMethods = this.paymentMethods.filter((pm) => pm.id !== id);
                }
                return processed;
            } catch (error) {
                // Manejar errores específicos (método con transacciones)
                if (error.response?.status === 422) {
                    this.message = error.response.data?.message || 'No se puede eliminar el método de pago';
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
         * Actualiza filtros
         */
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
        },

        /**
         * Limpia filtros
         */
        clearFilters() {
            this.filters = {
                active_only: null,
                type: '',
                requires_cash_register: null
            };
        },

        /**
         * Busca un método de pago por código
         */
        findByCode(code) {
            return this.paymentMethods.find((pm) => pm.code === code);
        },

        /**
         * Obtiene métodos de pago compatibles con una venta
         */
        getMethodsForSale(amount = 0) {
            return this.activeMethods.filter((method) => {
                // Verificar límites de monto
                if (method.min_amount && amount < parseFloat(method.min_amount)) {
                    return false;
                }
                if (method.max_amount && amount > parseFloat(method.max_amount)) {
                    return false;
                }
                return true;
            });
        },

        /**
         * Valida si un método de pago puede ser usado
         */
        validateMethod(methodId, amount, hasReference = false) {
            const method = this.paymentMethods.find((pm) => pm.id === methodId);

            if (!method) {
                return { valid: false, message: 'Método de pago no encontrado' };
            }

            if (!method.is_active) {
                return { valid: false, message: 'Método de pago inactivo' };
            }

            if (method.min_amount && amount < parseFloat(method.min_amount)) {
                return { valid: false, message: `Monto mínimo: ${method.min_amount}` };
            }

            if (method.max_amount && amount > parseFloat(method.max_amount)) {
                return { valid: false, message: `Monto máximo: ${method.max_amount}` };
            }

            if (method.requires_reference && !hasReference) {
                return { valid: false, message: 'Este método requiere número de referencia' };
            }

            return { valid: true, message: 'Método válido' };
        }
    }
});
