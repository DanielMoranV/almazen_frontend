<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useUnitsStore } from '@/stores/unitsStore';
import UnitsTable from './componentsUnits/UnitsTable.vue';
import UnitsFormDialog from './componentsUnits/UnitsFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import UnitToolbar from './componentsUnits/UnitToolbar.vue';

const toast = useToast();
const unitsStore = useUnitsStore();

// Estados locales
const selectedUnit = ref(null);
const showUnitDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

const openCreateDialog = () => {
    selectedUnit.value = null;
    isCreating.value = true;
    showUnitDialog.value = true;
};

// Estados computados del store
const totalUnits = computed(() => unitsStore.totalUnits);
const isLoading = computed(() => unitsStore.isLoadingUnits);
const hasUnits = computed(() => unitsStore.unitsList.length > 0);

// Inicialización
onMounted(async () => {
    await loadUnits();
});

// Gestión de carga inicial
const loadUnits = async () => {
    await unitsStore.fetchUnits();
    if (unitsStore.success) {
        showSuccess('Unidades cargadas', 'Lista actualizada correctamente');
    }
};

const handleUnitSubmit = async (unitData) => {
    const action = isCreating.value ? unitsStore.createUnit : unitsStore.updateUnit;
    await action(unitData);

    if (unitsStore.success) {
        const message = isCreating.value ? 'Unidad creada exitosamente' : 'Unidad actualizada exitosamente';
        showSuccess(message, unitsStore.message);
        showUnitDialog.value = false;
        await loadUnits();
    } else {
        handleApiErrors(unitsStore);
    }
};

const handleUnitDelete = async () => {
    await unitsStore.removeUnit(selectedUnit.value.id);
    if (unitsStore.success) {
        showSuccess('Unidad eliminada', unitsStore.message);
        showDeleteDialog.value = false;
        await loadUnits();
    } else {
        handleApiErrors(unitsStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await unitsStore.fetchUnits();
    showSuccess('Datos actualizados', 'Lista de unidades actualizada');
};

// Helpers para manejo de respuestas API
const handleApiErrors = (store) => {
    if (store.validationErrors && store.validationErrors.length > 0) {
        store.validationErrors.forEach((err) => {
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
            summary: 'Error',
            detail: store.message || 'Ha ocurrido un error inesperado',
            life: 4000
        });
    }
};

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (summary, detail) => {
    toast.add({ severity: 'error', summary, detail, life: 4000 });
};
</script>
<template>
    <div class="users-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal Mejorado -->
        <UnitToolbar :total-units="totalUnits" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Área Principal de Contenido con Animaciones -->
        <div class="content-wrapper">
            <!-- Estado Vacío Mejorado -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasUnits" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-box"></i>
                        </div>
                        <h3 class="empty-title">
                            No hay unidades
                        </h3>
                        <p class="empty-description">
                            Crea tu primera unidad para empezar a gestionar el sistema.
                        </p>
                        <div class="empty-actions">
                            <Button icon="pi pi-plus" label="Agregar Unidad" class="primary-action-btn" @click="openCreateDialog" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Unidades con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasUnits" class="table-container">
                    <UnitsTable :units="unitsStore.unitsList" :loading="isLoading" @edit="
                            (unit) => {
                                selectedUnit = unit;
                                showUnitDialog = true;
                            }
                        " @delete="
                            (unit) => {
                                selectedUnit = unit;
                                showDeleteDialog = true;
                            }
                        " />
                </div>
            </transition>

            <!-- Estado de Carga Mejorado -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando unidades...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <UnitsFormDialog v-model:visible="showUnitDialog" :unit="selectedUnit" @submit="handleUnitSubmit" :loading="isLoading" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedUnit?.name || ''" item-type="unidad" @confirm="handleUnitDelete" :loading="isLoading" />
    </div>
</template>
