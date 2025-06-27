<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { usePurchaseStore } from '@/stores/purchaseStore';
import PurchaseOrderFormDialog from '@/views/purchases/orders/componentsOrders/PurchaseOrderFormDialog.vue';
import PurchaseOrdersTable from '@/views/purchases/orders/componentsOrders/PurchaseOrdersTable.vue';
import PurchaseOrderStatistics from '@/views/purchases/orders/componentsOrders/PurchaseOrderStatistics.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const purchaseStore = usePurchaseStore();

// Estados
const purchaseOrders = ref([]);
const selectedOrder = ref(null);
const showPurchaseOrderDialog = ref(false);
const showDeleteDialog = ref(false);

// Filtros rápidos
const quickFilters = ref({
    status: null,
    period: null
});

const statusFilterOptions = ref([
    { name: 'Todos los estados', value: null },
    { name: 'Pendiente', value: 'PENDIENTE' },
    { name: 'Aprobado', value: 'APROBADO' },
    { name: 'Recibido', value: 'RECIBIDO' },
    { name: 'Cancelado', value: 'CANCELADO' },
    { name: 'Rechazado', value: 'RECHAZADO' }
]);

const periodFilterOptions = ref([
    { name: 'Todos los períodos', value: null },
    { name: 'Última semana', value: 'week' },
    { name: 'Último mes', value: 'month' },
    { name: 'Últimos 3 meses', value: 'quarter' },
    { name: 'Este año', value: 'year' }
]);

// Inicialización
onMounted(async () => {
    await loadPurchaseOrders();
});

