<script setup>
import AutoComplete from 'primevue/autocomplete';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Toolbar from 'primevue/toolbar';
import { computed, reactive, ref } from 'vue';

const props = defineProps({
    filters: { type: Object, required: true },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['filter-change', 'refresh']);

// Estado local de filtros
const localFilters = reactive({ ...props.filters });

// Opciones de estado
const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagado', value: 'PAGADO' },
    { label: 'Vencido', value: 'VENCIDO' },
    { label: 'Anulado', value: 'ANULADO' }
];

// Datos para autocompletado
const customers = ref([]);
const sellers = ref([]);
const filteredCustomers = ref([]);
const filteredSellers = ref([]);

// Búsqueda de clientes
const searchCustomers = async (event) => {
    try {
        const response = await fetch(`/api/customers/search?q=${event.query}`);
        const data = await response.json();
        filteredCustomers.value = data.results || [];
    } catch (error) {
        console.error('Error searching customers:', error);
        filteredCustomers.value = [];
    }
};

// Búsqueda de vendedores
const searchSellers = async (event) => {
    try {
        const response = await fetch(`/api/users/search?q=${event.query}&role=seller`);
        const data = await response.json();
        filteredSellers.value = data.results || [];
    } catch (error) {
        console.error('Error searching sellers:', error);
        filteredSellers.value = [];
    }
};

// Aplicar filtros
const applyFilters = () => {
    emit('filter-change', { ...localFilters });
};

// Limpiar filtros
const clearFilters = () => {
    Object.keys(localFilters).forEach((key) => {
        localFilters[key] = null;
    });
    localFilters.onlyOverdue = false;
    applyFilters();
};

// Refrescar datos
const refresh = () => {
    emit('refresh');
};

// Exportar a Excel
const exportToExcel = () => {
    // Implementar exportación
    console.log('Exportar a Excel');
};

// Contador de filtros activos
const activeFiltersCount = computed(() => {
    return Object.values(localFilters).filter((value) => value !== null && value !== '' && value !== false).length;
});
</script>

<template>
    <div class="credits-toolbar">
        <Toolbar class="toolbar-container">
            <template #start>
                <div class="toolbar-start">
                    <h2 class="toolbar-title">
                        <i class="pi pi-filter"></i>
                        Filtros
                        <Badge v-if="activeFiltersCount > 0" :value="activeFiltersCount" severity="info" class="ml-2" />
                    </h2>
                </div>
            </template>

            <template #end>
                <div class="toolbar-actions">
                    <Button icon="pi pi-refresh" label="Actualizar" class="p-button-outlined p-button-sm" @click="refresh" :loading="loading" />
                    <Button icon="pi pi-file-excel" label="Excel" class="p-button-success p-button-outlined p-button-sm" @click="exportToExcel" />
                </div>
            </template>
        </Toolbar>

        <!-- Filtros -->
        <div class="filters-container">
            <div class="filters-grid">
                <!-- Cliente -->
                <div class="filter-field">
                    <label class="filter-label">Cliente</label>
                    <AutoComplete v-model="localFilters.customer" :suggestions="filteredCustomers" @complete="searchCustomers" optionLabel="name" placeholder="Buscar cliente..." class="filter-input" :dropdown="true" @change="applyFilters" />
                </div>

                <!-- Vendedor -->
                <div class="filter-field">
                    <label class="filter-label">Vendedor</label>
                    <AutoComplete v-model="localFilters.seller" :suggestions="filteredSellers" @complete="searchSellers" optionLabel="name" placeholder="Buscar vendedor..." class="filter-input" :dropdown="true" @change="applyFilters" />
                </div>

                <!-- Estado -->
                <div class="filter-field">
                    <label class="filter-label">Estado</label>
                    <Select v-model="localFilters.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Todos los estados" class="filter-input" @change="applyFilters" />
                </div>

                <!-- Solo vencidos -->
                <div class="filter-field filter-checkbox">
                    <Checkbox id="only_overdue" v-model="localFilters.onlyOverdue" :binary="true" @change="applyFilters" />
                    <label for="only_overdue" class="checkbox-label"> Solo vencidos </label>
                </div>
            </div>

            <!-- Segunda fila de filtros -->
            <div class="filters-grid">
                <!-- Fecha desde -->
                <div class="filter-field">
                    <label class="filter-label">Fecha desde</label>
                    <DatePicker v-model="localFilters.dateFrom" dateFormat="dd/mm/yy" placeholder="Fecha inicial" class="filter-input" @date-select="applyFilters" :showIcon="true" />
                </div>

                <!-- Fecha hasta -->
                <div class="filter-field">
                    <label class="filter-label">Fecha hasta</label>
                    <DatePicker v-model="localFilters.dateTo" dateFormat="dd/mm/yy" placeholder="Fecha final" class="filter-input" @date-select="applyFilters" :showIcon="true" />
                </div>

                <!-- Monto desde -->
                <div class="filter-field">
                    <label class="filter-label">Monto desde</label>
                    <InputNumber v-model="localFilters.amountFrom" mode="currency" currency="PEN" placeholder="0.00" class="filter-input" @input="applyFilters" />
                </div>

                <!-- Monto hasta -->
                <div class="filter-field">
                    <label class="filter-label">Monto hasta</label>
                    <InputNumber v-model="localFilters.amountTo" mode="currency" currency="PEN" placeholder="0.00" class="filter-input" @input="applyFilters" />
                </div>
            </div>

            <!-- Acciones de filtros -->
            <div class="filter-actions">
                <Button icon="pi pi-filter-slash" label="Limpiar Filtros" class="p-button-text p-button-sm" @click="clearFilters" v-if="activeFiltersCount > 0" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.credits-toolbar {
    @apply bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.toolbar-container {
    @apply bg-transparent border-none p-4;
}

.toolbar-start {
    @apply flex items-center gap-2;
}

.toolbar-title {
    @apply text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 m-0;
}

.toolbar-actions {
    @apply flex items-center gap-2;
}

.filters-container {
    @apply p-4 pt-0 space-y-4;
}

.filters-grid {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

.filter-field {
    @apply flex flex-col gap-2;
}

.filter-field.filter-checkbox {
    @apply flex-row items-center gap-2 pt-6;
}

.filter-label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.checkbox-label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer;
}

.filter-input {
    @apply w-full;
}

.filter-actions {
    @apply flex justify-center pt-2;
}

/* Estilos para componentes PrimeVue */
:deep(.p-toolbar) {
    @apply bg-transparent border-none rounded-none;
}

:deep(.p-autocomplete),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputnumber) {
    @apply w-full;
}

:deep(.p-autocomplete .p-inputtext),
:deep(.p-dropdown .p-dropdown-label),
:deep(.p-calendar .p-inputtext),
:deep(.p-inputnumber .p-inputnumber-input) {
    @apply border-gray-300 dark:border-gray-600 rounded-lg;
}

:deep(.p-autocomplete:not(.p-disabled).p-focus),
:deep(.p-dropdown:not(.p-disabled).p-focus),
:deep(.p-calendar:not(.p-disabled).p-focus),
:deep(.p-inputnumber:not(.p-disabled).p-inputnumber-focused) {
    @apply ring-2 ring-purple-500/20 border-purple-500;
}

/* Responsive */
@media (max-width: 768px) {
    .filters-grid {
        @apply grid-cols-1;
    }

    .toolbar-container {
        @apply flex-col gap-4;
    }

    .toolbar-actions {
        @apply w-full justify-center;
    }
}
</style>
