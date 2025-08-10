<script setup>
import { useStockTransfersStore } from '@/stores/stockTransfersStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { storeToRefs } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

// PrimeVue Components
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';

// Components
import StockTransferFormDialog from './componentsTransfers/StockTransferFormDialog.vue';
import StockTransfersTable from './componentsTransfers/StockTransfersTable.vue';
import StockTransfersToolbar from './componentsTransfers/StockTransfersToolbar.vue';

const toast = useToast();
const confirm = useConfirm();
const stockTransfersStore = useStockTransfersStore();
const warehousesStore = useWarehousesStore();

// Store reactive data
const { transfers } = storeToRefs(stockTransfersStore);
const { warehousesList } = storeToRefs(warehousesStore);

// Function to get default date range (from 30 days ago up to tomorrow)
const getDefaultDateRange = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
        from: thirtyDaysAgo,
        to: tomorrow
    };
};

// Initialize default date range
const defaultDates = getDefaultDateRange();

// Local reactive refs for UI with default values
const dateFromFilter = ref(defaultDates.from);
const dateToFilter = ref(defaultDates.to);
const fromWarehouseFilter = ref(null);
const toWarehouseFilter = ref(null);
const productFilter = ref('');
const statusFilter = ref(null);

// Dialog refs
const showTransferDialog = ref(false);
const selectedTransfer = ref(null);

// Error handling state
const hasError = ref(false);
const errorMessage = ref('');

// Computed properties using store data
const loading = computed(() => stockTransfersStore.isLoading);
const transferItems = computed(() => transfers.value || []);

// Total transfers computed from store
const totalTransfers = computed(() => transferItems.value.length);

