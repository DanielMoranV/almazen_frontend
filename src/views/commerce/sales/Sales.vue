<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useSalesStore } from '@/stores/salesStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import SaleFormDialog from './componentsSales/SaleFormDialog.vue';
import SalesTable from './componentsSales/SalesTable.vue';
import SalesToolbar from './componentsSales/SalesToolbar.vue';
import SalesFilters from './componentsSales/SalesFilters.vue';

const toast = useToast();
const salesStore = useSalesStore();

// Estados locales
const selectedSale = ref(null);
const showSaleDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

// Estados computados del store
const totalSales = computed(() => salesStore.totalSales);
const isLoading = computed(() => salesStore.isLoading);
const hasSales = computed(() => salesStore.salesList.length > 0);

// Inicialización
onMounted(async () => {
    await loadSales();
});

// Gestión de carga inicial
const loadSales = async () => {
    await salesStore.fetchSales();
    console.log(salesStore.salesList);
    if (salesStore.success) {
        showSuccess('Ventas cargadas', 'Lista actualizada correctamente');
    }
};

// Gestión de ventas
const openCreateDialog = () => {
    selectedSale.value = null;
    isCreating.value = true;
    showSaleDialog.value = true;
};

const openEditDialog = (sale) => {
    // Solo permitir editar ventas con estado PENDIENTE
    if (sale.status !== 'PENDIENTE') {
        showError('No permitido', 'Solo se pueden editar ventas con estado PENDIENTE');
        return;
    }

    selectedSale.value = { ...sale };
    isCreating.value = false;
    showSaleDialog.value = true;
};

const openDeleteDialog = (sale) => {
    selectedSale.value = sale;
    showDeleteDialog.value = true;
};

const handleSaleSubmit = async (saleData) => {
    const action = isCreating.value ? salesStore.createSale : salesStore.updateSale;
    await action(saleData);

    if (salesStore.success) {
        const message = isCreating.value ? 'Venta creada exitosamente' : 'Venta actualizada exitosamente';
        showSuccess(message, salesStore.message);
        showSaleDialog.value = false;
        await salesStore.fetchSales();
    } else {
        handleApiErrors(salesStore);
    }
};

const handleSaleDelete = async () => {
    await salesStore.removeSale(selectedSale.value.id);

    if (salesStore.success) {
        showSuccess('Venta eliminada', salesStore.message);
        showDeleteDialog.value = false;
        await salesStore.fetchSales();
    } else {
        handleApiErrors(salesStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await salesStore.fetchSales();
    showSuccess('Datos actualizados', 'Lista de ventas actualizada');
};

// Manejadores de filtros
const handleFilterUpdate = (filters) => {
    salesStore.updateFilters(filters);
};

const handleClearFilters = () => {
    salesStore.clearFilters();
    showSuccess('Filtros limpiados', 'Mostrando todas las ventas');
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

<template>
    <div class="sales-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal -->
        <SalesToolbar :total-sales="totalSales" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Filtros de Búsqueda -->
        <SalesFilters :filters="salesStore.filters" :loading="isLoading" @update:filters="handleFilterUpdate" @clear="handleClearFilters" @search="() => salesStore.applyLocalFilters()" />

        <!-- Área Principal de Contenido -->
        <div class="content-wrapper">
            <!-- Estado Vacío -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasSales" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-shopping-cart"></i>
                        </div>
                        <h3 class="empty-title">
                            {{ salesStore.getCurrentSearchTerm ? 'No se encontraron ventas' : 'Aún no tienes ventas' }}
                        </h3>
                        <p class="empty-description">
                            {{
                                salesStore.getCurrentSearchTerm
                                    ? `Intenta con otros términos de búsqueda o limpia los
                            filtros.`
                                    : `Crea tu primera venta para empezar a gestionar las transacciones.`
                            }}
                        </p>
                        <div class="empty-actions">
                            <Button v-if="!salesStore.getCurrentSearchTerm" icon="pi pi-plus" label="Nueva Venta" class="primary-action-btn" @click="openCreateDialog" />
                            <Button v-else icon="pi pi-times" label="Limpiar Búsqueda" class="secondary-action-btn" @click="salesStore.clearSearch && salesStore.clearSearch()" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Ventas -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasSales" class="table-container">
                    <SalesTable :sales="salesStore.salesList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </transition>

            <!-- Estado de Carga -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando ventas...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <SaleFormDialog v-model:visible="showSaleDialog" :sale="selectedSale" :loading="isLoading" @submit="handleSaleSubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedSale?.document_number || `Venta #${selectedSale?.id}`" @confirm="handleSaleDelete" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de ventas */
.sales-page {
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
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-green-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

/* Contenedor del ícono mejorado */
.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500 shadow-lg;
}

/* Estilo del ícono con animación */
.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

/* Título del estado vacío mejorado */
.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #10b981, #14b8a6);
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
    @apply bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 border-none text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105;
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
