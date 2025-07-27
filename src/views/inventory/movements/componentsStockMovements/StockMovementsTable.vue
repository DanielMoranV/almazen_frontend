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
    movements: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['view-details', 'clear-filters']);

// Inicializar filtros
const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    product_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    product_sku: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    type: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }]
    },
    warehouse_name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    },
    reason: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }]
    }
});

const localFilters = ref(initFilters());

// Limpiar filtros cuando cambian los datos
watch(
    () => props.movements,
    () => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);

// Función para manejar click en fila
const handleRowClick = (event) => {
    emit('view-details', event.data);
};

// Función para limpiar filtros
const clearFilters = () => {
    localFilters.value = initFilters();
    emit('clear-filters');
};

// Función para exportar a Excel
const exportMovements = async () => {
    const columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: 'Fecha', key: 'created_at', width: 15 },
        { header: 'Tipo', key: 'type_label', width: 12 },
        { header: 'Producto', key: 'product_name', width: 30 },
        { header: 'SKU', key: 'product_sku', width: 15 },
        { header: 'Almacén', key: 'warehouse_name', width: 20 },
        { header: 'Cantidad', key: 'quantity', width: 12 },
        { header: 'Lote', key: 'batch_code', width: 15 },
        { header: 'Razón', key: 'reason', width: 25 },
        { header: 'Documento', key: 'reference_document', width: 15 },
        { header: 'Usuario', key: 'user_name', width: 15 }
    ];

    const formattedMovements = props.movements.map((item) => ({
        ...item,
        id: item.id || '-',
        created_at: formatDate(item.created_at) + ' ' + formatTime(item.created_at),
        type_label: getTypeLabel(item.movement_type || item.type),
        quantity: formatQuantity(item.movement_type || item.type, item.quantity),
        batch_code: item.batch_code || 'Sin lote',
        reason: item.reason || '-',
        reference_document: item.reference_document || '-',
        user_name: item.user_name || '-'
    }));

    await exportToExcel(columns, formattedMovements, 'Movimientos_Stock', 'Movimientos_Stock');
};

// Funciones de formato y utilidad
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
};

const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '';
    }
};

const getTypeClass = (type) => {
    const classes = {
        ENTRADA: 'type-entry',
        SALIDA: 'type-exit',
        AJUSTE: 'type-adjustment',
        TRANSFERENCIA: 'type-transfer'
    };
    return classes[type] || 'type-default';
};

const getTypeIcon = (type) => {
    const icons = {
        ENTRADA: 'pi pi-arrow-down',
        SALIDA: 'pi pi-arrow-up',
        AJUSTE: 'pi pi-cog',
        TRANSFERENCIA: 'pi pi-arrow-right-arrow-left'
    };
    return icons[type] || 'pi pi-circle';
};

const getTypeLabel = (type) => {
    const labels = {
        ENTRADA: 'Entrada',
        SALIDA: 'Salida',
        AJUSTE: 'Ajuste',
        TRANSFERENCIA: 'Transferencia'
    };
    return labels[type] || type;
};

const getQuantityClass = (type, quantity) => {
    if (type === 'ENTRADA') return 'quantity-positive';
    if (type === 'SALIDA') return 'quantity-negative';
    return 'quantity-neutral';
};

const formatQuantity = (type, quantity) => {
    if (!quantity) return '0';
    const sign = type === 'SALIDA' ? '-' : '+';
    return `${sign}${Math.abs(quantity)}`;
};
</script>

