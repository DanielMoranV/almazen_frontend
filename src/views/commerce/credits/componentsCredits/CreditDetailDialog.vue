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
const daysOverdue = computed(() => {
    if (!props.credit?.overdue_info?.is_overdue) return 0;
    // Usar los días calculados por el backend si están disponibles
    if (props.credit.overdue_info.days_overdue !== undefined) {
        return props.credit.overdue_info.days_overdue;
    }
    // Fallback: calcular manualmente si no viene del backend
    if (!props.credit?.dates?.due_date) return 0;
    const dueDate = new Date(props.credit.dates.due_date);
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
            <!-- Información compacta en dos columnas -->
            <div class="compact-grid">
                <!-- Columna izquierda: Cliente y Venta -->
                <Card class="compact-card">
                    <template #content>
                        <!-- Cliente -->
                        <div class="section-block">
                            <div class="section-header">
                                <i class="pi pi-user text-blue-600"></i>
                                <h4>{{ credit.customer?.name || 'N/A' }}</h4>
                            </div>
                            <div class="compact-info">
                                <div class="info-item">
                                    <span class="label">Doc:</span>
                                    <span>{{ credit.customer?.identity_document || '' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Tel:</span>
                                    <span>{{ credit.customer?.phone || '' }}</span>
                                </div>
                                <div v-if="credit.customer?.credit_enabled" class="info-item">
                                    <span class="label">Límite:</span>
                                    <span class="font-semibold text-blue-600">{{ formatCurrency(credit.customer.credit_limit) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Venta -->
                        <div class="section-block">
                            <div class="section-header">
                                <i class="pi pi-shopping-cart text-green-600"></i>
                                <h4>Venta # {{ credit.sale?.document_number || 'N/A' }}</h4>
                            </div>
                            <div class="compact-info">
                                <div class="info-item">
                                    <span class="label">Fecha:</span>
                                    <span>{{ formatDate(credit.sale?.sale_date) }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Vendedor:</span>
                                    <span>{{ credit.seller?.name || 'N/A' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Total:</span>
                                    <span class="font-semibold">{{ formatCurrency(credit.sale?.total_amount) }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Columna derecha: Crédito y Finanzas -->
                <Card class="compact-card">
                    <template #content>
                        <!-- Estado del Crédito -->
                        <div class="section-block">
                            <div class="section-header">
                                <i class="pi pi-credit-card text-purple-600"></i>
                                <div class="flex items-center gap-2">
                                    <h4>Crédito</h4>
                                    <Badge :value="typeof credit.status === 'object' ? credit.status.display : credit.status_display || credit.status" :severity="getStatusSeverity(credit.status)" class="text-xs" />
                                </div>
                            </div>
                            <div class="compact-info">
                                <div class="info-item">
                                    <span class="label">Otorgado:</span>
                                    <span>{{ formatDate(credit.dates?.credit_date) }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">Vence:</span>
                                    <span :class="{ 'text-red-600 font-semibold': credit.overdue_info?.is_overdue }">
                                        {{ formatDate(credit.dates?.due_date) }}
                                    </span>
                                </div>
                                <div v-if="credit.overdue_info?.is_overdue" class="info-item">
                                    <span class="label">Mora:</span>
                                    <span class="text-red-600 font-bold">{{ daysOverdue }} días</span>
                                </div>
                            </div>
                        </div>

                        <!-- Resumen Financiero Compacto -->
                        <div class="section-block">
                            <div class="section-header">
                                <i class="pi pi-money-bill text-orange-600"></i>
                                <h4>Resumen Financiero</h4>
                            </div>
                            <div class="financial-compact">
                                <div class="financial-row">
                                    <span class="label">Total:</span>
                                    <span class="value text-blue-600">{{ formatCurrency(credit.amounts?.total_amount) }}</span>
                                </div>
                                <div class="financial-row">
                                    <span class="label">Pagado:</span>
                                    <div class="payment-display">
                                        <span class="value text-green-600">{{ formatCurrency(credit.amounts?.paid_amount) }}</span>
                                        <div class="progress-mini">
                                            <div class="progress-fill-mini" :style="{ width: `${credit.payment_status?.payment_percentage || 0}%` }"></div>
                                        </div>
                                        <span class="percentage-mini">{{ credit.payment_status?.payment_percentage || 0 }}%</span>
                                    </div>
                                </div>
                                <div class="financial-row">
                                    <span class="label">Pendiente:</span>
                                    <span class="value" :class="credit.payment_status?.is_fully_paid ? 'text-green-600' : 'text-orange-600'">
                                        {{ credit.payment_status?.is_fully_paid ? 'COMPLETO' : formatCurrency(credit.amounts?.remaining_amount) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Información adicional compacta -->
            <div v-if="paymentHistory.length > 0 || credit.notes" class="additional-info">
                <!-- Historial de pagos compacto -->
                <Card v-if="paymentHistory.length > 0" class="compact-card">
                    <template #content>
                        <div class="section-block">
                            <div class="section-header">
                                <i class="pi pi-clock text-indigo-600"></i>
                                <h4>Historial de Pagos</h4>
                            </div>
                            <div class="payment-history-compact">
                                <div v-for="payment in paymentHistory" :key="payment.id" class="payment-item">
                                    <div class="payment-date">{{ formatDate(payment.payment_date) }}</div>
                                    <div class="payment-amount">{{ formatCurrency(payment.amount) }}</div>
                                    <div class="payment-method">{{ payment.payment_method?.name || 'N/A' }}</div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Notas compactas -->
                <Card v-if="credit.notes" class="compact-card">
                    <template #content>
                        <div class="section-block">
                            <div class="section-header">
                                <i class="pi pi-file-edit text-gray-600"></i>
                                <h4>Notas</h4>
                            </div>
                            <div class="notes-compact">
                                {{ credit.notes }}
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cerrar" icon="pi pi-times" class="p-button-text" @click="close" />
                <Button v-if="credit?.status?.code === 'PENDIENTE' || credit?.status?.code === 'VENCIDO'" label="Registrar Pago" icon="pi pi-dollar" class="p-button-success" @click="requestPayment" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.credit-detail-content {
    @apply space-y-4;
}

.compact-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4;
}

.compact-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.section-block {
    @apply mb-4 last:mb-0;
}

.section-header {
    @apply flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-600;
}

.section-header h4 {
    @apply text-sm font-semibold text-gray-800 dark:text-gray-200 m-0;
}

.compact-info {
    @apply space-y-2;
}

.info-item {
    @apply flex justify-between items-center text-sm;
}

.info-item .label {
    @apply font-medium text-gray-500 dark:text-gray-400 text-xs;
}

.financial-compact {
    @apply space-y-3;
}

.financial-row {
    @apply flex justify-between items-center;
}

.financial-row .label {
    @apply font-medium text-gray-600 dark:text-gray-400 text-sm;
}

.financial-row .value {
    @apply font-semibold text-sm;
}

.payment-display {
    @apply flex items-center gap-2;
}

.progress-mini {
    @apply w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden;
}

.progress-fill-mini {
    @apply h-full bg-green-500 transition-all duration-300;
}

.percentage-mini {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.additional-info {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4;
}

.payment-history-compact {
    @apply space-y-2 max-h-32 overflow-y-auto;
}

.payment-item {
    @apply grid grid-cols-3 gap-2 text-sm py-1 border-b border-gray-100 dark:border-gray-600 last:border-b-0;
}

.payment-date {
    @apply text-gray-600 dark:text-gray-400 text-xs;
}

.payment-amount {
    @apply font-semibold text-green-600;
}

.payment-method {
    @apply text-gray-500 dark:text-gray-400 text-xs;
}

.notes-compact {
    @apply text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg;
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
@media (max-width: 1024px) {
    .compact-grid,
    .additional-info {
        @apply grid-cols-1;
    }

    .payment-display {
        @apply flex-col items-start gap-1;
    }
}

@media (max-width: 768px) {
    .section-header {
        @apply flex-col items-start gap-1;
    }

    .info-item {
        @apply flex-col items-start gap-1;
    }

    .financial-row {
        @apply flex-col items-start gap-1;
    }
}
</style>
