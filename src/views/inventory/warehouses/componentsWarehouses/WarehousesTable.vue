<script setup>
import { ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { exportToExcel } from '@/utils/excelUtils';

const { warehouses, loading } = defineProps({
    warehouses: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['edit', 'delete']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    address: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
});

const localFilters = ref(initFilters());

watch(
    () => warehouses,
    () => {
        localFilters.value = initFilters();
    }
);

const exportWarehouses = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Dirección', key: 'address', width: 40 },
        { header: 'Teléfono', key: 'phone', width: 20 }
    ];

    await exportToExcel(columns, warehouses, 'Almacenes', 'Almacenes');
};
</script>
<template>
    <DataTable
        stripedRows
        :value="warehouses"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['name', 'address', 'phone']"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} almacenes"
        class="warehouses-table red-theme p-datatable-gridlines"
    >
        <template #header>
            <div class="table-header">
                <div class="header-backdrop"></div>
                <div class="header-content">
                    <div class="search-section">
                        <div class="search-container">
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText 
                                    v-model="localFilters.global.value" 
                                    placeholder="Buscar por nombre, dirección, teléfono..."
                                    class="search-input"
                                />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button 
                            type="button" 
                            icon="pi pi-file-excel" 
                            label="Exportar" 
                            class="export-btn" 
                            @click="exportWarehouses()" 
                            v-tooltip.top="'Exportar almacenes a Excel'"
                            :disabled="!warehouses.length"
                        />
                    </div>
                </div>
            </div>
        </template>
        <!-- Mostrar mensaje cuando no hay registros -->
        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-search"></i>
                </div>
                <h3 class="empty-title">No se encontraron almacenes</h3>
                <p class="empty-description">Intenta ajustar los filtros o términos de búsqueda</p>
                <Button 
                    icon="pi pi-filter-slash" 
                    label="Limpiar filtros" 
                    class="p-button-outlined" 
                    @click="localFilters = initFilters()"
                />
            </div>
        </template>
        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando almacenes...</p>
            </div>
        </template>
        <Column field="name" header="Nombre" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="warehouse-name">
                    <div class="name-icon">
                        {{ data.name?.charAt(0)?.toUpperCase() || 'A' }}
                    </div>
                    <span class="name-text">{{ data.name || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="address" header="Dirección" sortable style="min-width: 15rem; max-width: 20rem">
            <template #body="{ data }">
                <div class="address-container">
                    <i class="pi pi-map-marker"></i>
                    <span class="address-text">{{ data.address || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="phone" header="Teléfono" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="phone-container">
                    <i class="pi pi-phone"></i>
                    <span>{{ data.phone || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column :exportable="false" header="Acciones" style="min-width: 6rem; max-width: 8rem">
            <template #body="slotProps">
                <div class="flex justify-center gap-1">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info" size="small" rounded text v-tooltip.top="'Editar'" @click="$emit('edit', slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" size="small" rounded text v-tooltip.top="'Eliminar'" @click="$emit('delete', slotProps.data)" />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
/* Encabezado de la tabla mejorado */
.table-header {
    @apply relative overflow-hidden mb-0 rounded-t-2xl;
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f97316 100%);
    padding: 1.5rem 2rem;
}

/* Fondo decorativo */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: 
        radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size: 40px 40px, 25px 25px;
    animation: pattern-drift 25s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

/* Sección de búsqueda mejorada */
.search-section {
    @apply flex-1 max-w-md;
}

.search-container {
    @apply relative;
}

.search-input {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/70 rounded-xl px-4 py-3 font-medium transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
    @apply bg-white/30 border-white/50 ring-2 ring-white/20;
    transform: translateY(-1px);
}

.search-input::placeholder {
    @apply text-white/70;
}

/* Icono de búsqueda */
:deep(.search-container .p-icon-field .p-input-icon) {
    @apply text-white/80;
}

/* Sección de acciones */
.actions-section {
    @apply flex gap-3;
}

/* Botón de exportar mejorado */
.export-btn {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-semibold px-4 py-3 rounded-xl transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.export-btn:hover:not(:disabled) {
    @apply bg-white/30 border-white/40;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.export-btn:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Estados de tabla vacía y carga mejorados */
.empty-table-state {
    @apply text-center py-16 px-8;
}

.empty-icon {
    @apply mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center;
}

.empty-icon i {
    @apply text-3xl text-gray-400 dark:text-gray-500;
}

.empty-title {
    @apply text-xl font-bold text-gray-700 dark:text-gray-300 mb-2;
}

.empty-description {
    @apply text-gray-500 dark:text-gray-400 mb-6;
}

.loading-table-state {
    @apply text-center py-16 px-8;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

/* Tema principal de la tabla mejorado */
:deep(.red-theme) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.red-theme .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

/* Encabezado de las columnas de la tabla */
:deep(.red-theme .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-red-600 text-white font-bold text-sm py-5 px-6 border-none text-center;
}

/* Cuerpo de la tabla */
:deep(.red-theme .p-datatable-tbody > tr > td) {
    @apply py-5 px-6 align-middle border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

/* Estilo para filas pares */
:deep(.red-theme .p-datatable-tbody > tr:nth-child(even) > td) {
    @apply bg-gray-50 dark:bg-gray-700/50;
}

/* Efecto hover en las filas */
:deep(.red-theme .p-datatable-tbody > tr:hover > td) {
    @apply bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800;
}

/* Elementos de almacén mejorados */
.warehouse-name {
    @apply flex items-center gap-3;
}

.name-icon {
    @apply w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold text-sm;
}

.name-text {
    @apply font-semibold text-gray-800 dark:text-gray-200;
}

.address-container,
.phone-container {
    @apply flex items-center gap-2;
}

.address-container i {
    @apply text-red-600 dark:text-red-400;
}

.phone-container i {
    @apply text-green-600 dark:text-green-400;
}

.address-text {
    @apply text-sm text-gray-700 dark:text-gray-300;
}

/* Botones de acción */
:deep(.red-theme .p-button.p-button-info) {
    @apply bg-red-600 hover:bg-red-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.red-theme .p-button.p-button-danger) {
    @apply bg-red-600 hover:bg-red-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

/* Paginador */
:deep(.red-theme .p-paginator) {
    @apply bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl;
}

:deep(.red-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    @apply text-red-600 border border-red-600 font-semibold rounded-xl mx-1 w-10 h-10 transition-colors;
}

:deep(.red-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    @apply bg-red-600 text-white;
}

:deep(.red-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    @apply bg-red-50 dark:bg-red-900/30 border-red-700;
}

/* Animación del patrón */
@keyframes pattern-drift {
    0% {
        background-position: 0% 0%, 0% 0%;
    }
    100% {
        background-position: 100% 100%, -100% -100%;
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    .table-header {
        @apply p-4;
    }

    .header-content {
        @apply flex-col gap-4;
    }

    .search-section {
        @apply max-w-none w-full;
    }

    .search-input {
        @apply w-full;
    }

    .actions-section {
        @apply w-full;
    }

    .export-btn {
        @apply w-full justify-center;
    }

    :deep(.red-theme .p-datatable-thead > tr > th),
    :deep(.red-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
    }

    .warehouse-name {
        @apply gap-2;
    }

    .name-icon {
        @apply w-6 h-6 text-xs;
    }
}

@media (max-width: 480px) {
    .table-header {
        @apply p-3;
    }

    .search-input {
        @apply py-2.5 text-sm;
    }

    .export-btn {
        @apply py-2.5 text-sm;
    }
}
</style>
