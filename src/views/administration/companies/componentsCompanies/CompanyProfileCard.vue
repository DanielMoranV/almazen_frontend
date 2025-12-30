<script setup>
import { computed } from 'vue';

const props = defineProps({
    company: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['edit', 'upload-logo']);

// Computed properties
const logoUrl = computed(() => props.company?.logo || null);
const hasLogo = computed(() => !!logoUrl.value);
const isActive = computed(() => props.company?.is_active ?? true);
const displayRuc = computed(() => props.company?.ruc || 'No registrado');
</script>

<template>
    <div class="company-profile-card">
        <div class="card-content">
            <div class="profile-layout">
                <!-- Logo Section - Left Side -->
                <div class="logo-section">
                    <div class="logo-container group" @click="$emit('upload-logo')">
                        <img v-if="hasLogo" :src="logoUrl" :alt="company.company_name" class="company-logo" @error="$event.target.style.display = 'none'" />
                        <div v-else class="logo-placeholder">
                            <i class="pi pi-building"></i>
                        </div>
                        <div class="logo-overlay">
                            <i class="pi pi-camera"></i>
                            <span>Cambiar</span>
                        </div>
                    </div>
                </div>

                <!-- Company Info Section - Right Side -->
                <div class="info-section">
                    <div class="header-row">
                        <div class="title-group">
                            <h1 class="company-name">{{ company.company_name }}</h1>
                            <div class="company-meta">
                                <span class="ruc-badge">
                                    <i class="pi pi-id-card"></i>
                                    RUC: {{ displayRuc }}
                                </span>
                                <span v-if="isActive" class="status-badge active">
                                    <i class="pi pi-check-circle"></i>
                                    Activa
                                </span>
                                <span v-else class="status-badge inactive">
                                    <i class="pi pi-times-circle"></i>
                                    Inactiva
                                </span>
                            </div>
                        </div>
                        <button class="edit-btn" @click="$emit('edit')">
                            <i class="pi pi-pencil"></i>
                            <span>Editar</span>
                        </button>
                    </div>

                    <!-- Description -->
                    <div v-if="company.description" class="description-section">
                        <h3 class="section-title">
                            <i class="pi pi-info-circle"></i>
                            Acerca de
                        </h3>
                        <p class="description-text">{{ company.description }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.company-profile-card {
    @apply relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.card-content {
    @apply p-6;
}

/* Profile Layout - Horizontal */
.profile-layout {
    @apply flex gap-6 items-start;
}

/* Logo Section - Left Side */
.logo-section {
    @apply flex-shrink-0;
}

.logo-container {
    @apply relative w-32 h-32 rounded-xl overflow-hidden cursor-pointer transition-all duration-300;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logo-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.company-logo {
    @apply w-full h-full object-contain bg-white dark:bg-gray-700;
}

.logo-placeholder {
    @apply w-full h-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center;
}

.logo-placeholder i {
    @apply text-5xl text-green-600 dark:text-green-400;
}

.logo-overlay {
    @apply absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300;
}

.logo-overlay i {
    @apply text-2xl text-white;
}

.logo-overlay span {
    @apply text-white font-semibold text-xs;
}

/* Info Section - Right Side */
.info-section {
    @apply flex-1 min-w-0 space-y-4;
}

.header-row {
    @apply flex justify-between items-start gap-3;
}

.title-group {
    @apply flex-1 min-w-0;
}

.company-name {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2;
    background: linear-gradient(135deg, #059669, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.company-meta {
    @apply flex flex-wrap items-center gap-2;
}

.ruc-badge {
    @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700;
}

.ruc-badge i {
    @apply text-blue-600 dark:text-blue-400 text-xs;
}

.status-badge {
    @apply inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold;
}

.status-badge.active {
    @apply bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700;
}

.status-badge.active i {
    @apply text-green-600 dark:text-green-400 text-xs;
}

.status-badge.inactive {
    @apply bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700;
}

.status-badge.inactive i {
    @apply text-red-600 dark:text-red-400 text-xs;
}

.edit-btn {
    @apply flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 text-sm flex-shrink-0;
    background: linear-gradient(135deg, #059669, #10b981);
    box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

.edit-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
}

.edit-btn i {
    @apply text-base;
}

/* Description Section */
.description-section {
    @apply space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.section-title {
    @apply flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200;
}

.section-title i {
    @apply text-green-600 dark:text-green-400 text-sm;
}

.description-text {
    @apply text-gray-700 dark:text-gray-300 leading-relaxed text-sm;
}

/* Responsive Design */
@media (max-width: 768px) {
    .profile-layout {
        @apply flex-col items-center;
    }

    .logo-section {
        @apply w-full flex justify-center;
    }

    .logo-container {
        @apply w-28 h-28;
    }

    .info-section {
        @apply w-full;
    }

    .header-row {
        @apply flex-col items-start;
    }

    .company-name {
        @apply text-2xl;
    }

    .edit-btn {
        @apply w-full justify-center;
    }
}
</style>
