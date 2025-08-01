<script setup>
const props = defineProps({
    totalAdjustments: {
        type: Number,
        default: 0
    },
    totalPositive: {
        type: Number,
        default: 0
    },
    totalNegative: {
        type: Number,
        default: 0
    },
    totalQuantityAdjusted: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    }
});
</script>

<template>
    <div class="statistics-container">
        <!-- Estadísticas en formato horizontal compacto -->
        <div class="stats-grid">
            <!-- Total de Ajustes -->
            <div class="stat-card stat-total">
                <div class="stat-icon">
                    <i class="pi pi-sliders-h"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Total Ajustes</div>
                    <div class="stat-value">
                        <span v-if="loading">
                            <i class="pi pi-spin pi-spinner"></i>
                        </span>
                        <span v-else>{{ totalAdjustments.toLocaleString() }}</span>
                    </div>
                </div>
            </div>

            <!-- Ajustes Positivos -->
            <div class="stat-card stat-positive">
                <div class="stat-icon">
                    <i class="pi pi-plus-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Positivos</div>
                    <div class="stat-value">
                        <span v-if="loading">
                            <i class="pi pi-spin pi-spinner"></i>
                        </span>
                        <span v-else>{{ totalPositive.toLocaleString() }}</span>
                    </div>
                </div>
            </div>

            <!-- Ajustes Negativos -->
            <div class="stat-card stat-negative">
                <div class="stat-icon">
                    <i class="pi pi-minus-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Negativos</div>
                    <div class="stat-value">
                        <span v-if="loading">
                            <i class="pi pi-spin pi-spinner"></i>
                        </span>
                        <span v-else>{{ totalNegative.toLocaleString() }}</span>
                    </div>
                </div>
            </div>

            <!-- Cantidad Total Ajustada -->
            <div class="stat-card stat-quantity">
                <div class="stat-icon">
                    <i class="pi pi-chart-bar"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Cantidad Ajustada</div>
                    <div class="stat-value">
                        <span v-if="loading">
                            <i class="pi pi-spin pi-spinner"></i>
                        </span>
                        <span v-else>{{ totalQuantityAdjusted.toLocaleString() }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.statistics-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700;
}

.stats-grid {
    @apply grid grid-cols-2 lg:grid-cols-4 gap-4 p-4;
}

.stat-card {
    @apply flex items-center gap-3 p-4 rounded-lg border border-gray-100 dark:border-gray-600 transition-all duration-200 hover:shadow-md;
    min-height: 80px;
}

.stat-card:hover {
    @apply transform scale-105;
}

.stat-icon {
    @apply w-12 h-12 rounded-full flex items-center justify-center text-xl;
}

.stat-content {
    @apply flex-1;
}

.stat-label {
    @apply text-xs font-medium text-gray-600 dark:text-gray-400 mb-1;
}

.stat-value {
    @apply text-xl font-bold;
}

/* Estilos específicos por tipo de estadística */
.stat-total {
    @apply bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700;
}

.stat-total .stat-icon {
    @apply bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400;
}

.stat-total .stat-value {
    @apply text-blue-900 dark:text-blue-100;
}

.stat-positive {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700;
}

.stat-positive .stat-icon {
    @apply bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400;
}

.stat-positive .stat-value {
    @apply text-green-900 dark:text-green-100;
}

.stat-negative {
    @apply bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700;
}

.stat-negative .stat-icon {
    @apply bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400;
}

.stat-negative .stat-value {
    @apply text-red-900 dark:text-red-100;
}

.stat-quantity {
    @apply bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700;
}

.stat-quantity .stat-icon {
    @apply bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400;
}

.stat-quantity .stat-value {
    @apply text-purple-900 dark:text-purple-100;
}

/* Responsividad */
@media (max-width: 1024px) {
    .stats-grid {
        @apply grid-cols-2 gap-3 p-3;
    }

    .stat-card {
        @apply p-3;
        min-height: 70px;
    }

    .stat-value {
        @apply text-lg;
    }
}

@media (max-width: 640px) {
    .stats-grid {
        @apply grid-cols-1 gap-2 p-2;
    }

    .stat-card {
        @apply p-2;
        min-height: 60px;
    }

    .stat-icon {
        @apply w-10 h-10 text-lg;
    }

    .stat-value {
        @apply text-base;
    }

    .stat-label {
        @apply text-xs;
    }
}

/* Animaciones */
.stat-card {
    animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Efectos de hover mejorados */
.stat-card:hover .stat-icon {
    @apply transform scale-110;
    transition: transform 0.2s ease-in-out;
}
</style>
