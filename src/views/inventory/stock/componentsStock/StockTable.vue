<template>
    <div class="stock-table">
        <!-- Loading state -->
        <div v-if="loading" class="loading-state">
            <div class="loading-content">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                <p class="loading-text">Cargando inventario...</p>
            </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!stockItems.length" class="empty-state">
            <div class="empty-content">
                <div class="empty-icon">
                    <i class="pi pi-inbox"></i>
                </div>
                <h3 class="empty-title">No hay productos disponibles</h3>
                <p class="empty-description">No se encontraron productos que coincidan con los filtros aplicados.</p>
                <div class="empty-actions">
                    <Button 
                        icon="pi pi-filter-slash" 
                        label="Limpiar Filtros" 
                        class="secondary-action-btn" 
                        @click="$emit('clear-filters')"
                    />
                </div>
            </div>
        </div>

        <!-- Table with data -->
        <div v-else class="table-container">
            <div class="table-wrapper">
                <table class="stock-data-table">
                    <thead>
                        <tr>
                            <th class="table-header">SKU</th>
                            <th class="table-header">Producto</th>
                            <th class="table-header">Almacenes</th>
                            <th class="table-header text-right">Stock Total</th>
                            <th class="table-header text-right">Costo Promedio</th>
                            <th class="table-header text-right">Costo Total</th>
                            <th class="table-header text-right">Stock Máximo</th>
                            <th class="table-header text-right">Stock Mínimo</th>
                            <th class="table-header">Lotes</th>
                            <th class="table-header text-center">Estado</th>
                            <th class="table-header text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="item in stockItems" 
                            :key="item.id" 
                            class="table-row"
                            @click="$emit('view-details', item)"
                        >
                            <!-- SKU -->
                            <td class="table-cell">
                                <div class="sku-cell">
                                    <span class="sku-code">{{ item.sku || '-' }}</span>
                                    <span v-if="item.barcode" class="barcode">{{ item.barcode }}</span>
                                </div>
                            </td>

                            <!-- Producto -->
                            <td class="table-cell">
                                <div class="product-cell">
                                    <span class="product-name">{{ item.name }}</span>
                                </div>
                            </td>

                            <!-- Almacenes -->
                            <td class="table-cell">
                                <div class="warehouses-cell">
                                    <div v-if="item.warehouses?.length" class="warehouse-list">
                                        <div 
                                            v-for="warehouse in item.warehouses" 
                                            :key="warehouse.id" 
                                            class="warehouse-item"
                                        >
                                            <span class="warehouse-name">{{ warehouse.name }}</span>
                                            <span class="warehouse-stock">{{ warehouse.stock }}</span>
                                        </div>
                                    </div>
                                    <span v-else class="no-data">-</span>
                                </div>
                            </td>

                            <!-- Stock Total -->
                            <td class="table-cell text-right">
                                <div class="stock-cell">
                                    <span class="stock-amount" :class="getStockAmountClass(item.total_stock)">
                                        {{ item.total_stock }}
                                    </span>
                                </div>
                            </td>

                            <!-- Costo Promedio -->
                            <td class="table-cell text-right">
                                <div class="cost-cell">
                                    <span class="cost-amount">
                                        {{ item.avg_cost_unit ? `S/ ${item.avg_cost_unit.toFixed(2)}` : '-' }}
                                    </span>
                                </div>
                            </td>

                            <!-- Costo Total -->
                            <td class="table-cell text-right">
                                <div class="total-cost-cell">
                                    <span class="total-cost-amount">
                                        {{ item.total_cost ? `S/ ${item.total_cost.toFixed(2)}` : '-' }}
                                    </span>
                                </div>
                            </td>

                            <!-- Stock Máximo -->
                            <td class="table-cell text-right">
                                <div class="max-stock-cell">
                                    <span class="max-stock-amount">
                                        {{ item.max_stock || '-' }}
                                    </span>
                                </div>
                            </td>

                            <!-- Stock Mínimo -->
                            <td class="table-cell text-right">
                                <div class="min-stock-cell">
                                    <span class="min-stock-amount">
                                        {{ item.min_stock || '-' }}
                                    </span>
                                </div>
                            </td>

                            <!-- Lotes -->
                            <td class="table-cell">
                                <div class="batches-cell">
                                    <div v-if="item.batches?.length" class="batches-info">
                                        <div class="batch-count">
                                            <i class="pi pi-tags"></i>
                                            <span>{{ item.batches.length }} lote(s)</span>
                                        </div>
                                        <div class="batch-preview">
                                            <div 
                                                v-for="batch in item.batches.slice(0, 2)" 
                                                :key="batch.id"
                                                class="batch-item"
                                            >
                                                <span class="batch-code">{{ batch.code }}</span>
                                                <span class="batch-stock">{{ batch.stock }}</span>
                                            </div>
                                            <span v-if="item.batches.length > 2" class="more-batches">
                                                +{{ item.batches.length - 2 }} más
                                            </span>
                                        </div>
                                    </div>
                                    <span v-else class="no-data">-</span>
                                </div>
                            </td>

                            <!-- Estado -->
                            <td class="table-cell text-center">
                                <span class="status-badge" :class="getStatusClass(item.total_stock)">
                                    {{ getStatusLabel(item.total_stock) }}
                                </span>
                            </td>

                            <!-- Acciones -->
                            <td class="table-cell text-center">
                                <div class="actions-cell">
                                    <Button 
                                        icon="pi pi-eye" 
                                        class="action-btn view-btn" 
                                        v-tooltip.top="'Ver detalles'"
                                        text
                                        @click.stop="$emit('view-details', item)"
                                    />
                                    <Button 
                                        icon="pi pi-pencil" 
                                        class="action-btn edit-btn" 
                                        v-tooltip.top="'Ajustar stock'"
                                        text
                                        @click.stop="$emit('adjust-stock', item)"
                                    />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ProgressSpinner, Button } from 'primevue';

defineProps({
    stockItems: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['view-details', 'adjust-stock', 'clear-filters']);

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
</script>

<style scoped>
.stock-table {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden;
}

/* Loading state */
.loading-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700;
}

.loading-content {
    @apply text-center px-8 py-12;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

/* Empty state */
.empty-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg;
}

.empty-icon i {
    @apply text-4xl text-white;
}

.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #7c3aed, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.empty-description {
    @apply text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed;
}

.empty-actions {
    @apply flex justify-center gap-4;
}

.secondary-action-btn {
    @apply bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300;
}

/* Table container */
.table-container {
    @apply overflow-hidden;
}

.table-wrapper {
    @apply overflow-x-auto;
}

.stock-data-table {
    @apply w-full min-w-full;
}

/* Table headers */
.table-header {
    @apply px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600;
}

/* Table rows */
.table-row {
    @apply border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200;
}

.table-cell {
    @apply px-6 py-4 whitespace-nowrap;
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