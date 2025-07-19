<template>
    <div class="stock-statistics">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- Total Productos -->
            <div class="stat-card primary">
                <div class="stat-icon">
                    <i class="pi pi-box"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ loading ? '...' : totalProducts }}</div>
                    <div class="stat-label">Total Productos</div>
                </div>
            </div>

            <!-- Cantidad Total -->
            <div class="stat-card success">
                <div class="stat-icon">
                    <i class="pi pi-chart-bar"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ loading ? '...' : formatNumber(totalQuantity) }}</div>
                    <div class="stat-label">Stock Total</div>
                </div>
            </div>

            <!-- Stock Bajo -->
            <div class="stat-card warning">
                <div class="stat-icon">
                    <i class="pi pi-exclamation-triangle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ loading ? '...' : lowStockProducts }}</div>
                    <div class="stat-label">Stock Bajo</div>
                </div>
            </div>

            <!-- Agotados -->
            <div class="stat-card danger">
                <div class="stat-icon">
                    <i class="pi pi-times-circle"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ loading ? '...' : outOfStockProducts }}</div>
                    <div class="stat-label">Agotados</div>
                </div>
            </div>

            <!-- Valor Total (placeholder) -->
            <div class="stat-card info">
                <div class="stat-icon">
                    <i class="pi pi-dollar"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ loading ? '...' : formatCurrency(totalValue) }}</div>
                    <div class="stat-label">Valor Total (Compra)</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    totalProducts: {
        type: Number,
        default: 0
    },
    totalQuantity: {
        type: Number,
        default: 0
    },
    lowStockProducts: {
        type: Number,
        default: 0
    },
    outOfStockProducts: {
        type: Number,
        default: 0
    },
    totalValue: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const formatNumber = (value) => {
    return value ? value.toLocaleString() : '0';
};

const formatCurrency = (value) => {
    return value ? `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/ 0.00';
};
</script>

<style scoped>
.stock-statistics {
    @apply mb-6;
}

.stat-card {
    @apply bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-105;
    min-height: 120px;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    @apply w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold;
    flex-shrink: 0;
}

.stat-content {
    @apply flex-1;
}

.stat-value {
    @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1;
}

.stat-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

/* Variantes de color */
.stat-card.primary {
    @apply border-l-blue-500;
}

.stat-card.primary .stat-icon {
    @apply bg-gradient-to-br from-blue-500 to-blue-600;
}

.stat-card.success {
    @apply border-l-green-500;
}

.stat-card.success .stat-icon {
    @apply bg-gradient-to-br from-green-500 to-green-600;
}

.stat-card.warning {
    @apply border-l-yellow-500;
}

.stat-card.warning .stat-icon {
    @apply bg-gradient-to-br from-yellow-500 to-yellow-600;
}

.stat-card.danger {
    @apply border-l-red-500;
}

.stat-card.danger .stat-icon {
    @apply bg-gradient-to-br from-red-500 to-red-600;
}

.stat-card.info {
    @apply border-l-purple-500;
}

.stat-card.info .stat-icon {
    @apply bg-gradient-to-br from-purple-500 to-purple-600;
}

/* Responsive */
@media (max-width: 768px) {
    .stat-card {
        @apply p-4;
        min-height: 100px;
    }

    .stat-icon {
        @apply w-12 h-12 text-lg;
    }

    .stat-value {
        @apply text-xl;
    }

    .stat-label {
        @apply text-xs;
    }
}

@media (max-width: 480px) {
    .stat-card {
        @apply p-3 flex-col text-center gap-2;
        min-height: 90px;
    }

    .stat-icon {
        @apply w-10 h-10 text-base;
    }

    .stat-value {
        @apply text-lg;
    }
}
</style>