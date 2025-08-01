<script setup>
import { computed } from 'vue';

const props = defineProps({
    adjustments: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['viewDetails', 'clearFilters']);

// Formatear fecha
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Obtener clase CSS para el tipo de ajuste
const getTypeClass = (type) => {
    switch (type) {
        case 'POSITIVO':
            return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700';
        case 'NEGATIVO':
            return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
    }
};

// Obtener icono para el tipo de ajuste
const getTypeIcon = (type) => {
    switch (type) {
        case 'POSITIVO':
            return 'pi-plus-circle';
        case 'NEGATIVO':
            return 'pi-minus-circle';
        default:
            return 'pi-sliders-h';
    }
};

// Formatear cantidad con signo y color
const formatQuantity = (quantity, type) => {
    const num = parseFloat(quantity || 0);
    const sign = type === 'POSITIVO' ? '+' : '-';
    return `${sign}${Math.abs(num).toLocaleString()}`;
};

// Obtener clase CSS para la cantidad
const getQuantityClass = (type) => {
    switch (type) {
        case 'POSITIVO':
            return 'text-green-600 dark:text-green-400 font-semibold';
        case 'NEGATIVO':
            return 'text-red-600 dark:text-red-400 font-semibold';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
};

// Computed para mostrar mensaje cuando no hay datos
const hasAdjustments = computed(() => props.adjustments && props.adjustments.length > 0);
</script>

<template>
    <div class="table-container">
        <!-- Loading state -->
        <div v-if="loading" class="loading-container">
            <ProgressSpinner style="width: 50px; height: 50px" stroke-width="4" />
            <span class="loading-text">Cargando ajustes...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="!hasAdjustments" class="empty-state">
            <div class="empty-icon">
                <i class="pi pi-sliders-h"></i>
            </div>
            <h6 class="empty-title">No hay ajustes de stock</h6>
            <p class="empty-description">No se encontraron ajustes que coincidan con los filtros aplicados.</p>
            <Button label="Limpiar Filtros" icon="pi pi-filter-slash" class="clear-filters-btn"
                @click="emit('clearFilters')" />
        </div>

        <!-- Table with data -->
        <div v-else class="table-wrapper">
            <DataTable :value="adjustments" :loading="loading" responsive-layout="scroll" :paginator="true" :rows="20"
                paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rows-per-page-options="[10, 20, 50]"
                current-page-report-template="Mostrando {first} a {last} de {totalRecords} ajustes"
                class="enhanced-datatable" striped-rows show-gridlines>
                <!-- Producto -->
                <Column field="product_name" header="Producto" :sortable="true" style="min-width: 200px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-box mr-2"></i>
                            Producto
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="product-cell">
                            <div class="product-name">{{ data.product_name || 'N/A' }}</div>
                            <div class="product-sku">{{ data.product_sku || 'Sin SKU' }}</div>
                        </div>
                    </template>
                </Column>

                <!-- Almacén -->
                <Column field="warehouse_name" header="Almacén" :sortable="true" style="min-width: 150px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-building mr-2"></i>
                            Almacén
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="warehouse-cell">
                            <i class="pi pi-building mr-2"></i>
                            <span>{{ data.warehouse_name || 'N/A' }}</span>
                        </div>
                    </template>
                </Column>

                <!-- Tipo de Ajuste -->
                <Column field="adjustment_type" header="Tipo" :sortable="true" style="min-width: 120px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-tag mr-2"></i>
                            Tipo
                        </div>
                    </template>
                    <template #body="{ data }">
                        <Tag :value="data.adjustment_type" :class="getTypeClass(data.adjustment_type)" class="type-tag">
                            <i :class="`pi ${getTypeIcon(data.adjustment_type)} mr-1`"></i>
                            {{ data.adjustment_type }}
                        </Tag>
                    </template>
                </Column>

                <!-- Cantidad -->
                <Column field="quantity" header="Cantidad" :sortable="true" style="min-width: 120px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-chart-bar mr-2"></i>
                            Cantidad
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="quantity-cell" :class="getQuantityClass(data.adjustment_type)">
                            <i :class="`pi ${getTypeIcon(data.adjustment_type)} mr-1`"></i>
                            {{ formatQuantity(data.quantity, data.adjustment_type) }}
                        </div>
                    </template>
                </Column>

                <!-- Razón -->
                <Column field="reason" header="Razón" :sortable="true" style="min-width: 200px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-info-circle mr-2"></i>
                            Razón
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="reason-cell" :title="data.reason || 'Sin especificar'">
                            {{ data.reason || 'Sin especificar' }}
                        </div>
                    </template>
                </Column>

                <!-- Documento de Referencia -->
                <Column field="reference_document" header="Referencia" :sortable="true" style="min-width: 120px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-file mr-2"></i>
                            Referencia
                        </div>
                    </template>
                    <template #body="{ data }">
                        <span v-if="data.reference_document" class="reference-badge">
                            {{ data.reference_document }}
                        </span>
                        <span v-else class="no-reference">-</span>
                    </template>
                </Column>

                <!-- Usuario -->
                <Column field="user_name" header="Usuario" :sortable="true" style="min-width: 120px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-user mr-2"></i>
                            Usuario
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="user-cell">
                            <i class="pi pi-user mr-2"></i>
                            <span>{{ data.user_name || 'N/A' }}</span>
                        </div>
                    </template>
                </Column>

                <!-- Fecha -->
                <Column field="created_at" header="Fecha" :sortable="true" style="min-width: 140px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-calendar mr-2"></i>
                            Fecha
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="date-cell">
                            {{ formatDate(data.created_at) }}
                        </div>
                    </template>
                </Column>

                <!-- Acciones -->
                <Column header="Acciones" style="min-width: 100px">
                    <template #header>
                        <div class="column-header">
                            <i class="pi pi-cog mr-2"></i>
                            Acciones
                        </div>
                    </template>
                    <template #body="{ data }">
                        <div class="actions-cell">
                            <Button icon="pi pi-eye" class="action-btn" @click="emit('viewDetails', data)"
                                v-tooltip.bottom="'Ver detalles'" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<style scoped>
.table-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden;
}

/* Loading state */
.loading-container {
    @apply flex flex-col items-center justify-center p-12;
}

.loading-text {
    @apply text-lg text-gray-600 dark:text-gray-400 mt-4;
}

/* Empty state */
.empty-state {
    @apply text-center p-12;
}

.empty-icon {
    @apply mb-6;
}

.empty-icon i {
    @apply text-6xl text-gray-400 dark:text-gray-600;
}

.empty-title {
    @apply text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3;
}

.empty-description {
    @apply text-gray-500 dark:text-gray-400 mb-6;
}

.clear-filters-btn {
    @apply bg-blue-500 hover:bg-blue-600 border-blue-500;
}

/* Table wrapper */
.table-wrapper {
    @apply overflow-x-auto;
}

/* Enhanced datatable styles */
:deep(.enhanced-datatable) {
    @apply border-0;
}

:deep(.enhanced-datatable .p-datatable-header) {
    @apply bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600;
}

:deep(.enhanced-datatable .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 font-semibold;
    padding: 1rem 0.75rem;
}

:deep(.enhanced-datatable .p-datatable-tbody > tr) {
    @apply hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200;
}

:deep(.enhanced-datatable .p-datatable-tbody > tr > td) {
    @apply border-b border-gray-100 dark:border-gray-600;
    padding: 1rem 0.75rem;
}

/* Column headers */
.column-header {
    @apply flex items-center text-gray-700 dark:text-gray-300 font-semibold;
}

/* Cell styles */
.product-cell {
    @apply flex flex-col;
}

.product-name {
    @apply font-medium text-gray-900 dark:text-white;
}

.product-sku {
    @apply text-sm text-gray-500 dark:text-gray-400;
}

.warehouse-cell {
    @apply flex items-center text-gray-700 dark:text-gray-300;
}

.warehouse-cell i {
    @apply text-gray-500 dark:text-gray-400;
}

.type-tag {
    @apply text-xs font-medium px-2 py-1 border;
}

.quantity-cell {
    @apply flex items-center justify-end font-semibold;
}

.quantity-cell i {
    @apply text-sm;
}

.reason-cell {
    @apply max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-gray-700 dark:text-gray-300;
}

.reference-badge {
    @apply text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded font-medium;
}

.no-reference {
    @apply text-gray-400 dark:text-gray-500;
}

.user-cell {
    @apply flex items-center text-gray-700 dark:text-gray-300;
}

.user-cell i {
    @apply text-gray-500 dark:text-gray-400;
}

.date-cell {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.actions-cell {
    @apply flex justify-center;
}

.action-btn {
    @apply rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 transition-colors;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    :deep(.enhanced-datatable .p-datatable-tbody > tr > td) {
        padding: 0.75rem 0.5rem;
    }

    .column-header {
        @apply text-sm;
    }

    .product-name,
    .warehouse-cell,
    .user-cell {
        @apply text-sm;
    }

    .quantity-cell {
        @apply text-sm;
    }
}

/* Hover effects */
:deep(.enhanced-datatable .p-datatable-tbody > tr:hover) {
    @apply bg-blue-50 dark:bg-blue-900/10;
}

/* Striped rows */
:deep(.enhanced-datatable .p-datatable-tbody > tr:nth-child(even)) {
    @apply bg-gray-50/50 dark:bg-gray-700/50;
}

/* Grid lines */
:deep(.enhanced-datatable .p-datatable-tbody > tr > td) {
    @apply border-r border-gray-100 dark:border-gray-600;
}

:deep(.enhanced-datatable .p-datatable-tbody > tr > td:last-child) {
    @apply border-r-0;
}
</style>