<template>
    <DataTable
        stripedRows
        :value="movements"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['product_name', 'product_sku', 'product_barcode', 'reason', 'reference_document', 'warehouse_name']"
        :paginator="true"
        :rows="25"
        :rowsPerPageOptions="[10, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} movimientos"
        class="movements-table green-theme p-datatable-gridlines"
        @row-click="handleRowClick"
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
                                <InputText v-model="localFilters['global'].value" placeholder="Buscar por producto, SKU, razón, documento..." class="search-input" fluid />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button type="button" icon="pi pi-file-excel" label="Exportar" class="export-btn" @click="exportMovements()" v-tooltip.top="'Exportar movimientos a Excel'" :disabled="!movements.length" />
                    </div>
                </div>
            </div>
        </template>

        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-history"></i>
                </div>
                <h3 class="empty-title">No hay movimientos disponibles</h3>
                <p class="empty-description">No se encontraron movimientos que coincidan con los filtros aplicados.</p>
                <Button icon="pi pi-filter-slash" label="Limpiar filtros" class="p-button-outlined" @click="clearFilters()" />
            </div>
        </template>

        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando movimientos...</p>
            </div>
        </template>

        <!-- ID Column -->
        <Column field="id" header="ID" sortable style="min-width: 4rem; max-width: 6rem">
            <template #body="{ data }">
                <div class="id-cell">
                    <span class="id-value">#{{ data.id }}</span>
                </div>
            </template>
        </Column>

        <!-- Fecha Column -->
        <Column field="created_at" header="Fecha" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="date-cell">
                    <div class="date-value">{{ formatDate(data.created_at) }}</div>
                    <div class="time-value">{{ formatTime(data.created_at) }}</div>
                </div>
            </template>
        </Column>

        <!-- Tipo Column -->
        <Column field="movement_type" header="Tipo" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="text-center">
                    <span class="type-badge" :class="getTypeClass(data.movement_type)">
                        <i :class="getTypeIcon(data.movement_type)"></i>
                        {{ getTypeLabel(data.movement_type) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Producto Column -->
        <Column field="product_name" header="Producto" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="product-cell">
                    <div class="product-name">{{ data.product_name }}</div>
                    <div v-if="data.product_sku" class="product-sku">SKU: {{ data.product_sku }}</div>
                    <div v-if="data.product_barcode" class="product-barcode">
                        {{ data.product_barcode }}
                    </div>
                </div>
            </template>
        </Column>

        <!-- Almacén Column -->
        <Column field="warehouse_name" header="Almacén" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="warehouse-cell">
                    <span class="warehouse-name">{{ data.warehouse_name || '-' }}</span>
                </div>
            </template>
        </Column>

        <!-- Cantidad Column -->
        <Column field="quantity" header="Cantidad" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="text-center">
                    <span class="quantity-amount" :class="getQuantityClass(data.type, data.quantity)">
                        {{ formatQuantity(data.type, data.quantity) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Lote Column -->
        <Column field="batch_code" header="Lote" style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="batch-cell">
                    <span v-if="data.batch_code" class="batch-code">{{ data.batch_code }}</span>
                    <span v-else class="no-batch">Sin lote</span>
                </div>
            </template>
        </Column>

        <!-- Razón Column -->
        <Column field="reason" header="Razón" style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="reason-cell">
                    <span class="reason-text">{{ data.reason || '-' }}</span>
                </div>
            </template>
        </Column>

        <!-- Documento Column -->
        <Column field="reference_document" header="Documento" style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="document-cell">
                    <span v-if="data.reference_document" class="document-text">{{ data.reference_document }}</span>
                    <span v-else class="no-document">-</span>
                </div>
            </template>
        </Column>

        <!-- Usuario Column -->
        <Column field="user_name" header="Usuario" style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="user-cell">
                    <span class="user-name">{{ data.user_name || '-' }}</span>
                </div>
            </template>
        </Column>

        <!-- Acciones Column -->
        <Column :exportable="false" header="Acciones" style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="actions-cell">
                    <Button icon="pi pi-eye" class="p-button-rounded p-button-info" size="small" rounded text v-tooltip.top="'Ver detalles'" @click="$emit('view-details', data)" />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
/* Encabezado de la tabla */
.table-header {
    @apply relative overflow-hidden mb-0 rounded-t-2xl;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    padding: 1.5rem 2rem;
}

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

.search-section {
    @apply flex-1 max-w-md;
}

.search-input {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/70 rounded-xl px-4 py-3 font-medium transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
    @apply bg-white/30 border-white/50 ring-2 ring-white/20;
    transform: translateY(-1px);
}

.export-btn {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-semibold px-4 py-3 rounded-xl transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.export-btn:hover:not(:disabled) {
    @apply bg-white/30 border-white/40;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Estados de tabla vacía y carga */
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

/* Tema de la tabla */
:deep(.movements-table) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.movements-table .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

:deep(.movements-table .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-green-600 text-white font-bold text-sm py-4 px-3 border-none text-center;
}

:deep(.movements-table .p-datatable-tbody > tr > td) {
    @apply py-4 px-3 align-middle border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

:deep(.movements-table .p-datatable-tbody > tr:nth-child(even) > td) {
    @apply bg-gray-50 dark:bg-gray-700/50;
}

:deep(.movements-table .p-datatable-tbody > tr:hover > td) {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800;
}

/* Celdas específicas */
.id-cell {
    @apply text-center;
}

.id-value {
    @apply font-mono text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded;
}

.date-cell {
    @apply flex flex-col gap-1;
}

.date-value {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.time-value {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.type-badge {
    @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold;
}

.type-entry {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.type-exit {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.type-adjustment {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.type-transfer {
    @apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}

.product-cell {
    @apply max-w-xs;
}

.product-name {
    @apply font-medium text-gray-900 dark:text-gray-100 truncate;
}

.product-sku {
    @apply text-xs text-blue-600 dark:text-blue-400 font-mono;
}

.product-barcode {
    @apply text-xs text-gray-500 dark:text-gray-400 font-mono;
}

.warehouse-name {
    @apply font-medium text-gray-700 dark:text-gray-300;
}

.quantity-amount {
    @apply font-bold text-lg;
}

.quantity-positive {
    @apply text-green-600 dark:text-green-400;
}

.quantity-negative {
    @apply text-red-600 dark:text-red-400;
}

.quantity-neutral {
    @apply text-blue-600 dark:text-blue-400;
}

.batch-code {
    @apply font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded;
}

.no-batch {
    @apply text-gray-400 dark:text-gray-500 italic;
}

.reason-text {
    @apply text-gray-700 dark:text-gray-300;
}

.document-text {
    @apply font-mono text-sm;
}

.no-document {
    @apply text-gray-400 dark:text-gray-500;
}

.user-name {
    @apply font-medium text-gray-700 dark:text-gray-300;
}

.actions-cell {
    @apply flex justify-center;
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

/* Responsive */
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

    .export-btn {
        @apply w-full justify-center;
    }

    :deep(.movements-table .p-datatable-thead > tr > th),
    :deep(.movements-table .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }
}
</style>
