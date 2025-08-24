<script setup>
import { exportToExcel } from '@/utils/excelUtils';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import { ref, watch } from 'vue';

const props = defineProps({
    companies: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'delete', 'upload-logo']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    company_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    address: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    phone: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    email: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    website: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    description: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    is_active: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
    }
});

const localFilters = ref(initFilters());

watch(
    () => props.companies,
    (newCompanies) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);

const exportCompanies = async () => {
    const columns = [
        { header: 'Nombre', key: 'company_name', width: 25 },
        { header: 'Dirección', key: 'address', width: 25 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 20 },
        { header: 'Web', key: 'website', width: 20 },
        { header: 'Logo', key: 'logo', width: 20 },
        { header: 'Descripción', key: 'description', width: 25 },
        { header: 'Activo', key: 'is_active', width: 15 }
    ];

    await exportToExcel(columns, props.companies, 'Empresas', 'Empresas');
};

</script>

<template>
    <DataTable
        stripedRows
        :value="props.companies"
        :loading="props.loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['company_name', 'address', 'phone', 'email', 'website', 'description']"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} empresas"
        class="companies-table green-theme p-datatable-gridlines"
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
                                <InputText v-model="localFilters['global'].value" placeholder="Buscar por nombre, dirección, teléfono..." class="search-input" fluid />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button type="button" icon="pi pi-file-excel" label="Exportar" class="export-btn" @click="exportCompanies()" v-tooltip.top="'Exportar empresas a Excel'" :disabled="!props.companies.length" />
                    </div>
                </div>
            </div>
        </template>

        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-search"></i>
                </div>
                <h3 class="empty-title">No se encontraron empresas</h3>
                <p class="empty-description">Intenta ajustar los filtros o términos de búsqueda</p>
                <Button icon="pi pi-filter-slash" label="Limpiar filtros" class="p-button-outlined" @click="localFilters = initFilters()" />
            </div>
        </template>
        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando empresas...</p>
            </div>
        </template>

        <!-- Columna Principal: Logo + Información de la empresa -->
        <Column field="company_info" header="Empresa" style="min-width: 18rem; max-width: 22rem">
            <template #body="{ data }">
                <div class="company-info-cell">
                    <div class="company-logo-container">
                        <img v-if="data.logo" :src="data.logo" alt="Logo" class="company-logo" @error="$event.target.style.display = 'none'" />
                        <div v-else class="company-logo-placeholder">
                            <i class="pi pi-building"></i>
                        </div>
                    </div>
                    <div class="company-details">
                        <h4 class="company-name">{{ data.company_name }}</h4>
                        <p class="company-description" :title="data.description">
                            {{ data.description || 'Sin descripción' }}
                        </p>
                        <div class="company-status">
                            <span v-if="data.is_active" class="status-badge active">
                                <i class="pi pi-check-circle"></i> Activa
                            </span>
                            <span v-else class="status-badge inactive">
                                <i class="pi pi-times-circle"></i> Inactiva
                            </span>
                        </div>
                    </div>
                </div>
            </template>
        </Column>

        <!-- Columna de Contacto: Email + Teléfono agrupados -->
        <Column field="contact_info" header="Contacto" style="min-width: 14rem; max-width: 16rem">
            <template #body="{ data }">
                <div class="contact-info-cell">
                    <div v-if="data.email" class="contact-item">
                        <div class="contact-tag email">
                            <i class="pi pi-envelope"></i>
                            <span>{{ data.email }}</span>
                        </div>
                    </div>
                    <div v-if="data.phone" class="contact-item">
                        <div class="contact-tag phone">
                            <i class="pi pi-phone"></i>
                            <span>{{ data.phone }}</span>
                        </div>
                    </div>
                    <div v-if="data.website" class="contact-item">
                        <div class="contact-tag website">
                            <i class="pi pi-globe"></i>
                            <a :href="data.website" target="_blank" class="website-link">
                                Sitio web
                            </a>
                        </div>
                    </div>
                    <div v-if="!data.email && !data.phone && !data.website" class="no-contact">
                        <i class="pi pi-info-circle"></i>
                        <span>Sin información</span>
                    </div>
                </div>
            </template>
        </Column>

        <!-- Columna de Dirección optimizada -->
        <Column field="address" header="Dirección" sortable style="min-width: 14rem; max-width: 18rem">
            <template #body="{ data }">
                <div class="address-cell">
                    <div v-if="data.address" class="address-content" :title="data.address">
                        <i class="pi pi-map-marker address-icon"></i>
                        <span class="address-text">{{ data.address }}</span>
                    </div>
                    <div v-else class="no-address">
                        <i class="pi pi-map-marker"></i>
                        <span>Sin dirección</span>
                    </div>
                </div>
            </template>
        </Column>
        <Column :exportable="false" header="Acciones" style="min-width: 8rem; max-width: 10rem">
            <template #body="slotProps">
                <div class="flex justify-center gap-1">
                    <Button 
                        icon="pi pi-upload" 
                        class="p-button-rounded p-button-warning" 
                        size="small" 
                        rounded 
                        text 
                        v-tooltip.top="slotProps.data.logo ? 'Cambiar logo' : 'Subir logo'"
                        @click="$emit('upload-logo', slotProps.data)" 
                    />
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