// Métodos
const handleApproveOrder = async (order) => {
    await purchaseStore.approvePurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden aprobada', `Orden #${order.id} aprobada exitosamente`);
    } else {
        handleError('Error al aprobar orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const handleReceiveOrder = async (order) => {
    await purchaseStore.receivePurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden recibida', `Orden #${order.id} marcada como recibida`);
    } else {
        handleError('Error al recibir orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const handleCancelOrder = async (order) => {
    await purchaseStore.cancelPurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden cancelada', `Orden #${order.id} cancelada exitosamente`);
    } else {
        handleError('Error al cancelar orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const loadPurchaseOrders = async () => {
    await purchaseStore.fetchPurchaseOrders();

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        // Solo mostrar mensaje de éxito en carga manual
        if (!purchaseStore.isInitialLoad) {
            showSuccess('Lista actualizada', 'Órdenes de compra actualizadas correctamente');
        }
    } else {
        handleError('Error al cargar órdenes', purchaseStore.message, purchaseStore.validationErrors);
    }
};

// Métodos mejorados para manejo de diálogos
const openCreateDialog = () => {
    selectedOrder.value = null;
    showPurchaseOrderDialog.value = true;
};

const openEditDialog = (order) => {
    selectedOrder.value = order;
    showPurchaseOrderDialog.value = true;
};

const openDeleteDialog = (order) => {
    selectedOrder.value = order;
    showDeleteDialog.value = true;
};

// Filtros computados
const filteredOrders = computed(() => {
    let filtered = [...purchaseOrders.value];

    // Filtro por estado
    if (quickFilters.value.status) {
        filtered = filtered.filter((order) => order.status === quickFilters.value.status);
    }

    // Filtro por período
    if (quickFilters.value.period) {
        const now = new Date();
        const filterDate = new Date();

        switch (quickFilters.value.period) {
            case 'week':
                filterDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                filterDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        filtered = filtered.filter((order) => new Date(order.purchase_date) >= filterDate);
    }

    return filtered;
});

// Métodos para filtros
const applyQuickFilters = () => {
    // Los filtros se aplican automáticamente via computed
};

const clearFilters = () => {
    quickFilters.value = {
        status: null,
        period: null
    };
};

const exportOrders = () => {
    // TODO: Implementar exportación
    showSuccess('Exportación', 'Funcionalidad de exportación próximamente');
};

const handlePurchaseOrderSubmit = async (purchaseOrderData) => {
    const action = purchaseOrderData.id ? purchaseStore.updatePurchaseOrder : purchaseStore.createPurchaseOrder;
    await action(purchaseOrderData);

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess(purchaseOrderData.id ? 'Orden actualizada' : 'Orden creada', purchaseOrderData.id ? `Orden #${purchaseOrderData.id} actualizada exitosamente` : 'Nueva orden de compra creada exitosamente');
        showPurchaseOrderDialog.value = false;
    } else {
        handleError(purchaseOrderData.id ? 'Error al actualizar orden' : 'Error al crear orden', purchaseStore.message, purchaseStore.validationErrors);
    }
};

const handlePurchaseOrderDelete = async () => {
    await purchaseStore.deletePurchaseOrder(selectedOrder.value.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden eliminada', `Orden #${selectedOrder.value.id} eliminada exitosamente`);
    } else {
        handleError('Error al eliminar orden', purchaseStore.message, purchaseStore.validationErrors);
    }
    showDeleteDialog.value = false;
};

// Helpers mejorados
const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (detail) => {
    toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
};

const handleError = (summary, message, validationErrors = null) => {
    if (validationErrors && validationErrors.length > 0) {
        validationErrors.forEach((err) => {
            toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
        });
    } else {
        toast.add({ severity: 'error', summary, detail: message, life: 4000 });
    }
};

// Estadísticas reactivas
const statistics = computed(() => {
    const orders = purchaseOrders.value;
    return {
        totalOrders: orders.length,
        totalAmount: orders.filter((order) => order.status !== 'ANULADO').reduce((total, order) => total + (Number(order.total_amount) || 0), 0),
        averageAmount:
            orders.filter((order) => order.status !== 'ANULADO').length > 0
                ? orders.filter((order) => order.status !== 'ANULADO').reduce((total, order) => total + (Number(order.total_amount) || 0), 0) / orders.filter((order) => order.status !== 'ANULADO').length
                : 0,
        highestAmount: orders.filter((order) => order.status !== 'ANULADO').length > 0 ? Math.max(...orders.filter((order) => order.status !== 'ANULADO').map((order) => Number(order.total_amount) || 0)) : 0,
        lowestAmount: orders.filter((order) => order.status !== 'ANULADO').length > 0 ? Math.min(...orders.filter((order) => order.status !== 'ANULADO').map((order) => Number(order.total_amount) || 0)) : 0,
        pendingOrders: orders.filter((order) => order.status === 'PENDIENTE').length,
        approvedOrders: orders.filter((order) => order.status === 'APROBADO').length,
        receivedOrders: orders.filter((order) => order.status === 'RECIBIDO').length,
        cancelledOrders: orders.filter((order) => order.status === 'ANULADO').length
    };
});

function formatCurrencyPEN(value) {
    // Siempre muestra el símbolo S/ para el sol peruano
    if (typeof value !== 'number') return '';
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
</script>

<template>
    <div class="purchase-orders-view">
        <Toast />
        <ConfirmDialog />

        <!-- Header principal -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-info">
                    <div class="breadcrumb">
                        <i class="pi pi-home"></i>
                        <span>Compras</span>
                        <i class="pi pi-chevron-right"></i>
                        <span>Órdenes de Compra</span>
                    </div>
                    <h1 class="page-title">
                        <i class="pi pi-shopping-cart"></i>
                        Gestión de Órdenes de Compra
                    </h1>
                    <p class="page-description">Administra y controla todas las órdenes de compra de tu empresa</p>
                </div>
                <div class="header-actions">
                    <Button icon="pi pi-refresh" label="Actualizar" outlined class="refresh-btn" @click="loadPurchaseOrders" :loading="purchaseStore.isLoadingPurchaseOrders" v-tooltip.top="'Actualizar lista de órdenes'" />
                    <Button icon="pi pi-plus" label="Nueva Orden" class="create-btn" @click="openCreateDialog" v-tooltip.top="'Crear nueva orden de compra'" />
                </div>
            </div>
        </div>

        <!-- Estadísticas -->
        <div class="statistics-section">
            <PurchaseOrderStatistics :statistics="statistics" :formatCurrencyPEN="formatCurrencyPEN" :loading="purchaseStore.isLoadingPurchaseOrders" />
        </div>

        <!-- Toolbar con filtros rápidos -->
        <div class="toolbar-section">
            <div class="toolbar-content">
                <div class="filters-group">
                    <div class="filter-item">
                        <label>Estado:</label>
                        <Dropdown v-model="quickFilters.status" :options="statusFilterOptions" optionLabel="name" optionValue="value" placeholder="Todos los estados" class="status-filter" @change="applyQuickFilters" />
                    </div>
                    <div class="filter-item">
                        <label>Fecha:</label>
                        <Dropdown v-model="quickFilters.period" :options="periodFilterOptions" optionLabel="name" optionValue="value" placeholder="Todos los períodos" class="period-filter" @change="applyQuickFilters" />
                    </div>
                </div>
                <div class="actions-group">
                    <Button icon="pi pi-filter-slash" label="Limpiar Filtros" outlined class="clear-filters-btn" @click="clearFilters" v-tooltip.top="'Limpiar todos los filtros'" />
                    <Button icon="pi pi-download" label="Exportar" outlined class="export-btn" @click="exportOrders" :disabled="!purchaseOrders.length" v-tooltip.top="'Exportar órdenes a Excel'" />
                </div>
            </div>
        </div>

        <!-- Tabla principal -->
        <div class="table-section">
            <PurchaseOrdersTable
                :purchaseOrders="filteredOrders"
                :loading="purchaseStore.isLoadingPurchaseOrders"
                @edit="openEditDialog"
                @delete="openDeleteDialog"
                @approve-order="handleApproveOrder"
                @receive-order="handleReceiveOrder"
                @cancel-order="handleCancelOrder"
            />
        </div>

        <!-- Diálogos -->
        <PurchaseOrderFormDialog v-model:visible="showPurchaseOrderDialog" :order="selectedOrder" @submit="handlePurchaseOrderSubmit" :loading="purchaseStore.isLoadingPurchaseOrders" />
        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedOrder?.id ? `Orden #${selectedOrder.id}` : ''" @confirm="handlePurchaseOrderDelete" />
    </div>
</template>

<style scoped>
/* Layout principal */
.purchase-orders-view {
    @apply min-h-screen;
}

/* Header principal */
.page-header {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6 overflow-hidden;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
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
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30;
}

.create-btn {
    @apply bg-white text-purple-600 font-semibold hover:bg-white/90 border-none;
}

/* Sección de estadísticas */
.statistics-section {
    @apply mb-6;
}

/* Toolbar con filtros */
.toolbar-section {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 p-4;
}

.toolbar-content {
    @apply flex justify-between items-center gap-4;
}

.filters-group {
    @apply flex gap-4;
}

.filter-item {
    @apply flex flex-col gap-2;
}

.filter-item label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.status-filter,
.period-filter {
    @apply min-w-48;
}

.actions-group {
    @apply flex gap-3;
}

.clear-filters-btn,
.export-btn {
    @apply text-sm;
}

/* Sección de tabla */
.table-section {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden;
}

/* Responsive design */
@media (max-width: 768px) {
    .purchase-orders-view {
        @apply p-2;
    }

    .header-content {
        @apply flex-col gap-4 p-4;
    }

    .header-actions {
        @apply w-full;
    }

    .refresh-btn,
    .create-btn {
        @apply flex-1;
    }

    .toolbar-content {
        @apply flex-col gap-4;
    }

    .filters-group {
        @apply w-full flex-col gap-3;
    }

    .filter-item {
        @apply w-full;
    }

    .status-filter,
    .period-filter {
        @apply min-w-full;
    }

    .actions-group {
        @apply w-full;
    }

    .clear-filters-btn,
    .export-btn {
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
