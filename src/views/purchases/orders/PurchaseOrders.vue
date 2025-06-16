<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { usePurchaseStore } from '@/stores/purchaseStore';
import PurchaseOrdersTable from '@/views/purchases/orders/componentsOrders/PurchaseOrdersTable.vue';
import PurchaseOrderFormDialog from '@/views/purchases/orders/componentsOrders/PurchaseOrderFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import PurchaseOrderStatistics from '@/views/purchases/orders/componentsOrders/PurchaseOrderStatistics.vue';

const toast = useToast();
const purchaseStore = usePurchaseStore();

// Estados
const purchaseOrders = ref([]);
const selectedOrder = ref(null);
const showPurchaseOrderDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadPurchaseOrders();
    // Las estadísticas se recalculan automáticamente por el computed
});

// Métodos
const handleApproveOrder = async (order) => {
    await purchaseStore.approvePurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden aprobada', purchaseStore.message);
    } else {
        if (purchaseStore.validationErrors && purchaseStore.validationErrors.length > 0) {
            purchaseStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(purchaseStore.message);
        }
    }
};

const handleReceiveOrder = async (order) => {
    await purchaseStore.receivePurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden marcada como recibida', purchaseStore.message);
    } else {
        if (purchaseStore.validationErrors && purchaseStore.validationErrors.length > 0) {
            purchaseStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(purchaseStore.message);
        }
    }
};

const handleCancelOrder = async (order) => {
    await purchaseStore.cancelPurchaseOrder(order.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden cancelada', purchaseStore.message);
    } else {
        if (purchaseStore.validationErrors && purchaseStore.validationErrors.length > 0) {
            purchaseStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(purchaseStore.message);
        }
    }
};
const loadPurchaseOrders = async () => {
    await purchaseStore.fetchPurchaseOrders();

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Órdenes de compra cargadas', purchaseStore.message);
    } else {
        if (purchaseStore.validationErrors && purchaseStore.validationErrors.length > 0) {
            purchaseStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(purchaseStore.message);
        }
    }
};

const handlePurchaseOrderSubmit = async (purchaseOrderData) => {
    const action = purchaseOrderData.id ? purchaseStore.updatePurchaseOrder : purchaseStore.createPurchaseOrder;
    await action(purchaseOrderData);

    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess(purchaseOrderData.id ? 'Orden de compra actualizada' : 'Orden de compra creada', purchaseStore.message);
        showPurchaseOrderDialog.value = false;
    } else {
        if (purchaseStore.validationErrors && purchaseStore.validationErrors.length > 0) {
            purchaseStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(purchaseStore.message);
        }
    }
};

const handlePurchaseOrderDelete = async () => {
    await purchaseStore.deletePurchaseOrder(selectedOrder.value.id);
    if (purchaseStore.success) {
        purchaseOrders.value = purchaseStore.purchaseOrdersList;
        showSuccess('Orden de compra eliminada', purchaseStore.message);
    } else {
        if (purchaseStore.validationErrors && purchaseStore.validationErrors.length > 0) {
            purchaseStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(purchaseStore.message);
        }
    }
    showDeleteDialog.value = false;
};

// Helpers
const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (detail) => {
    toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
};

// Estadísticas reactivas
const statistics = computed(() => {
    const orders = purchaseOrders.value;
    return {
        totalOrders: orders.length,
        totalAmount: orders
            .filter(order => order.status !== 'ANULADO')
            .reduce((total, order) => total + (Number(order.total_amount) || 0), 0),
        averageAmount:
            orders.filter(order => order.status !== 'ANULADO').length > 0
                ? orders.filter(order => order.status !== 'ANULADO').reduce((total, order) => total + (Number(order.total_amount) || 0), 0) /
                  orders.filter(order => order.status !== 'ANULADO').length
                : 0,
        highestAmount:
            orders.filter(order => order.status !== 'ANULADO').length > 0
                ? Math.max(...orders.filter(order => order.status !== 'ANULADO').map(order => Number(order.total_amount) || 0))
                : 0,
        lowestAmount:
            orders.filter(order => order.status !== 'ANULADO').length > 0
                ? Math.min(...orders.filter(order => order.status !== 'ANULADO').map(order => Number(order.total_amount) || 0))
                : 0,
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
    <!-- Estadísticas modernas y responsivas -->
    <PurchaseOrderStatistics :statistics="statistics" :formatCurrencyPEN="formatCurrencyPEN" :loading="purchaseStore.isLoadingPurchaseOrders" class="mb-3" />

    <div class="p-4 sm:p-6 lg:px-16 card bg-white dark:bg-gray-900 rounded-xl shadow-md w-full max-w-none">
        <Toast />
        <ConfirmDialog />
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <Button
                icon="pi pi-plus"
                class="p-button-success w-full sm:w-auto block sm:inline-flex mb-2 sm:mb-0"
                label="Orden de Compra"
                @click="
                    () => {
                        selectedOrder = null;
                        showPurchaseOrderDialog = true;
                    }
                "
            />
        </div>

        <!-- Tabla con scroll horizontal en móviles -->
        <div class="overflow-x-auto rounded-lg shadow-sm bg-white dark:bg-gray-800">
            <PurchaseOrdersTable
                :purchaseOrders="purchaseOrders"
                :loading="purchaseStore.isLoadingPurchaseOrders"
                @edit="
                    (order) => {
                        selectedOrder = order;
                        showPurchaseOrderDialog = true;
                    }
                "
                @delete="
                    (order) => {
                        selectedOrder = order;
                        showDeleteDialog = true;
                    }
                "
                @approve-order="handleApproveOrder"
                @receive-order="handleReceiveOrder"
                @cancel-order="handleCancelOrder"
            />
        </div>
        <!-- Diálogos -->
        <PurchaseOrderFormDialog v-model:visible="showPurchaseOrderDialog" :order="selectedOrder" @submit="handlePurchaseOrderSubmit" :loading="purchaseStore.isLoadingPurchaseOrders" dialog-class="max-w-full w-[95vw] sm:w-[500px]" />
        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedOrder?.id ? String(selectedOrder.id) : ''" @confirm="handlePurchaseOrderDelete" dialog-class="max-w-full w-[90vw] sm:w-[400px]" />
    </div>
</template>
