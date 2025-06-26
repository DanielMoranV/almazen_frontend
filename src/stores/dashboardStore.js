import { defineStore } from 'pinia';
import { fetchDashboardMetrics, fetchLowStockProducts, fetchExpiringProducts } from '@/api';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useDashboardStore = defineStore('dashboardStore', {
    state: () => ({
        metrics: {
            total_products: 0,
            active_products: 0,
            sales_today: 0,
            sales_this_month: 0,
            sales_count_today: 0,
            purchases_pending: 0,
            purchases_this_month: 0,
            low_stock_count: 0,
            out_of_stock_count: 0,
            inventory_value: 0,
            last_updated: null
        },
        lowStockProducts: [],
        lowStockSummary: {
            total_alerts: 0,
            critical_alerts: 0
        },
        expiringProducts: [],
        expiringProductsSummary: {
            total_batches: 0,
            critical_batches: 0
        },
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        getDashboardMetrics: (state) => state.metrics,
        getLowStockProducts: (state) => state.lowStockProducts,
        getLowStockSummary: (state) => state.lowStockSummary,
        getExpiringProducts: (state) => state.expiringProducts,
        getExpiringProductsSummary: (state) => state.expiringProductsSummary,
        isLoadingDashboard: (state) => state.isLoading,
        
        // Computed getters for quick insights
        getTotalSalesGrowth: (state) => {
            const dailyAverage = state.metrics.sales_this_month / 30;
            return dailyAverage > 0 ? ((state.metrics.sales_today / dailyAverage) * 100).toFixed(1) : 0;
        },
        
        getInventoryHealthScore: (state) => {
            const total = state.metrics.total_products;
            if (total === 0) return 100;
            const problematic = state.metrics.low_stock_count + state.metrics.out_of_stock_count;
            return ((total - problematic) / total * 100).toFixed(1);
        }
    },

    actions: {
        resetState() {
            this.isLoading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        },

        async fetchDashboardMetrics() {
            this.resetState();
            try {
                const res = await fetchDashboardMetrics();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.metrics = { ...this.metrics, ...processed.data };
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchLowStockProducts() {
            this.resetState();
            try {
                const res = await fetchLowStockProducts();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.lowStockProducts = processed.data.low_stock_products || [];
                    this.lowStockSummary = {
                        total_alerts: processed.data.total_alerts || 0,
                        critical_alerts: processed.data.critical_alerts || 0
                    };
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchExpiringProducts() {
            this.resetState();
            try {
                const res = await fetchExpiringProducts();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.expiringProducts = processed.data.expiring_products || [];
                    this.expiringProductsSummary = {
                        total_batches: processed.data.total_batches || 0,
                        critical_batches: processed.data.critical_batches || 0
                    };
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchAllDashboardData() {
            this.isLoading = true;
            try {
                // Ejecutar todas las llamadas en paralelo para mejor performance
                await Promise.allSettled([
                    this.fetchDashboardMetrics(),
                    this.fetchLowStockProducts(),
                    this.fetchExpiringProducts()
                ]);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                this.isLoading = false;
            }
        },

        // Método para refrescar datos automáticamente
        async refreshDashboard() {
            await this.fetchAllDashboardData();
        }
    }
});