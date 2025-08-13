<script setup>
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
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

// Estado reactivo
const dateRange = ref([new Date(new Date().setDate(1)), new Date()]); // Mes actual por defecto

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
    return {
        labels: creditsTrend.value.map((item) => item.month),
        datasets: [
            {
                label: 'Créditos Otorgados',
                data: creditsTrend.value.map((item) => item.credits_granted),
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Pagos Recibidos',
                data: creditsTrend.value.map((item) => item.payments_received),
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }
        ]
    };
});

// Gráfico de análisis de antigüedad
const agingData = computed(() => {
    return {
        labels: ['0-30 días', '31-60 días', '61-90 días', '90+ días'],
        datasets: [
            {
                label: 'Monto (S/)',
                data: agingAnalysis.value.map((item) => item.amount),
                backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                borderWidth: 1
            }
        ]
    };
});

// Datos de ejemplo para desarrollo
const loadMockData = () => {
    // Métricas de ejemplo
    metrics.value = {
        totalCredits: 45,
        totalAmount: 125000,
        totalPaid: 85000,
        totalPending: 40000,
        overdueCredits: 8,
        overdueAmount: 15000,
        averagePaymentDays: 28,
        paymentsToday: 5,
        paymentsThisMonth: 32
    };

    // Tendencia de créditos de ejemplo
    creditsTrend.value = [
        { month: 'Ene', credits_granted: 120000, payments_received: 95000 },
        { month: 'Feb', credits_granted: 135000, payments_received: 110000 },
        { month: 'Mar', credits_granted: 110000, payments_received: 125000 },
        { month: 'Abr', credits_granted: 145000, payments_received: 105000 },
        { month: 'May', credits_granted: 125000, payments_received: 140000 },
        { month: 'Jun', credits_granted: 130000, payments_received: 120000 }
    ];

    // Clientes con mayor deuda de ejemplo
    topCustomersDebt.value = [
        { customer_name: 'Comercial ABC S.A.C.', customer_document: '20123456789', total_debt: 8500, overdue_count: 2 },
        { customer_name: 'Distribuidora XYZ', customer_document: '20987654321', total_debt: 6200, overdue_count: 1 },
        { customer_name: 'Empresa DEF Ltda.', customer_document: '20456789123', total_debt: 4800, overdue_count: 0 },
        { customer_name: 'Negocios GHI E.I.R.L.', customer_document: '20654321987', total_debt: 3200, overdue_count: 1 },
        { customer_name: 'Corporación JKL', customer_document: '20789123456', total_debt: 2800, overdue_count: 0 }
    ];

    // Créditos próximos a vencer de ejemplo
    upcomingCredits.value = [
        { customer_name: 'Cliente A', sale_number: 'V-001234', due_date: '2024-01-25', remaining_amount: 1500 },
        { customer_name: 'Cliente B', sale_number: 'V-001235', due_date: '2024-01-27', remaining_amount: 2200 },
        { customer_name: 'Cliente C', sale_number: 'V-001236', due_date: '2024-01-30', remaining_amount: 800 },
        { customer_name: 'Cliente D', sale_number: 'V-001237', due_date: '2024-02-02', remaining_amount: 3200 },
        { customer_name: 'Cliente E', sale_number: 'V-001238', due_date: '2024-02-05', remaining_amount: 1200 }
    ];

    // Historial de pagos recientes de ejemplo
    paymentHistory.value = [
        { payment_date: '2024-01-20', customer_name: 'Cliente F', amount: 1200, payment_method: 'Efectivo', credits_count: 1 },
        { payment_date: '2024-01-20', customer_name: 'Cliente G', amount: 800, payment_method: 'Transferencia', credits_count: 2 },
        { payment_date: '2024-01-19', customer_name: 'Cliente H', amount: 2500, payment_method: 'Efectivo', credits_count: 1 },
        { payment_date: '2024-01-19', customer_name: 'Cliente I', amount: 600, payment_method: 'Tarjeta', credits_count: 1 },
        { payment_date: '2024-01-18', customer_name: 'Cliente J', amount: 1800, payment_method: 'Transferencia', credits_count: 3 }
    ];

    // Análisis de antigüedad de ejemplo
    agingAnalysis.value = [
        { range: '0-30', amount: 25000 },
        { range: '31-60', amount: 12000 },
        { range: '61-90', amount: 8000 },
        { range: '90+', amount: 5000 }
    ];
};

