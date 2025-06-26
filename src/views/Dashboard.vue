<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useDashboardStore } from '@/stores/dashboardStore';
import { storeToRefs } from 'pinia';

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

const refreshDashboard = async () => {
    await dashboardStore.fetchAllDashboardData();
};

onMounted(async () => {
    await refreshDashboard();
    
    // Auto-refresh cada 5 minutos
    refreshInterval.value = setInterval(refreshDashboard, 5 * 60 * 1000);
});

// Limpiar intervalo al desmontar componente
onUnmounted(() => {
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
                    <Button 
                        icon="pi pi-refresh" 
                        :loading="isLoadingDashboard"
                        @click="refreshDashboard"
                        class="p-button-outlined"
                        v-tooltip.top="'Actualizar datos'"
                    />
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
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Total Productos -->
                    <Card class="border-l-4 border-l-blue-500">
                        <template #content>
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-gray-600">Total Productos</p>
                                    <p class="text-2xl font-bold text-gray-900">{{ formatNumber(getDashboardMetrics.total_products) }}</p>
                                    <p class="text-xs text-gray-500">{{ formatNumber(getDashboardMetrics.active_products) }} activos</p>
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
                                    <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(getDashboardMetrics.sales_today) }}</p>
                                    <p class="text-xs text-green-600">{{ formatNumber(getDashboardMetrics.sales_count_today) }} transacciones</p>
                                </div>
                                <div class="p-3 bg-green-100 rounded-full">
                                    <i class="pi pi-chart-line text-green-600 text-xl"></i>
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
                                    <p class="text-2xl font-bold text-gray-900">{{ formatNumber(getDashboardMetrics.purchases_pending) }}</p>
                                    <p class="text-xs text-gray-500">{{ formatCurrency(getDashboardMetrics.purchases_this_month) }} este mes</p>
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
                                    <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(getDashboardMetrics.inventory_value) }}</p>
                                    <p class="text-xs" :class="getInventoryHealthScore >= 90 ? 'text-green-600' : getInventoryHealthScore >= 70 ? 'text-yellow-600' : 'text-red-600'">
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
                                <Badge 
                                    :value="getLowStockSummary.total_alerts" 
                                    :severity="getLowStockSummary.critical_alerts > 0 ? 'danger' : 'warning'"
                                />
                            </div>
                        </template>
                        <template #content>
                            <div v-if="getLowStockProducts.length === 0" class="text-center py-4 text-gray-500">
                                <i class="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                                <p>No hay productos con stock bajo</p>
                            </div>
                            <div v-else class="space-y-3 max-h-64 overflow-y-auto">
                                <div 
                                    v-for="product in getLowStockProducts.slice(0, 5)" 
                                    :key="product.product_name"
                                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900">{{ product.product_name }}</p>
                                        <p class="text-sm text-gray-500">{{ product.sku }} - {{ product.warehouse }}</p>
                                        <p class="text-xs text-gray-400">
                                            Stock: {{ product.current_stock }} / Min: {{ product.min_stock }}
                                        </p>
                                    </div>
                                    <Badge 
                                        :value="product.urgency" 
                                        :class="getUrgencyClass(product.urgency)"
                                        class="text-xs px-2 py-1 rounded-full"
                                    />
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
                                <Badge 
                                    :value="getExpiringProductsSummary.total_batches" 
                                    :severity="getExpiringProductsSummary.critical_batches > 0 ? 'danger' : 'warning'"
                                />
                            </div>
                        </template>
                        <template #content>
                            <div v-if="getExpiringProducts.length === 0" class="text-center py-4 text-gray-500">
                                <i class="pi pi-check-circle text-green-500 text-2xl mb-2"></i>
                                <p>No hay productos próximos a vencer</p>
                            </div>
                            <div v-else class="space-y-3 max-h-64 overflow-y-auto">
                                <div 
                                    v-for="batch in getExpiringProducts.slice(0, 5)" 
                                    :key="batch.batch_code"
                                    class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900">{{ batch.product_name }}</p>
                                        <p class="text-sm text-gray-500">Lote: {{ batch.batch_code }}</p>
                                        <p class="text-xs text-gray-400">
                                            Vence: {{ formatExpirationDate(batch.expiration_date) }} ({{ batch.days_to_expire }} días)
                                        </p>
                                        <p class="text-xs text-gray-400">Stock: {{ batch.total_stock }}</p>
                                    </div>
                                    <Badge 
                                        :value="batch.urgency" 
                                        :class="getUrgencyClass(batch.urgency)"
                                        class="text-xs px-2 py-1 rounded-full"
                                    />
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
                                <p class="text-3xl font-bold text-green-600">{{ formatCurrency(getDashboardMetrics.sales_today) }}</p>
                                <p class="text-sm text-gray-600">Ventas Hoy</p>
                                <p class="text-xs text-gray-500">{{ formatNumber(getDashboardMetrics.sales_count_today) }} transacciones</p>
                            </div>
                            <div class="text-center">
                                <p class="text-3xl font-bold text-blue-600">{{ formatCurrency(getDashboardMetrics.sales_this_month) }}</p>
                                <p class="text-sm text-gray-600">Ventas Este Mes</p>
                                <p class="text-xs" :class="getTotalSalesGrowth > 100 ? 'text-green-500' : 'text-gray-500'">
                                    {{ getTotalSalesGrowth }}% vs promedio diario
                                </p>
                            </div>
                            <div class="text-center">
                                <p class="text-3xl font-bold text-purple-600">{{ formatCurrency(getDashboardMetrics.purchases_this_month) }}</p>
                                <p class="text-sm text-gray-600">Compras Este Mes</p>
                                <p class="text-xs text-gray-500">{{ formatNumber(getDashboardMetrics.purchases_pending) }} pendientes</p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<style scoped>
.border-l-4 {
    border-left-width: 4px;
}
</style>
