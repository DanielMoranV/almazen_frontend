<script setup>
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { ref, watch, computed } from 'vue';
import { exportToExcel } from '@/utils/excelUtils';

const { sales, loading } = defineProps({
    sales: { type: Array, required: true },
    loading: { type: Boolean, default: false }
});

defineEmits(['edit', 'delete']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    document_number: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    customer_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    sale_date: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    status: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    document_type: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    total_amount: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

watch(
    () => sales,
    (newSales) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);

const exportSales = async () => {
    const columns = [
        { header: 'Número de Documento', key: 'document_number', width: 20 },
        { header: 'Tipo de Documento', key: 'document_type', width: 15 },
        { header: 'Cliente', key: 'customer_name', width: 25 },
        { header: 'Fecha de Venta', key: 'sale_date', width: 15 },
        { header: 'Total', key: 'total_amount', width: 15 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Notas', key: 'notes', width: 30 }
    ];

    await exportToExcel(columns, sales, 'Ventas', 'Ventas');
};

// Función para determinar si una venta se puede editar
const canEditSale = (sale) => {
    return sale.status_info?.can_edit || sale.status === 'PENDIENTE';
};

// Función para determinar si una venta se puede eliminar
const canDeleteSale = (sale) => {
    return sale.status_info?.can_delete !== false && sale.status === 'PENDIENTE';
};

// Función para formatear moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount || 0);
};

// Función para formatear fecha
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

</script>

<template>
    <DataTable
        stripedRows
        :value="sales"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['document_number', 'customer_name', 'document_type', 'status']"
        :paginator="true"
        :rows="20"
        :rowsPerPageOptions="[10, 15, 20, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ventas"
        class="sales-table green-theme p-datatable-gridlines"
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
                                <InputText 
                                    v-model="localFilters.global.value" 
                                    placeholder="Buscar por documento, cliente, tipo..." 
                                    class="search-input" 
                                    fluid 
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
                            @click="exportSales()" 
                            v-tooltip.top="'Exportar ventas a Excel'" 
                            :disabled="!sales.length" 
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
                <h3 class="empty-title">No se encontraron ventas</h3>
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
                <p class="loading-text">Cargando ventas...</p>
            </div>
        </template>
        
        <!-- Número de documento -->
        <Column field="document_number" header="N° Documento" sortable style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="document-badge">
                    {{ data.document_number || `#${data.id}` }}
                </div>
            </template>
        </Column>
        
        <!-- Tipo de documento -->
        <Column field="document_type" header="Tipo" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="document-type-tag">
                    <i class="pi pi-file"></i>
                    <span>{{ data.document_type || data.voucher_type || '-' }}</span>
                </div>
            </template>
        </Column>
        
        <!-- Cliente -->
        <Column field="customer_name" header="Cliente" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="customer-info">
                    <div class="customer-avatar">
                        {{ (data.customer_name || data.customer?.name || 'C')?.charAt(0)?.toUpperCase() }}
                    </div>
                    <div class="customer-details">
                        <span class="customer-name">{{ data.customer_name || data.customer?.name || '-' }}</span>
                        <span v-if="data.customer?.document_number" class="customer-document">
                            {{ data.customer.document_number }}
                        </span>
                    </div>
                </div>
            </template>
        </Column>
        
        <!-- Fecha de venta -->
        <Column field="sale_date" header="Fecha" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="date-container">
                    <i class="pi pi-calendar"></i>
                    <span>{{ formatDate(data.sale_date) }}</span>
                </div>
            </template>
        </Column>
        
        <!-- Total -->
        <Column field="total_amount" header="Total" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="amount-badge">
                    {{ formatCurrency(data.total_amount) }}
                </div>
            </template>
        </Column>
        
        <!-- Estado -->
        <Column field="status" header="Estado" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="flex justify-center">
                    <div 
                        :class="{
                            'status-badge': true,
                            'pending': data.status === 'PENDIENTE' || data.status_info?.is_pending,
                            'paid': data.status === 'PAGADO' || data.status_info?.is_paid,
                            'cancelled': data.status === 'ANULADO' || data.status_info?.is_cancelled
                        }"
                        :title="data.status_display || data.status"
                    >
                        <i :class="{
                            'pi pi-clock': data.status === 'PENDIENTE' || data.status_info?.is_pending,
                            'pi pi-check': data.status === 'PAGADO' || data.status_info?.is_paid,
                            'pi pi-times': data.status === 'ANULADO' || data.status_info?.is_cancelled
                        }"></i>
                        <span>{{ data.status_display || data.status || 'PENDIENTE' }}</span>
                    </div>
                </div>
            </template>
        </Column>
        
        <!-- Usuario que registró -->
        <Column field="user" header="Usuario" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="user-info" v-if="data.user">
                    <div class="user-avatar">
                        {{ data.user.name?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                    <span class="user-name">{{ data.user.name || '-' }}</span>
                </div>
                <span v-else class="text-gray-400">-</span>
            </template>
        </Column>
        
        <!-- Notas -->
        <Column field="notes" header="Notas" style="min-width: 12rem; max-width: 20rem">
            <template #body="{ data }">
                <div class="notes-text">
                    {{ data.notes || '-' }}
                </div>
            </template>
        </Column>
        
        <!-- Acciones -->
        <Column :exportable="false" header="Acciones" style="min-width: 8rem; max-width: 10rem">
            <template #body="slotProps">
                <div class="flex justify-center gap-1">
                    <Button 
                        icon="pi pi-pencil" 
                        class="p-button-rounded p-button-info" 
                        size="small" 
                        rounded 
                        text 
                        :disabled="!canEditSale(slotProps.data)"
                        v-tooltip.top="canEditSale(slotProps.data) ? 'Editar' : 'Solo se pueden editar ventas pendientes'" 
                        @click="$emit('edit', slotProps.data)" 
                    />
                    <Button 
                        icon="pi pi-trash" 
                        class="p-button-rounded p-button-danger" 
                        size="small" 
                        rounded 
                        text 
                        :disabled="!canDeleteSale(slotProps.data)"
                        v-tooltip.top="canDeleteSale(slotProps.data) ? 'Eliminar' : 'No se puede eliminar esta venta'" 
                        @click="$emit('delete', slotProps.data)" 
                    />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
/* Encabezado de la tabla mejorado */
.table-header {
    @apply relative overflow-hidden mb-0 rounded-t-2xl;
    background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%);
    padding: 1.5rem 2rem;
}

/* Fondo decorativo */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
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
    @apply text-white;
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
:deep(.green-theme) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.green-theme .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

/* Encabezado de las columnas de la tabla */
:deep(.green-theme .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-teal-600 text-white font-bold text-sm py-4 px-3 border-none text-center;
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
    @apply bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800;
}

/* Elementos de venta mejorados */
.document-badge {
    @apply font-mono text-sm px-3 py-1 rounded-xl font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 text-center;
}

.document-type-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700;
}

