<script setup>
import Skeleton from 'primevue/skeleton';

defineProps({
    totalMovements: {
        type: Number,
        default: 0
    },
    totalEntries: {
        type: Number,
        default: 0
    },
    totalExits: {
        type: Number,
        default: 0
    },
    totalAdjustments: {
        type: Number,
        default: 0
    },
    totalTransfers: {
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
    <div class="stock-movements-statistics">
        <div class="statistics-container">
            <!-- Estadística: Total de Movimientos -->
            <div class="stat-card total-movements">
                <div class="stat-icon">
                    <i class="pi pi-history"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <span v-if="!loading">{{ totalMovements.toLocaleString() }}</span>
                        <Skeleton v-else width="4rem" height="2rem" />
                    </div>
                    <div class="stat-label">Total Movimientos</div>
                </div>
            </div>

            <!-- Estadística: Entradas -->
            <div class="stat-card entries">
                <div class="stat-icon">
                    <i class="pi pi-arrow-down"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <span v-if="!loading">{{ totalEntries.toLocaleString() }}</span>
                        <Skeleton v-else width="3rem" height="2rem" />
                    </div>
                    <div class="stat-label">Entradas</div>
                </div>
            </div>

            <!-- Estadística: Salidas -->
            <div class="stat-card exits">
                <div class="stat-icon">
                    <i class="pi pi-arrow-up"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <span v-if="!loading">{{ totalExits.toLocaleString() }}</span>
                        <Skeleton v-else width="3rem" height="2rem" />
                    </div>
                    <div class="stat-label">Salidas</div>
                </div>
            </div>

            <!-- Estadística: Ajustes -->
            <div class="stat-card adjustments">
                <div class="stat-icon">
                    <i class="pi pi-cog"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <span v-if="!loading">{{ totalAdjustments.toLocaleString() }}</span>
                        <Skeleton v-else width="3rem" height="2rem" />
                    </div>
                    <div class="stat-label">Ajustes</div>
                </div>
            </div>

            <!-- Estadística: Transferencias -->
            <div class="stat-card transfers">
                <div class="stat-icon">
                    <i class="pi pi-arrow-right-arrow-left"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">
                        <span v-if="!loading">{{ totalTransfers.toLocaleString() }}</span>
                        <Skeleton v-else width="3rem" height="2rem" />
                    </div>
                    <div class="stat-label">Transferencias</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Contenedor principal de estadísticas */
.stock-movements-statistics {
    @apply mb-6;
}

.statistics-container {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4;
}

/* Tarjeta base de estadística */
.stat-card {
    @apply bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Layout interno de la tarjeta */
.stat-card {
    @apply flex items-center gap-4;
}

/* Ícono de la estadística */
.stat-icon {
    @apply w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl;
}

/* Contenido de la estadística */
.stat-content {
    @apply flex flex-col;
}

.stat-value {
    @apply text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight;
}

.stat-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400 mt-1;
}

/* Colores específicos para cada tipo de estadística */
.total-movements .stat-icon {
    @apply bg-gradient-to-br from-blue-500 to-blue-600;
}

.entries .stat-icon {
    @apply bg-gradient-to-br from-green-500 to-green-600;
}

.exits .stat-icon {
    @apply bg-gradient-to-br from-red-500 to-red-600;
}

.adjustments .stat-icon {
    @apply bg-gradient-to-br from-yellow-500 to-yellow-600;
}

.transfers .stat-icon {
    @apply bg-gradient-to-br from-purple-500 to-purple-600;
}

/* Efectos hover específicos */
.total-movements:hover {
    @apply border-blue-200 dark:border-blue-700;
}

.entries:hover {
    @apply border-green-200 dark:border-green-700;
}

.exits:hover {
    @apply border-red-200 dark:border-red-700;
}

.adjustments:hover {
    @apply border-yellow-200 dark:border-yellow-700;
}

.transfers:hover {
    @apply border-purple-200 dark:border-purple-700;
}

/* Ajustes responsivos */
@media (max-width: 768px) {
    .statistics-container {
        @apply grid-cols-2 gap-3;
    }

    .stat-card {
        @apply p-4 flex-col text-center gap-2;
    }

    .stat-icon {
        @apply w-10 h-10 text-lg;
    }

    .stat-value {
        @apply text-xl;
    }

    .stat-label {
        @apply text-xs;
    }
}

@media (max-width: 480px) {
    .statistics-container {
        @apply grid-cols-1 gap-3;
    }

    .stat-card {
        @apply p-4 flex-row text-left gap-3;
    }

    .stat-icon {
        @apply w-12 h-12 text-xl;
    }

    .stat-value {
        @apply text-xl;
    }

    .stat-label {
        @apply text-sm;
    }
}

/* Mejoras para modo oscuro */
@media (prefers-color-scheme: dark) {
    .stat-card {
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.3),
            0 2px 4px -1px rgba(0, 0, 0, 0.2);
    }

    .stat-card:hover {
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.3),
            0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }
}
</style>
