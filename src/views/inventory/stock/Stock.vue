<script setup>
import { useProductStocksStore } from '@/stores/productStocksStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// Components
import StockFilters from './componentsStock/StockFilters.vue';
import StockStatistics from './componentsStock/StockStatistics.vue';
import StockTable from './componentsStock/StockTable.vue';
import StockToolbar from './componentsStock/StockToolbar.vue';

const toast = useToast();
const router = useRouter();
const stocksStore = useProductStocksStore();

// Local reactive refs for UI
const searchQuery = ref('');
const warehouseFilter = ref(null);
const stockStatusFilter = ref(null);

// Computed properties using store data
const loading = computed(() => stocksStore.isLoadingStocks);
const stockItems = computed(() => stocksStore.filteredStocks);

// Statistics computed from store
const totalItems = computed(() => stocksStore.totalProducts);
const totalQuantity = computed(() => stocksStore.totalQuantity);
const lowStockItems = computed(() => stocksStore.lowStockProducts);
const outOfStockItems = computed(() => stocksStore.outOfStockProducts);
const totalValue = computed(() => {
    return stocksStore.stocksList.reduce((total, product) => {
        return total + (product.total_cost || 0);
    }, 0);
});

// Dynamic warehouse options based on actual data
const warehouseOptions = computed(() => {
    const warehouses = new Map();
    warehouses.set(null, { label: 'Todos los almacenes', value: null });

    stocksStore.stocksList.forEach((product) => {
        product.warehouses?.forEach((warehouse) => {
            if (!warehouses.has(warehouse.id)) {
                warehouses.set(warehouse.id, { label: warehouse.name, value: warehouse.id });
            }
        });
    });

    return Array.from(warehouses.values());
});

// Watch for filter changes and update store
watch(
    [searchQuery, warehouseFilter, stockStatusFilter],
    ([search, warehouse, status]) => {
        stocksStore.setSearchTerm(search);
        stocksStore.setWarehouseFilter(warehouse);
        stocksStore.setStatusFilter(status);
    },
    { immediate: true }
);

// Lifecycle
onMounted(async () => {
    await loadStockItems();
    console.log(stocksStore.productStocks);

    // Show success/error messages
    if (stocksStore.message) {
        toast.add({
            severity: stocksStore.success ? 'success' : 'error',
            summary: stocksStore.success ? 'Éxito' : 'Error',
            detail: stocksStore.message,
            life: 3000
        });
        stocksStore.clearMessage();
    }
});

// Methods
const loadStockItems = async () => {
    try {
        await stocksStore.fetchProductStocks();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el inventario',
            life: 3000
        });
    }
};

const handleRefresh = async () => {
    await loadStockItems();
    if (stocksStore.success) {
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Inventario actualizado correctamente',
            life: 3000
        });
    }
};

const exportToExcel = () => {
    // TODO: Implement Excel export functionality
    toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Reporte de inventario exportado a Excel',
        life: 3000
    });
};

const printInventory = () => {
    // TODO: Implement print functionality
    toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Reporte de inventario enviado a impresión',
        life: 3000
    });
};

const viewProductDetails = (item) => {
    // Navigate to product details page
    router.push(`/products/${item.id}`);
};

const adjustStock = (item) => {
    // TODO: Open stock adjustment dialog
    toast.add({
        severity: 'info',
        summary: 'Ajuste de Stock',
        detail: `Ajustando stock para ${item.name}`,
        life: 3000
    });
};

const clearFilters = () => {
    searchQuery.value = '';
    warehouseFilter.value = null;
    stockStatusFilter.value = null;
    stocksStore.clearFilters();
};
</script>

<template>
    <div class="stock-page">
        <!-- Toast notifications -->
        <Toast />

        <!-- Toolbar Principal -->
        <StockToolbar :total-products="totalItems" :total-quantity="totalQuantity" :is-loading="loading" @refresh="handleRefresh" @export="exportToExcel" @print="printInventory" />

        <!-- Estadísticas -->
        <StockStatistics :total-products="totalItems" :total-quantity="totalQuantity" :low-stock-products="lowStockItems" :out-of-stock-products="outOfStockItems" :total-value="totalValue" :loading="loading" />

        <!-- Filtros -->
        <StockFilters v-model:search-query="searchQuery" v-model:warehouse-filter="warehouseFilter" v-model:stock-status-filter="stockStatusFilter" :warehouse-options="warehouseOptions" @clear-filters="clearFilters" />

        <!-- Tabla de Stock -->
        <transition name="slide-up" appear>
            <StockTable :stock-items="stockItems" :loading="loading" @view-details="viewProductDetails" @adjust-stock="adjustStock" @clear-filters="clearFilters" />
        </transition>
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de stock */
.stock-page {
    @apply min-h-screen space-y-6;
}

/* Animaciones de transición */
.slide-up-enter-active {
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
    transform: translateY(20px);
    opacity: 0;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .stock-page {
        @apply space-y-4 p-2;
    }
}
</style>
