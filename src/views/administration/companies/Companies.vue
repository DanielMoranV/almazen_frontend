<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useCompaniesStore } from '@/stores/companiesStore';
import CompaniesTable from './componentsCompanies/CompaniesTable.vue';
import CompanyFormDialog from './componentsCompanies/CompanyFormDialog.vue';
import CompanyToolbar from './componentsCompanies/CompanyToolbar.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const companiesStore = useCompaniesStore();

// Estados locales
const selectedCompany = ref(null);
const showCompanyDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

// Estados computados del store
const totalCompanies = computed(() => companiesStore.companiesList.length);
const isLoading = computed(() => companiesStore.isLoadingCompanies);
const hasCompanies = computed(() => companiesStore.companiesList.length > 0);

// Inicialización
onMounted(async () => {
    await loadCompanies();
});

// Gestión de carga inicial
const loadCompanies = async () => {
    await companiesStore.fetchCompanies();
    if (companiesStore.success) {
        showSuccess('Empresas cargadas', 'Lista actualizada correctamente');
    }
};

// Gestión de empresas
const openCreateDialog = () => {
    selectedCompany.value = null;
    isCreating.value = true;
    showCompanyDialog.value = true;
};

const openEditDialog = (company) => {
    selectedCompany.value = { ...company };
    isCreating.value = false;
    showCompanyDialog.value = true;
};

const openDeleteDialog = (company) => {
    selectedCompany.value = company;
    showDeleteDialog.value = true;
};

const handleCompanySubmit = async (companyData) => {
    const action = isCreating.value ? companiesStore.createCompany : companiesStore.updateCompany;
    await action(companyData, companyData.id);

    if (companiesStore.success) {
        const message = isCreating.value ? 'Empresa creada exitosamente' : 'Empresa actualizada exitosamente';
        showSuccess(message, companiesStore.message);
        showCompanyDialog.value = false;
        // Recargar la lista para mostrar los cambios
        await companiesStore.fetchCompanies();
    } else {
        handleApiErrors(companiesStore);
    }
};

const handleCompanyDelete = async () => {
    await companiesStore.removeCompany(selectedCompany.value.id);

    if (companiesStore.success) {
        showSuccess('Empresa eliminada', companiesStore.message);
        showDeleteDialog.value = false;
        // Recargar para reflejar la eliminación
        await companiesStore.fetchCompanies();
    } else {
        handleApiErrors(companiesStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await companiesStore.fetchCompanies();
    showSuccess('Datos actualizados', 'Lista de empresas actualizada');
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
    <div class="companies-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal Mejorado -->
        <CompanyToolbar :total-companies="totalCompanies" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Área Principal de Contenido con Animaciones -->
        <div class="content-wrapper">
            <!-- Estado Vacío Mejorado -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasCompanies" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-building"></i>
                        </div>
                        <h3 class="empty-title">Aún no tienes empresas</h3>
                        <p class="empty-description">Crea tu primera empresa para empezar a gestionar tu directorio empresarial.</p>
                        <div class="empty-actions">
                            <Button icon="pi pi-plus" label="Agregar Empresa" class="primary-action-btn" @click="openCreateDialog" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Empresas con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasCompanies" class="table-container">
                    <CompaniesTable :companies="companiesStore.companiesList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </transition>

            <!-- Estado de Carga Mejorado -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando empresas...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <CompanyFormDialog v-model:visible="showCompanyDialog" :company="selectedCompany" :loading="isLoading" @submit="handleCompanySubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedCompany?.company_name || ''" @confirm="handleCompanyDelete" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de empresas */
.companies-page {
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

