<script setup>
// import { computed } from 'vue';

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
    totalCostValue: {
        type: Number,
        default: 0
    },
    totalSaleValue: {
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

const formatCurrency = (value, detailed = false) => {
    if (!value) return 'S/ 0.00';
    if (detailed) {
        return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    }
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
};

// Función para formatear números grandes de forma compacta
const formatCompactNumber = (value) => {
    if (!value || value === 0) return '0';

    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toLocaleString();
};

// Función para formatear monedas de forma compacta
const formatCompactCurrency = (value) => {
    if (!value || value === 0) return 'S/ 0';

    if (value >= 1000000) {
        return `S/ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `S/ ${(value / 1000).toFixed(1)}K`;
    }
    return `S/ ${value.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
};
</script>

<template>
    <div class="stock-statistics">
        <div class="stats-grid">
            <!-- Total Productos -->
            <div class="stat-card primary">
                <div class="stat-header">
                    <div class="stat-icon">
                        <i class="pi pi-box"></i>
                    </div>
                    <div class="stat-trend positive" v-if="!loading">
                        <i class="pi pi-arrow-up"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value" v-tooltip.top="props.loading ? '' : `Total exacto: ${props.totalProducts.toLocaleString()} productos`">
                        {{ props.loading ? '...' : formatCompactNumber(props.totalProducts) }}
                    </div>
                    <div class="stat-label">Total Productos</div>
                </div>
            </div>

            <!-- Cantidad Total -->
            <div class="stat-card success">
                <div class="stat-header">
                    <div class="stat-icon">
                        <i class="pi pi-chart-bar"></i>
                    </div>
                    <div class="stat-trend positive" v-if="!loading">
                        <i class="pi pi-arrow-up"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value" v-tooltip.top="props.loading ? '' : `Stock exacto: ${props.totalQuantity.toLocaleString()} unidades`">
                        {{ props.loading ? '...' : formatCompactNumber(props.totalQuantity) }}
                    </div>
                    <div class="stat-label">Stock Total</div>
                    <div class="stat-sublabel">unidades</div>
                </div>
            </div>

            <!-- Stock Bajo -->
            <div class="stat-card warning">
                <div class="stat-header">
                    <div class="stat-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-trend warning" v-if="!props.loading && props.lowStockProducts > 0">
                        <i class="pi pi-exclamation-circle"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value" v-tooltip.top="props.loading ? '' : `${props.lowStockProducts.toLocaleString()} productos con stock bajo`">
                        {{ props.loading ? '...' : formatCompactNumber(props.lowStockProducts) }}
                    </div>
                    <div class="stat-label">Stock Bajo</div>
                    <div class="stat-sublabel">productos</div>
                </div>
            </div>

            <!-- Agotados -->
            <div class="stat-card danger">
                <div class="stat-header">
                    <div class="stat-icon">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-trend danger" v-if="!props.loading && props.outOfStockProducts > 0">
                        <i class="pi pi-ban"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value" v-tooltip.top="props.loading ? '' : `${props.outOfStockProducts.toLocaleString()} productos agotados`">
                        {{ props.loading ? '...' : formatCompactNumber(props.outOfStockProducts) }}
                    </div>
                    <div class="stat-label">Agotados</div>
                    <div class="stat-sublabel">productos</div>
                </div>
            </div>

            <!-- Valor Total Costo -->
            <div class="stat-card info">
                <div class="stat-header">
                    <div class="stat-icon">
                        <i class="pi pi-dollar"></i>
                    </div>
                    <div class="stat-trend neutral" v-if="!props.loading">
                        <i class="pi pi-minus"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value" v-tooltip.top="props.loading ? '' : `Valor exacto: ${formatCurrency(props.totalCostValue, true)}`">
                        {{ props.loading ? '...' : formatCompactCurrency(props.totalCostValue) }}
                    </div>
                    <div class="stat-label">Valor Costo</div>
                    <div class="stat-sublabel">total inventario</div>
                </div>
            </div>

            <!-- Valor Total Venta -->
            <div class="stat-card secondary">
                <div class="stat-header">
                    <div class="stat-icon">
                        <i class="pi pi-money-bill"></i>
                    </div>
                    <div class="stat-trend positive" v-if="!props.loading">
                        <i class="pi pi-plus"></i>
                    </div>
                </div>
                <div class="stat-content">
                    <div class="stat-value" v-tooltip.top="props.loading ? '' : `Valor exacto: ${formatCurrency(props.totalSaleValue, true)}`">
                        {{ props.loading ? '...' : formatCompactCurrency(props.totalSaleValue) }}
                    </div>
                    <div class="stat-label">Valor Venta</div>
                    <div class="stat-sublabel">total inventario</div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stock-statistics {
    @apply mb-6;
}

/* Grid optimizado para 6 tarjetas en línea */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
}

/* Tarjeta compacta para pantalla normal */
.stat-card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02];
    padding: 1rem;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

/* Header con icono y tendencia más compacto */
.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.stat-icon {
    @apply w-9 h-9 rounded-lg flex items-center justify-center text-white text-base font-bold;
    flex-shrink: 0;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

/* Indicadores de tendencia */
.stat-trend {
    @apply w-6 h-6 rounded-full flex items-center justify-center text-xs;
    opacity: 0.8;
}

.stat-trend.positive {
    @apply bg-green-100 text-green-600;
}

.stat-trend.warning {
    @apply bg-yellow-100 text-yellow-600;
}

.stat-trend.danger {
    @apply bg-red-100 text-red-600;
}

.stat-trend.neutral {
    @apply bg-gray-100 text-gray-600;
}

/* Contenido optimizado */
.stat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.stat-value {
    @apply font-bold text-gray-900 dark:text-gray-100;
    font-size: 1.5rem;
    line-height: 1.1;
    margin-bottom: 0.25rem;
    word-break: break-all;
    cursor: help;
}

.stat-label {
    @apply text-xs font-semibold text-gray-700 dark:text-gray-300;
    margin-bottom: 0.125rem;
    line-height: 1.2;
}

.stat-sublabel {
    @apply text-xs text-gray-500 dark:text-gray-400;
    font-weight: 500;
    opacity: 0.8;
    font-size: 0.625rem;
}

/* Variantes de color mejoradas */
.stat-card.primary {
    @apply border-l-blue-500;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.05) 100%);
}

