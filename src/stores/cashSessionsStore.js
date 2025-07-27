import { closeCashSession, getCashSessionHistory, getCashSessionReport, getCurrentCashSession, openCashSession } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para gestión de sesiones de caja
 * Permite abrir, cerrar, consultar sesiones y obtener reportes
 */
export const useCashSessionsStore = defineStore('cashSessionsStore', {
    state: () => ({
        currentSession: null,
        sessionHistory: [],
        sessionReport: null,
        filters: {
            status: '',
            date_from: '',
            date_to: '',
            cash_register_id: null
        },
        pagination: {
            currentPage: 1,
            perPage: 15,
            total: 0,
            lastPage: 1
        },
        isLoading: false,
        isLoadingHistory: false,
        isLoadingReport: false,
        message: '',
        success: false,
        validationErrors: []
    }),

    getters: {
        hasActiveSession: (state) => state.currentSession !== null && state.currentSession.status === 'OPEN',
        isLoadingSessions: (state) => state.isLoading,
        isLoadingSessionHistory: (state) => state.isLoadingHistory,
        isLoadingSessionReport: (state) => state.isLoadingReport,
        sessionsList: (state) => state.sessionHistory,
        totalSessions: (state) => state.pagination.total,

        // Información de la sesión actual
        currentSessionInfo: (state) => {
            if (!state.currentSession) return null;

            return {
                id: state.currentSession.id,
                cashier: state.currentSession.user?.name,
                cashRegister: state.currentSession.cash_register?.name,
                openedAt: state.currentSession.opened_at,
                openingAmount: parseFloat(state.currentSession.opening_amount || 0),
                expectedAmount: parseFloat(state.currentSession.summary?.expected_amount || 0),
                duration: state.currentSession.summary?.duration_minutes || 0,
                salesCount: state.currentSession.summary?.transaction_count || 0,
                totalSales: parseFloat(state.currentSession.summary?.total_sales || 0)
            };
        },

        hasActiveFilters: (state) => {
            return state.filters.status || state.filters.date_from || state.filters.date_to || state.filters.cash_register_id;
        }
    },

    actions: {
        /**
         * Abre una nueva sesión de caja
         */
        async openSession(payload) {
            this.isLoading = true;
            try {
                const res = await openCashSession(payload);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    const sessionData = processed.data?.session || null;
                    const summaryData = processed.data?.summary || null;
                    this.currentSession = sessionData ? { ...sessionData, summary: summaryData } : null;
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
         * Obtiene la sesión activa del usuario actual
         */
        async getCurrentSession() {
            this.isLoading = true;
            try {
                const res = await getCurrentCashSession();
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    console.log('getCurrentSession processed:', processed);
                    const sessionData = processed.data?.session || null;
                    const summaryData = processed.data?.summary || null;
                    this.currentSession = sessionData ? { ...sessionData, summary: summaryData } : null;
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Cierra una sesión de caja
         */
        async closeSession(sessionId, payload) {
            this.isLoading = true;
            try {
                const res = await closeCashSession(sessionId, payload);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.currentSession = null; // Limpiar sesión actual
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
         * Obtiene el reporte detallado de una sesión
         */
        async getSessionReport(sessionId) {
            this.isLoadingReport = true;
            try {
                const res = await getCashSessionReport(sessionId);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    console.log('getSessionReport processed:', processed);
                    this.sessionReport = processed.data;
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingReport = false;
            }
        },

        /**
         * Obtiene el historial de sesiones con paginación
         */
        async fetchSessionHistory(params = {}) {
            this.isLoadingHistory = true;
            try {
                let finalParams = {
                    ...this.filters,
                    ...params,
                    page: params.page || this.pagination.currentPage,
                    per_page: params.per_page || this.pagination.perPage
                };
                // Eliminar claves vacías para evitar errores 422
                Object.keys(finalParams).forEach((key) => {
                    const val = finalParams[key];
                    if (val === '' || val === null || typeof val === 'undefined') {
                        delete finalParams[key];
                    }
                });

                const res = await getCashSessionHistory(finalParams);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.sessionHistory = processed.data?.data || [];
                    this.pagination = {
                        currentPage: processed.data?.current_page || 1,
                        perPage: processed.data?.per_page || 15,
                        total: processed.data?.total || 0,
                        lastPage: processed.data?.last_page || 1
                    };
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoadingHistory = false;
            }
        },

        /**
         * Actualiza filtros y recarga historial
         */
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
            this.pagination.currentPage = 1; // Reset página
        },

        /**
         * Limpia filtros
         */
        clearFilters() {
            this.filters = {
                status: '',
                date_from: '',
                date_to: '',
                cash_register_id: null
            };
            this.pagination.currentPage = 1;
        },

        /**
         * Cambia de página en el historial
         */
        async changePage(page) {
            this.pagination.currentPage = page;
            await this.fetchSessionHistory();
        },

        /**
         * Valida si se puede abrir una nueva sesión
         */
        validateOpenSession(payload) {
            if (this.hasActiveSession) {
                return {
                    valid: false,
                    message: 'Ya tiene una sesión de caja activa'
                };
            }

            if (!payload.cash_register_id) {
                return {
                    valid: false,
                    message: 'Debe seleccionar una caja registradora'
                };
            }

            if (!payload.opening_amount || payload.opening_amount <= 0) {
                return {
                    valid: false,
                    message: 'El monto de apertura debe ser mayor a cero'
                };
            }

            return { valid: true, message: 'Datos válidos para apertura' };
        },

        /**
         * Valida si se puede cerrar una sesión
         */
        validateCloseSession(payload) {
            if (!this.hasActiveSession) {
                return {
                    valid: false,
                    message: 'No tiene una sesión activa para cerrar'
                };
            }

            if (!payload.actual_amount || payload.actual_amount < 0) {
                return {
                    valid: false,
                    message: 'Debe especificar el monto real de cierre'
                };
            }

            return { valid: true, message: 'Datos válidos para cierre' };
        },

        /**
         * Calcula diferencia entre monto esperado y real
         */
        calculateDifference(actualAmount) {
            if (!this.currentSession || !actualAmount) return 0;

            const expected = parseFloat(this.currentSession.expected_amount || 0);
            const actual = parseFloat(actualAmount);

            return actual - expected;
        },

        /**
         * Verifica si hay discrepancia significativa
         */
        hasSignificantDiscrepancy(actualAmount, maxDiscrepancy = 5) {
            const difference = Math.abs(this.calculateDifference(actualAmount));
            return difference > maxDiscrepancy;
        },

        /**
         * Refresca la sesión actual
         */
        async refreshCurrentSession() {
            if (this.hasActiveSession) {
                await this.getCurrentSession();
            }
        }
    }
});
