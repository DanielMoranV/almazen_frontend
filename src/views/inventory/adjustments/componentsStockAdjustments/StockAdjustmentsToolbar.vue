<script setup>
import { computed, ref } from 'vue';

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
    isLoading: {
        type: Boolean,
        default: false
    },
    typeFilter: {
        type: String,
        default: null
    },
    warehouseFilter: {
        type: [String, Number],
        default: null
    },
    dateFromFilter: {
        type: [Date, String],
        default: null
    },
    dateToFilter: {
        type: [Date, String],
        default: null
    },
    warehouseOptions: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:typeFilter', 'update:warehouseFilter', 'update:dateFromFilter', 'update:dateToFilter', 'refresh', 'clearFilters', 'newAdjustment']);

// Estado local para los filtros
const localTypeFilter = ref(props.typeFilter);
const localWarehouseFilter = ref(props.warehouseFilter);
const localDateFromFilter = ref(props.dateFromFilter);
const localDateToFilter = ref(props.dateToFilter);

// Opciones de tipo de ajuste
const typeOptions = [
    { label: 'Todos los tipos', value: null },
    { label: 'Ajustes Positivos', value: 'POSITIVO' },
    { label: 'Ajustes Negativos', value: 'NEGATIVO' }
];

// Computed para verificar si hay filtros activos
const hasActiveFilters = computed(() => {
    return localTypeFilter.value || localWarehouseFilter.value || localDateFromFilter.value || localDateToFilter.value;
});

// Computed para formatear fechas
const formattedDateFrom = computed({
    get() {
        if (!localDateFromFilter.value) return '';
        const date = new Date(localDateFromFilter.value);
        return date.toISOString().split('T')[0];
    },
    set(value) {
        localDateFromFilter.value = value ? new Date(value) : null;
        emit('update:dateFromFilter', value ? new Date(value) : null);
    }
});

const formattedDateTo = computed({
    get() {
        if (!localDateToFilter.value) return '';
        const date = new Date(localDateToFilter.value);
        return date.toISOString().split('T')[0];
    },
    set(value) {
        localDateToFilter.value = value ? new Date(value) : null;
        emit('update:dateToFilter', value ? new Date(value) : null);
    }
});

// Métodos
const onTypeFilterChange = () => {
    emit('update:typeFilter', localTypeFilter.value);
};

const onWarehouseFilterChange = () => {
    emit('update:warehouseFilter', localWarehouseFilter.value);
};

const clearTypeFilter = () => {
    localTypeFilter.value = null;
    emit('update:typeFilter', null);
};

const clearWarehouseFilter = () => {
    localWarehouseFilter.value = null;
    emit('update:warehouseFilter', null);
};

const clearDateFilters = () => {
    localDateFromFilter.value = null;
    localDateToFilter.value = null;
    emit('update:dateFromFilter', null);
    emit('update:dateToFilter', null);
};

const clearFilters = () => {
    localTypeFilter.value = null;
    localWarehouseFilter.value = null;
    localDateFromFilter.value = null;
    localDateToFilter.value = null;
    emit('clearFilters');
};

const getTypeLabel = (value) => {
    const option = typeOptions.find((opt) => opt.value === value);
    return option ? option.label : 'Desconocido';
};

const getWarehouseLabel = (value) => {
    const option = props.warehouseOptions.find((opt) => opt.value === value);
    return option ? option.label : 'Desconocido';
};
</script>

