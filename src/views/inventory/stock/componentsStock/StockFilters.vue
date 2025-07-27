<script setup>
import { ref, computed, watch } from 'vue';
import { InputText, Select, Button } from 'primevue';

const props = defineProps({
    searchQuery: {
        type: String,
        default: ''
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

const emit = defineEmits(['update:searchQuery', 'update:warehouseFilter', 'update:stockStatusFilter', 'clear-filters']);

// Estado local para los filtros
const localSearchQuery = ref(props.searchQuery);
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
    return localSearchQuery.value || localWarehouseFilter.value || localStockStatusFilter.value;
});

// Watchers para sincronizar con props
watch(
    () => props.searchQuery,
    (newVal) => {
        localSearchQuery.value = newVal;
    }
);

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
const onSearchChange = () => {
    emit('update:searchQuery', localSearchQuery.value);
};

const onFilterChange = () => {
    emit('update:warehouseFilter', localWarehouseFilter.value);
    emit('update:stockStatusFilter', localStockStatusFilter.value);
};

const clearSearch = () => {
    localSearchQuery.value = '';
    emit('update:searchQuery', '');
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
    localSearchQuery.value = '';
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
    <div class="stock-filters">
        <div class="filters-container">
            <!-- Búsqueda principal -->
            <div class="search-section">
                <div class="search-wrapper">
                    <i class="pi pi-search search-icon"></i>
                    <InputText v-model="localSearchQuery" placeholder="Buscar por nombre, SKU o código de barras..." class="search-input" @input="onSearchChange" />
                    <Button v-if="localSearchQuery" icon="pi pi-times" class="clear-search-btn" text @click="clearSearch" v-tooltip.top="'Limpiar búsqueda'" />
                </div>
            </div>

            <!-- Filtros en línea -->
            <div class="inline-filters">
                <!-- Filtro por almacén -->
                <div class="filter-item">
                    <label for="warehouse-filter" class="filter-label">Almacén</label>
                    <Select id="warehouse-filter" v-model="localWarehouseFilter" :options="warehouseOptions" optionLabel="label" optionValue="value" placeholder="Todos los almacenes" class="filter-select" @change="onFilterChange" />
                </div>

                <!-- Filtro por estado de stock -->
                <div class="filter-item">
                    <label for="status-filter" class="filter-label">Estado</label>
                    <Select id="status-filter" v-model="localStockStatusFilter" :options="stockStatusOptions" optionLabel="label" optionValue="value" placeholder="Todos los estados" class="filter-select" @change="onFilterChange" />
                </div>

                <!-- Botón para limpiar filtros -->
                <div class="filter-actions">
                    <Button icon="pi pi-filter-slash" label="Limpiar" outlined @click="clearFilters" v-tooltip.top="'Limpiar todos los filtros'" class="clear-filters-btn" :disabled="!hasActiveFilters" />
                </div>
            </div>

            <!-- Indicador de filtros activos -->
            <div v-if="hasActiveFilters" class="active-filters">
                <div class="filter-tags">
                    <span v-if="localSearchQuery" class="filter-tag">
                        <i class="pi pi-search"></i>
                        Búsqueda: "{{ localSearchQuery }}"
                        <button @click="clearSearch" class="tag-remove">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>

                    <span v-if="localWarehouseFilter" class="filter-tag">
                        <i class="pi pi-warehouse"></i>
                        Almacén: {{ getWarehouseLabel(localWarehouseFilter) }}
                        <button @click="clearWarehouseFilter" class="tag-remove">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>

                    <span v-if="localStockStatusFilter" class="filter-tag">
                        <i class="pi pi-chart-bar"></i>
                        Estado: {{ getStatusLabel(localStockStatusFilter) }}
                        <button @click="clearStatusFilter" class="tag-remove">
                            <i class="pi pi-times"></i>
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stock-filters {
    @apply mb-6;
}

.filters-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6;
}

/* Sección de búsqueda */
.search-section {
    @apply mb-6;
}

.search-wrapper {
    @apply relative max-w-md;
}

.search-icon {
    @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10;
}

.search-input {
    @apply w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200;
}

.clear-search-btn {
    @apply absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 hover:text-gray-600 p-0;
}

/* Filtros en línea */
.inline-filters {
    @apply flex flex-wrap items-end gap-4;
}

.filter-item {
    @apply flex flex-col gap-2 min-w-48;
}

.filter-label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.filter-select {
    @apply w-full;
}

.filter-actions {
    @apply flex items-end;
}

.clear-filters-btn {
    @apply h-12;
}

/* Filtros activos */
.active-filters {
    @apply mt-4 pt-4 border-t border-gray-200 dark:border-gray-600;
}

.filter-tags {
    @apply flex flex-wrap gap-2;
}

.filter-tag {
    @apply inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium;
}

.tag-remove {
    @apply ml-1 w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-center transition-colors;
}

.tag-remove i {
    @apply text-xs;
}

/* Responsive */
@media (max-width: 768px) {
    .filters-container {
        @apply p-4;
    }

    .search-wrapper {
        @apply max-w-full;
    }

    .inline-filters {
        @apply flex-col gap-3;
    }

    .filter-item {
        @apply min-w-full;
    }

    .filter-actions {
        @apply w-full;
    }

    .clear-filters-btn {
        @apply w-full h-10;
    }

    .filter-tags {
        @apply gap-1;
    }

    .filter-tag {
        @apply text-xs px-2 py-1;
    }
}

@media (max-width: 480px) {
    .search-input {
        @apply py-2 text-sm;
    }

    .filter-label {
        @apply text-xs;
    }

    .clear-filters-btn {
        @apply text-sm;
    }
}
</style>
