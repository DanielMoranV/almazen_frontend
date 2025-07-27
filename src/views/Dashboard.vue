<script setup>
import { useDashboardStore } from '@/stores/dashboardStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const dashboardStore = useDashboardStore();
const {
    getDashboardMetrics,
    getLowStockProducts,
    getLowStockSummary,
    getExpiringProducts,
    getExpiringProductsSummary,
    isLoadingDashboard,
    getTotalSalesGrowth,
    getInventoryHealthScore
} = storeToRefs(dashboardStore);

const refreshInterval = ref(null);
// Referencias a instancias de Chart para destruirlas al desmontar
const salesChartRef = ref(null);
const productsChartRef = ref(null);

// Formatear números para mostrar
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(value);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('es-PE').format(value);
};

// Obtener clase de color según urgencia
const getUrgencyClass = (urgency) => {
    const classes = {
        'BAJO': 'bg-green-100 text-green-800',
        'MEDIO': 'bg-yellow-100 text-yellow-800',
        'ALTO': 'bg-red-100 text-red-800',
        'CRÍTICO': 'bg-red-600 text-white'
    };
    return classes[urgency] || 'bg-gray-100 text-gray-800';
};

// Formatear fecha de vencimiento
const formatExpirationDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Configuración de gráficas
const chartOptions = {
    plugins: { legend: { display: false } },
    scales: { x: { display: true }, y: { display: true, beginAtZero: true } }
};

const salesChartData = computed(() => {
    const trend = getDashboardMetrics.value.sales_trend_month || [];
    return {
        labels: trend.map(i => i.date),
        datasets: [{ label: 'Ventas', fill: false, borderColor: '#4caf50', tension: 0.3, data: trend.map(i => i.total_sales) }]
    };
});

// Datos para gráfico Top Productos del Mes
const topProductsMonthChartData = computed(() => {
    const list = [...(getDashboardMetrics.value.top_products_month || [])]
        .sort((a,b)=> b.total_quantity - a.total_quantity);
    const palette = ['#4caf50','#2196f3','#ff9800','#9c27b0','#f44336','#00acc1','#8bc34a','#e91e63','#ffc107','#3f51b5'];
    return {
        labels: list.map(i => i.product_name.length > 15 ? i.product_name.slice(0, 12) + '…' : i.product_name),
        datasets: [{
            label: 'Unidades',
            backgroundColor: list.map((_,idx)=> palette[idx % palette.length]),
            data: list.map(i => i.total_quantity)
        }]
    };
});

const productsChartData = computed(() => {
    const trend = getDashboardMetrics.value.products_trend_month || [];
    return {
        labels: trend.map(i => i.date),
        datasets: [{ label: 'Unidades', fill: false, borderColor: '#2196f3', tension: 0.3, data: trend.map(i => i.total_quantity) }]
    };
});

const refreshDashboard = async () => {
    await dashboardStore.fetchAllDashboardData();
};

onMounted(async () => {
    await refreshDashboard();

    console.log(getDashboardMetrics.value);

    // Auto-refresh cada 5 minutos
    refreshInterval.value = setInterval(refreshDashboard, 5 * 60 * 1000);
});

// Limpiar intervalo al desmontar componente
onUnmounted(() => {
    // Destruir instancias de Chart para liberar canvas
    salesChartRef.value?.chart?.destroy?.();
    productsChartRef.value?.chart?.destroy?.();
    if (refreshInterval.value) {
        clearInterval(refreshInterval.value);
    }
});
</script>

