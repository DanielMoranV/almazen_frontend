import {
    fetchCashMovements,
    getCashMovement
} from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

/**
 * Store para gestión de movimientos de caja
 * Permite consultar y filtrar movimientos de efectivo
 */
export const useCashMovementsStore = defineStore('cashMovementsStore', {
    state: () => ({
        movements: [],
        movementDetail: null,
        filters: {
            cash_session_id: null,
            type: '',
            date_from: '',
            date_to: ''
        },
        summary: {
            total_amount: 0,
            sales_amount: 0,
            adjustments_amount: 0,
            expenses_amount: 0,
            deposits_amount: 0,
            withdrawals_amount: 0
        },
        pagination: {
            currentPage: 1,
            perPage: 15,
            total: 0,
            lastPage: 1
        },
        isLoading: false,
        isLoadingDetail: false,
        message: '',
        success: false,
        validationErrors: []
    }),

    getters: {
        movementsList: (state) => state.movements,
        isLoadingMovements: (state) => state.isLoading,
        isLoadingMovementDetail: (state) => state.isLoadingDetail,
        totalMovements: (state) => state.pagination.total,
        movementsSummary: (state) => state.summary,

        // Movimientos por tipo
        salesMovements: (state) => state.movements.filter(m => m.type === 'SALE'),
        expenseMovements: (state) => state.movements.filter(m => m.type === 'EXPENSE'),
        withdrawalMovements: (state) => state.movements.filter(m => m.type === 'WITHDRAWAL'),
        depositMovements: (state) => state.movements.filter(m => m.type === 'DEPOSIT'),
        adjustmentMovements: (state) => state.movements.filter(m => m.type === 'ADJUSTMENT'),

        hasActiveFilters: (state) => {
            return state.filters.cash_session_id ||
                state.filters.type ||
                state.filters.date_from ||
                state.filters.date_to;
        }
    },

    actions: {
        /**
         * Obtiene movimientos de caja con paginación
         */
        async fetchMovements(params = {}) {
            this.isLoading = true;
            try {
                let finalParams = {
                    ...this.filters,
                    ...params,
                    page: params.page || this.pagination.currentPage,
                    per_page: params.per_page || this.pagination.perPage
                };
                // Remove empty or null filters to avoid 422 backend validation errors
                finalParams = Object.fromEntries(
                    Object.entries(finalParams).filter(([, value]) => value !== null && value !== '' && value !== undefined)
                );

                const res = await fetchCashMovements(finalParams);
                console.log('res', res);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    // API devuelve objeto { movements: { data, current_page, ... }, summary: {...} }
                    const paginated = processed.data?.movements || {};
                    this.movements = paginated.data || [];
                    this.summary = processed.data?.summary || {};
                    this.pagination = {
                        currentPage: paginated.current_page || 1,
                        perPage: paginated.per_page || 15,
                        total: paginated.total || 0,
                        lastPage: paginated.last_page || 1
                    };
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        /**
         * Obtiene el detalle completo de un movimiento
         */
        async getMovementDetail(id) {
            this.isLoadingDetail = true;
            try {
                const res = await getCashMovement(id);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    this.movementDetail = processed.data;
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoadingDetail = false;
            }
        },

        /**
         * Obtiene movimientos por sesión específica
         */
        async fetchMovementsBySession(sessionId) {
            await this.fetchMovements({ cash_session_id: sessionId });
        },

        /**
         * Actualiza filtros y recarga movimientos
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
                cash_session_id: null,
                type: '',
                date_from: '',
                date_to: ''
            };
            this.pagination.currentPage = 1;
        },

        /**
         * Cambia de página
         */
        async changePage(page) {
            this.pagination.currentPage = page;
            await this.fetchMovements();
        },

        /**
         * Obtiene resumen de movimientos por tipo
         */
        getMovementTypeSummary() {
            return {
                SALE: {
                    count: this.salesMovements.length,
                    amount: this.summary.sales_amount || 0,
                    label: 'Ventas',
                    icon: 'pi-shopping-cart',
                    color: 'success'
                },
                EXPENSE: {
                    count: this.expenseMovements.length,
                    amount: this.summary.expenses_amount || 0,
                    label: 'Gastos',
                    icon: 'pi-minus-circle',
                    color: 'danger'
                },
                WITHDRAWAL: {
                    count: this.withdrawalMovements.length,
                    amount: this.summary.withdrawals_amount || 0,
                    label: 'Retiros',
                    icon: 'pi-arrow-up',
                    color: 'warning'
                },
                DEPOSIT: {
                    count: this.depositMovements.length,
                    amount: this.summary.deposits_amount || 0,
                    label: 'Depósitos',
                    icon: 'pi-arrow-down',
                    color: 'info'
                },
                ADJUSTMENT: {
                    count: this.adjustmentMovements.length,
                    amount: this.summary.adjustments_amount || 0,
                    label: 'Ajustes',
                    icon: 'pi-refresh',
                    color: 'secondary'
                }
            };
        },

        /**
         * Formatea el tipo de movimiento para display
         */
        formatMovementType(type) {
            const types = {
                'SALE': 'Venta',
                'EXPENSE': 'Gasto',
                'WITHDRAWAL': 'Retiro',
                'DEPOSIT': 'Depósito',
                'ADJUSTMENT': 'Ajuste'
            };
            return types[type] || type;
        },

        /**
         * Obtiene el color para el tipo de movimiento
         */
        getMovementTypeColor(type) {
            const colors = {
                'SALE': 'success',
                'EXPENSE': 'danger',
                'WITHDRAWAL': 'warning',
                'DEPOSIT': 'info',
                'ADJUSTMENT': 'secondary'
            };
            return colors[type] || 'secondary';
        },

        /**
         * Obtiene el icono para el tipo de movimiento
         */
        getMovementTypeIcon(type) {
            const icons = {
                'SALE': 'pi-shopping-cart',
                'EXPENSE': 'pi-minus-circle',
                'WITHDRAWAL': 'pi-arrow-up',
                'DEPOSIT': 'pi-arrow-down',
                'ADJUSTMENT': 'pi-refresh'
            };
            return icons[type] || 'pi-circle';
        },

        /**
         * Calcula total de ingresos (ventas + depósitos)
         */
        getTotalIncome() {
            return (parseFloat(this.summary.sales_amount) || 0) +
                (parseFloat(this.summary.deposits_amount) || 0);
        },

        /**
         * Calcula total de egresos (gastos + retiros)
         */
        getTotalOutcome() {
            return (parseFloat(this.summary.expenses_amount) || 0) +
                (parseFloat(this.summary.withdrawals_amount) || 0);
        },

        /**
         * Calcula el balance neto
         */
        getNetBalance() {
            return this.getTotalIncome() - this.getTotalOutcome() +
                (parseFloat(this.summary.adjustments_amount) || 0);
        }
    }
});