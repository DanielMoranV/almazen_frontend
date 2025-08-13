<script setup>
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import { computed } from 'vue';

const props = defineProps({
    visible: { type: Boolean, default: false },
    credit: { type: Object, default: null }
});

const emit = defineEmits(['update:visible', 'payment-request']);

const close = () => emit('update:visible', false);

const requestPayment = () => {
    emit('payment-request', props.credit);
    close();
};

// Formateo de fecha
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
    const severityMap = {
        PENDIENTE: 'info',
        PAGADO: 'success',
        VENCIDO: 'danger',
        ANULADO: 'secondary'
    };
    return severityMap[status] || 'info';
};

// Calcular días de mora
const daysOverdue = computed(() => {
    if (!props.credit?.is_overdue || !props.credit?.due_date) return 0;
    const dueDate = new Date(props.credit.due_date);
    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Historial de pagos de ejemplo (esto vendría del API)
const paymentHistory = computed(() => {
    return props.credit?.payment_history || [];
});
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :style="{ width: '900px', maxWidth: '95vw' }" header="📋 Detalle de Crédito" :modal="true" class="credit-detail-dialog" :closable="true">
        <div v-if="credit" class="credit-detail-content">
            <!-- Información principal -->
            <div class="main-info-grid">
                <!-- Información del cliente -->
                <Card class="info-card">
                    <template #title>
                        <div class="card-title">
                            <i class="pi pi-user"></i>
                            Cliente
                        </div>
                    </template>
                    <template #content>
                        <div class="client-info">
                            <h3 class="client-name">{{ credit.customer?.name || 'N/A' }}</h3>
                            <p class="client-document">{{ credit.customer?.identity_document || '' }}</p>
                            <p class="client-contact">{{ credit.customer?.phone || '' }}</p>
                            <p class="client-email">{{ credit.customer?.email || '' }}</p>
                        </div>
                    </template>
                </Card>

                <!-- Información de la venta -->
                <Card class="info-card">
                    <template #title>
                        <div class="card-title">
                            <i class="pi pi-shopping-cart"></i>
                            Venta
                        </div>
                    </template>
                    <template #content>
                        <div class="sale-info">
                            <div class="info-row">
                                <span class="label">Número:</span>
                                <span class="value"># {{ credit.sale?.document_number || 'N/A' }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Fecha:</span>
                                <span class="value">{{ formatDate(credit.sale?.date) }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Vendedor:</span>
                                <span class="value">{{ credit.seller?.name || 'N/A' }}</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Información del crédito -->
                <Card class="info-card">
                    <template #title>
                        <div class="card-title">
                            <i class="pi pi-credit-card"></i>
                            Crédito
                        </div>
                    </template>
                    <template #content>
                        <div class="credit-info">
                            <div class="info-row">
                                <span class="label">Fecha crédito:</span>
                                <span class="value">{{ formatDate(credit.credit_date) }}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Vencimiento:</span>
                                <span class="value" :class="{ 'overdue-text': credit.is_overdue }">
                                    {{ formatDate(credit.due_date) }}
                                </span>
                            </div>
                            <div class="info-row">
                                <span class="label">Estado:</span>
                                <Badge :value="credit.status_display || credit.status" :severity="getStatusSeverity(credit.status)" />
                            </div>
                            <div v-if="credit.is_overdue" class="info-row">
                                <span class="label">Días mora:</span>
                                <span class="value overdue-text font-bold">{{ daysOverdue }} días</span>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Resumen financiero -->
                <Card class="info-card md:col-span-2">
                    <template #title>
                        <div class="card-title">
                            <i class="pi pi-money-bill"></i>
                            Resumen Financiero
                        </div>
                    </template>
                    <template #content>
                        <div class="financial-info">
                            <div class="amount-row total">
                                <span class="label">Monto Total:</span>
                                <span class="value">{{ formatCurrency(credit.total_amount) }}</span>
                            </div>
                            <div class="amount-row paid">
                                <span class="label">Monto Pagado:</span>
                                <span class="value">{{ formatCurrency(credit.paid_amount) }}</span>
                            </div>
                            <div class="amount-row pending">
                                <span class="label">Saldo Pendiente:</span>
                                <span class="value">{{ formatCurrency(credit.remaining_amount) }}</span>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Historial de pagos -->
            <Card v-if="paymentHistory.length > 0" class="history-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-clock"></i>
                        Historial de Pagos
                    </div>
                </template>
                <template #content>
                    <DataTable :value="paymentHistory" class="payment-history-table">
                        <Column field="payment_date" header="Fecha">
                            <template #body="{ data }">
                                {{ formatDate(data.payment_date) }}
                            </template>
                        </Column>
                        <Column field="amount" header="Monto">
                            <template #body="{ data }">
                                {{ formatCurrency(data.amount) }}
                            </template>
                        </Column>
                        <Column field="payment_method" header="Método">
                            <template #body="{ data }">
                                {{ data.payment_method?.name || 'N/A' }}
                            </template>
                        </Column>
                        <Column field="reference_number" header="Referencia">
                            <template #body="{ data }">
                                {{ data.reference_number || '-' }}
                            </template>
                        </Column>
                        <Column field="notes" header="Notas">
                            <template #body="{ data }">
                                {{ data.notes || '-' }}
                            </template>
                        </Column>
                    </DataTable>
                </template>
            </Card>

            <!-- Notas del crédito -->
            <Card v-if="credit.notes" class="notes-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-file-edit"></i>
                        Notas
                    </div>
                </template>
                <template #content>
                    <p class="notes-text">{{ credit.notes }}</p>
                </template>
            </Card>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="close" />
                <Button v-if="credit?.status === 'PENDIENTE' || credit?.status === 'VENCIDO'" label="Registrar Pago" icon="pi pi-dollar" class="p-button-success" @click="requestPayment" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.credit-detail-content {
    @apply space-y-6;
}

.main-info-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.info-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.card-title {
    @apply flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200;
}

.card-title i {
    @apply text-purple-600 dark:text-purple-400;
}

.client-info {
    @apply space-y-2;
}

.client-name {
    @apply text-xl font-bold text-gray-900 dark:text-white m-0;
}

.client-document,
.client-contact,
.client-email {
    @apply text-gray-600 dark:text-gray-400 m-0;
}

.sale-info,
.credit-info {
    @apply space-y-3;
}

.info-row {
    @apply flex justify-between items-center;
}

.info-row .label {
    @apply font-medium text-gray-600 dark:text-gray-400;
}

.info-row .value {
    @apply font-semibold text-gray-900 dark:text-white;
}

.overdue-text {
    @apply text-red-600 dark:text-red-400;
}

.financial-info {
    @apply space-y-4;
}

.amount-row {
    @apply flex justify-between items-center p-3 rounded-lg;
}

.amount-row.total {
    @apply bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700;
}

.amount-row.paid {
    @apply bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700;
}

.amount-row.pending {
    @apply bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700;
}

.amount-row .label {
    @apply font-medium text-gray-700 dark:text-gray-300;
}

.amount-row .value {
    @apply font-bold text-lg;
}

.history-card,
.notes-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.payment-history-table {
    @apply mt-4;
}

.notes-text {
    @apply text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg;
}

.dialog-footer {
    @apply flex justify-between items-center w-full;
}

/* Estilos del diálogo */
:deep(.credit-detail-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-purple-600 to-indigo-600 text-white;
}

:deep(.credit-detail-dialog .p-dialog-content) {
    @apply p-6;
}

:deep(.credit-detail-dialog .p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-700;
}

/* Estilos de las tarjetas */
:deep(.info-card .p-card-content) {
    @apply p-4;
}

:deep(.info-card .p-card-title) {
    @apply mb-4;
}

/* Responsive */
@media (max-width: 768px) {
    .main-info-grid {
        @apply grid-cols-1;
    }

    .financial-card {
        @apply col-span-1;
    }

    .info-row {
        @apply flex-col items-start gap-1;
    }

    .amount-row {
        @apply flex-col items-start gap-1;
    }
}
</style>
