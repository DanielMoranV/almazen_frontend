<script setup>
import { ref, computed, watch } from 'vue';
import { InputText, Select, Button } from 'primevue';

const props = defineProps({
    totalProducts: {
        type: Number,
        default: 0
    },
    totalQuantity: {
        type: Number,
        default: 0
    },
    isLoading: {
        type: Boolean,
        default: false
    },

    warehouseFilter: {
        type: [String, Number],
        default: null
    },
    stockStatusFilter: {
        type: String,
        default: null
    },
    warehouseOptions: {
        type: Array,
        default: () => [{ label: 'Todos los almacenes', value: null }]
    }
});

const emit = defineEmits(['refresh', 'update:warehouseFilter', 'update:stockStatusFilter', 'clear-filters']);

// Estado local para los filtros
const localWarehouseFilter = ref(props.warehouseFilter);
const localStockStatusFilter = ref(props.stockStatusFilter);

// Opciones para el filtro de estado de stock
const stockStatusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'En stock', value: 'in_stock' },
    { label: 'Stock bajo', value: 'low_stock' },
    { label: 'Agotado', value: 'out_of_stock' }
];

// Computed para verificar si hay filtros activos
const hasActiveFilters = computed(() => {
    return localWarehouseFilter.value || localStockStatusFilter.value;
});

// Watchers para sincronizar con props
watch(
    () => props.warehouseFilter,
    (newVal) => {
        localWarehouseFilter.value = newVal;
    }
);

watch(
    () => props.stockStatusFilter,
    (newVal) => {
        localStockStatusFilter.value = newVal;
    }
);

// Métodos
const onFilterChange = () => {
    emit('update:warehouseFilter', localWarehouseFilter.value);
    emit('update:stockStatusFilter', localStockStatusFilter.value);
};

const clearWarehouseFilter = () => {
    localWarehouseFilter.value = null;
    emit('update:warehouseFilter', null);
};

const clearStatusFilter = () => {
    localStockStatusFilter.value = null;
    emit('update:stockStatusFilter', null);
};

const clearFilters = () => {
    localWarehouseFilter.value = null;
    localStockStatusFilter.value = null;
    emit('clear-filters');
};

const getWarehouseLabel = (value) => {
    const option = props.warehouseOptions.find((opt) => opt.value === value);
    return option ? option.label : 'Desconocido';
};

const getStatusLabel = (value) => {
    const option = stockStatusOptions.find((opt) => opt.value === value);
    return option ? option.label : 'Desconocido';
};
</script>

<template>
    <div class="stock-toolbar">
        <!-- Header compacto con título, estadísticas y filtros en una sola sección -->
        <div class="toolbar-header">
            <div class="header-backdrop"></div>
            <div class="header-content">
                <!-- Sección izquierda: Título y estadísticas -->
                <div class="title-section">
                    <div class="title-wrapper">
                        <div class="icon-container">
                            <i class="pi pi-chart-bar"></i>
                        </div>
                        <div class="title-text">
                            <h1 class="page-title">Stock por Producto</h1>
                            <p v-if="totalProducts > 0" class="subtitle">
                                {{ totalProducts }}
                                {{ totalProducts === 1 ? 'producto' : 'productos' }} • {{ totalQuantity }} unidades
                            </p>
                            <p v-else class="subtitle">No hay productos disponibles</p>
                        </div>
                    </div>
                </div>

                <!-- Sección central: Filtros compactos -->
                <div class="filters-section-compact">
                    <div class="compact-filters">
                        <!-- Filtro por almacén -->
                        <Select id="warehouse-filter" v-model="localWarehouseFilter" :options="warehouseOptions" optionLabel="label" optionValue="value" placeholder="Almacén" class="filter-select-compact" @change="onFilterChange" />

                        <!-- Filtro por estado de stock -->
                        <Select id="status-filter" v-model="localStockStatusFilter" :options="stockStatusOptions" optionLabel="label" optionValue="value" placeholder="Estado" class="filter-select-compact" @change="onFilterChange" />

                        <!-- Botón para limpiar filtros -->
                        <Button icon="pi pi-filter-slash" outlined @click="clearFilters" v-tooltip.bottom="'Limpiar filtros'" class="clear-filters-btn-compact" :disabled="!hasActiveFilters" />
                    </div>
                </div>

                <!-- Sección derecha: Acciones -->
                <div class="actions-section">
                    <Button icon="pi pi-refresh" class="refresh-btn-compact" :loading="isLoading" @click="$emit('refresh')" v-tooltip.bottom="'Actualizar stock'" :disabled="isLoading" />
                </div>
            </div>

            <!-- Tags de filtros activos (solo si hay filtros) -->
            <div v-if="hasActiveFilters" class="active-filters-compact">
                <div class="filter-tags-compact">
                    <span v-if="localWarehouseFilter" class="filter-tag-compact">
                        <i class="pi pi-warehouse"></i>
                        {{ getWarehouseLabel(localWarehouseFilter) }}
                        <button @click="clearWarehouseFilter" class="tag-remove-compact">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>

                    <span v-if="localStockStatusFilter" class="filter-tag-compact">
                        <i class="pi pi-chart-bar"></i>
                        {{ getStatusLabel(localStockStatusFilter) }}
                        <button @click="clearStatusFilter" class="tag-remove-compact">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Contenedor principal del toolbar con efecto de elevación */
