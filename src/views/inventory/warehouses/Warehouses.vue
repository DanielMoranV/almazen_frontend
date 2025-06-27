<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useWarehousesStore } from '@/stores/warehousesStore';
import WarehouseFormDialog from '@/views/inventory/warehouses/componentsWarehouses/WarehouseFormDialog.vue';
import WarehousesTable from '@/views/inventory/warehouses/componentsWarehouses/WarehousesTable.vue';
import WarehouseToolbar from '@/views/inventory/warehouses/componentsWarehouses/WarehouseToolbar.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const warehousesStore = useWarehousesStore();

// Estados locales
const selectedWarehouse = ref(null);
const showWarehouseDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

// Estados computados del store
const totalWarehouses = computed(() => warehousesStore.totalWarehouses);
const isLoading = computed(() => warehousesStore.isLoadingWarehouses);
const hasWarehouses = computed(() => warehousesStore.warehousesList.length > 0);

// Inicialización
onMounted(async () => {
    await loadWarehouses();
});

// Gestión de carga inicial
const loadWarehouses = async () => {
    await warehousesStore.fetchWarehouses();
    if (warehousesStore.success) {
        showSuccess('Almacenes cargados', 'Lista actualizada correctamente');
    }
};

// Gestión de almacenes
const openCreateDialog = () => {
    selectedWarehouse.value = null;
    isCreating.value = true;
    showWarehouseDialog.value = true;
};

const openEditDialog = (warehouse) => {
    selectedWarehouse.value = { ...warehouse };
    isCreating.value = false;
    showWarehouseDialog.value = true;
};

const openDeleteDialog = (warehouse) => {
    selectedWarehouse.value = warehouse;
    showDeleteDialog.value = true;
};

const handleWarehouseSubmit = async (warehouseData) => {
    const action = isCreating.value ? warehousesStore.createWarehouse : warehousesStore.updateWarehouse;
    await action(warehouseData);

    if (warehousesStore.success) {
        const message = isCreating.value ? 'Almacén creado exitosamente' : 'Almacén actualizado exitosamente';
        showSuccess(message, warehousesStore.message);
        showWarehouseDialog.value = false;
        // Recargar la página actual para mostrar el nuevo/editado almacén
        await warehousesStore.fetchWarehouses();
    } else {
        handleApiErrors(warehousesStore);
    }
};

const handleWarehouseDelete = async () => {
    await warehousesStore.deleteWarehouse(selectedWarehouse.value.id);

    if (warehousesStore.success) {
        showSuccess('Almacén eliminado', warehousesStore.message);
        showDeleteDialog.value = false;
        // Recargar para reflejar la eliminación
        await warehousesStore.fetchWarehouses();
    } else {
        handleApiErrors(warehousesStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await warehousesStore.fetchWarehouses();
    showSuccess('Datos actualizados', 'Lista de almacenes actualizada');
};

// Helpers para manejo de respuestas API
const handleApiErrors = (store) => {
    if (store.validationErrors && store.validationErrors.length > 0) {
        store.validationErrors.forEach((err) => {
            toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
        });
    } else {
        showError('Error', store.message || 'Ha ocurrido un error inesperado');
    }
};

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (summary, detail) => {
    toast.add({ severity: 'error', summary, detail, life: 4000 });
};
</script>

<style scoped>
/* Contenedor principal de la página de almacenes */
.warehouses-page {
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
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-red-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

/* Contenedor del ícono mejorado */
.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg;
}

/* Estilo del ícono con animación */
.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

/* Título del estado vacío mejorado */
.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #dc2626, #f97316);
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
    @apply bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 border-none text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105;
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
<template>
    <div class="warehouses-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal Mejorado -->
        <WarehouseToolbar :total-warehouses="totalWarehouses" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Área Principal de Contenido con Animaciones -->
        <div class="content-wrapper">
            <!-- Estado Vacío Mejorado -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasWarehouses" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-building"></i>
                        </div>
                        <h3 class="empty-title">
                            {{ warehousesStore.getCurrentSearchTerm ? 'No se encontraron almacenes' : 'Aún no tienes almacenes' }}
                        </h3>
                        <p class="empty-description">
                            {{ warehousesStore.getCurrentSearchTerm ? 'Intenta con otros términos de búsqueda o limpia los filtros.' : 'Crea tu primer almacén para empezar a gestionar tu inventario.' }}
                        </p>
                        <div class="empty-actions">
                            <Button v-if="!warehousesStore.getCurrentSearchTerm" icon="pi pi-plus" label="Agregar Almacén" class="primary-action-btn" @click="openCreateDialog" />
                            <Button v-else icon="pi pi-times" label="Limpiar Búsqueda" class="secondary-action-btn" @click="warehousesStore.clearSearch && warehousesStore.clearSearch()" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Almacenes con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasWarehouses" class="table-container">
                    <WarehousesTable :warehouses="warehousesStore.warehousesList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </transition>

            <!-- Estado de Carga Mejorado -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando almacenes...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <WarehouseFormDialog v-model:visible="showWarehouseDialog" :warehouse="selectedWarehouse" :loading="isLoading" @submit="handleWarehouseSubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedWarehouse?.name || ''" @confirm="handleWarehouseDelete" />
    </div>
</template>
