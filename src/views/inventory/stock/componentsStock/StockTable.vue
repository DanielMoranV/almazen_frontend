<script setup>
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { exportInventoryToExcel } from '@/utils/excelUtils';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import { ref, watch } from 'vue';

const props = defineProps({
    stockItems: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['view-details', 'edit-stock', 'bulk-edit', 'clear-filters']);

// Inicializar filtros
const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    sku: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    barcode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    total_stock: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    avg_unit_cost: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    avg_sale_price: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

// Limpiar filtros cuando cambian los datos
watch(
    () => props.stockItems,
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

// Función para exportar a Excel con múltiples pestañas
const exportStock = async () => {
    // Datos del resumen (pestaña 1) - formato actual
    const summaryData = props.stockItems.map((item) => ({
        sku: item.sku || '-',
        name: item.name || '-',
        total_stock: item.total_stock || 0,
        avg_unit_cost: item.avg_unit_cost || 0,
        total_cost_value: item.total_cost_value || 0,
        avg_sale_price: item.avg_sale_price || 0,
        total_sale_value: item.total_sale_value || 0,
        requires_batches: item.requires_batches || false
    }));

    // Datos del detalle (pestaña 2) - desglosado por almacén y lotes
    const detailData = [];

    props.stockItems.forEach((product) => {
        if (product.stock_by_warehouse && product.stock_by_warehouse.length > 0) {
            product.stock_by_warehouse.forEach((warehouse) => {
                // Si el producto requiere lotes y tiene lotes
                if (product.requires_batches && warehouse.batches && warehouse.batches.length > 0) {
                    warehouse.batches.forEach((batch) => {
                        detailData.push({
                            sku: product.sku || '-',
                            product_name: product.name || '-',
                            warehouse_name: warehouse.warehouse_name || '-',
                            stock: batch.stock || 0,
                            unit_cost: batch.unit_cost || warehouse.avg_unit_cost || product.avg_unit_cost || 0,
                            total_cost: (batch.stock || 0) * (batch.unit_cost || warehouse.avg_unit_cost || product.avg_unit_cost || 0),
                            sale_price: batch.sale_price || warehouse.avg_sale_price || product.avg_sale_price || 0,
                            total_value: (batch.stock || 0) * (batch.sale_price || warehouse.avg_sale_price || product.avg_sale_price || 0),
                            min_stock: warehouse.min_stock || 0,
                            max_stock: warehouse.max_stock || 0,
                            batch_code: batch.batch_code || '-',
                            expiration_date: batch.expiration_date || null,
                            manufacturing_date: batch.manufacturing_date || null,
                            status: getStockStatus(batch.stock || 0, warehouse.min_stock || 10)
                        });
                    });
                } else {
                    // Si no requiere lotes o no tiene lotes, crear entrada por almacén
                    detailData.push({
                        sku: product.sku || '-',
                        product_name: product.name || '-',
                        warehouse_name: warehouse.warehouse_name || '-',
                        stock: warehouse.total_stock || 0,
                        unit_cost: warehouse.avg_unit_cost || product.avg_unit_cost || 0,
                        total_cost: (warehouse.total_stock || 0) * (warehouse.avg_unit_cost || product.avg_unit_cost || 0),
                        sale_price: warehouse.avg_sale_price || product.avg_sale_price || 0,
                        total_value: (warehouse.total_stock || 0) * (warehouse.avg_sale_price || product.avg_sale_price || 0),
                        min_stock: warehouse.min_stock || 0,
                        max_stock: warehouse.max_stock || 0,
                        batch_code: product.requires_batches ? 'Sin lotes' : 'No requiere',
                        expiration_date: null,
                        manufacturing_date: null,
                        status: getStockStatus(warehouse.total_stock || 0, warehouse.min_stock || 10)
                    });
                }
            });
        } else {
            // Si no tiene información de almacenes, crear entrada básica
            detailData.push({
                sku: product.sku || '-',
                product_name: product.name || '-',
                warehouse_name: 'Sin almacén definido',
                stock: product.total_stock || 0,
                unit_cost: product.avg_unit_cost || 0,
                total_cost: (product.total_stock || 0) * (product.avg_unit_cost || 0),
                sale_price: product.avg_sale_price || 0,
                total_value: (product.total_stock || 0) * (product.avg_sale_price || 0),
                min_stock: 0,
                max_stock: 0,
                batch_code: product.requires_batches ? 'Sin lotes' : 'No requiere',
                expiration_date: null,
                manufacturing_date: null,
                status: getStockStatus(product.total_stock || 0, 10)
            });
        }
    });

    // Exportar con ambas pestañas
    await exportInventoryToExcel(summaryData, detailData, 'Inventario_Stock');
};

// Función auxiliar para determinar el estado del stock
const getStockStatus = (stock, minStock = 10) => {
    if (stock === 0) return 'Agotado';
    if (stock <= minStock) return 'Stock bajo';
    return 'En stock';
};

// Función para formatear moneda
const formatCurrency = (value) => {
    if (!value || isNaN(value) || value === null || value === undefined) return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '-';
    return `S/ ${numValue.toFixed(2)}`;
};

// Métodos para clases y etiquetas
const getStockAmountClass = (totalStock) => {
    if (totalStock === 0) return 'stock-empty';
    if (totalStock <= 10) return 'stock-low';
    return 'stock-normal';
};

const getStatusClass = (totalStock) => {
    if (totalStock === 0) return 'status-empty';
    if (totalStock <= 10) return 'status-low';
    return 'status-normal';
};

const getStatusLabel = (totalStock) => {
    if (totalStock === 0) return 'Agotado';
    if (totalStock <= 10) return 'Stock bajo';
    return 'En stock';
};

// Métodos para manejo de lotes según la nueva estructura de datos
const hasAnyBatches = (item) => {
    if (!item.stock_by_warehouse) return false;
    return item.stock_by_warehouse.some((warehouse) => warehouse.batches && warehouse.batches.length > 0);
};

const getTotalBatches = (item) => {
    if (!item.stock_by_warehouse) return 0;
    return item.stock_by_warehouse.reduce((total, warehouse) => {
        return total + (warehouse.batches ? warehouse.batches.length : 0);
    }, 0);
};

const getFirstBatches = (item, limit = 2) => {
    if (!item.stock_by_warehouse) return [];

    const allBatches = [];
    item.stock_by_warehouse.forEach((warehouse) => {
        if (warehouse.batches) {
            warehouse.batches.forEach((batch) => {
                allBatches.push({
                    ...batch,
                    warehouse_name: warehouse.warehouse_name
                });
            });
        }
    });

    return allBatches.slice(0, limit);
};

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
</script>

<template>
    <DataTable
        stripedRows
        :value="stockItems"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['name', 'sku', 'barcode']"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos en stock"
        class="stock-table green-theme p-datatable-gridlines"
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
                                <InputText v-model="localFilters['global'].value" placeholder="Buscar por nombre, SKU, código de barras..." class="search-input" fluid />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button type="button" icon="pi pi-file-excel" label="Exportar" class="export-btn" @click="exportStock()" v-tooltip.top="'Exportar inventario a Excel'" :disabled="!stockItems.length" />
                    </div>
                </div>
            </div>
        </template>

        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-inbox"></i>
                </div>
                <h3 class="empty-title">No hay productos disponibles</h3>
                <p class="empty-description">No se encontraron productos que coincidan con los filtros aplicados.</p>
                <Button icon="pi pi-filter-slash" label="Limpiar filtros" class="p-button-outlined" @click="clearFilters()" />
            </div>
        </template>

        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando inventario...</p>
            </div>
        </template>

        <!-- SKU Column -->
        <Column field="sku" header="SKU" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="sku-cell">
                    <div class="sku-badge">{{ data.sku || '-' }}</div>
                    <div v-if="data.barcode" class="barcode">{{ data.barcode }}</div>
                </div>
            </template>
        </Column>

        <!-- Producto Column -->
        <Column field="name" header="Producto" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="product-cell">
                    <span class="product-name">{{ data.name }}</span>
                </div>
            </template>
        </Column>

        <!-- Almacenes Column -->
        <Column header="Almacenes" style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="warehouses-cell">
                    <div v-if="data.stock_by_warehouse?.length" class="warehouse-list">
                        <div v-for="warehouse in data.stock_by_warehouse" :key="warehouse.warehouse_id" class="warehouse-item">
                            <span class="warehouse-name">{{ warehouse.warehouse_name }}</span>
                            <span class="warehouse-stock">{{ warehouse.total_stock || 0 }}</span>
                        </div>
                    </div>
                    <span v-else class="no-data">-</span>
                </div>
            </template>
        </Column>

        <!-- Stock Total Column -->
        <Column field="total_stock" header="Stock Total" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="text-center">
                    <span class="stock-amount" :class="getStockAmountClass(data.total_stock)">
                        {{ data.total_stock || 0 }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Costo Promedio Column -->
        <Column field="avg_unit_cost" header="Costo Promedio" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="text-right">
                    <span class="cost-amount">
                        {{ formatCurrency(data.avg_unit_cost) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Costo Total Column -->
        <Column field="total_cost_value" header="Costo Total" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="text-right">
                    <span class="total-cost-amount">
                        {{ formatCurrency(data.total_cost_value) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Precio Promedio Venta Column -->
        <Column field="avg_sale_price" header="Precio Promedio Venta" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="text-right">
                    <span class="price-amount">
                        {{ formatCurrency(data.avg_sale_price) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Valor Total Venta Column -->
        <Column field="total_sale_value" header="Valor Total Venta" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="text-right">
                    <span class="total-sale-amount">
                        {{ formatCurrency(data.total_sale_value) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Lotes Column -->
        <Column header="Lotes" style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="batches-cell">
                    <div v-if="data.requires_batches && hasAnyBatches(data)" class="batches-info">
                        <div class="batch-count">
                            <i class="pi pi-tags"></i>
                            <span>{{ getTotalBatches(data) }} lote(s)</span>
                        </div>
                        <div class="batch-preview">
                            <div v-for="batch in getFirstBatches(data)" :key="batch.stock_id" class="batch-item">
                                <span class="batch-code">{{ batch.batch_code }}</span>
                                <span class="batch-stock">{{ batch.stock || 0 }}</span>
                                <span v-if="batch.expiration_date" class="batch-expiry">
                                    {{ formatDate(batch.expiration_date) }}
                                </span>
                            </div>
                            <span v-if="getTotalBatches(data) > 2" class="more-batches"> +{{ getTotalBatches(data) - 2 }} más </span>
                        </div>
                    </div>
                    <span v-else-if="data.requires_batches" class="no-data">Sin lotes</span>
                    <span v-else class="no-batches">No requiere lotes</span>
                </div>
            </template>
        </Column>

        <!-- Estado Column -->
        <Column field="total_stock" header="Estado" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="text-center">
                    <span class="status-badge" :class="getStatusClass(data.total_stock)">
                        {{ getStatusLabel(data.total_stock) }}
                    </span>
                </div>
            </template>
        </Column>

        <!-- Acciones Column -->
        <Column :exportable="false" header="Acciones" style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="actions-cell">
                    <Button icon="pi pi-eye" class="p-button-rounded p-button-info" size="small" rounded text v-tooltip.top="'Ver detalles'" @click="$emit('view-details', data)" />
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success" size="small" rounded text v-tooltip.top="'Editar stock'" @click="$emit('edit-stock', data)" />
                    <Button icon="pi pi-cog" class="p-button-rounded p-button-warning" size="small" rounded text v-tooltip.top="'Edición masiva'" @click="$emit('bulk-edit', data)" />
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

/* Botones de acción */
:deep(.green-theme .p-button.p-button-info) {
    @apply bg-blue-600 hover:bg-blue-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.green-theme .p-button.p-button-success) {
    @apply bg-green-600 hover:bg-green-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.green-theme .p-button.p-button-warning) {
    @apply bg-orange-600 hover:bg-orange-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
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

/* Insignia de SKU */
.sku-badge {
    @apply font-mono text-sm px-3 py-1 rounded-xl font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 text-center;
}

/* Mensaje de tabla vacía */
:deep(.green-theme .p-datatable-emptymessage) {
    @apply bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-12 font-medium rounded-xl m-6 border-2 border-dashed border-gray-300 dark:border-gray-600;
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

/* SKU cell */
.sku-cell {
    @apply flex flex-col gap-1;
}

.sku-code {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.barcode {
    @apply text-xs text-gray-500 dark:text-gray-400 font-mono;
}

/* Product cell */
.product-cell {
    @apply max-w-xs;
}

.product-name {
    @apply font-medium text-gray-900 dark:text-gray-100 truncate;
}

/* Warehouses cell */
.warehouses-cell {
    @apply max-w-xs;
}

.warehouse-list {
    @apply space-y-1;
}

.warehouse-item {
    @apply flex justify-between items-center text-sm;
}

.warehouse-name {
    @apply text-gray-600 dark:text-gray-400 truncate;
}

.warehouse-stock {
    @apply font-semibold text-blue-600 dark:text-blue-400 ml-2;
}

/* Stock cell */
.stock-cell {
    @apply text-right;
}

.stock-amount {
    @apply font-bold text-lg;
}

.stock-amount.stock-normal {
    @apply text-green-600 dark:text-green-400;
}

.stock-amount.stock-low {
    @apply text-yellow-600 dark:text-yellow-400;
}

.stock-amount.stock-empty {
    @apply text-red-600 dark:text-red-400;
}

/* Cost cell */
.cost-cell {
    @apply text-right;
}

.cost-amount {
    @apply font-medium text-gray-700 dark:text-gray-300;
}

/* Total cost cell */
.total-cost-cell {
    @apply text-right;
}

.total-cost-amount {
    @apply font-semibold text-green-700 dark:text-green-400;
}

/* Price cell */
.price-cell {
    @apply text-right;
}

.price-amount {
    @apply font-medium text-blue-700 dark:text-blue-400;
}

/* Total sale cell */
.total-sale-cell {
    @apply text-right;
}

.total-sale-amount {
    @apply font-semibold text-purple-700 dark:text-purple-400;
}

/* Max stock cell */
.max-stock-cell {
    @apply text-right;
}

.max-stock-amount {
    @apply font-medium text-blue-600 dark:text-blue-400;
}

/* Min stock cell */
.min-stock-cell {
    @apply text-right;
}

.min-stock-amount {
    @apply font-medium text-orange-600 dark:text-orange-400;
}

/* Batches cell */
.batches-cell {
    @apply max-w-48;
}

.batches-info {
    @apply space-y-2;
}

.batch-count {
    @apply flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400;
}

.batch-preview {
    @apply space-y-1;
}

.batch-item {
    @apply flex justify-between items-center text-xs;
}

.batch-code {
    @apply text-gray-600 dark:text-gray-400 font-mono;
}

.batch-stock {
    @apply font-semibold text-purple-600 dark:text-purple-400;
}

.more-batches {
    @apply text-xs text-gray-500 dark:text-gray-400 italic;
}

/* Status badges */
.status-badge {
    @apply px-2 py-1 text-xs font-semibold rounded-full;
}

.status-badge.status-normal {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.status-badge.status-low {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.status-badge.status-empty {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

/* Actions cell */
.actions-cell {
    @apply flex justify-center gap-2;
}

.action-btn {
    @apply w-8 h-8 p-0 transition-all duration-200;
}

.view-btn:hover {
    @apply text-blue-600 dark:text-blue-400;
}

.edit-btn:hover {
    @apply text-purple-600 dark:text-purple-400;
}

.bulk-btn:hover {
    @apply text-orange-600 dark:text-orange-400;
}

/* No data placeholder */
.no-data {
    @apply text-gray-400 dark:text-gray-500 italic;
}

/* Responsive */
@media (max-width: 768px) {
    .table-header,
    .table-cell {
        @apply px-3 py-3;
    }

    .stock-amount {
        @apply text-base;
    }

    .warehouse-item,
    .batch-item {
        @apply text-xs;
    }

    .empty-content {
        @apply px-4 py-8;
    }

    .empty-title {
        @apply text-2xl;
    }

    .empty-description {
        @apply text-base;
    }
}

@media (max-width: 480px) {
    .table-header,
    .table-cell {
        @apply px-2 py-2;
    }

    .table-header {
        @apply text-xs;
    }

    .stock-amount {
        @apply text-sm;
    }

    .action-btn {
        @apply w-6 h-6;
    }

    .status-badge {
        @apply px-1 py-0.5 text-xs;
    }

    /* Hide less important columns on mobile */
    .table-row td:nth-child(3),
    .table-row td:nth-child(5),
    .table-row td:nth-child(6),
    .table-row td:nth-child(7),
    .table-row td:nth-child(8),
    .table-row td:nth-child(9) {
        @apply hidden;
    }

    thead tr th:nth-child(3),
    thead tr th:nth-child(5),
    thead tr th:nth-child(6),
    thead tr th:nth-child(7),
    thead tr th:nth-child(8),
    thead tr th:nth-child(9) {
        @apply hidden;
    }
}
</style>