.document-type-tag i {
    @apply text-purple-600 dark:text-purple-400;
}

.customer-info {
    @apply flex items-center gap-3;
}

.customer-avatar {
    @apply w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0;
}

.customer-details {
    @apply flex flex-col gap-1;
}

.customer-name {
    @apply font-semibold text-gray-800 dark:text-gray-200 text-sm;
}

.customer-document {
    @apply text-xs text-gray-500 dark:text-gray-400 font-mono;
}

.user-info {
    @apply flex items-center gap-2;
}

.user-avatar {
    @apply w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0;
}

.user-name {
    @apply text-sm text-gray-700 dark:text-gray-300;
}

.date-container {
    @apply flex items-center gap-2;
}

.date-container i {
    @apply text-gray-600 dark:text-gray-400;
}

.amount-badge {
    @apply font-bold text-lg px-3 py-1 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700 text-center;
}

.status-badge {
    @apply flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold;
}

.status-badge.pending {
    @apply bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700;
}

.status-badge.paid {
    @apply bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700;
}

.status-badge.cancelled {
    @apply bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700;
}

.notes-text {
    @apply text-sm text-gray-600 dark:text-gray-400 truncate;
    max-width: 200px;
}

/* Botones de acción */
:deep(.green-theme .p-button.p-button-info) {
    @apply bg-teal-600 hover:bg-teal-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.green-theme .p-button.p-button-info:disabled) {
    @apply bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-50;
}

:deep(.green-theme .p-button.p-button-danger) {
    @apply bg-red-600 hover:bg-red-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

/* Paginador */
:deep(.green-theme .p-paginator) {
    @apply bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    @apply text-teal-600 border border-teal-600 font-semibold rounded-xl mx-1 w-10 h-10 transition-colors;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    @apply bg-teal-600 text-white;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    @apply bg-teal-50 dark:bg-teal-900/30 border-teal-700;
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

    :deep(.green-theme .p-datatable-thead > tr > th),
    :deep(.green-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
    }

    .customer-info {
        @apply gap-2;
    }

    .customer-avatar {
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