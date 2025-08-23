import {
    cancelCreditPayment,
    cancelCustomerCredit,
    createCreditPayment,
    fetchAgingAnalysis,
    fetchCreditMetrics,
    fetchCreditPayments,
    fetchCreditsTrend,
    fetchCustomerCredits,
    fetchRecentPayments,
    fetchTopCustomersDebt,
    fetchUpcomingCredits,
    getCreditPayment,
    getCustomerCredit,
    getCustomerCreditSummary,
    getCustomerPendingCredits,
    previewCreditPaymentDistribution,
    updateCustomerCredit
} from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useCreditsStore = defineStore('creditsStore', {
    state: () => ({
        // Lista de créditos
        creditsList: [],
        creditsTotal: 0,

        // Crédito seleccionado
        selectedCredit: null,

        // Estados de carga
        isLoadingCredits: false,
        isLoadingCredit: false,
        isProcessingPayment: false,
        isLoadingDashboard: false,

        // Dashboard data
        dashboardMetrics: {
            total_credits: 0,
            total_debt: 0,
            overdue_credits: 0,
            overdue_debt: 0,
            payments_this_month: 0,
            customers_with_debt: 0,
            average_overdue_days: 0,
            recovery_rate: 0,
            overdue_percentage: 0
        },
        creditsTrend: [],
        topCustomersDebt: [],
        upcomingCredits: [],
        recentPayments: [],
        agingAnalysis: [],

        // Filtros y paginación
        currentFilters: {},
        currentPagination: {
            page: 1,
            size: 20
        },

        // Error states
        errors: {
            credits: null,
            dashboard: null,
            payment: null
        },

        // Common store states
        message: '',
        success: false,
        validationErrors: []
    }),

    getters: {
        // Obtener créditos filtrados por estado
        creditsByStatus: (state) => (status) => {
            const credits = Array.isArray(state.creditsList) ? state.creditsList : [];
            return credits.filter((credit) => credit.status === status);
        },

        // Obtener créditos vencidos
        overdueCredits: (state) => {
            const credits = Array.isArray(state.creditsList) ? state.creditsList : [];
            return credits.filter((credit) => credit.is_overdue);
        },

        // Obtener créditos pendientes
        pendingCredits: (state) => {
            const credits = Array.isArray(state.creditsList) ? state.creditsList : [];
            return credits.filter((credit) => credit.status === 'PENDIENTE');
        },

        // Calcular totales de la página actual
        currentPageTotals: (state) => {
            const credits = Array.isArray(state.creditsList) ? state.creditsList : [];
            const totals = credits.reduce(
                (acc, credit) => {
                    acc.totalAmount += credit.total_amount || 0;
                    acc.totalPaid += credit.paid_amount || 0;
                    acc.totalPending += credit.remaining_amount || 0;
                    return acc;
                },
                { totalAmount: 0, totalPaid: 0, totalPending: 0 }
            );

            return totals;
        },

        // Verificar si hay datos del dashboard
        hasDashboardData: (state) => {
            return state.dashboardMetrics.totalCredits > 0 || state.creditsTrend.length > 0 || state.topCustomersDebt.length > 0;
        }
    },

    actions: {
        // Cargar lista de créditos con filtros y paginación
        async fetchCredits(params = {}) {
            this.isLoadingCredits = true;
            this.errors.credits = null;

            try {
                const mergedParams = {
                    ...this.currentFilters,
                    page: this.currentPagination.page,
                    size: this.currentPagination.size,
                    ...params
                };

                const response = await fetchCustomerCredits(mergedParams);

                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Asegurar que creditsList siempre sea un array
                    const dataResults = processed.data.results || processed.data || [];
                    this.creditsList = Array.isArray(dataResults) ? dataResults : [];
                    this.creditsTotal = processed.data.count || processed.data.total || this.creditsList.length;

                    // Actualizar filtros y paginación actuales
                    this.currentFilters = { ...this.currentFilters, ...params };

                    return processed;
                } else {
                    this.errors.credits = processed.message;
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                this.errors.credits = this.message;

                console.warn('Error cargando créditos desde API:', error);

                // En caso de error, cargar datos de ejemplo solo si es error de red
                if (process.env.NODE_ENV === 'development' && (error.message?.includes('conexión') || error.status === 0)) {
                    console.info('Cargando datos de ejemplo debido a error de conexión');
                    this.loadMockCreditsData();
                } else {
                    // Para otros errores, mantener lista vacía
                    this.creditsList = [];
                    this.creditsTotal = 0;
                }

                throw error;
            } finally {
                this.isLoadingCredits = false;
            }
        },

        // Obtener detalle de un crédito específico
        async fetchCreditDetail(creditId) {
            this.isLoadingCredit = true;

            try {
                const response = await getCustomerCredit(creditId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.selectedCredit = processed.data;
                    return processed;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);

                // En caso de error, buscar en la lista local
                const localCredit = this.creditsList.find((c) => c.id === creditId);
                if (localCredit) {
                    this.selectedCredit = localCredit;
                } else {
                    throw error;
                }
            } finally {
                this.isLoadingCredit = false;
            }
        },

        // Procesar pago de crédito
        async processPayment(paymentData) {
            this.isProcessingPayment = true;
            this.errors.payment = null;

            try {
                const response = await createCreditPayment(paymentData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar la lista de créditos localmente
                    await this.fetchCredits({ ...this.currentFilters });

                    return processed;
                } else {
                    this.errors.payment = processed.message;
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                this.errors.payment = this.message;
                throw error;
            } finally {
                this.isProcessingPayment = false;
            }
        },

        // Obtener resumen de crédito de un cliente
        async fetchCustomerCreditSummary(customerId) {
            try {
                // Endpoint funcional confirmado: /customers/{customerId}/credit-summary
                const response = await getCustomerCreditSummary(customerId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    return processed.data;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                console.warn('Error obteniendo resumen de crédito del cliente:', error.message);

                // Retornar null para indicar que no se pudieron obtener datos actualizados
                // El componente debería usar los datos locales del cliente
                return null;
            }
        },

        // Obtener créditos pendientes de un cliente
        async fetchCustomerPendingCredits(customerId) {
            try {
                const response = await getCustomerPendingCredits(customerId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    return processed.data.results || processed.data || [];
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                return [];
            }
        },

        // Cargar datos del dashboard
        async fetchDashboardData(params = {}) {
            this.isLoadingDashboard = true;
            this.errors.dashboard = null;

            try {
                const [metricsResponse, trendResponse, customersResponse, upcomingResponse, paymentsResponse, agingResponse] = await Promise.all([
                    fetchCreditMetrics(params),
                    fetchCreditsTrend(params),
                    fetchTopCustomersDebt(params),
                    fetchUpcomingCredits(params),
                    fetchRecentPayments(params),
                    fetchAgingAnalysis(params)
                ]);

                // Procesar respuestas
                const metricsResult = handleProcessSuccess(metricsResponse, this);
                const trendResult = handleProcessSuccess(trendResponse, this);
                const customersResult = handleProcessSuccess(customersResponse, this);
                const upcomingResult = handleProcessSuccess(upcomingResponse, this);
                const paymentsResult = handleProcessSuccess(paymentsResponse, this);
                const agingResult = handleProcessSuccess(agingResponse, this);

                if (metricsResult.success) {
                    this.dashboardMetrics = metricsResult.data;
                    this.creditsTrend = trendResult.data || [];
                    this.topCustomersDebt = customersResult.data || [];
                    this.upcomingCredits = upcomingResult.data || [];
                    this.recentPayments = paymentsResult.data || [];
                    this.agingAnalysis = agingResult.data || [];
                } else {
                    throw new Error('Error loading dashboard data');
                }

                return true;
            } catch (error) {
                handleProcessError(error, this);
                this.errors.dashboard = this.message;

                console.warn('Error cargando dashboard desde API:', error);

                // En desarrollo, cargar datos de ejemplo solo si es error de red
                if (process.env.NODE_ENV === 'development' && (error.message?.includes('conexión') || error.status === 0)) {
                    console.info('Cargando datos de ejemplo de dashboard debido a error de conexión');
                    this.loadMockDashboardData();
                } else {
                    // Para otros errores, mantener datos vacíos
                    this.dashboardMetrics = {
                        totalCredits: 0,
                        totalAmount: 0,
                        totalPaid: 0,
                        totalPending: 0,
                        overdueCredits: 0,
                        overdueAmount: 0,
                        averagePaymentDays: 0,
                        paymentsToday: 0,
                        paymentsThisMonth: 0
                    };
                    this.creditsTrend = [];
                    this.topCustomersDebt = [];
                    this.upcomingCredits = [];
                    this.recentPayments = [];
                    this.agingAnalysis = [];
                }

                throw error;
            } finally {
                this.isLoadingDashboard = false;
            }
        },

        // Actualizar filtros
        updateFilters(newFilters) {
            this.currentFilters = { ...this.currentFilters, ...newFilters };
        },

        // Actualizar paginación
        updatePagination(newPagination) {
            this.currentPagination = { ...this.currentPagination, ...newPagination };
        },

        // Limpiar filtros
        clearFilters() {
            this.currentFilters = {};
            this.currentPagination = { page: 1, size: 20 };
        },

        // Seleccionar crédito
        selectCredit(credit) {
            this.selectedCredit = credit;
        },

        // Limpiar crédito seleccionado
        clearSelectedCredit() {
            this.selectedCredit = null;
        },

        // Datos de ejemplo para desarrollo
        loadMockCreditsData() {
            this.creditsList = [
                {
                    id: 1,
                    customer: { name: 'Comercial ABC S.A.C.', identity_document: '20123456789' },
                    sale: { document_number: 'V-001234', date: '2024-01-15' },
                    seller: { name: 'Juan Pérez' },
                    total_amount: 5000,
                    paid_amount: 2000,
                    remaining_amount: 3000,
                    status: 'PENDIENTE',
                    status_display: 'Pendiente',
                    credit_date: '2024-01-15',
                    due_date: '2024-02-15',
                    is_overdue: false,
                    days_overdue: 0
                },
                {
                    id: 2,
                    customer: { name: 'Distribuidora XYZ', identity_document: '20987654321' },
                    sale: { document_number: 'V-001235', date: '2024-01-10' },
                    seller: { name: 'María García' },
                    total_amount: 3200,
                    paid_amount: 3200,
                    remaining_amount: 0,
                    status: 'PAGADO',
                    status_display: 'Pagado',
                    credit_date: '2024-01-10',
                    due_date: '2024-02-10',
                    paid_date: '2024-01-25',
                    is_overdue: false,
                    days_overdue: 0
                },
                {
                    id: 3,
                    customer: { name: 'Empresa DEF Ltda.', identity_document: '20456789123' },
                    sale: { document_number: 'V-001220', date: '2023-12-20' },
                    seller: { name: 'Carlos López' },
                    total_amount: 2800,
                    paid_amount: 0,
                    remaining_amount: 2800,
                    status: 'VENCIDO',
                    status_display: 'Vencido',
                    credit_date: '2023-12-20',
                    due_date: '2024-01-20',
                    is_overdue: true,
                    days_overdue: 15
                }
            ];
            this.creditsTotal = this.creditsList.length;
        },

        loadMockDashboardData() {
            this.dashboardMetrics = {
                total_credits: 45,
                total_debt: 125000,
                overdue_credits: 8,
                overdue_debt: 15000,
                payments_this_month: 32000,
                customers_with_debt: 25,
                average_overdue_days: 28.5,
                recovery_rate: 68.5,
                overdue_percentage: 17.8
            };

            this.creditsTrend = [
                { month: 'Ene', credits_granted: 120000, payments_received: 95000 },
                { month: 'Feb', credits_granted: 135000, payments_received: 110000 },
                { month: 'Mar', credits_granted: 110000, payments_received: 125000 },
                { month: 'Abr', credits_granted: 145000, payments_received: 105000 },
                { month: 'May', credits_granted: 125000, payments_received: 140000 },
                { month: 'Jun', credits_granted: 130000, payments_received: 120000 }
            ];

            this.topCustomersDebt = [
                { customer_name: 'Comercial ABC S.A.C.', customer_document: '20123456789', total_debt: 8500, overdue_count: 2 },
                { customer_name: 'Distribuidora XYZ', customer_document: '20987654321', total_debt: 6200, overdue_count: 1 },
                { customer_name: 'Empresa DEF Ltda.', customer_document: '20456789123', total_debt: 4800, overdue_count: 0 }
            ];

            this.upcomingCredits = [
                { customer_name: 'Cliente A', sale_number: 'V-001234', due_date: '2024-01-25', remaining_amount: 1500 },
                { customer_name: 'Cliente B', sale_number: 'V-001235', due_date: '2024-01-27', remaining_amount: 2200 }
            ];

            this.recentPayments = [
                { payment_date: '2024-01-20', customer_name: 'Cliente F', amount: 1200, payment_method: 'Efectivo', credits_count: 1 },
                { payment_date: '2024-01-20', customer_name: 'Cliente G', amount: 800, payment_method: 'Transferencia', credits_count: 2 }
            ];

            this.agingAnalysis = [
                { range: '0-30', amount: 25000 },
                { range: '31-60', amount: 12000 },
                { range: '61-90', amount: 8000 },
                { range: '90+', amount: 5000 }
            ];
        },

        // Actualizar crédito (fecha vencimiento, notas)
        async updateCredit(creditId, payload) {
            try {
                const response = await updateCustomerCredit(creditId, payload);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar en la lista local si existe
                    const index = this.creditsList.findIndex((credit) => credit.id === creditId);
                    if (index !== -1) {
                        this.creditsList[index] = { ...this.creditsList[index], ...processed.data };
                    }
                    return processed;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        // Anular crédito
        async cancelCredit(creditId) {
            try {
                const response = await cancelCustomerCredit(creditId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Actualizar el estado en la lista local
                    const index = this.creditsList.findIndex((credit) => credit.id === creditId);
                    if (index !== -1) {
                        this.creditsList[index].status = 'ANULADO';
                    }
                    return processed;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        // Vista previa de distribución de pago
        async previewPaymentDistribution(payload) {
            try {
                const response = await previewCreditPaymentDistribution(payload);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    return processed.data;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        // Obtener lista de pagos
        async fetchPayments(params = {}) {
            try {
                const response = await fetchCreditPayments(params);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    return processed.data;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        // Obtener detalle de pago
        async fetchPaymentDetail(paymentId) {
            try {
                const response = await getCreditPayment(paymentId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    return processed.data;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        // Anular pago
        async cancelPayment(paymentId) {
            try {
                const response = await cancelCreditPayment(paymentId);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    return processed;
                } else {
                    throw new Error(processed.message);
                }
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            }
        },

        // Limpiar errores
        clearErrors() {
            this.errors = {
                credits: null,
                dashboard: null,
                payment: null
            };
        }
    }
});