/* Estilos para la nueva estructura de datos */

/* Celda de información de la empresa */
.company-info-cell {
    @apply flex items-start gap-3 py-2;
}

.company-logo-container {
    @apply flex-shrink-0;
}

.company-logo {
    @apply w-14 h-14 object-contain rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-sm;
}

.company-logo-placeholder {
    @apply w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center;
}

.company-logo-placeholder i {
    @apply text-gray-400 text-lg;
}

.company-details {
    @apply flex-1 min-w-0;
}

.company-name {
    @apply font-bold text-gray-900 dark:text-gray-100 text-base mb-1 truncate;
}

.company-description {
    @apply text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed;
}

.company-status {
    @apply flex items-center;
}

.status-badge {
    @apply inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold;
}

.status-badge.active {
    @apply bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700;
}

.status-badge.inactive {
    @apply bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700;
}

.status-badge i {
    @apply text-xs;
}

/* Celda de información de contacto */
.contact-info-cell {
    @apply flex flex-col gap-2 py-2;
}

.contact-item {
    @apply flex items-center;
}

.contact-tag {
    @apply flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium;
}

.contact-tag.email {
    @apply bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700;
}

.contact-tag.email i {
    @apply text-purple-600 dark:text-purple-400;
}

.contact-tag.phone {
    @apply bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700;
}

.contact-tag.phone i {
    @apply text-blue-600 dark:text-blue-400;
}

.contact-tag.website {
    @apply bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700;
}

.contact-tag.website i {
    @apply text-orange-600 dark:text-orange-400;
}

.website-link {
    @apply hover:underline font-medium;
}

.no-contact {
    @apply flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600;
}

/* Celda de dirección */
.address-cell {
    @apply py-2;
}

.address-content {
    @apply flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600;
}

.address-icon {
    @apply text-gray-500 dark:text-gray-400 text-sm mt-0.5 flex-shrink-0;
}

.address-text {
    @apply text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed;
}

.no-address {
    @apply flex items-center gap-2 p-2.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600;
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
        @apply text-xs py-2 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
    }

    /* Ajustes para la nueva estructura en mobile */
    .company-info-cell {
        @apply flex-col items-start gap-2;
    }

    .company-logo-container {
        @apply self-center;
    }

    .company-logo,
    .company-logo-placeholder {
        @apply w-10 h-10;
    }

    .company-name {
        @apply text-sm;
    }

    .company-description {
        @apply text-xs;
    }

    .contact-info-cell {
        @apply gap-1;
    }

    .contact-tag {
        @apply px-2 py-1 text-xs;
    }

    .address-content,
    .no-address {
        @apply p-2 text-xs;
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

/* Botón de subir logo */
:deep(.green-theme .p-button.p-button-warning) {
    @apply bg-yellow-600 hover:bg-yellow-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}
</style>
