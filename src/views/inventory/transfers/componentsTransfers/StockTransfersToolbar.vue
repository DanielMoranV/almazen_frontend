<script setup>
import { computed, ref } from 'vue';

// PrimeVue Components
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import SplitButton from 'primevue/splitbutton';
import Tag from 'primevue/tag';

const props = defineProps({
    totalTransfers: {
        type: Number,
        default: 0
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    dateFromFilter: {
        type: Date,
        default: null
    },
    dateToFilter: {
        type: Date,
        default: null
    },
    fromWarehouseFilter: {
        type: Number,
        default: null
    },
    toWarehouseFilter: {
        type: Number,
        default: null
    },
    productFilter: {
        type: String,
        default: ''
    },
    statusFilter: {
        type: String,
        default: null
    },
    warehouseOptions: {
        type: Array,
        default: () => []
    },
    statusOptions: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:dateFromFilter', 'update:dateToFilter', 'update:fromWarehouseFilter', 'update:toWarehouseFilter', 'update:productFilter', 'update:statusFilter', 'refresh', 'clearFilters', 'export', 'applyFilters']);

// Collapsible filters state
const filtersCollapsed = ref(false);

const toggleFilters = () => {
    filtersCollapsed.value = !filtersCollapsed.value;
};

// Computed for v-model bindings
const dateFromModel = computed({
    get: () => props.dateFromFilter,
    set: (value) => emit('update:dateFromFilter', value)
});

const dateToModel = computed({
    get: () => props.dateToFilter,
    set: (value) => emit('update:dateToFilter', value)
});

const fromWarehouseModel = computed({
    get: () => props.fromWarehouseFilter,
    set: (value) => emit('update:fromWarehouseFilter', value)
});

const toWarehouseModel = computed({
    get: () => props.toWarehouseFilter,
    set: (value) => emit('update:toWarehouseFilter', value)
});

const productModel = computed({
    get: () => props.productFilter,
    set: (value) => emit('update:productFilter', value)
});

const statusModel = computed({
    get: () => props.statusFilter,
    set: (value) => emit('update:statusFilter', value)
});

// Check if any filters are active
const hasActiveFilters = computed(() => {
    return props.dateFromFilter || props.dateToFilter || props.fromWarehouseFilter || props.toWarehouseFilter || props.productFilter || props.statusFilter;
});

// Export options
const exportItems = [
    {
        label: 'Excel',
        icon: 'pi pi-file-excel',
        command: () => emit('export', 'excel')
    },
    {
        label: 'PDF',
        icon: 'pi pi-file-pdf',
        command: () => emit('export', 'pdf')
    },
    {
        label: 'CSV',
        icon: 'pi pi-file',
        command: () => emit('export', 'csv')
    }
];
</script>

<template>
    <div class="toolbar-container">
        <!-- Header with summary -->
        <div class="toolbar-header">
            <div class="toolbar-title">
                <Button 
                    :icon="filtersCollapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'"
                    @click="toggleFilters"
                    text
                    size="small"
                    class="toggle-button"
                    v-tooltip.top="filtersCollapsed ? 'Mostrar filtros' : 'Ocultar filtros'"
                />
                <i class="pi pi-filter"></i>
                <span>Filtros de Búsqueda</span>
                <Tag v-if="hasActiveFilters" value="Filtros Activos" severity="info" class="ml-2" />
            </div>
            <div class="toolbar-summary">
                <span class="text-sm text-gray-600 dark:text-gray-400"> {{ totalTransfers }} transferencia{{
                    totalTransfers !== 1 ? 's' : '' }} encontrada{{ totalTransfers !== 1 ? 's' : '' }} </span>
            </div>
        </div>

        <!-- Filters Grid -->
        <transition name="slide-down">
            <div v-show="!filtersCollapsed" class="filters-grid">
            <!-- Date Range Filters -->
            <div class="filter-group">
                <h4 class="filter-group-title">
                    <i class="pi pi-calendar"></i>
                    Rango de Fechas
                </h4>
                <div class="filter-row">
                    <div class="filter-item">
                        <label>Fecha Desde:</label>
                        <DatePicker v-model="dateFromModel" showIcon dateFormat="dd/mm/yy" placeholder="Seleccionar fecha"
                            class="w-full" />
                    </div>
                    <div class="filter-item">
                        <label>Fecha Hasta:</label>
                        <DatePicker v-model="dateToModel" showIcon dateFormat="dd/mm/yy" placeholder="Seleccionar fecha"
                            class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Warehouse Filters -->
            <div class="filter-group">
                <h4 class="filter-group-title">
                    <i class="pi pi-warehouse"></i>
                    Almacenes
                </h4>
                <div class="filter-row">
                    <div class="filter-item">
                        <label>Almacén Origen:</label>
                        <Select v-model="fromWarehouseModel" :options="warehouseOptions" optionLabel="label"
                            optionValue="value" placeholder="Seleccionar almacén origen" class="w-full" filter
                            filterPlaceholder="Buscar almacén..." />
                    </div>
                    <div class="filter-item">
                        <label>Almacén Destino:</label>
                        <Select v-model="toWarehouseModel" :options="warehouseOptions" optionLabel="label"
                            optionValue="value" placeholder="Seleccionar almacén destino" class="w-full" filter
                            filterPlaceholder="Buscar almacén..." />
                    </div>
                </div>
            </div>

            <!-- Product and Status Filters -->
            <div class="filter-group">
                <h4 class="filter-group-title">
                    <i class="pi pi-search"></i>
                    Búsqueda y Estado
                </h4>
                <div class="filter-row">
                    <div class="filter-item">
                        <label>Buscar Producto:</label>
                        <InputText v-model="productModel" placeholder="Nombre, código o SKU del producto"
                            class="w-full" />
                    </div>
                    <div class="filter-item">
                        <label>Estado:</label>
                        <Select v-model="statusModel" :options="statusOptions" optionLabel="label" optionValue="value"
                            placeholder="Seleccionar estado" class="w-full" />
                    </div>
                </div>
            </div>
            </div>
        </transition>

        <!-- Action Buttons -->
        <div class="toolbar-actions">
            <div class="action-buttons">
                <Button icon="pi pi-search" label="Buscar" @click="$emit('applyFilters')" class="search-button"
                    v-tooltip.top="'Aplicar filtros de búsqueda'" />
                <Button icon="pi pi-refresh" label="Actualizar" @click="$emit('refresh')" :loading="isLoading"
                    class="refresh-button" v-tooltip.top="'Actualizar lista de transferencias'" />
                <Button icon="pi pi-filter-slash" label="Limpiar Filtros" outlined @click="$emit('clearFilters')"
                    :disabled="!hasActiveFilters" class="clear-button" v-tooltip.top="'Limpiar todos los filtros'" />
                <SplitButton label="Exportar" icon="pi pi-download" :model="exportItems" outlined
                    :disabled="totalTransfers === 0" class="export-button" v-tooltip.top="'Exportar transferencias'" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.toolbar-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 p-6 border border-gray-200 dark:border-gray-700;
}

.toolbar-header {
    @apply flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700;
}

.toolbar-title {
    @apply flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.toolbar-title i {
    @apply text-purple-500;
}

.toggle-button {
    @apply mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors;
}

.toggle-button:deep(.p-button-icon) {
    @apply text-purple-500;
}

.toolbar-summary {
    @apply text-right;
}

.filters-grid {
    @apply grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6;
}

.filter-group {
    @apply space-y-4;
}

.filter-group-title {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-600;
}

.filter-group-title i {
    @apply text-purple-500;
}

.filter-row {
    @apply space-y-4;
}

.filter-item {
    @apply space-y-2;
}

.filter-item label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.toolbar-actions {
    @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

.action-buttons {
    @apply flex justify-center gap-3;
}

.search-button {
    @apply bg-blue-600 hover:bg-blue-700 border-blue-600 text-white font-semibold;
}

.refresh-button {
    @apply bg-purple-600 hover:bg-purple-700 border-purple-600 text-white;
}

.clear-button {
    @apply border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700;
}

.export-button {
    @apply border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900;
}

/* Responsive design */
@media (max-width: 1024px) {
    .filters-grid {
        @apply grid-cols-1 gap-4;
    }

    .filter-row {
        @apply grid grid-cols-1 md:grid-cols-2 gap-4;
    }
}

@media (max-width: 768px) {
    .toolbar-container {
        @apply p-4;
    }

    .toolbar-header {
        @apply flex-col gap-3 items-start;
    }

    .toolbar-title {
        @apply text-base;
    }

    .filter-group-title {
        @apply text-xs;
    }

    .action-buttons {
        @apply flex-col gap-2;
    }

    .refresh-button,
    .clear-button,
    .export-button {
        @apply w-full text-sm;
    }
}

@media (max-width: 480px) {
    .filter-row {
        @apply grid-cols-1;
    }
}

/* Slide down transition */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-in-out;
    max-height: 1000px;
    opacity: 1;
}

.slide-down-enter-from,
.slide-down-leave-to {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
}
</style>