<template>
    <div class="stock-adjustments-toolbar">
        <!-- Header compacto con título, estadísticas y filtros integrados -->
        <div class="toolbar-header">
            <div class="header-backdrop"></div>
            <div class="header-content">
                <!-- Sección izquierda: Título y estadísticas -->
                <div class="title-section">
                    <div class="title-wrapper">
                        <div class="icon-container">
                            <i class="pi pi-sliders-h"></i>
                        </div>
                        <div class="title-text">
                            <h1 class="page-title">Ajustes</h1>
                            <p v-if="totalAdjustments > 0" class="subtitle">
                                {{ totalAdjustments }}
                                {{ totalAdjustments === 1 ? 'ajuste' : 'ajustes' }} • <span class="text-green-400">+{{
                                    totalPositive }}</span> •
                                <span class="text-red-400">-{{ totalNegative }}</span>
                            </p>
                            <p v-else class="subtitle">No hay ajustes disponibles</p>
                        </div>
                    </div>
                </div>

                <!-- Sección central: Filtros compactos -->
                <div class="filters-section-compact">
                    <div class="compact-filters">
                        <!-- Filtro por tipo -->
                        <Select id="type-filter" v-model="localTypeFilter" :options="typeOptions" optionLabel="label"
                            optionValue="value" placeholder="Tipo" class="filter-select-compact"
                            @change="onTypeFilterChange" />

                        <!-- Filtro por almacén -->
                        <Select id="warehouse-filter" v-model="localWarehouseFilter" :options="warehouseOptions"
                            optionLabel="label" optionValue="value" placeholder="Almacén" class="filter-select-compact"
                            @change="onWarehouseFilterChange" />

                        <!-- Filtro por fecha desde -->
                        <InputText id="date-from" type="date" v-model="formattedDateFrom" placeholder="Desde"
                            class="filter-date-compact" />

                        <!-- Filtro por fecha hasta -->
                        <InputText id="date-to" type="date" v-model="formattedDateTo" placeholder="Hasta"
                            class="filter-date-compact" />

                        <!-- Botón para limpiar filtros -->
                        <Button icon="pi pi-filter-slash" outlined @click="clearFilters"
                            v-tooltip.bottom="'Limpiar filtros'" class="clear-filters-btn-compact"
                            :disabled="!hasActiveFilters" />
                    </div>
                </div>

                <!-- Sección derecha: Acciones -->
                <div class="actions-section">
                    <Button icon="pi pi-refresh" class="refresh-btn-compact" :loading="isLoading"
                        @click="$emit('refresh')" v-tooltip.bottom="'Actualizar ajustes'" :disabled="isLoading" />
                    <Button icon="pi pi-plus" label="Nuevo" class="new-adjustment-btn-compact"
                        @click="$emit('newAdjustment')" v-tooltip.bottom="'Crear nuevo ajuste'" />
                </div>
            </div>

            <!-- Tags de filtros activos (solo si hay filtros) -->
            <div v-if="hasActiveFilters" class="active-filters-compact">
                <div class="filter-tags-compact">
                    <span v-if="localTypeFilter" class="filter-tag-compact">
                        <i class="pi pi-tag"></i>
                        {{ getTypeLabel(localTypeFilter) }}
                        <button @click="clearTypeFilter" class="tag-remove-compact">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>

                    <span v-if="localWarehouseFilter" class="filter-tag-compact">
                        <i class="pi pi-building"></i>
                        {{ getWarehouseLabel(localWarehouseFilter) }}
                        <button @click="clearWarehouseFilter" class="tag-remove-compact">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>

                    <span v-if="localDateFromFilter || localDateToFilter" class="filter-tag-compact">
                        <i class="pi pi-calendar"></i>
                        {{ localDateFromFilter ? new Date(localDateFromFilter).toLocaleDateString() : 'Desde inicio' }}
                        -
                        {{ localDateToFilter ? new Date(localDateToFilter).toLocaleDateString() : 'Hasta hoy' }}
                        <button @click="clearDateFilters" class="tag-remove-compact">
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
.stock-adjustments-toolbar {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Encabezado del toolbar compacto */
.toolbar-header {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
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
    @apply flex items-center gap-3;
}

/* Botón de refrescar con estilo glassmorphism */
.refresh-btn-compact {
    @apply bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    min-width: 48px;
    min-height: 48px;
}

.refresh-btn-compact:disabled {
    @apply opacity-60 cursor-not-allowed;
    transform: none !important;
}

/* Botón de nuevo ajuste */
.new-adjustment-btn-compact {
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

/* Sección de filtros compacta integrada en el header */
.filters-section-compact {
    @apply flex items-center;
}

.compact-filters {
    @apply flex items-center gap-3;
}

/* Filtros compactos con mejor contraste */
.filter-select-compact {
    @apply bg-white/90 backdrop-blur-sm border-2 border-white/50 text-gray-800 rounded-lg px-3 py-2 min-w-32 transition-all duration-300 font-medium;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.filter-select-compact:hover {
    @apply bg-white border-white/70;
}

.filter-select-compact:focus {
    @apply bg-white border-white ring-2 ring-white/30;
}

/* Filtros de fecha compactos */
.filter-date-compact {
    @apply bg-white/90 backdrop-blur-sm border-2 border-white/50 text-gray-800 rounded-lg px-3 py-2 min-w-32 transition-all duration-300 font-medium;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.filter-date-compact:hover {
    @apply bg-white border-white/70;
}

.filter-date-compact:focus {
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

    .filter-select-compact,
    .filter-date-compact {
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

    .filter-select-compact,
    .filter-date-compact {
        @apply w-full min-w-full;
    }

    .clear-filters-btn-compact,
    .refresh-btn-compact {
        @apply w-full;
    }
}

/* Mejoras para modo oscuro */
@media (prefers-color-scheme: dark) {
    .stock-adjustments-toolbar {
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
