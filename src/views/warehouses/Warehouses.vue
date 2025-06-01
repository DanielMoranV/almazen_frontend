<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useWarehousesStore } from '@/stores/warehousesStore';
import WarehousesTable from '@/components/warehouses/WarehousesTable.vue';
import WarehouseFormDialog from '@/components/warehouses/WarehouseFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const warehousesStore = useWarehousesStore();

// Estados
const warehouses = ref([]);
const selectedWarehouse = ref(null);
const showWarehouseDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadWarehouses();
});

// Métodos
const loadWarehouses = async () => {
    await warehousesStore.fetchWarehouses();

    if (warehousesStore.success) {
        warehouses.value = warehousesStore.warehousesList;
        showSuccess('Almacenes cargados', warehousesStore.message);
    } else {
        if (warehousesStore.validationErrors && warehousesStore.validationErrors.length > 0) {
            warehousesStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(warehousesStore.message);
        }
    }
};

const handleWarehouseSubmit = async (warehouseData) => {
    const action = warehouseData.id ? warehousesStore.updateWarehouse : warehousesStore.createWarehouse;
    await action(warehouseData);

    if (warehousesStore.success) {
        warehouses.value = warehousesStore.warehousesList;
        showSuccess(warehouseData.id ? 'Almacén actualizado' : 'Almacén creado', warehousesStore.message);
        showWarehouseDialog.value = false;
    } else {
        if (warehousesStore.validationErrors && warehousesStore.validationErrors.length > 0) {
            warehousesStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(warehousesStore.message);
        }
    }
};

const handleWarehouseDelete = async () => {
    await warehousesStore.deleteWarehouse(selectedWarehouse.value.id);
    if (warehousesStore.success) {
        warehouses.value = warehousesStore.warehousesList;
        showSuccess('Almacén eliminado', warehousesStore.message);
        showDeleteDialog.value = false;
    } else {
        if (warehousesStore.validationErrors && warehousesStore.validationErrors.length > 0) {
            warehousesStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(warehousesStore.message);
        }
    }
};

const showSuccess = (title, message) => {
    toast.add({
        severity: 'success',
        summary: title,
        detail: message,
        life: 3000
    });
};

const showError = (message) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 3000
    });
};
</script>
<template>
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Almacenes</h2>
            <Button
                icon="pi pi-plus"
                class="p-button-success"
                @click="
                    () => {
                        selectedWarehouse = null;
                        showWarehouseDialog = true;
                    }
                "
            />
        </div>
        <WarehousesTable
            :warehouses="warehouses"
            :loading="warehousesStore.isLoadingWarehouses"
            @edit="
                (warehouse) => {
                    selectedWarehouse = warehouse;
                    showWarehouseDialog = true;
                }
            "
            @delete="
                (warehouse) => {
                    selectedWarehouse = warehouse;
                    showDeleteDialog = true;
                }
            "
        />

        <WarehouseFormDialog v-model:visible="showWarehouseDialog" :warehouse="selectedWarehouse" @submit="handleWarehouseSubmit" :loading="warehousesStore.isLoadingWarehouses" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedWarehouse?.name || ''" @confirm="handleWarehouseDelete" />
    </div>
</template>