// Utility function to format dates for API (YYYY-MM-DD format)
const formatDateForAPI = (date, type = 'start') => {
    if (!date) return null;

    try {
        let dateObj;

        if (date instanceof Date) {
            dateObj = new Date(date);
        } else if (typeof date === 'string') {
            dateObj = new Date(date);
        } else {
            return null;
        }

        if (isNaN(dateObj.getTime())) {
            console.warn('Invalid date provided:', date);
            return null;
        }

        if (type === 'end') {
            dateObj.setHours(23, 59, 59, 999);
        } else {
            dateObj.setHours(0, 0, 0, 0);
        }

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');

        if (type === 'end') {
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
            return `${year}-${month}-${day}`;
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
};

// Dynamic warehouse options based on actual data
const warehouseOptions = computed(() => {
    const warehouses = new Map();
    warehouses.set(null, { label: 'Todos los almacenes', value: null });

    warehousesList.value.forEach((warehouse) => {
        warehouses.set(warehouse.id, {
            label: warehouse.name,
            value: warehouse.id
        });
    });

    return Array.from(warehouses.values());
});

// Status filter options
const statusFilterOptions = computed(() => [
    { label: 'Todos los estados', value: null },
    { label: 'Completado', value: 'completed' },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Cancelado', value: 'cancelled' }
]);

// Apply filters function
const applyFilters = () => {
    const formattedDateFrom = dateFromFilter.value ? formatDateForAPI(dateFromFilter.value, 'start') : null;
    const formattedDateTo = dateToFilter.value ? formatDateForAPI(dateToFilter.value, 'end') : null;

    // Update filters directly in store
    stockTransfersStore.filters.from_date = formattedDateFrom;
    stockTransfersStore.filters.to_date = formattedDateTo;
    stockTransfersStore.filters.from_warehouse_id = fromWarehouseFilter.value;
    stockTransfersStore.filters.to_warehouse_id = toWarehouseFilter.value;
    stockTransfersStore.filters.product_search = productFilter.value;
    stockTransfersStore.filters.status = statusFilter.value;

    // Reload transfers with new filters
    loadTransfers();
};

// Lifecycle
onMounted(async () => {
    await Promise.all([loadTransfers(), warehousesStore.fetchWarehouses()]);

    // Show success/error messages from store
    if (stockTransfersStore.message) {
        const severity = stockTransfersStore.success ? 'success' : 'error';
        const summary = stockTransfersStore.success ? 'Éxito' : 'Error';
        showToast(severity, summary, stockTransfersStore.message);
        stockTransfersStore.clearMessage();
    }
});

// Utility function for showing toast messages
const showToast = (severity, summary, detail) => {
    toast.add({
        severity,
        summary,
        detail,
        life: 3000
    });
};

// Methods
const loadTransfers = async () => {
    try {
        hasError.value = false;
        errorMessage.value = '';
        await stockTransfersStore.loadTransfers();
    } catch (error) {
        console.error('Error loading transfers:', error);
        hasError.value = true;
        errorMessage.value = 'Error al cargar las transferencias de stock';
        showToast('error', 'Error', errorMessage.value);
    }
};

const handleRefresh = async () => {
    try {
        await loadTransfers();
        if (stockTransfersStore.success) {
            showToast('success', 'Éxito', 'Transferencias actualizadas correctamente');
        }
    } catch (error) {
        console.error('Error refreshing transfers:', error);
        showToast('error', 'Error', 'Error al actualizar las transferencias');
    }
};

const openCreateDialog = () => {
    selectedTransfer.value = null;
    showTransferDialog.value = true;
};

const openEditDialog = (transfer) => {
    selectedTransfer.value = transfer;
    showTransferDialog.value = true;
};

const handleTransferSubmit = async (transferData) => {
    try {
        const action = transferData.id ? stockTransfersStore.updateTransfer : stockTransfersStore.createTransfer;
        await action(transferData);

        if (stockTransfersStore.success) {
            showToast('success', transferData.id ? 'Transferencia actualizada' : 'Transferencia creada', transferData.id ? 'La transferencia se ha actualizado exitosamente' : 'Nueva transferencia creada exitosamente');
            showTransferDialog.value = false;
            await loadTransfers();
        } else {
            handleError(transferData.id ? 'Error al actualizar transferencia' : 'Error al crear transferencia', stockTransfersStore.message, stockTransfersStore.validationErrors);
        }
    } catch (error) {
        console.error('Error submitting transfer:', error);
        handleError('Error del sistema', 'Ocurrió un error inesperado');
    }
};

const confirmRestoreTransfer = (transfer) => {
    confirm.require({
        message: `¿Está seguro de restaurar la transferencia #${transfer.id}?`,
        header: 'Confirmar Restauración',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, Restaurar',
        rejectLabel: 'Cancelar',
        accept: () => restoreTransfer(transfer.id)
    });
};

const restoreTransfer = async (transferId) => {
    try {
        await stockTransfersStore.restoreTransfer(transferId);

        if (stockTransfersStore.success) {
            showToast('success', 'Transferencia restaurada', 'La transferencia se ha restaurado exitosamente');
            await loadTransfers();
        } else {
            handleError('Error al restaurar transferencia', stockTransfersStore.message);
        }
    } catch (error) {
        console.error('Error restoring transfer:', error);
        handleError('Error del sistema', 'Ocurrió un error inesperado al restaurar la transferencia');
    }
};

const clearFilters = () => {
    // Reset filters to default values
    const newDefaultDates = getDefaultDateRange();
    dateFromFilter.value = newDefaultDates.from;
    dateToFilter.value = newDefaultDates.to;
    fromWarehouseFilter.value = null;
    toWarehouseFilter.value = null;
    productFilter.value = '';
    statusFilter.value = null;

    // Clear store filters
    stockTransfersStore.clearFilters();

    // Reload transfers with cleared filters
    loadTransfers();
};

// Helper for error handling
const handleError = (summary, message, validationErrors = null) => {
    if (validationErrors && validationErrors.length > 0) {
        validationErrors.forEach((err) => {
            toast.add({
                severity: 'error',
                summary: 'Error de validación',
                detail: err,
                life: 4000
            });
        });
    } else {
        toast.add({
            severity: 'error',
            summary,
            detail: message,
            life: 4000
        });
    }
};

// Export functionality
const exportTransfers = (format) => {
    // TODO: Implement export functionality
    showToast('info', 'Exportación', `Exportando transferencias en formato ${format.toUpperCase()}...`);
};
</script>

<template>
    <div class="stock-transfers-page">
        <!-- Toast notifications -->
        <Toast />
        <ConfirmDialog />

        <!-- Header principal -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-info">
                    <div class="breadcrumb">
                        <i class="pi pi-home"></i>
                        <span>Inventario</span>
                        <i class="pi pi-chevron-right"></i>
                        <span>Transferencias de Stock</span>
                    </div>
                    <h1 class="page-title">
                        <i class="pi pi-arrow-right-arrow-left"></i>
                        Gestión de Transferencias de Stock
                    </h1>
                    <p class="page-description">Administra y controla todas las transferencias de stock entre almacenes</p>
                </div>
                <div class="header-actions">
                    <Button icon="pi pi-refresh" label="Actualizar" outlined class="refresh-btn" @click="handleRefresh" :loading="loading" v-tooltip.top="'Actualizar lista de transferencias'" />
                    <Button icon="pi pi-plus" label="Nueva Transferencia" severity="success" @click="openCreateDialog" v-tooltip.top="'Crear nueva transferencia de stock'" />
                </div>
            </div>
        </div>

        <!-- Toolbar Principal -->
        <StockTransfersToolbar
            :total-transfers="totalTransfers"
            :is-loading="loading"
            v-model:date-from-filter="dateFromFilter"
            v-model:date-to-filter="dateToFilter"
            v-model:from-warehouse-filter="fromWarehouseFilter"
            v-model:to-warehouse-filter="toWarehouseFilter"
            v-model:product-filter="productFilter"
            v-model:status-filter="statusFilter"
            :warehouse-options="warehouseOptions"
            :status-options="statusFilterOptions"
            @refresh="handleRefresh"
            @clear-filters="clearFilters"
            @export="exportTransfers"
            @apply-filters="applyFilters"
        />

        <!-- Tabla de Transferencias -->
        <transition name="slide-up" appear>
            <StockTransfersTable :transfers="transferItems" :loading="loading" @edit="openEditDialog" @restore="confirmRestoreTransfer" @clear-filters="clearFilters" />
        </transition>

        <!-- Modal de Formulario -->
        <StockTransferFormDialog v-model:visible="showTransferDialog" :transfer="selectedTransfer" :warehouse-options="warehouseOptions" :loading="loading" @submit="handleTransferSubmit" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de transferencias */
.stock-transfers-page {
    @apply min-h-screen space-y-6;
}

/* Header principal */
.page-header {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #3b82f6 100%);
}

.header-content {
    @apply p-6 flex justify-between items-start gap-6;
}

.header-info {
    @apply flex-1;
}

.breadcrumb {
    @apply flex items-center gap-2 text-white/80 text-sm mb-3;
}

.breadcrumb i {
    @apply text-xs;
}

.page-title {
    @apply text-3xl font-bold text-white mb-2 flex items-center gap-3;
}

.page-title i {
    @apply text-2xl;
}

.page-description {
    @apply text-white/90 text-lg;
}

.header-actions {
    @apply flex gap-3;
}

.refresh-btn {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white;
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
    .stock-transfers-page {
        @apply space-y-4 p-2;
    }

    .header-content {
        @apply flex-col gap-4 p-4;
    }

    .header-actions {
        @apply w-full;
    }

    .refresh-btn {
        @apply flex-1;
    }
}

@media (max-width: 480px) {
    .page-title {
        @apply text-2xl;
    }

    .page-description {
        @apply text-base;
    }

    .header-actions {
        @apply flex-col;
    }
}
</style>
