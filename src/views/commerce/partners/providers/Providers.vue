<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useProvidersStore } from '@/stores/providersStore';
import ProviderFormDialog from './componentsProviders/ProviderFormDialog.vue';
import ProvidersTable from './componentsProviders/ProvidersTable.vue';
import ProviderToolbar from './componentsProviders/ProviderToolbar.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const providersStore = useProvidersStore();

// Estados locales
const selectedProvider = ref(null);
const showProviderDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

// Estados computados del store
const totalProviders = computed(() => providersStore.providersList.length);
const isLoading = computed(() => providersStore.isLoadingProviders);
const hasProviders = computed(() => providersStore.providersList.length > 0);

// Inicialización
onMounted(async () => {
    await loadProviders();
});

// Gestión de carga inicial
const loadProviders = async () => {
    await providersStore.fetchProviders();
    if (providersStore.success) {
        showSuccess('Proveedores cargados', 'Lista actualizada correctamente');
    }
};

// Gestión de proveedores
const openCreateDialog = () => {
    selectedProvider.value = null;
    isCreating.value = true;
    showProviderDialog.value = true;
};

const openEditDialog = (provider) => {
    selectedProvider.value = { ...provider };
    isCreating.value = false;
    showProviderDialog.value = true;
};

const openDeleteDialog = (provider) => {
    selectedProvider.value = provider;
    showDeleteDialog.value = true;
};

const handleProviderSubmit = async (providerData) => {
    const action = isCreating.value ? providersStore.createProvider : providersStore.updateProvider;
    await action(providerData);

    if (providersStore.success) {
        const message = isCreating.value ? 'Proveedor creado exitosamente' : 'Proveedor actualizado exitosamente';
        showSuccess(message, providersStore.message);
        showProviderDialog.value = false;
        // Recargar la lista para mostrar los cambios
        await providersStore.fetchProviders();
    } else {
        handleApiErrors(providersStore);
    }
};

const handleProviderDelete = async () => {
    await providersStore.deleteProvider(selectedProvider.value.id);

    if (providersStore.success) {
        showSuccess('Proveedor eliminado', providersStore.message);
        showDeleteDialog.value = false;
        // Recargar para reflejar la eliminación
        await providersStore.fetchProviders();
    } else {
        handleApiErrors(providersStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await providersStore.fetchProviders();
    showSuccess('Datos actualizados', 'Lista de proveedores actualizada');
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
    <div class="providers-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal Mejorado -->
        <ProviderToolbar :total-providers="totalProviders" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Área Principal de Contenido con Animaciones -->
        <div class="content-wrapper">
            <!-- Estado Vacío Mejorado -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasProviders" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-users"></i>
                        </div>
                        <h3 class="empty-title">Aún no tienes proveedores</h3>
                        <p class="empty-description">Crea tu primer proveedor para empezar a gestionar tu red de suministros.</p>
                        <div class="empty-actions">
                            <Button icon="pi pi-plus" label="Agregar Proveedor" class="primary-action-btn" @click="openCreateDialog" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Proveedores con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasProviders" class="table-container">
                    <ProvidersTable :providers="providersStore.providersList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </transition>

            <!-- Estado de Carga Mejorado -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando proveedores...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <ProviderFormDialog v-model:visible="showProviderDialog" :provider="selectedProvider" :loading="isLoading" @submit="handleProviderSubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProvider?.name || ''" @confirm="handleProviderDelete" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de proveedores */
.providers-page {
    @apply min-h-screen;
}

/* Contenedor de contenido con espaciado y diseño mejorado */
.content-wrapper {
    @apply mt-6 space-y-6;
}

/* Contenedor de tabla con efecto de elevación */
.table-container {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Estado vacío mejorado con diseño centrado */
.empty-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-green-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

/* Contenedor del ícono mejorado */
.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg;
}

/* Estilo del ícono con animación */
.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

/* Título del estado vacío mejorado */
.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #059669, #3b82f6);
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
    @apply bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border-none text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105;
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
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
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
    0%, 20%, 50%, 80%, 100% {
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
    
    .primary-action-btn {
        @apply w-full;
    }
}

/* Mejoras adicionales para modo oscuro */
@media (prefers-color-scheme: dark) {
    .table-container {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
