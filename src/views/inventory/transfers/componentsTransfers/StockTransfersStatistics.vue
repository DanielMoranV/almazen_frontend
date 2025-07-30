<script setup>
import { computed } from 'vue';

// PrimeVue Components
import Skeleton from 'primevue/skeleton';

const props = defineProps({
    totalTransfers: {
        type: Number,
        default: 0
    },
    completedTransfers: {
        type: Number,
        default: 0
    },
    pendingTransfers: {
        type: Number,
        default: 0
    },
    cancelledTransfers: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    }
});

// Computed percentages
const completedPercentage = computed(() => {
    return props.totalTransfers > 0 ? Math.round((props.completedTransfers / props.totalTransfers) * 100) : 0;
});

const pendingPercentage = computed(() => {
    return props.totalTransfers > 0 ? Math.round((props.pendingTransfers / props.totalTransfers) * 100) : 0;
});

const cancelledPercentage = computed(() => {
    return props.totalTransfers > 0 ? Math.round((props.cancelledTransfers / props.totalTransfers) * 100) : 0;
});
</script>

<template>
    <div class="statistics-container">
        <div class="statistics-grid">
            <!-- Total Transferencias -->
            <div class="stat-card total-card">
                <div class="stat-icon">
                    <i class="pi pi-arrow-right-arrow-left"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <Skeleton v-if="loading" width="3rem" height="2rem" />
                        <span v-else>{{ totalTransfers.toLocaleString() }}</span>
                    </div>
                    <div class="stat-label">Total Transferencias</div>
                </div>
            </div>

            <!-- Transferencias Completadas -->
            <div class="stat-card completed-card">
                <div class="stat-icon">
                    <i class="pi pi-check-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <Skeleton v-if="loading" width="3rem" height="2rem" />
                        <span v-else>{{ completedTransfers.toLocaleString() }}</span>
                    </div>
                    <div class="stat-label">Completadas</div>
                    <div class="stat-percentage completed">
                        <Skeleton v-if="loading" width="2rem" height="1rem" />
                        <span v-else>{{ completedPercentage }}%</span>
                    </div>
                </div>
            </div>

            <!-- Transferencias Pendientes -->
            <div class="stat-card pending-card">
                <div class="stat-icon">
                    <i class="pi pi-clock"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <Skeleton v-if="loading" width="3rem" height="2rem" />
                        <span v-else>{{ pendingTransfers.toLocaleString() }}</span>
                    </div>
                    <div class="stat-label">Pendientes</div>
                    <div class="stat-percentage pending">
                        <Skeleton v-if="loading" width="2rem" height="1rem" />
                        <span v-else>{{ pendingPercentage }}%</span>
                    </div>
                </div>
            </div>

            <!-- Transferencias Canceladas -->
            <div class="stat-card cancelled-card">
                <div class="stat-icon">
                    <i class="pi pi-times-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <Skeleton v-if="loading" width="3rem" height="2rem" />
                        <span v-else>{{ cancelledTransfers.toLocaleString() }}</span>
                    </div>
                    <div class="stat-label">Canceladas</div>
                    <div class="stat-percentage cancelled">
                        <Skeleton v-if="loading" width="2rem" height="1rem" />
                        <span v-else>{{ cancelledPercentage }}%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.statistics-container {
    @apply mb-6;
}

.statistics-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg;
}

.stat-card:hover {
    @apply transform -translate-y-1;
}

.total-card {
    @apply border-l-4 border-l-blue-500;
}

.total-card .stat-icon {
    @apply text-blue-500 bg-blue-100 dark:bg-blue-900;
}

.completed-card {
    @apply border-l-4 border-l-green-500;
}

.completed-card .stat-icon {
    @apply text-green-500 bg-green-100 dark:bg-green-900;
}

.pending-card {
    @apply border-l-4 border-l-yellow-500;
}

.pending-card .stat-icon {
    @apply text-yellow-500 bg-yellow-100 dark:bg-yellow-900;
}

.cancelled-card {
    @apply border-l-4 border-l-red-500;
}

.cancelled-card .stat-icon {
    @apply text-red-500 bg-red-100 dark:bg-red-900;
}

.stat-icon {
    @apply w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4;
}

.stat-content {
    @apply space-y-2;
}

.stat-value {
    @apply text-2xl font-bold text-gray-900 dark:text-gray-100;
}

.stat-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.stat-percentage {
    @apply text-xs font-semibold px-2 py-1 rounded-full;
}

.stat-percentage.completed {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.stat-percentage.pending {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.stat-percentage.cancelled {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .statistics-grid {
        @apply grid-cols-2 gap-3;
    }

    .stat-card {
        @apply p-4;
    }

    .stat-icon {
        @apply w-10 h-10 text-lg mb-3;
    }

    .stat-value {
        @apply text-xl;
    }

    .stat-label {
        @apply text-xs;
    }
}

@media (max-width: 480px) {
    .statistics-grid {
        @apply grid-cols-1 gap-3;
    }
}
</style>