.stat-card.primary .stat-icon {
    @apply bg-gradient-to-br from-blue-500 to-blue-600;
}

.stat-card.success {
    @apply border-l-green-500;
    background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(134, 239, 172, 0.05) 100%);
}

.stat-card.success .stat-icon {
    @apply bg-gradient-to-br from-green-500 to-green-600;
}

.stat-card.warning {
    @apply border-l-yellow-500;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(253, 224, 71, 0.05) 100%);
}

.stat-card.warning .stat-icon {
    @apply bg-gradient-to-br from-yellow-500 to-yellow-600;
}

.stat-card.danger {
    @apply border-l-red-500;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(252, 165, 165, 0.05) 100%);
}

.stat-card.danger .stat-icon {
    @apply bg-gradient-to-br from-red-500 to-red-600;
}

.stat-card.info {
    @apply border-l-purple-500;
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(196, 181, 253, 0.05) 100%);
}

.stat-card.info .stat-icon {
    @apply bg-gradient-to-br from-purple-500 to-purple-600;
}

.stat-card.secondary {
    @apply border-l-indigo-500;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(165, 180, 252, 0.05) 100%);
}

.stat-card.secondary .stat-icon {
    @apply bg-gradient-to-br from-indigo-500 to-indigo-600;
}

/* Responsive mejorado - mantener 6 columnas hasta 1024px */
@media (max-width: 1024px) {
    .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.875rem;
    }

    .stat-card {
        padding: 0.875rem;
        min-height: 110px;
    }

    .stat-icon {
        @apply w-8 h-8 text-sm;
    }

    .stat-value {
        font-size: 1.375rem;
    }
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
    }

    .stat-card {
        padding: 1rem;
        min-height: 120px;
    }

    .stat-icon {
        @apply w-10 h-10 text-base;
    }

    .stat-value {
        font-size: 1.5rem;
    }

    .stat-label {
        @apply text-xs;
    }

    .stat-sublabel {
        @apply text-xs;
    }
}

@media (max-width: 640px) {
    .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .stat-card {
        padding: 0.875rem;
        min-height: 110px;
    }

    .stat-header {
        margin-bottom: 0.5rem;
    }

    .stat-icon {
        @apply w-9 h-9 text-sm;
    }

    .stat-value {
        font-size: 1.375rem;
    }

    .stat-trend {
        @apply w-5 h-5;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }

    .stat-card {
        padding: 0.75rem;
        min-height: 100px;
    }

    .stat-icon {
        @apply w-8 h-8 text-sm;
    }

    .stat-value {
        font-size: 1.25rem;
    }

    .stat-label {
        font-size: 0.75rem;
    }

    .stat-sublabel {
        font-size: 0.625rem;
    }
}

@media (max-width: 360px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .stat-card {
        min-height: 90px;
    }
}

/* Animaciones suaves */
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

.stat-card {
    animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(1) {
    animation-delay: 0.1s;
}
.stat-card:nth-child(2) {
    animation-delay: 0.2s;
}
.stat-card:nth-child(3) {
    animation-delay: 0.3s;
}
.stat-card:nth-child(4) {
    animation-delay: 0.4s;
}
.stat-card:nth-child(5) {
    animation-delay: 0.5s;
}
.stat-card:nth-child(6) {
    animation-delay: 0.6s;
}

/* Efectos hover mejorados */
.stat-card:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-card:hover .stat-icon {
    transform: scale(1.1);
}

.stat-card:hover .stat-trend {
    transform: scale(1.2);
}
</style>