// Cargar datos del dashboard
const loadDashboardData = async () => {
    try {
        const [startDate, endDate] = dateRange.value;
        const params = {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
        };

        console.log('Cargando datos de dashboard con parámetros:', params);
        await creditsStore.fetchDashboardData(params);
        
        console.log('Dashboard cargado exitosamente desde API');

    } catch (error) {
        console.warn('Error loading dashboard data:', error);
        
        // Solo mostrar toast de error si no se cargaron datos mock
        if (creditsStore.dashboardMetrics.totalCredits === 0 && creditsStore.creditsTrend.length === 0) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar los datos del dashboard',
                life: 4000
            });
        } else {
            toast.add({
                severity: 'info',
                summary: 'Modo Demo',
                detail: 'Mostrando datos de ejemplo',
                life: 4000
            });
        }
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

// Calcular días hasta vencimiento
const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
                    <div class="date-filter">
                        <label class="filter-label">Período:</label>
                        <Calendar v-model="dateRange" selectionMode="range" :showIcon="true" dateFormat="dd/mm/yy" placeholder="Seleccionar período" @date-select="loadDashboardData" />
                    </div>
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
                            <h3 class="metric-value">{{ metrics.totalCredits.toLocaleString() }}</h3>
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
                            <h3 class="metric-value">{{ formatCurrency(metrics.totalAmount) }}</h3>
                            <p class="metric-label">Monto Total</p>
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
                            <h3 class="metric-value">{{ formatCurrency(metrics.totalPending) }}</h3>
                            <p class="metric-label">Pendiente</p>
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
                            <h3 class="metric-value">{{ metrics.overdueCredits }}</h3>
                            <p class="metric-label">Vencidos</p>
                            <p class="metric-sublabel">{{ formatCurrency(metrics.overdueAmount) }}</p>
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
                            <h3 class="metric-value">{{ metrics.averagePaymentDays }}</h3>
                            <p class="metric-label">Días Promedio Pago</p>
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
                            <h3 class="metric-value">{{ metrics.paymentsToday }}</h3>
                            <p class="metric-label">Pagos Hoy</p>
                            <p class="metric-sublabel">{{ metrics.paymentsThisMonth }} este mes</p>
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
                    <Chart type="line" :data="creditsTrendData" :options="chartOptions" style="height: 300px" />
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
                    <Chart type="doughnut" :data="agingData" :options="{ responsive: true, maintainAspectRatio: false }" style="height: 300px" />
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
                        <Column field="customer_name" header="Cliente">
                            <template #body="{ data }">
                                <div class="customer-info">
                                    <div class="customer-name">{{ data.customer_name }}</div>
                                    <div class="customer-document">{{ data.customer_document }}</div>
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
                        <Column field="overdue_count" header="Vencidos">
                            <template #body="{ data }">
                                <Badge :value="data.overdue_count" :severity="data.overdue_count > 0 ? 'danger' : 'success'" />
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
                        <Column field="customer_name" header="Cliente">
                            <template #body="{ data }">
                                <div class="customer-info">
                                    <div class="customer-name">{{ data.customer_name }}</div>
                                    <div class="sale-number"># {{ data.sale_number }}</div>
                                </div>
                            </template>
                        </Column>
                        <Column field="due_date" header="Vence">
                            <template #body="{ data }">
                                <div class="due-date">
                                    <div>{{ formatDate(data.due_date) }}</div>
                                    <Badge :value="`${getDaysUntilDue(data.due_date)} días`" :severity="getSeverity(getDaysUntilDue(data.due_date))" size="small" />
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
                        <Column field="payment_date" header="Fecha">
                            <template #body="{ data }">
                                {{ formatDate(data.payment_date) }}
                            </template>
                        </Column>
                        <Column field="customer_name" header="Cliente" />
                        <Column field="amount" header="Monto">
                            <template #body="{ data }">
                                <span class="font-bold text-green-600">
                                    {{ formatCurrency(data.amount) }}
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
