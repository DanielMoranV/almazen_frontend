<script setup>
import { computed } from 'vue';

const props = defineProps({
    company: {
        type: Object,
        required: true
    }
});

// Social media platforms configuration
const socialPlatforms = [
    {
        key: 'facebook',
        name: 'Facebook',
        icon: 'pi pi-facebook',
        color: 'blue',
        baseUrl: 'https://facebook.com/'
    },
    {
        key: 'instagram',
        name: 'Instagram',
        icon: 'pi pi-instagram',
        color: 'pink',
        baseUrl: 'https://instagram.com/'
    },
    {
        key: 'tiktok',
        name: 'TikTok',
        icon: 'pi pi-video',
        color: 'gray',
        baseUrl: 'https://tiktok.com/@'
    },
    {
        key: 'twitter',
        name: 'Twitter/X',
        icon: 'pi pi-twitter',
        color: 'sky',
        baseUrl: 'https://twitter.com/'
    },
    {
        key: 'linkedin',
        name: 'LinkedIn',
        icon: 'pi pi-linkedin',
        color: 'indigo',
        baseUrl: 'https://linkedin.com/company/'
    },
    {
        key: 'youtube',
        name: 'YouTube',
        icon: 'pi pi-youtube',
        color: 'red',
        baseUrl: 'https://youtube.com/'
    },
    {
        key: 'whatsapp',
        name: 'WhatsApp',
        icon: 'pi pi-whatsapp',
        color: 'green',
        baseUrl: 'https://wa.me/'
    }
];

// Computed properties
const socialMedia = computed(() => props.company?.social_media || {});

const activePlatforms = computed(() => {
    return socialPlatforms.filter((platform) => {
        const value = socialMedia.value[platform.key];
        return value && value.trim() !== '';
    });
});

const hasAnySocial = computed(() => activePlatforms.value.length > 0);

// Methods
const getSocialUrl = (platform) => {
    const value = socialMedia.value[platform.key];
    if (!value) return '#';

    // If it's already a full URL, return it
    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    // Otherwise, construct the URL
    return platform.baseUrl + value;
};

const openWhatsApp = (phone) => {
    // Remove any non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
};
</script>

<template>
    <div class="social-media-card">
        <div class="card-header">
            <h2 class="card-title">
                <i class="pi pi-share-alt"></i>
                Redes Sociales
            </h2>
        </div>

        <div v-if="hasAnySocial" class="social-grid">
            <a v-for="platform in activePlatforms" :key="platform.key" :href="platform.key === 'whatsapp' ? '#' : getSocialUrl(platform)" :class="['social-item', platform.color]" target="_blank" rel="noopener noreferrer" @click.prevent="platform.key === 'whatsapp' ? openWhatsApp(socialMedia[platform.key]) : window.open(getSocialUrl(platform), '_blank')">
                <div class="social-icon">
                    <i :class="platform.icon"></i>
                </div>
                <div class="social-details">
                    <span class="social-name">{{ platform.name }}</span>
                    <span class="social-handle">{{ socialMedia[platform.key] }}</span>
                </div>
                <i class="pi pi-external-link external-icon"></i>
            </a>
        </div>

        <div v-else class="empty-state">
            <i class="pi pi-share-alt"></i>
            <p>No hay redes sociales configuradas</p>
        </div>
    </div>
</template>

<style scoped>
.social-media-card {
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

.social-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4;
}

.social-item {
    @apply flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border;
}

.social-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Facebook - Blue */
.social-item.blue {
    @apply bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700;
}

.social-item.blue:hover {
    @apply bg-blue-100 dark:bg-blue-900/30;
}

.social-item.blue .social-icon {
    @apply bg-blue-200 dark:bg-blue-800;
}

.social-item.blue .social-icon i {
    @apply text-blue-700 dark:text-blue-300;
}

/* Instagram - Pink */
.social-item.pink {
    @apply bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700;
}

.social-item.pink:hover {
    @apply bg-pink-100 dark:bg-pink-900/30;
}

.social-item.pink .social-icon {
    @apply bg-pink-200 dark:bg-pink-800;
}

.social-item.pink .social-icon i {
    @apply text-pink-700 dark:text-pink-300;
}

/* TikTok - Gray */
.social-item.gray {
    @apply bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700;
}

.social-item.gray:hover {
    @apply bg-gray-100 dark:bg-gray-900/30;
}

.social-item.gray .social-icon {
    @apply bg-gray-200 dark:bg-gray-800;
}

.social-item.gray .social-icon i {
    @apply text-gray-700 dark:text-gray-300;
}

/* Twitter - Sky */
.social-item.sky {
    @apply bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700;
}

.social-item.sky:hover {
    @apply bg-sky-100 dark:bg-sky-900/30;
}

.social-item.sky .social-icon {
    @apply bg-sky-200 dark:bg-sky-800;
}

.social-item.sky .social-icon i {
    @apply text-sky-700 dark:text-sky-300;
}

/* LinkedIn - Indigo */
.social-item.indigo {
    @apply bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700;
}

.social-item.indigo:hover {
    @apply bg-indigo-100 dark:bg-indigo-900/30;
}

.social-item.indigo .social-icon {
    @apply bg-indigo-200 dark:bg-indigo-800;
}

.social-item.indigo .social-icon i {
    @apply text-indigo-700 dark:text-indigo-300;
}

/* YouTube - Red */
.social-item.red {
    @apply bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700;
}

.social-item.red:hover {
    @apply bg-red-100 dark:bg-red-900/30;
}

.social-item.red .social-icon {
    @apply bg-red-200 dark:bg-red-800;
}

.social-item.red .social-icon i {
    @apply text-red-700 dark:text-red-300;
}

/* WhatsApp - Green */
.social-item.green {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700;
}

.social-item.green:hover {
    @apply bg-green-100 dark:bg-green-900/30;
}

.social-item.green .social-icon {
    @apply bg-green-200 dark:bg-green-800;
}

.social-item.green .social-icon i {
    @apply text-green-700 dark:text-green-300;
}

/* Common styles */
.social-icon {
    @apply flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center;
}

.social-icon i {
    @apply text-lg;
}

.social-details {
    @apply flex-1 min-w-0;
}

.social-name {
    @apply block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5;
}

.social-handle {
    @apply block text-xs font-medium text-gray-900 dark:text-gray-100 truncate;
}

.external-icon {
    @apply text-gray-400 dark:text-gray-500 text-xs flex-shrink-0;
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
@media (max-width: 1024px) {
    .social-grid {
        @apply grid-cols-2;
    }
}

@media (max-width: 768px) {
    .social-grid {
        @apply grid-cols-1;
    }
}
</style>
