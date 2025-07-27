<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useUnitsStore } from '@/stores/unitsStore';
import UnitsTable from './componentsUnits/UnitsTable.vue';
import UnitsFormDialog from './componentsUnits/UnitsFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const unitsStore = useUnitsStore();

// Estados
const units = ref([]);
const selectedUnit = ref(null);
const showUnitDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadUnits();
});

// Métodos
const loadUnits = async () => {
    await unitsStore.fetchUnits();

    if (unitsStore.success) {
        units.value = unitsStore.unitsList;
        showSuccess('Unidades cargadas', unitsStore.message);
    } else {
        if (unitsStore.validationErrors && unitsStore.validationErrors.length > 0) {
            unitsStore.validationErrors.forEach((err) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error de validación',
                    detail: err,
                    life: 4000
                });
            });
        } else {
            showError(unitsStore.message);
        }
    }
};

const handleUnitSubmit = async (unitData) => {
    const action = unitData.id ? unitsStore.updateUnit : unitsStore.createUnit;
    await action(unitData);

    if (unitsStore.success) {
        units.value = unitsStore.unitsList;
        showSuccess(unitData.id ? 'Unidad actualizada' : 'Unidad creada', unitsStore.message);
        showUnitDialog.value = false;
    } else {
        if (unitsStore.validationErrors && unitsStore.validationErrors.length > 0) {
            unitsStore.validationErrors.forEach((err) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error de validación',
                    detail: err,
                    life: 4000
                });
            });
        } else {
            showError(unitsStore.message);
        }
    }
};

const handleUnitDelete = async () => {
    await unitsStore.removeUnit(selectedUnit.value.id);
    if (unitsStore.success) {
        units.value = unitsStore.unitsList;
        showSuccess('Unidad eliminada', unitsStore.message);
        showDeleteDialog.value = false;
    } else {
        if (unitsStore.validationErrors && unitsStore.validationErrors.length > 0) {
            unitsStore.validationErrors.forEach((err) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error de validación',
                    detail: err,
                    life: 4000
                });
            });
        } else {
            showError(unitsStore.message);
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
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Unidades</h2>
            <Button
                icon="pi pi-plus"
                class="p-button-success"
                @click="
                    () => {
                        selectedUnit = null;
                        showUnitDialog = true;
                    }
                "
            />
        </div>
        <UnitsTable
            :units="units"
            :loading="unitsStore.isLoadingUnits"
            @edit="
                (unit) => {
                    selectedUnit = unit;
                    showUnitDialog = true;
                }
            "
            @delete="
                (unit) => {
                    selectedUnit = unit;
                    showDeleteDialog = true;
                }
            "
        />

        <UnitsFormDialog v-model:visible="showUnitDialog" :unit="selectedUnit" @submit="handleUnitSubmit" :loading="unitsStore.isLoadingUnits" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedUnit?.name || ''" @confirm="handleUnitDelete" />
    </div>
</template>
