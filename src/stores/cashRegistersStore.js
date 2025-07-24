import { 
    fetchCashRegisters, 
    getCashRegister, 
    createCashRegister, 
    updateCashRegister, 
    deleteCashRegister 
} from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para gestión de cajas registradoras
 * Permite crear, editar, eliminar y consultar cajas registradoras
 */
export const useCashRegistersStore = defineStore('cashRegistersStore', {
    state: () => ({
        cashRegisters: [],
        filters: {
            active_only: null
        },
        isLoading: false,
        message: '',
        success: false,
        validationErrors: []
    }),

    getters: {
        cashRegistersList: (state) => state.cashRegisters,
        isLoadingCashRegisters: (state) => state.isLoading,
        totalCashRegisters: (state) => state.cashRegisters.length,
        
        // Cajas activas
        activeCashRegisters: (state) => state.cashRegisters.filter(cr => cr.is_active),
        
        // Cajas con sesiones activas
        cashRegistersWithActiveSessions: (state) => 
            state.cashRegisters.filter(cr => cr.status?.has_active_sessions),
        
        // Cajas disponibles para nueva sesión
        availableForNewSession: (state) => 
            state.activeCashRegisters.filter(cr => cr.status?.can_open_session),
        
        hasActiveFilters: (state) => {
            return state.filters.active_only !== null;
        }
    },

    actions: {
        /**
         * Obtiene todas las cajas registradoras
         */
        async fetchCashRegisters(params = {}) {
            this.isLoading = true;
            try {
                const finalParams = { ...this.filters, ...params };
                const res = await fetchCashRegisters(finalParams);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.cashRegisters = processed.data || [];
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Obtiene una caja registradora específica con estadísticas
         */
        async getCashRegister(id) {
            this.isLoading = true;
            try {
                const res = await getCashRegister(id);
                return handleProcessSuccess(res, this);
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Crea una nueva caja registradora
         */
        async createCashRegister(payload) {
            this.isLoading = true;
            try {
                const res = await createCashRegister(payload);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    const newRegister = processed.data;
                    if (newRegister) {
                        this.cashRegisters.unshift(newRegister);
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
         * Actualiza una caja registradora existente
         */
        async updateCashRegister(payload, id) {
            this.isLoading = true;
            try {
                const res = await updateCashRegister(payload, id);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    const updatedRegister = processed.data;
                    if (updatedRegister) {
                        const index = this.cashRegisters.findIndex(cr => cr.id === updatedRegister.id);
                        if (index !== -1) {
                            this.cashRegisters[index] = updatedRegister;
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
         * Elimina una caja registradora
         */
        async removeCashRegister(id) {
            this.isLoading = true;
            try {
                const res = await deleteCashRegister(id);
                const processed = handleProcessSuccess(res, this);
                
                if (processed.success) {
                    this.cashRegisters = this.cashRegisters.filter(cr => cr.id !== id);
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
                active_only: null
            };
        },

        /**
         * Busca una caja por código
         */
        findByCode(code) {
            return this.cashRegisters.find(cr => cr.code === code);
        },

        /**
         * Valida si se puede abrir una sesión en una caja
         */
        canOpenSession(registerId) {
            const register = this.cashRegisters.find(cr => cr.id === registerId);
            
            if (!register) {
                return { valid: false, message: 'Caja registradora no encontrada' };
            }
            
            if (!register.is_active) {
                return { valid: false, message: 'Caja registradora inactiva' };
            }
            
            if (!register.status?.can_open_session) {
                return { valid: false, message: 'No se puede abrir una nueva sesión en esta caja' };
            }
            
            return { valid: true, message: 'Caja disponible para nueva sesión' };
        },

        /**
         * Obtiene cajas con límites de efectivo
         */
        getRegistersWithCashLimits() {
            return this.activeCashRegisters.filter(cr => cr.max_cash_amount > 0);
        },

        /**
         * Verifica si un monto excede el límite de una caja
         */
        validateCashAmount(registerId, amount) {
            const register = this.cashRegisters.find(cr => cr.id === registerId);
            
            if (!register || !register.max_cash_amount) {
                return { valid: true, message: 'Sin límite de efectivo' };
            }
            
            if (amount > parseFloat(register.max_cash_amount)) {
                return { 
                    valid: false, 
                    message: `Monto excede el límite máximo de S/ ${register.max_cash_amount}` 
                };
            }
            
            return { valid: true, message: 'Monto dentro del límite' };
        }
    }
});