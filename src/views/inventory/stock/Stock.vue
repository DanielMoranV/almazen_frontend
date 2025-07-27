<script setup>
import { useProductStocksStore } from '@/stores/productStocksStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

// Components
import BulkEditDialog from './componentsStock/BulkEditDialog.vue';
import StockDetailsModal from './componentsStock/StockDetailsModal.vue';
import StockEditDialog from './componentsStock/StockEditDialog.vue';
import StockStatistics from './componentsStock/StockStatistics.vue';
import StockTable from './componentsStock/StockTable.vue';
import StockToolbar from './componentsStock/StockToolbar.vue';

const toast = useToast();
const stocksStore = useProductStocksStore();

// Local reactive refs for UI
const warehouseFilter = ref(null);
const stockStatusFilter = ref(null);

// Dialog refs
const showStockEditDialog = ref(false);
const showBulkEditDialog = ref(false);
const showDetailsModal = ref(false);
const selectedStockForEdit = ref(null);
const selectedProductForBulk = ref(null);
const selectedProductForDetails = ref(null);

// Computed properties using store data
const loading = computed(() => stocksStore.isLoadingStocks);
const stockItems = computed(() => stocksStore.filteredStocks);

// Statistics computed from store
const totalItems = computed(() => stocksStore.totalProducts);
const totalQuantity = computed(() => stocksStore.totalQuantity);
const lowStockItems = computed(() => stocksStore.lowStockProducts);
const outOfStockItems = computed(() => stocksStore.outOfStockProducts);
const totalCostValue = computed(() => stocksStore.totalCostValue);
const totalSaleValue = computed(() => stocksStore.totalSaleValue);

// Dynamic warehouse options based on actual data
const warehouseOptions = computed(() => {
    const warehouses = new Map();
    warehouses.set(null, { label: 'Todos los almacenes', value: null });

    stocksStore.stocksList.forEach((product) => {
        product.stock_by_warehouse?.forEach((warehouse) => {
            if (!warehouses.has(warehouse.warehouse_id)) {
                warehouses.set(warehouse.warehouse_id, {
                    label: warehouse.warehouse_name,
                    value: warehouse.warehouse_id
                });
            }
        });
    });

    return Array.from(warehouses.values());
});

// Watch for filter changes and update store
watch(
    [warehouseFilter, stockStatusFilter],
    ([warehouse, status]) => {
        stocksStore.setWarehouseFilter(warehouse);
        stocksStore.setStatusFilter(status);
    },
    { immediate: true }
);

// Lifecycle
onMounted(async () => {
    await loadStockItems();

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

// const exportToExcel = () => {
//     // TODO: Implement Excel export functionality
//     toast.add({
//         severity: 'success',
//         summary: 'Éxito',
//         detail: 'Reporte de inventario exportado a Excel',
//         life: 3000
//     });
// };

// const printInventory = () => {
//     // TODO: Implement print functionality
//     toast.add({
//         severity: 'success',
//         summary: 'Éxito',
//         detail: 'Reporte de inventario enviado a impresión',
//         life: 3000
//     });
// };

const viewProductDetails = (item) => {
    selectedProductForDetails.value = item;
    showDetailsModal.value = true;
};

const editStock = async (item) => {
    try {
        // Get the first available stock_id from the product structure
        let stockId = null;

        if (item.stock_by_warehouse && item.stock_by_warehouse.length > 0) {
            const firstWarehouse = item.stock_by_warehouse[0];

            // Check if there's a direct stock_id (for products without batches)
            if (firstWarehouse.stock_id) {
                stockId = firstWarehouse.stock_id;
            }
            // Or get from the first batch if available
            else if (firstWarehouse.batches && firstWarehouse.batches.length > 0) {
                stockId = firstWarehouse.batches[0].stock_id;
            }
        }

        if (!stockId) {
            toast.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No se encontró información de stock editable para este producto',
                life: 3000
            });
            return;
        }

        // Fetch detailed stock information
        const stockData = await stocksStore.getStockById(stockId);
        selectedStockForEdit.value = stockData;
        showStockEditDialog.value = true;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar información del stock',
            life: 3000
        });
    }
};

const bulkEdit = (item) => {
    selectedProductForBulk.value = item;
    showBulkEditDialog.value = true;
};

const handleStockUpdated = async () => {
    await loadStockItems();
    toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Stock actualizado correctamente',
        life: 3000
    });
};

const handleBulkUpdated = async () => {
    await loadStockItems();
};

const clearFilters = () => {
    warehouseFilter.value = null;
    stockStatusFilter.value = null;
    stocksStore.clearFilters();
};
</script>

<template>
    <div class="stock-page">
        <!-- Toast notifications -->
        <Toast />

        <!-- Toolbar Principal con Filtros Integrados -->
        <StockToolbar
            :total-products="totalItems"
            :total-quantity="totalQuantity"
            :is-loading="loading"
            v-model:warehouse-filter="warehouseFilter"
            v-model:stock-status-filter="stockStatusFilter"
            :warehouse-options="warehouseOptions"
            @refresh="handleRefresh"
            @clear-filters="clearFilters"
        />

        <!-- Estadísticas -->
        <StockStatistics
            :total-products="totalItems"
            :total-quantity="totalQuantity"
            :low-stock-products="lowStockItems"
            :out-of-stock-products="outOfStockItems"
            :total-cost-value="totalCostValue"
            :total-sale-value="totalSaleValue"
            :loading="loading"
        />

        <!-- Tabla de Stock -->
        <transition name="slide-up" appear>
            <StockTable :stock-items="stockItems" :loading="loading" @view-details="viewProductDetails" @edit-stock="editStock" @bulk-edit="bulkEdit" @clear-filters="clearFilters" />
        </transition>

        <!-- Dialogs -->
        <StockEditDialog v-model:visible="showStockEditDialog" :stock-data="selectedStockForEdit" @stock-updated="handleStockUpdated" />

        <BulkEditDialog v-model:visible="showBulkEditDialog" :product-data="selectedProductForBulk" @bulk-updated="handleBulkUpdated" />

        <StockDetailsModal v-model:visible="showDetailsModal" :product-data="selectedProductForDetails" />
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
