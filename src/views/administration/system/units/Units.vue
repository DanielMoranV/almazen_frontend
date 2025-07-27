<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useUnitsStore } from '@/stores/unitsStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import UnitsFormDialog from './componentsUnits/UnitsFormDialog.vue';
import UnitsTable from './componentsUnits/UnitsTable.vue';
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
    try {
        if (isCreating.value) {
            // Crear nueva unidad
            await unitsStore.createUnit(unitData);
        } else {
            // Actualizar unidad existente
            await unitsStore.updateUnit({
                ...unitData,
                id: selectedUnit.value.id
            });
        }

        if (unitsStore.success) {
            const message = isCreating.value ? 'Unidad creada exitosamente' : 'Unidad actualizada exitosamente';
            showSuccess(message, unitsStore.message);
            showUnitDialog.value = false;
            // No es necesario recargar todas las unidades si el store ya actualiza su estado
        } else {
            handleApiErrors(unitsStore);
        }
    } catch (error) {
        showError('Error', 'Ha ocurrido un error al procesar la unidad');
    }
};

const handleUnitDelete = async () => {
    try {
        await unitsStore.removeUnit(selectedUnit.value.id);
        if (unitsStore.success) {
            showSuccess('Unidad eliminada', unitsStore.message);
            showDeleteDialog.value = false;
            // No es necesario recargar todas las unidades si el store ya actualiza su estado
        } else {
            handleApiErrors(unitsStore);
            showDeleteDialog.value = false;
        }
    } catch (error) {
        showError('Error', 'Ha ocurrido un error al eliminar la unidad');
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
                        <h3 class="empty-title">No hay unidades</h3>
                        <p class="empty-description">Crea tu primera unidad para empezar a gestionar el sistema.</p>
                        <div class="empty-actions">
                            <Button icon="pi pi-plus" label="Agregar Unidad" class="primary-action-btn" @click="openCreateDialog" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Unidades con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasUnits" class="table-container">
                    <UnitsTable
                        :units="unitsStore.unitsList"
                        :loading="isLoading"
                        @edit="
                            (unit) => {
                                selectedUnit.value = unit;
                                isCreating.value = false;
                                showUnitDialog.value = true;
                            }
                        "
                        @delete="
                            (unit) => {
                                selectedUnit.value = unit;
                                showDeleteDialog.value = true;
                            }
                        "
                    />
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

<style scoped>
/* Contenedor principal de la página de usuarios */
.users-page {
    @apply min-h-screen;
}

/* Contenedor de contenido con espaciado y diseño mejorado */
.content-wrapper {
    @apply mt-6 space-y-6;
}

/* Contenedor de tabla con efecto de elevación */
.table-container {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Estado vacío mejorado con diseño centrado */
.empty-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-purple-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

/* Contenedor del ícono mejorado */
.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg;
}

/* Estilo del ícono con animación */
.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

/* Título del estado vacío mejorado */
.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Descripción del estado vacío */
.empty-description {
    @apply text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed;
}

/* Contenedor de acciones en estado vacío */
.empty-actions {
    @apply flex justify-center gap-4;
}

/* Botón de acción principal */
.primary-action-btn {
    @apply bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105;
}

/* Botón de acción secundaria */
.secondary-action-btn {
    @apply bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300;
}

/* Estado de carga mejorado */
.loading-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl;
}

.loading-content {
    @apply text-center px-8 py-12;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

/* Animaciones de transición */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-up-enter-active {
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
    transform: translateY(20px);
    opacity: 0;
}

/* Animaciones de CSS */
@keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .empty-content {
        @apply px-4 py-8;
    }

    .empty-title {
        @apply text-2xl;
    }

    .empty-description {
        @apply text-base;
    }

    .empty-actions {
        @apply flex-col gap-3;
    }

    .primary-action-btn,
    .secondary-action-btn {
        @apply w-full;
    }
}

/* Mejoras adicionales para modo oscuro */
@media (prefers-color-scheme: dark) {
    .table-container {
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
