<script setup>
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Paginator from 'primevue/paginator';

const props = defineProps({
    credits: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    pagination: { type: Object, required: true },
    selection: { type: Object, default: null }
});

const emit = defineEmits(['update:selection', 'page-change', 'row-select', 'payment-request']);

// Formateo de fecha
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Formateo de moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount || 0);
};

// Obtener clase del badge según el estado
const getStatusSeverity = (status) => {
    const statusCode = typeof status === 'object' ? status.code : status;
    const severityMap = {
        PENDIENTE: 'info',
        PAGADO: 'success',
        VENCIDO: 'danger',
        ANULADO: 'secondary'
    };
    return severityMap[statusCode] || 'info';
};

// Calcular días de mora
const getDaysOverdue = (credit) => {
    if (!credit.overdue_info?.is_overdue) return 0;
    // Usar los días calculados por el backend si están disponibles
    if (credit.overdue_info.days_overdue !== undefined) {
        return credit.overdue_info.days_overdue;
    }
    // Fallback: calcular manualmente si no viene del backend
    if (!credit.dates?.due_date) return 0;
    const dueDate = new Date(credit.dates.due_date);
    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const onPageChange = (event) => {
    emit('page-change', event);
};

const onRowSelect = (event) => {
    emit('row-select', event);
};

const onPaymentClick = (credit) => {
    emit('payment-request', credit);
};
</script>

<template>
    <div class="credits-table-container">
        <DataTable
            :value="credits"
            :loading="loading"
            :selection="selection"
            @update:selection="$emit('update:selection', $event)"
            @row-select="onRowSelect"
            :paginator="false"
            dataKey="id"
            filterDisplay="row"
            :globalFilterFields="['customer.name', 'sale.document_number', 'seller.name']"
            class="credits-table"
            :rowClass="(data) => (data.overdue_info?.is_overdue ? 'overdue-row' : '')"
            selectionMode="single"
            @row-dblclick="onRowSelect"
            responsiveLayout="scroll"
        >
            <!-- Cliente -->
            <Column field="customer.name" header="Cliente" :sortable="true" class="min-w-48">
                <template #body="{ data }">
                    <div class="customer-info">
                        <div class="customer-name">{{ data.customer?.name || 'N/A' }}</div>
                        <div class="customer-document">{{ data.customer?.identity_document || '' }}</div>
                    </div>
                </template>
            </Column>

            <!-- Venta -->
            <Column field="sale.document_number" header="Venta" :sortable="true" class="min-w-32">
                <template #body="{ data }">
                    <div class="sale-info">
                        <div class="font-semibold"># {{ data.sale?.document_number || 'N/A' }}</div>
                        <div class="text-xs text-gray-500">{{ formatDate(data.sale?.sale_date) }}</div>
                    </div>
                </template>
            </Column>

            <!-- Vendedor -->
            <Column field="seller.name" header="Vendedor" :sortable="true" class="min-w-36">
                <template #body="{ data }">
                    <div class="seller-name">{{ data.seller?.name || 'N/A' }}</div>
                </template>
            </Column>

            <!-- Fecha de crédito -->
            <Column field="credit_date" header="Fecha Crédito" :sortable="true" class="min-w-32">
                <template #body="{ data }">
                    {{ formatDate(data.dates?.credit_date) }}
                </template>
            </Column>

            <!-- Fecha de vencimiento -->
            <Column field="due_date" header="Vencimiento" :sortable="true" class="min-w-32">
                <template #body="{ data }">
                    <div :class="{ 'text-red-600 font-semibold': data.overdue_info?.is_overdue }">
                        {{ formatDate(data.dates?.due_date) }}
                    </div>
                </template>
            </Column>

            <!-- Monto total -->
            <Column field="total_amount" header="Monto Total" :sortable="true" class="min-w-32">
                <template #body="{ data }">
                    <div class="amount-cell">
                        {{ formatCurrency(data.amounts?.total_amount) }}
                    </div>
                </template>
            </Column>

            <!-- Monto pagado -->
            <Column field="paid_amount" header="Pagado" :sortable="true" class="min-w-32">
                <template #body="{ data }">
                    <div class="amount-cell text-green-600">
                        {{ formatCurrency(data.amounts?.paid_amount) }}
                    </div>
                </template>
            </Column>

            <!-- Saldo pendiente -->
            <Column field="remaining_amount" header="Saldo" :sortable="true" class="min-w-32">
                <template #body="{ data }">
                    <div class="amount-cell font-semibold" :class="{ 'text-red-600': data.amounts?.remaining_amount > 0 }">
                        {{ formatCurrency(data.amounts?.remaining_amount) }}
                    </div>
                </template>
            </Column>

            <!-- Estado -->
            <Column field="status" header="Estado" :sortable="true" class="min-w-28">
                <template #body="{ data }">
                    <div class="status-cell">
                        <Badge :value="typeof data.status === 'object' ? data.status.display : data.status_display || data.status" :severity="getStatusSeverity(typeof data.status === 'object' ? data.status.code : data.status)" class="status-badge" />
                        <div v-if="data.overdue_info?.is_overdue" class="overdue-info">
                            <span class="text-xs text-red-600 font-semibold"> {{ getDaysOverdue(data) }} días mora </span>
                        </div>
                    </div>
                </template>
            </Column>

            <!-- Acciones -->
            <Column header="Acciones" class="min-w-32">
                <template #body="{ data }">
                    <div class="actions-cell">
                        <Button v-if="data.status?.code === 'PENDIENTE' || data.status?.code === 'VENCIDO'" icon="pi pi-dollar" label="Pagar" size="small" class="p-button-success p-button-sm" @click.stop="onPaymentClick(data)" />
                        <Button icon="pi pi-eye" size="small" class="p-button-info p-button-outlined p-button-sm ml-2" @click.stop="onRowSelect({ data })" />
                    </div>
                </template>
            </Column>

            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-credit-card text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-600 mb-2">No hay créditos</h3>
                    <p class="text-gray-500">No se encontraron créditos con los filtros aplicados</p>
                </div>
            </template>
        </DataTable>

        <!-- Paginación -->
        <div v-if="pagination.total > 0" class="pagination-container">
            <Paginator
                :rows="pagination.size"
                :totalRecords="pagination.total"
                :first="(pagination.page - 1) * pagination.size"
                @page="onPageChange"
                template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
                :rowsPerPageOptions="[10, 20, 50, 100]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} créditos"
            />
        </div>
    </div>
</template>

<style scoped>
.credits-table-container {
    @apply bg-white dark:bg-gray-800 rounded-xl overflow-hidden;
}

.customer-info {
    @apply space-y-1;
}

.customer-name {
    @apply font-semibold text-gray-900 dark:text-white;
}

.customer-document {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.sale-info {
    @apply space-y-1;
}

.seller-name {
    @apply text-gray-800 dark:text-gray-200;
}

.amount-cell {
    @apply font-mono text-right;
}

.status-cell {
    @apply space-y-1;
}

.status-badge {
    @apply text-xs;
}

.overdue-info {
    @apply mt-1;
}

.actions-cell {
    @apply flex items-center gap-1;
}

.empty-state {
    @apply text-center py-16;
}

.pagination-container {
    @apply p-4 border-t border-gray-200 dark:border-gray-700;
}

/* Fila vencida */
:deep(.overdue-row) {
    @apply bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500;
}

:deep(.credits-table .p-datatable-thead > tr > th) {
    @apply bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold;
}

:deep(.credits-table .p-datatable-tbody > tr) {
    @apply hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer;
}

:deep(.credits-table .p-datatable-tbody > tr > td) {
    @apply py-3 px-4 border-b border-gray-200 dark:border-gray-700;
}

/* Responsive */
@media (max-width: 768px) {
    :deep(.credits-table .p-datatable-responsive-scroll) {
        @apply overflow-x-auto;
    }

    .actions-cell {
        @apply flex-col gap-1;
    }
}
</style>
