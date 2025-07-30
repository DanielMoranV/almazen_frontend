<script setup>
// PrimeVue Components
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Skeleton from 'primevue/skeleton';
import Tag from 'primevue/tag';

const props = defineProps({
    transfers: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'restore', 'clearFilters']);

// Format date utility
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Get status severity for styling
const getStatusSeverity = (status) => {
    switch (status) {
        case 'completed':
            return 'success';
        case 'pending':
            return 'warning';
        case 'cancelled':
            return 'danger';
        default:
            return 'info';
    }
};

// Get status label
const getStatusLabel = (status) => {
    switch (status) {
        case 'completed':
            return 'Completado';
        case 'pending':
            return 'Pendiente';
        case 'cancelled':
            return 'Cancelado';
        default:
            return 'Desconocido';
    }
};
</script>

<template>
    <div class="table-container">
        <div class="table-header">
            <div class="table-title">
                <i class="pi pi-list"></i>
                <span>Lista de Transferencias</span>
            </div>
            <div class="table-summary" v-if="transfers.length > 0">
                <span class="text-sm text-gray-600 dark:text-gray-400"> Mostrando {{ transfers.length }} transferencia{{
                    transfers.length !== 1 ? 's' : '' }} </span>
            </div>
        </div>

        <DataTable :value="transfers" :loading="loading" dataKey="id" responsiveLayout="scroll" class="transfers-table"
            stripedRows :paginator="true" :rows="10" :rowsPerPageOptions="[10, 25, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros">
            <!-- Loading template -->
            <template #loading>
                <div class="loading-container">
                    <div class="loading-skeleton">
                        <Skeleton height="3rem" class="mb-3" />
                        <Skeleton height="2rem" class="mb-2" />
                        <Skeleton height="2rem" class="mb-2" />
                        <Skeleton height="2rem" class="mb-2" />
                        <Skeleton height="2rem" class="mb-2" />
                        <Skeleton height="2rem" />
                    </div>
                </div>
            </template>

            <!-- ID Column -->
            <Column field="id" header="ID" sortable class="id-column">
                <template #body="{ data }">
                    <div class="id-cell">
                        <Tag :value="`#${data.id}`" severity="info" />
                    </div>
                </template>
            </Column>

            <!-- Date Column -->
            <Column field="date" header="Fecha y Hora" sortable class="date-column">
                <template #body="{ data }">
                    <div class="date-cell">
                        <div class="date-primary">{{ formatDate(data.date) }}</div>
                        <div class="date-secondary">{{ data.created_at ? 'Creado: ' + formatDate(data.created_at) : ''
                            }}</div>
                    </div>
                </template>
            </Column>

            <!-- From Warehouse Column -->
            <Column header="Almacén Origen" class="warehouse-column">
                <template #body="{ data }">
                    <div class="warehouse-cell from-warehouse">
                        <div class="warehouse-icon">
                            <i class="pi pi-warehouse"></i>
                        </div>
                        <div class="warehouse-info">
                            <div class="warehouse-name">{{ data.from_warehouse?.name || `ID: ${data.from_warehouse_id}`
                                }}</div>
                            <div class="warehouse-id">ID: {{ data.from_warehouse_id }}</div>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- To Warehouse Column -->
            <Column header="Almacén Destino" class="warehouse-column">
                <template #body="{ data }">
                    <div class="warehouse-cell to-warehouse">
                        <div class="warehouse-icon">
                            <i class="pi pi-warehouse"></i>
                        </div>
                        <div class="warehouse-info">
                            <div class="warehouse-name">{{ data.to_warehouse?.name || `ID: ${data.to_warehouse_id}` }}
                            </div>
                            <div class="warehouse-id">ID: {{ data.to_warehouse_id }}</div>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Product Column -->
            <Column header="Producto" class="product-column">
                <template #body="{ data }">
                    <div class="product-cell">
                        <div class="product-icon">
                            <i class="pi pi-box"></i>
                        </div>
                        <div class="product-info">
                            <div class="product-name">{{ data.product?.name || `ID: ${data.product_id}` }}</div>
                            <div class="product-details">
                                <span v-if="data.product?.sku" class="product-sku">SKU: {{ data.product.sku }}</span>
                                <span v-if="data.product?.code" class="product-code">Código: {{ data.product.code
                                    }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Batch Column -->
            <Column header="Lote" class="batch-column">
                <template #body="{ data }">
                    <div class="batch-cell">
                        <Tag v-if="data.batch?.code || data.batch_id"
                            :value="data.batch?.code || `ID: ${data.batch_id}`" severity="secondary" />
                        <span v-else class="no-batch">Sin lote</span>
                    </div>
                </template>
            </Column>

            <!-- Quantity Column -->
            <Column field="quantity" header="Cantidad" sortable class="quantity-column">
                <template #body="{ data }">
                    <div class="quantity-cell">
                        <div class="quantity-value">{{ data.quantity }}</div>
                        <div class="quantity-unit">unidades</div>
                    </div>
                </template>
            </Column>

            <!-- User Column -->
            <Column header="Usuario" class="user-column">
                <template #body="{ data }">
                    <div class="user-cell">
                        <div class="user-icon">
                            <i class="pi pi-user"></i>
                        </div>
                        <div class="user-info">
                            <div class="user-name">{{ data.user?.name || `ID: ${data.user_id}` }}</div>
                            <div class="user-role">{{ data.user?.role || 'Usuario' }}</div>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Status Column -->
            <Column header="Estado" class="status-column">
                <template #body="{ data }">
                    <div class="status-cell">
                        <Tag :value="getStatusLabel(data.status || 'completed')"
                            :severity="getStatusSeverity(data.status || 'completed')" />
                    </div>
                </template>
            </Column>

            <!-- Reason Column -->
            <Column header="Motivo" class="reason-column">
                <template #body="{ data }">
                    <div class="reason-cell">
                        <span v-if="data.reason" class="reason-text" :title="data.reason">
                            {{ data.reason.length > 30 ? data.reason.substring(0, 30) + '...' : data.reason }}
                        </span>
                        <span v-else class="no-reason">Sin motivo especificado</span>
                    </div>
                </template>
            </Column>

            <!-- Actions Column -->
            <Column header="Acciones" class="actions-column">
                <template #body="{ data }">
                    <div class="actions-cell">
                        <Button icon="pi pi-eye" severity="info" size="small" @click="$emit('edit', data)"
                            v-tooltip.top="'Ver detalles'" class="action-button view-button" />
                        <Button icon="pi pi-refresh" severity="secondary" size="small" @click="$emit('restore', data)"
                            v-tooltip.top="'Restaurar transferencia'" class="action-button restore-button" />
                    </div>
                </template>
            </Column>

            <!-- Empty state -->
            <template #empty>
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="pi pi-search"></i>
                    </div>
                    <div class="empty-title">No se encontraron transferencias</div>
                    <div class="empty-description">No hay transferencias que coincidan con los filtros aplicados</div>
                    <Button label="Limpiar Filtros" icon="pi pi-filter-slash" outlined @click="$emit('clearFilters')"
                        class="empty-action" />
                </div>
            </template>
        </DataTable>
    </div>
</template>

<style scoped>
.table-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700;
}

