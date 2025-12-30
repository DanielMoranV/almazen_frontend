<script setup>
import { computed } from 'vue';

const props = defineProps({
    company: {
        type: Object,
        required: true
    }
});

// Computed properties
const hasEmail = computed(() => !!props.company?.email);
const hasPhone = computed(() => !!props.company?.phone);
const hasWebsite = computed(() => !!props.company?.website);
const hasAddress = computed(() => !!props.company?.address);
const hasAnyContact = computed(() => hasEmail.value || hasPhone.value || hasWebsite.value || hasAddress.value);
</script>

<template>
    <div class="contact-info-card">
        <div class="card-header">
            <h2 class="card-title">
                <i class="pi pi-phone"></i>
                Información de Contacto
            </h2>
        </div>

        <div v-if="hasAnyContact" class="contact-grid">
            <!-- Email -->
            <div v-if="hasEmail" class="contact-item email">
                <div class="contact-icon">
                    <i class="pi pi-envelope"></i>
                </div>
                <div class="contact-details">
                    <span class="contact-label">Email</span>
                    <a :href="`mailto:${company.email}`" class="contact-value">{{ company.email }}</a>
                </div>
            </div>

            <!-- Phone -->
            <div v-if="hasPhone" class="contact-item phone">
                <div class="contact-icon">
                    <i class="pi pi-phone"></i>
                </div>
                <div class="contact-details">
                    <span class="contact-label">Teléfono</span>
                    <a :href="`tel:${company.phone}`" class="contact-value">{{ company.phone }}</a>
                </div>
            </div>

            <!-- Website -->
            <div v-if="hasWebsite" class="contact-item website">
                <div class="contact-icon">
                    <i class="pi pi-globe"></i>
                </div>
                <div class="contact-details">
                    <span class="contact-label">Sitio Web</span>
                    <a :href="company.website" target="_blank" rel="noopener noreferrer" class="contact-value">
                        {{ company.website }}
                        <i class="pi pi-external-link"></i>
                    </a>
                </div>
            </div>

            <!-- Address -->
            <div v-if="hasAddress" class="contact-item address">
                <div class="contact-icon">
                    <i class="pi pi-map-marker"></i>
                </div>
                <div class="contact-details">
                    <span class="contact-label">Dirección</span>
                    <span class="contact-value">{{ company.address }}</span>
                </div>
            </div>
        </div>

        <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>No hay información de contacto disponible</p>
        </div>
    </div>
</template>

<style scoped>
.contact-info-card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.card-header {
    @apply p-4 border-b border-gray-200 dark:border-gray-700;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
}

.card-title {
    @apply flex items-center gap-2 text-lg font-bold text-white;
}

.card-title i {
    @apply text-lg;
}

.contact-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-3 p-4;
}

.contact-item {
    @apply flex items-start gap-3 p-3 rounded-lg transition-all duration-300 cursor-default;
}

.contact-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.contact-item.email {
    @apply bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700;
}

.contact-item.email:hover {
    @apply bg-purple-100 dark:bg-purple-900/30;
}

.contact-item.phone {
    @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700;
}

.contact-item.phone:hover {
    @apply bg-blue-100 dark:bg-blue-900/30;
}

.contact-item.website {
    @apply bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700;
}

.contact-item.website:hover {
    @apply bg-orange-100 dark:bg-orange-900/30;
}

.contact-item.address {
    @apply bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 md:col-span-2;
}

.contact-item.address:hover {
    @apply bg-green-100 dark:bg-green-900/30;
}

.contact-icon {
    @apply flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center;
}

.email .contact-icon {
    @apply bg-purple-200 dark:bg-purple-800;
}

.email .contact-icon i {
    @apply text-purple-700 dark:text-purple-300 text-xl;
}

.phone .contact-icon {
    @apply bg-blue-200 dark:bg-blue-800;
}

.phone .contact-icon i {
    @apply text-blue-700 dark:text-blue-300 text-xl;
}

.website .contact-icon {
    @apply bg-orange-200 dark:bg-orange-800;
}

.website .contact-icon i {
    @apply text-orange-700 dark:text-orange-300 text-xl;
}

.address .contact-icon {
    @apply bg-green-200 dark:bg-green-800;
}

.address .contact-icon i {
    @apply text-green-700 dark:text-green-300 text-xl;
}

.contact-details {
    @apply flex-1 min-w-0;
}

.contact-label {
    @apply block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5;
}

.contact-value {
    @apply block text-xs font-medium text-gray-900 dark:text-gray-100 break-words;
}

a.contact-value {
    @apply hover:underline transition-colors;
}

.email a.contact-value {
    @apply text-purple-700 dark:text-purple-300;
}

.phone a.contact-value {
    @apply text-blue-700 dark:text-blue-300;
}

.website a.contact-value {
    @apply text-orange-700 dark:text-orange-300 flex items-center gap-2;
}

.website a.contact-value i {
    @apply text-xs;
}

.empty-state {
    @apply flex flex-col items-center justify-center py-8 px-6 text-gray-500 dark:text-gray-400;
}

.empty-state i {
    @apply text-3xl mb-2;
}

.empty-state p {
    @apply text-xs font-medium;
}

/* Responsive Design */
@media (max-width: 768px) {
    .contact-grid {
        @apply grid-cols-1;
    }

    .contact-item.address {
        @apply col-span-1;
    }
}
</style>