.stock-toolbar {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Encabezado del toolbar compacto */
.toolbar-header {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #3b82f6 100%);
    padding: 1.5rem 2rem;
    position: relative;
}

/* Fondo decorativo con patrón */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 2px, transparent 2px), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size:
        50px 50px,
        30px 30px;
    animation: pattern-move 20s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

/* Sección del título mejorada */
.title-section {
    @apply flex-1;
}

.title-wrapper {
    @apply flex items-center gap-4;
}

/* Contenedor del ícono con efecto de brillo */
.icon-container {
    @apply w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.icon-container i {
    @apply text-3xl text-white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Texto del título */
.title-text {
    @apply flex flex-col gap-1;
}

.page-title {
    @apply text-2xl font-bold text-white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: -0.025em;
}

.subtitle {
    @apply text-white/80 font-medium text-sm;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Sección de acciones mejorada */
.actions-section {
    @apply flex items-center;
}

.action-buttons {
    @apply flex gap-3;
}

/* Estilo base para botones de acción mejorado */
.action-btn {
    @apply font-semibold rounded-xl px-4 py-3 transition-all duration-300 backdrop-blur-sm;
    transform: translateY(0);
}

.action-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
    transform: translateY(0) !important;
}

/* Botón de refrescar con estilo glassmorphism */
.refresh-btn {
    @apply bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    min-width: 48px;
    min-height: 48px;
}

.refresh-btn:disabled {
    @apply opacity-60 cursor-not-allowed;
    transform: none !important;
}

/* Botones de exportar e imprimir con estilo outline */
.export-btn,
.print-btn {
    @apply bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Animación del patrón de fondo */
@keyframes pattern-move {
    0% {
        background-position:
            0% 0%,
            0% 0%;
    }
    100% {
        background-position:
            100% 100%,
            -100% -100%;
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    .toolbar-header {
        @apply p-4;
    }

    .header-content {
        @apply flex-col items-start gap-3;
    }

    .title-wrapper {
        @apply gap-3;
    }

    .icon-container {
        @apply w-12 h-12;
    }

    .icon-container i {
        @apply text-2xl;
    }

    .page-title {
        @apply text-xl;
    }

    .subtitle {
        @apply text-xs;
    }

    .filters-section-compact {
        @apply w-full;
    }

    .compact-filters {
        @apply flex-wrap gap-2;
    }

    .filter-select-compact {
        @apply min-w-32 text-sm;
    }

    .actions-section {
        @apply w-full justify-end;
    }

    .active-filters-compact {
        @apply mt-2 pt-2;
    }

    .filter-tags-compact {
        @apply gap-1;
    }

    .filter-tag-compact {
        @apply text-xs px-2 py-0.5;
    }
}

@media (max-width: 480px) {
    .toolbar-header {
        @apply p-3;
    }

    .page-title {
        @apply text-lg;
    }

    .subtitle {
        @apply text-xs;
    }

    .compact-filters {
        @apply flex-col gap-2 w-full;
    }

    .filter-select-compact {
        @apply w-full min-w-full;
    }

    .clear-filters-btn-compact,
    .refresh-btn-compact {
        @apply w-full;
    }
}

/* Sección de filtros compacta integrada en el header */
.filters-section-compact {
    @apply flex items-center;
}

.compact-filters {
    @apply flex items-center gap-3;
}

/* Filtros compactos con mejor contraste */
.filter-select-compact {
    @apply bg-white/90 backdrop-blur-sm border-2 border-white/50 text-gray-800 rounded-lg px-3 py-2 min-w-40 transition-all duration-300 font-medium;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.filter-select-compact:hover {
    @apply bg-white border-white/70;
}

.filter-select-compact:focus {
    @apply bg-white border-white ring-2 ring-white/30;
}

/* Mejorar contraste en el dropdown */
:deep(.filter-select-compact .p-dropdown-label) {
    @apply text-gray-800 font-medium;
}

:deep(.filter-select-compact .p-dropdown-trigger) {
    @apply text-gray-600;
}

/* Placeholder con mejor contraste */
:deep(.filter-select-compact .p-dropdown-label.p-placeholder) {
    @apply text-gray-600 font-normal;
}

/* Botón limpiar filtros compacto */
.clear-filters-btn-compact {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40 rounded-lg px-3 py-2 transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    min-width: 40px;
    min-height: 40px;
}

.clear-filters-btn-compact:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Botón refresh compacto */
.refresh-btn-compact {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40 rounded-lg transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    min-width: 40px;
    min-height: 40px;
}

.refresh-btn-compact:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.refresh-btn-compact:disabled {
    @apply opacity-60 cursor-not-allowed;
    transform: none !important;
}

/* Tags de filtros activos compactos */
.active-filters-compact {
    @apply mt-3 pt-3 border-t border-white/20;
}

.filter-tags-compact {
    @apply flex flex-wrap gap-2;
}

.filter-tag-compact {
    @apply inline-flex items-center gap-2 px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/30;
}

.tag-remove-compact {
    @apply ml-1 w-3 h-3 rounded-full hover:bg-white/30 flex items-center justify-center transition-colors;
}

.tag-remove-compact i {
    @apply text-xs;
}

/* Mejoras para modo oscuro */
@media (prefers-color-scheme: dark) {
    .stock-toolbar {
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
