<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import CompanyContactInfo from './componentsCompanies/CompanyContactInfo.vue';
import CompanyFormDialog from './componentsCompanies/CompanyFormDialog.vue';
import CompanyLogoModal from './componentsCompanies/CompanyLogoModal.vue';
import CompanyProfileCard from './componentsCompanies/CompanyProfileCard.vue';
import CompanySocialMedia from './componentsCompanies/CompanySocialMedia.vue';

const toast = useToast();
const companiesStore = useCompaniesStore();
const authStore = useAuthStore();

// Estados locales
const showCompanyDialog = ref(false);
const showDeleteDialog = ref(false);
const showLogoModal = ref(false);
const isLoading = ref(false);

// Computed properties
const currentCompany = computed(() => authStore.currentCompany);
const hasCompany = computed(() => !!currentCompany.value);

// Inicialización
onMounted(async () => {
    // No need to fetch companies list, we use the company from auth
});

// Gestión de empresa
const openEditDialog = () => {
    showCompanyDialog.value = true;
};

const openLogoModal = () => {
    showLogoModal.value = true;
};

const handleCompanySubmit = async (companyData) => {
    console.log('[Companies] Received company data from dialog:', companyData);
    console.log('[Companies] Social media from received data:', companyData.social_media);
    
    isLoading.value = true;
    await companiesStore.updateCompany(companyData);

    if (companiesStore.success) {
        showSuccess('Empresa actualizada', companiesStore.message);
        showCompanyDialog.value = false;
        // Refresh user data to get updated company info
        await authStore.me();
    } else {
        handleApiErrors(companiesStore);
    }
    isLoading.value = false;
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
        showError('Error', store.message || 'Ha ocurrido un error inesperado');
    }
};

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (summary, detail) => {
    toast.add({ severity: 'error', summary, detail, life: 4000 });
};

// Manejador para cuando se actualiza un logo
const handleLogoUpdated = async (data) => {
    showSuccess('Logo actualizado', 'El logo de la empresa se actualizó correctamente');
    showLogoModal.value = false;
    // Refresh user data to get updated logo
    await authStore.me();
};
</script>
<template>
    <div class="company-profile-page">
        <!-- Toast -->
        <Toast />

        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-building"></i>
                        Perfil de Empresa
                    </h1>
                    <p class="page-subtitle">Gestiona la información de tu empresa</p>
                </div>
            </div>
        </div>

        <!-- Área Principal de Contenido -->
        <div class="content-wrapper">
            <!-- Estado Vacío -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasCompany" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-building"></i>
                        </div>
                        <h3 class="empty-title">No hay información de empresa</h3>
                        <p class="empty-description">No se encontró información de empresa asociada a tu cuenta.</p>
                    </div>
                </div>
            </transition>

            <!-- Profile Content -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasCompany" class="profile-grid">
                    <!-- Company Profile Card (Full Width) -->
                    <div class="profile-section full-width">
                        <CompanyProfileCard :company="currentCompany" @edit="openEditDialog" @upload-logo="openLogoModal" />
                    </div>

                    <!-- Contact Information -->
                    <div class="profile-section">
                        <CompanyContactInfo :company="currentCompany" />
                    </div>

                    <!-- Social Media -->
                    <div class="profile-section">
                        <CompanySocialMedia :company="currentCompany" />
                    </div>
                </div>
            </transition>

            <!-- Estado de Carga -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando información...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <CompanyFormDialog v-model:visible="showCompanyDialog" :company="currentCompany" :loading="isLoading" @submit="handleCompanySubmit" />

        <CompanyLogoModal v-model:visible="showLogoModal" :company="currentCompany" @logo-updated="handleLogoUpdated" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página */
.company-profile-page {
    @apply min-h-screen;
}

/* Page Header */
.page-header {
    @apply relative overflow-hidden mb-6 rounded-xl;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    padding: 1.5rem;
    box-shadow:
        0 4px 12px -2px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.05);
}

.header-content {
    @apply relative z-10;
}

.title-section {
    @apply text-center;
}

.page-title {
    @apply flex items-center justify-center gap-2 text-2xl font-bold text-white mb-1;
}

.page-title i {
    @apply text-2xl;
}

.page-subtitle {
    @apply text-white/90 text-sm;
}

/* Contenedor de contenido */
.content-wrapper {
    @apply space-y-6;
}

/* Profile Grid */
.profile-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.profile-section {
    @apply transition-all duration-300;
}

.profile-section.full-width {
    @apply lg:col-span-2;
}

/* Estado vacío */
.empty-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-green-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg;
}

.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #059669, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.empty-description {
    @apply text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed;
}

/* Estado de carga */
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
@media (max-width: 1024px) {
    .profile-grid {
        @apply grid-cols-1;
    }

    .profile-section.full-width {
        @apply col-span-1;
    }
}

@media (max-width: 640px) {
    .page-header {
        @apply p-6;
    }

    .page-title {
        @apply text-3xl;
    }

    .page-subtitle {
        @apply text-base;
    }

    .empty-content {
        @apply px-4 py-8;
    }

    .empty-title {
        @apply text-2xl;
    }

    .empty-description {
        @apply text-base;
    }
}

/* Mejoras adicionales para modo oscuro */
@media (prefers-color-scheme: dark) {
    .profile-section {
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
