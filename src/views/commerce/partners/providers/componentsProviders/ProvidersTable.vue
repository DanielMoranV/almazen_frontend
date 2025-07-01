<script setup>
import { exportToExcel } from '@/utils/excelUtils';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { ref, watch } from 'vue';

const props = defineProps({
    providers: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'delete']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    contact_person: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    address: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    website: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

watch(
    () => props.providers,
    (newProviders) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);

const exportProviders = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Persona de Contacto', key: 'contact_person', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Dirección', key: 'address', width: 25 },
        { header: 'Sitio Web', key: 'website', width: 25 },
        { header: 'Activo', key: 'is_active', width: 15 }
    ];

    await exportToExcel(columns, props.providers, 'Proveedores', 'Proveedores');
};
</script>
<template>
    <DataTable
        stripedRows
        :value="props.providers"
        :loading="props.loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['name', 'contact_person', 'phone', 'email', 'address', 'website']"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} proveedores"
        class="providers-table green-theme p-datatable-gridlines"
    >
        <template #header>
            <div class="table-header">
                <div class="header-backdrop"></div>
                <div class="header-content">
                    <div class="search-section">
                        <div class="search-container">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search text-white" />
                                </InputIcon>
                                <InputText v-model="localFilters['global'].value" placeholder="Buscar por nombre, contacto, teléfono..." class="search-input" fluid />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button type="button" icon="pi pi-file-excel" label="Exportar" class="export-btn" @click="exportProviders()" v-tooltip.top="'Exportar proveedores a Excel'" :disabled="!props.providers.length" />
                    </div>
                </div>
            </div>
        </template>

        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-search"></i>
                </div>
                <h3 class="empty-title">No se encontraron proveedores</h3>
                <p class="empty-description">Intenta ajustar los filtros o términos de búsqueda</p>
                <Button icon="pi pi-filter-slash" label="Limpiar filtros" class="p-button-outlined" @click="localFilters = initFilters()" />
            </div>
        </template>
        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando proveedores...</p>
            </div>
        </template>

        <Column field="name" header="Nombre" sortable style="min-width: 12rem; max-width: 15rem" />
        <Column field="contact_person" header="Contacto" sortable style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="contact-tag">
                    <i class="pi pi-user"></i>
                    <span>{{ data.contact_person || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="phone" header="Teléfono" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="phone-tag">
                    <i class="pi pi-phone"></i>
                    <span>{{ data.phone || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="email" header="Email" sortable style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="email-tag">
                    <i class="pi pi-envelope"></i>
                    <span class="truncate">{{ data.email || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="address" header="Dirección" sortable style="min-width: 12rem; max-width: 18rem">
            <template #body="{ data }">
                <div class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" :title="data.address">
                    {{ data.address || '-' }}
                </div>
            </template>
        </Column>
        <Column field="website" header="Web" sortable style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div v-if="data.website" class="website-tag">
                    <i class="pi pi-globe"></i>
                    <a :href="data.website" target="_blank" class="text-blue-600 hover:text-blue-800 truncate">{{ data.website }}</a>
                </div>
                <span v-else class="text-gray-400">-</span>
            </template>
        </Column>
        <Column field="is_active" header="Act." sortable style="min-width: 4rem; max-width: 5rem">
            <template #body="{ data }">
                <div class="flex justify-center">
                    <i class="pi pi-check-circle text-green-500 text-2xl" v-if="data.is_active" />
                    <i class="pi pi-times-circle text-red-500 text-2xl" v-else />
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
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    padding: 1.5rem 2rem;
}

/* Fondo decorativo */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size:
        40px 40px,
        25px 25px;
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

/* Animación del patrón */
@keyframes pattern-drift {
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

/* Tema principal de la tabla mejorado */
:deep(.green-theme) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.green-theme .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

/* Encabezado de las columnas de la tabla */
:deep(.green-theme .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-green-600 text-white font-bold text-sm py-4 px-3 border-none text-center;
}

/* Cuerpo de la tabla */
:deep(.green-theme .p-datatable-tbody > tr > td) {
    @apply py-4 px-3 align-middle border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

/* Estilo para filas pares */
:deep(.green-theme .p-datatable-tbody > tr:nth-child(even) > td) {
    @apply bg-gray-50 dark:bg-gray-700/50;
}

/* Efecto hover en las filas */
:deep(.green-theme .p-datatable-tbody > tr:hover > td) {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800;
}

/* Botones de acción (Editar y Eliminar) */
:deep(.green-theme .p-button.p-button-info) {
    @apply bg-green-600 hover:bg-green-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.green-theme .p-button.p-button-danger) {
    @apply bg-red-600 hover:bg-red-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

/* Indicadores de estado (activo/inactivo) */
:deep(.green-theme .pi-check-circle) {
    @apply text-green-600 dark:text-green-400 text-xl;
}

:deep(.green-theme .pi-times-circle) {
    @apply text-red-600 dark:text-red-400 text-xl;
}

/* Paginador */
:deep(.green-theme .p-paginator) {
    @apply bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    @apply text-green-600 border border-green-600 font-semibold rounded-xl mx-1 w-10 h-10 transition-colors;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    @apply bg-green-600 text-white;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    @apply bg-green-50 dark:bg-green-900/30 border-green-700;
}

:deep(.green-theme .p-paginator .p-dropdown) {
    @apply border-green-600 font-medium rounded-xl;
}

/* Etiquetas de información */
.contact-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700;
}

.contact-tag i {
    @apply text-indigo-600 dark:text-indigo-400;
}

.phone-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700;
}

.phone-tag i {
    @apply text-blue-600 dark:text-blue-400;
}

.email-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700 max-w-full;
}

.email-tag i {
    @apply text-purple-600 dark:text-purple-400 flex-shrink-0;
}

.website-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700 max-w-full;
}

.website-tag i {
    @apply text-orange-600 dark:text-orange-400 flex-shrink-0;
}

/* Mensaje de tabla vacía */
:deep(.green-theme .p-datatable-emptymessage) {
    @apply bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-12 font-medium rounded-xl m-6 border-2 border-dashed border-gray-300 dark:border-gray-600;
}

:deep(.green-theme .p-datatable-emptymessage .pi-box) {
    @apply text-green-600 dark:text-green-400 text-4xl mb-4;
}

/* Clases de utilidad para truncar texto */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.truncate {
    @apply overflow-hidden text-ellipsis whitespace-nowrap;
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

    :deep(.green-theme .p-datatable-thead > tr > th),
    :deep(.green-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
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