<template>
    <div class="min-h-screen bg-gray-50 py-8 px-4">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="flex justify-between items-center mb-8">
                <div class="flex items-center space-x-4">
                    <img src="/azlogo.png" alt="Logo" class="h-10 object-contain" />
                    <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <Button icon="pi pi-refresh" :loading="isLoadingDashboard" @click="refreshDashboard"
                        class="p-button-outlined" v-tooltip.top="'Actualizar datos'" />
                    <span class="text-sm text-gray-500" v-if="getDashboardMetrics.last_updated">
                        Actualizado: {{ new Date(getDashboardMetrics.last_updated).toLocaleString('es-PE') }}
                    </span>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoadingDashboard" class="flex justify-center items-center h-64">
                <ProgressSpinner />
            </div>

            <!-- Dashboard Content -->
            <div v-else class="space-y-8">
                <!-- Métricas Principales -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <!-- Total Productos -->
                    <Card class="border-l-4 border-l-blue-500">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Total Productos</p>
                                    <p class="text-2xl font-bold text-gray-900">{{
                                        formatNumber(getDashboardMetrics.total_products) }}</p>
                                    <p class="text-xs text-gray-500">{{
                                        formatNumber(getDashboardMetrics.active_products) }} activos</p>
                                </div>
                                <div class="p-3 bg-blue-100 rounded-full">
                                    <i class="pi pi-box text-blue-600 text-xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Ventas Hoy -->
                    <Card class="border-l-4 border-l-green-500">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Ventas Hoy</p>
                                    <p class="text-2xl font-bold text-gray-900">{{
                                        formatCurrency(getDashboardMetrics.sales_today) }}</p>
                                    <p class="text-xs text-green-600">{{
                                        formatNumber(getDashboardMetrics.sales_count_today) }} transacciones</p>
                                </div>
                                <div class="p-3 bg-green-100 rounded-full">
                                    <i class="pi pi-chart-line text-green-600 text-xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Compras Hoy -->
                    <Card class="border-l-4 border-l-teal-500">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Compras Hoy</p>
                                    <p class="text-2xl font-bold text-gray-900">{{
                                        formatCurrency(getDashboardMetrics.purchases_today_total ?? 0) }}</p>
                                    <p class="text-xs text-teal-600">{{
                                        formatNumber(getDashboardMetrics.purchases_today_count ?? 0) }} transacciones
                                    </p>
                                </div>
                                <div class="p-3 bg-teal-100 rounded-full">
                                    <i class="pi pi-shopping-bag text-teal-600 text-xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Compras Pendientes -->
                    <Card class="border-l-4 border-l-yellow-500">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Compras Pendientes</p>
                                    <p class="text-2xl font-bold text-gray-900">{{
                                        formatNumber(getDashboardMetrics.purchases_pending) }}</p>
                                    <p class="text-xs text-gray-500">{{
                                        formatCurrency(getDashboardMetrics.purchases_this_month) }} este mes</p>
                                </div>
                                <div class="p-3 bg-yellow-100 rounded-full">
                                    <i class="pi pi-shopping-cart text-yellow-600 text-xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Valor Inventario -->
                    <Card class="border-l-4 border-l-purple-500">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Valor Inventario</p>
                                    <p class="text-2xl font-bold text-gray-900">{{
                                        formatCurrency(getDashboardMetrics.inventory_value) }}</p>
                                    <p class="text-xs"
                                        :class="getInventoryHealthScore >= 90 ? 'text-green-600' : getInventoryHealthScore >= 70 ? 'text-yellow-600' : 'text-red-600'">
                                        Salud: {{ getInventoryHealthScore }}%
                                    </p>
                                </div>
                                <div class="p-3 bg-purple-100 rounded-full">
                                    <i class="pi pi-wallet text-purple-600 text-xl"></i>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Alertas de Stock -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Stock Bajo -->
                    <Card>
                        <template #title>
                            <div class="flex items-center justify-between">
                                <span class="flex items-center space-x-2">
                                    <i class="pi pi-exclamation-triangle text-red-500"></i>
                                    <span>Stock Bajo</span>
                                </span>
                                <Badge :value="getLowStockSummary.total_alerts"
                                    :severity="getLowStockSummary.critical_alerts > 0 ? 'danger' : 'warning'" />
                            </div>
                        </template>
                        <template #content>
                            <div v-if="getLowStockProducts.length === 0" class="text-center py-4 text-gray-500">
                                <i class="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                                <p>No hay productos con stock bajo</p>
                            </div>
                            <div v-else class="space-y-3 max-h-64 overflow-y-auto">
                                <div v-for="product in getLowStockProducts.slice(0, 5)" :key="product.product_name"
                                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900">{{ product.product_name }}</p>
                                        <p class="text-sm text-gray-500">{{ product.sku }} - {{ product.warehouse }}</p>
                                        <p class="text-xs text-gray-400">
                                            Stock: {{ product.current_stock }} / Min: {{ product.min_stock }}
                                        </p>
                                    </div>
                                    <Badge :value="product.urgency" :class="getUrgencyClass(product.urgency)"
                                        class="text-xs px-2 py-1 rounded-full" />
                                </div>
                                <div v-if="getLowStockProducts.length > 5" class="text-center pt-2">
                                    <span class="text-sm text-gray-500">
                                        Y {{ getLowStockProducts.length - 5 }} productos más...
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Productos por Vencer -->
                    <Card>
                        <template #title>
                            <div class="flex items-center justify-between">
                                <span class="flex items-center space-x-2">
                                    <i class="pi pi-calendar-times text-orange-500"></i>
                                    <span>Próximos a Vencer</span>
                                </span>
                                <Badge :value="getExpiringProductsSummary.total_batches"
                                    :severity="getExpiringProductsSummary.critical_batches > 0 ? 'danger' : 'warning'" />
                            </div>
                        </template>
                        <template #content>
                            <div v-if="getExpiringProducts.length === 0" class="text-center py-4 text-gray-500">
                                <i class="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                                <p>No hay productos próximos a vencer</p>
                            </div>
                            <div v-else class="space-y-3 max-h-64 overflow-y-auto">
                                <div v-for="batch in getExpiringProducts.slice(0, 5)" :key="batch.batch_code"
                                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900">{{ batch.product_name }}</p>
                                        <p class="text-sm text-gray-500">Lote: {{ batch.batch_code }}</p>
                                        <p class="text-xs text-gray-400">
                                            Vence: {{ formatExpirationDate(batch.expiration_date) }} ({{
                                                batch.days_to_expire }} días)
                                        </p>
                                        <p class="text-xs text-gray-400">Stock: {{ batch.total_stock }}</p>
                                    </div>
                                    <Badge :value="batch.urgency" :class="getUrgencyClass(batch.urgency)"
                                        class="text-xs px-2 py-1 rounded-full" />
                                </div>
                                <div v-if="getExpiringProducts.length > 5" class="text-center pt-2">
                                    <span class="text-sm text-gray-500">
                                        Y {{ getExpiringProducts.length - 5 }} lotes más...
                                    </span>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Resumen de Ventas -->
                <Card>
                    <template #title>
                        <div class="flex items-center space-x-2">
                            <i class="pi pi-chart-bar text-blue-500"></i>
                            <span>Resumen de Ventas</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="text-center">
                                <p class="text-3xl font-bold text-green-600">{{
                                    formatCurrency(getDashboardMetrics.sales_today) }}</p>
                                <p class="text-sm text-gray-600">Ventas Hoy</p>
                                <p class="text-xs text-gray-500">{{ formatNumber(getDashboardMetrics.sales_count_today)
                                }} transacciones</p>
                            </div>
                            <div class="text-center">
                                <p class="text-3xl font-bold text-blue-600">{{
                                    formatCurrency(getDashboardMetrics.sales_this_month) }}</p>
                                <p class="text-sm text-gray-600">Ventas Este Mes</p>
                                <p class="text-xs"
                                    :class="getTotalSalesGrowth > 100 ? 'text-green-500' : 'text-gray-500'">
                                    {{ getTotalSalesGrowth }}% vs promedio diario
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-3xl font-bold text-purple-600">{{
                                    formatCurrency(getDashboardMetrics.purchases_this_month) }}</p>
                                <p class="text-sm text-gray-600">Compras Este Mes</p>
                                <p class="text-xs text-gray-500">{{ formatNumber(getDashboardMetrics.purchases_pending)
                                }} pendientes</p>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Rankings del Día -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Top Vendedores Hoy -->
                    <Card>
                        <template #title>
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-users text-indigo-500"></i>
                                <span>Top Vendedores Hoy</span>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="!(getDashboardMetrics.top_sellers_today && getDashboardMetrics.top_sellers_today.length)"
                                class="text-center py-4 text-gray-500">
                                <p>No hay datos de vendedores</p>
                            </div>
                            <div v-else class="space-y-2">
                                <div v-for="seller in getDashboardMetrics.top_sellers_today" :key="seller.user_id"
                                    class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span class="font-medium text-gray-700">{{ seller.user_name }}</span>
                                    <span class="text-sm text-gray-600">{{ formatCurrency(seller.total_sales) }} ({{
                                        seller.sales_count }})</span>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Top Productos Hoy -->
                    <Card>
                        <template #title>
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-tags text-pink-500"></i>
                                <span>Top Productos Hoy</span>
                            </div>
                        </template>
                        <template #content>
                            <div v-if="!(getDashboardMetrics.top_products_today && getDashboardMetrics.top_products_today.length)"
                                class="text-center py-4 text-gray-500">
                                <p>No hay datos de productos</p>
                            </div>
                            <div v-else class="space-y-2">
                                <div v-for="prod in getDashboardMetrics.top_products_today" :key="prod.product_id"
                                    class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span class="font-medium text-gray-700">{{ prod.product_name }}</span>
                                    <span class="text-sm text-gray-600">{{ prod.total_quantity }} uds - {{
                                        formatCurrency(prod.total_sales) }}</span>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
                <!-- Tendencias Mensuales -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <template #title>
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-chart-line text-green-500"></i>
                                <span>Tendencia Ventas (Mes)</span>
                            </div>
                        </template>
                        <template #content>
                            <Chart v-if="salesChartData.labels.length" type="line" :data="salesChartData" :options="chartOptions" :key="'sales-'+salesChartData.labels.join('')" ref="salesChartRef"
                                style="min-height:300px" />
                        </template>
                    </Card>

                    <Card>
                        <template #title>
                            <div class="flex items-center space-x-2">
                                <i class="pi pi-chart-line text-blue-500"></i>
                                <span>Top Productos (Mes)</span>
                            </div>
                        </template>
                        <template #content>
                            <Chart v-if="salesChartData.labels.length" type="bar" :data="topProductsMonthChartData" :options="chartOptions" :key="'topprod-'+topProductsMonthChartData.labels.join('')" ref="productsChartRef"
                                style="min-height:300px" />
                        </template>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.border-l-4 {
    border-left-width: 4px;
}
</style>