.table-header {
    @apply flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700;
}

.table-title {
    @apply flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.table-title i {
    @apply text-purple-500;
}

.table-summary {
    @apply text-right;
}

/* Loading styles */
.loading-container {
    @apply p-6;
}

.loading-skeleton {
    @apply space-y-3;
}

/* Column specific styles */
.id-column {
    @apply w-20;
}

.date-column {
    @apply w-40;
}

.warehouse-column {
    @apply w-48;
}

.product-column {
    @apply w-56;
}

.batch-column {
    @apply w-32;
}

.quantity-column {
    @apply w-28;
}

.user-column {
    @apply w-40;
}

.status-column {
    @apply w-32;
}

.reason-column {
    @apply w-48;
}

.actions-column {
    @apply w-32;
}

/* Cell styles */
.id-cell {
    @apply text-center;
}

.date-cell {
    @apply space-y-1;
}

.date-primary {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.date-secondary {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.warehouse-cell {
    @apply flex items-center gap-3;
}

.warehouse-icon {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-sm;
}

.from-warehouse .warehouse-icon {
    @apply bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300;
}

.to-warehouse .warehouse-icon {
    @apply bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300;
}

.warehouse-info {
    @apply space-y-1;
}

.warehouse-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.warehouse-id {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.product-cell {
    @apply flex items-center gap-3;
}

.product-icon {
    @apply w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center text-sm;
}

.product-info {
    @apply space-y-1;
}

.product-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.product-details {
    @apply flex gap-2 text-xs text-gray-500 dark:text-gray-400;
}

.product-sku,
.product-code {
    @apply bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded;
}

.batch-cell {
    @apply text-center;
}

.no-batch {
    @apply text-gray-500 dark:text-gray-400 text-sm italic;
}

.quantity-cell {
    @apply text-center space-y-1;
}

.quantity-value {
    @apply text-lg font-bold text-gray-900 dark:text-gray-100;
}

.quantity-unit {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.user-cell {
    @apply flex items-center gap-3;
}

.user-icon {
    @apply w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 flex items-center justify-center text-sm;
}

.user-info {
    @apply space-y-1;
}

.user-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.user-role {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.status-cell {
    @apply text-center;
}

.reason-cell {
    @apply text-sm;
}

.reason-text {
    @apply text-gray-700 dark:text-gray-300;
}

.no-reason {
    @apply text-gray-500 dark:text-gray-400 italic;
}

.actions-cell {
    @apply flex gap-2 justify-center;
}

.action-button {
    @apply transition-all duration-200;
}

.view-button:hover {
    @apply transform scale-105;
}

.restore-button:hover {
    @apply transform scale-105;
}

/* Empty state */
.empty-state {
    @apply text-center py-12 space-y-4;
}

.empty-icon {
    @apply text-6xl text-gray-400 dark:text-gray-600 mb-4;
}

.empty-title {
    @apply text-xl font-semibold text-gray-700 dark:text-gray-300;
}

.empty-description {
    @apply text-gray-500 dark:text-gray-400;
}

.empty-action {
    @apply mt-4;
}

/* DataTable overrides */
:deep(.transfers-table) {
    @apply border-0;
}

:deep(.transfers-table .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold;
}

:deep(.transfers-table .p-datatable-tbody > tr > td) {
    @apply border-b border-gray-100 dark:border-gray-700 py-4;
}

:deep(.transfers-table .p-datatable-tbody > tr:hover) {
    @apply bg-gray-50 dark:bg-gray-700;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .table-header {
        @apply flex-col gap-3 items-start p-4;
    }

    .table-title {
        @apply text-base;
    }

    .warehouse-cell,
    .product-cell,
    .user-cell {
        @apply flex-col gap-1 items-start;
    }

    .warehouse-icon,
    .product-icon,
    .user-icon {
        @apply w-6 h-6 text-xs;
    }

    .actions-cell {
        @apply flex-col gap-1;
    }
}
</style>
