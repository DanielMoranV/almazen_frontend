'''<script setup>
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import { useCreditsStore } from '@/stores/creditsStore';

const toast = useToast();

// Store
const creditsStore = useCreditsStore();

// Computadas del store
const loading = computed(() => creditsStore.isLoadingDashboard);
const metrics = computed(() => creditsStore.dashboardMetrics);
const creditsTrend = computed(() => creditsStore.creditsTrend);
const topCustomersDebt = computed(() => creditsStore.topCustomersDebt);
const upcomingCredits = computed(() => creditsStore.upcomingCredits);
const paymentHistory = computed(() => creditsStore.recentPayments);
const agingAnalysis = computed(() => creditsStore.agingAnalysis);

// Configuración de gráficos
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

// Gráfico de tendencia de créditos
const creditsTrendData = computed(() => {
    const trend = Array.isArray(creditsTrend.value) ? creditsTrend.value : [];
    return {
        labels: trend.map((item) => item.month_name || item.month),
        datasets: [
            {
                label: 'Créditos Otorgados',
                data: trend.map((item) => item.credits_created || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Pagos Recibidos',
                data: trend.map((item) => item.payments_received || 0),
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }
        ]
    };
});

const hasCreditsTrendData = computed(() => {
    return creditsTrendData.value.datasets.some(ds => ds.data.length > 0);
});


// Gráfico de análisis de antigüedad
const agingData = computed(() => {
    // El backend puede devolver aging como array directo o dentro de data.aging
    let aging = [];
    if (Array.isArray(agingAnalysis.value)) {
        aging = agingAnalysis.value;
    } else if (agingAnalysis.value?.aging && Array.isArray(agingAnalysis.value.aging)) {
        aging = agingAnalysis.value.aging;
    }
    
    return {
        labels: aging.map((item) => item.range || ''),
        datasets: [
            {
                label: 'Monto (S/)',
                data: aging.map((item) => item.total_amount || 0),
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(156, 163, 175, 0.8)'],
                borderWidth: 1
            }
        ]
    };
});

const hasAgingData = computed(() => {
    return agingData.value.datasets[0].data.length > 0;
});

// Cargar datos de ejemplo en el store para desarrollo
const loadMockData = () => {
    creditsStore.loadMockDashboardData();
};

// Cargar datos del dashboard
const loadDashboardData = async () => {
    try {
        await creditsStore.fetchDashboardData();
        console.log('Dashboard cargado exitosamente desde API');
    } catch (error) {
        console.warn('Error loading dashboard data:', error);
        
        // Cargar datos de ejemplo para desarrollo
        loadMockData();
        
        toast.add({
            severity: 'info',
            summary: 'Modo Demo',
            detail: 'Mostrando datos de ejemplo debido a error en API',
            life: 4000
        });
    }
};

// Formateo de moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount || 0);
};

// Formateo de fecha
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Obtener clase de severidad para badges
const getSeverity = (daysUntilDue) => {
    if (daysUntilDue < 0) return 'danger'; // Vencido
    if (daysUntilDue <= 7) return 'warning'; // Próximo a vencer
    return 'info'; // Normal
};

onMounted(() => {
    loadDashboardData();
});
</script>

<template>
    <div class="credits-dashboard">
        <!-- Header -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-info">
                    <h1 class="page-title">
                        <i class="pi pi-chart-line"></i>
                        Dashboard de Créditos
                    </h1>
                    <p class="page-subtitle">Análisis y métricas de gestión de créditos</p>
                </div>
                <div class="header-actions">
                    <Button icon="pi pi-refresh" label="Actualizar" @click="loadDashboardData" :loading="loading" class="p-button-outlined" />
                </div>
            </div>
        </div>

        <!-- Métricas principales -->
        <div class="metrics-grid">
            <Card class="metric-card metric-blue">
                <template #content>
                    <div class="metric-content">
                        <div class="metric-icon">
                            <i class="pi pi-list"></i>
                        </div>
                        <div class="metric-info">
                            <h3 class="metric-value">{{ (metrics.total_credits || 0).toLocaleString() }}</h3>
                            <p class="metric-label">Total Créditos</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="metric-card metric-green">
                <template #content>
                    <div class="metric-content">
                        <div class="metric-icon">
                            <i class="pi pi-money-bill"></i>
                        </div>
                        <div class="metric-info">
                            <h3 class="metric-value">{{ formatCurrency(metrics.total_debt || 0) }}</h3>
                            <p class="metric-label">Deuda Total</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="metric-card metric-orange">
                <template #content>
                    <div class="metric-content">
                        <div class="metric-icon">
                            <i class="pi pi-clock"></i>
                        </div>
                        <div class="metric-info">
                            <h3 class="metric-value">{{ formatCurrency(metrics.payments_this_month || 0) }}</h3>
                            <p class="metric-label">Pagos del Mes</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="metric-card metric-red">
                <template #content>
                    <div class="metric-content">
                        <div class="metric-icon">
                            <i class="pi pi-exclamation-triangle"></i>
                        </div>
                        <div class="metric-info">
                            <h3 class="metric-value">{{ metrics.overdue_credits || 0 }}</h3>
                            <p class="metric-label">Vencidos</p>
                            <p class="metric-sublabel">{{ formatCurrency(metrics.overdue_debt || 0) }}</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="metric-card metric-purple">
                <template #content>
                    <div class="metric-content">
                        <div class="metric-icon">
                            <i class="pi pi-calendar"></i>
                        </div>
                        <div class="metric-info">
                            <h3 class="metric-value">{{ Math.round(metrics.average_overdue_days || 0) }}</h3>
                            <p class="metric-label">Promedio Días Mora</p>
                        </div>
                    </div>
                </template>
            </Card>

            <Card class="metric-card metric-teal">
                <template #content>
                    <div class="metric-content">
                        <div class="metric-icon">
                            <i class="pi pi-check-circle"></i>
                        </div>
                        <div class="metric-info">
                            <h3 class="metric-value">{{ Math.round(metrics.recovery_rate || 0) }}%</h3>
                            <p class="metric-label">Tasa Recuperación</p>
                            <p class="metric-sublabel">{{ metrics.customers_with_debt || 0 }} clientes</p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <!-- Gráficos -->
        <div class="charts-grid">
            <Card class="chart-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-chart-line"></i>
                        Tendencia de Créditos
                    </div>
                </template>
                <template #content>
                    <div v-if="hasCreditsTrendData" class="relative h-[300px]">
                        <Chart type="line" :data="creditsTrendData" :options="chartOptions" style="height: 300px" />
                    </div>
                    <div v-else class="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        No hay datos de tendencia para mostrar.
                    </div>
                </template>
            </Card>

            <Card class="chart-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-chart-pie"></i>
                        Análisis de Antigüedad
                    </div>
                </template>
                <template #content>
                    <div v-if="hasAgingData" class="relative h-[300px]">
                        <Chart type="doughnut" :data="agingData" :options="{ responsive: true, maintainAspectRatio: false }" style="height: 300px" />
                    </div>
                    <div v-else class="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                        No hay datos para el análisis de antigüedad.
                    </div>
                </template>
            </Card>
        </div>

        <!-- Tablas de datos -->
        <div class="tables-grid">
            <!-- Clientes con mayor deuda -->
            <Card class="table-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-users"></i>
                        Clientes con Mayor Deuda
                    </div>
                </template>
                <template #content>
                    <DataTable :value="topCustomersDebt" class="dashboard-table">
                        <template #empty> No hay clientes con deuda para mostrar. </template>
                        <Column field="name" header="Cliente">
                            <template #body="{ data }">
                                <div class="customer-info">
                                    <div class="customer-name">{{ data.name }}</div>
                                    <div class="customer-document">{{ data.email || data.phone || '' }}</div>
                                </div>
                            </template>
                        </Column>
                        <Column field="total_debt" header="Deuda Total">
                            <template #body="{ data }">
                                <span class="font-bold text-red-600">
                                    {{ formatCurrency(data.total_debt) }}
                                </span>
                            </template>
                        </Column>
                        <Column field="overdue_credits_count" header="Vencidos">
                            <template #body="{ data }">
                                <Badge :value="data.overdue_credits_count" :severity="data.overdue_credits_count > 0 ? 'danger' : 'success'" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Créditos próximos a vencer -->
            <Card class="table-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-clock"></i>
                        Próximos a Vencer
                    </div>
                </template>
                <template #content>
                    <DataTable :value="upcomingCredits" class="dashboard-table">
                        <template #empty> No hay créditos próximos a vencer. </template>
                        <Column field="customer.name" header="Cliente">
                            <template #body="{ data }">
                                <div class="customer-info">
                                    <div class="customer-name">{{ data.customer?.name }}</div>
                                    <div class="sale-number"># {{ data.sale_document }}</div>
                                </div>
                            </template>
                        </Column>
                        <Column field="due_date" header="Vence">
                            <template #body="{ data }">
                                <div class="due-date">
                                    <div>{{ formatDate(data.due_date) }}</div>
                                    <Badge :value="`${data.days_until_due} días`" :severity="getSeverity(data.days_until_due)" size="small" />
                                </div>
                            </template>
                        </Column>
                        <Column field="remaining_amount" header="Saldo">
                            <template #body="{ data }">
                                {{ formatCurrency(data.remaining_amount) }}
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Historial de pagos recientes -->
            <Card class="table-card full-width">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-history"></i>
                        Pagos Recientes
                    </div>
                </template>
                <template #content>
                    <DataTable :value="paymentHistory" class="dashboard-table">
                        <template #empty> No se han registrado pagos recientes. </template>
                        <Column field="payment_date" header="Fecha">
                            <template #body="{ data }">
                                {{ formatDate(data.payment_date) }}
                            </template>
                        </Column>
                        <Column field="customer.name" header="Cliente">
                            <template #body="{ data }">
                                {{ data.customer?.name }}
                            </template>
                        </Column>
                        <Column field="total_payment_amount" header="Monto">
                            <template #body="{ data }">
                                <span class="font-bold text-green-600">
                                    {{ formatCurrency(data.total_payment_amount) }}
                                </span>
                            </template>
                        </Column>
                        <Column field="payment_method" header="Método" />
                        <Column field="credits_count" header="Créditos">
                            <template #body="{ data }">
                                <Badge :value="data.credits_count" severity="info" />
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>
        </div>

        <Toast />
    </div>
</template>

<style scoped>
.credits-dashboard {
    @apply min-h-screen bg-gray-50 dark:bg-gray-900 p-6;
}

.page-header {
    @apply mb-8;
}

.header-content {
    @apply bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4;
}

.header-info {
    @apply flex-1;
}

.page-title {
    @apply text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2;
}

.page-title i {
    @apply text-purple-600 dark:text-purple-400;
}

.page-subtitle {
    @apply text-gray-600 dark:text-gray-300 text-lg;
}

.header-actions {
    @apply flex flex-col sm:flex-row items-start sm:items-center gap-4;
}

.date-filter {
    @apply flex flex-col sm:flex-row sm:items-center gap-2;
}

.filter-label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.metrics-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8;
}

.metric-card {
    @apply transition-all duration-200 hover:shadow-lg border-0;
}

.metric-blue {
    @apply bg-gradient-to-br from-blue-500 to-blue-600 text-white;
}
.metric-green {
    @apply bg-gradient-to-br from-green-500 to-green-600 text-white;
}
.metric-orange {
    @apply bg-gradient-to-br from-orange-500 to-orange-600 text-white;
}
.metric-red {
    @apply bg-gradient-to-br from-red-500 to-red-600 text-white;
}
.metric-purple {
    @apply bg-gradient-to-br from-purple-500 to-purple-600 text-white;
}
.metric-teal {
    @apply bg-gradient-to-br from-teal-500 to-teal-600 text-white;
}

.metric-content {
    @apply flex items-center gap-4 p-2;
}

.metric-icon {
    @apply text-3xl opacity-80;
}

.metric-info {
    @apply flex-1;
}

.metric-value {
    @apply text-2xl font-bold mb-1 leading-tight;
}

.metric-label {
    @apply text-sm opacity-90 mb-0;
}

.metric-sublabel {
    @apply text-xs opacity-75 mb-0;
}

.charts-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8;
}

.chart-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.tables-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.table-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.table-card.full-width {
    @apply lg:col-span-2;
}

.card-title {
    @apply flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200;
}

.card-title i {
    @apply text-purple-600 dark:text-purple-400;
}

.customer-info {
    @apply space-y-1;
}

.customer-name {
    @apply font-semibold text-gray-900 dark:text-white;
}

.customer-document,
.sale-number {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.due-date {
    @apply space-y-1;
}

.dashboard-table {
    @apply border-0;
}

/* Estilos para componentes */
:deep(.metric-card .p-card-content) {
    @apply p-4;
}

:deep(.chart-card .p-card-content) {
    @apply p-4;
}

:deep(.table-card .p-card-content) {
    @apply p-0;
}

:deep(.dashboard-table .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold border-gray-200 dark:border-gray-600;
}

:deep(.dashboard-table .p-datatable-tbody > tr > td) {
    @apply border-gray-200 dark:border-gray-700 py-3;
}

:deep(.dashboard-table .p-datatable-emptymessage) {
    @apply text-center p-4 text-gray-500 dark:text-gray-400;
}

/* Responsive */
@media (max-width: 1024px) {
    .metrics-grid {
        @apply grid-cols-1 md:grid-cols-2 lg:grid-cols-3;
    }

    .charts-grid {
        @apply grid-cols-1;
    }

    .tables-grid {
        @apply grid-cols-1;
    }

    .table-card.full-width {
        @apply col-span-1;
    }
}

@media (max-width: 768px) {
    .metrics-grid {
        @apply grid-cols-1;
    }

    .header-content {
        @apply flex-col;
    }

    .header-actions {
        @apply w-full;
    }
}
</style>
''
