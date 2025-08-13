<script setup>
import { computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import CreditStatusBadge from './CreditStatusBadge.vue';
import CreditLimitIndicator from './CreditLimitIndicator.vue';

const props = defineProps({
    customer: {
        type: Object,
        required: true
    },
    showActions: {
        type: Boolean,
        default: true
    },
    compact: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['payment-request', 'edit-config', 'view-history']);

// Cálculos derivados
const creditStatus = computed(() => {
    if (!props.customer.credit_enabled) return 'DESHABILITADO';
    if (props.customer.has_overdue_credits) return 'VENCIDO';
    if (props.customer.total_debt > 0) return 'PENDIENTE';
    return 'DISPONIBLE';
});

const statusSeverity = computed(() => {
    const severityMap = {
        'DESHABILITADO': 'secondary',
        'VENCIDO': 'danger',
        'PENDIENTE': 'warning',
        'DISPONIBLE': 'success'
    };
    return severityMap[creditStatus.value] || 'secondary';
});

const availableCredit = computed(() => {
    return Math.max((props.customer.credit_limit || 0) - (props.customer.total_debt || 0), 0);
});

const averagePaymentDays = computed(() => {
    return props.customer.average_payment_days || 0;
});

// Formateo de moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount || 0);
};

// Handlers de eventos
const handlePaymentRequest = () => {
    emit('payment-request', props.customer);
};

const handleEditConfig = () => {
    emit('edit-config', props.customer);
};

const handleViewHistory = () => {
    emit('view-history', props.customer);
};
</script>

<template>
    <Card class="credit-summary-card" :class="{ 'compact-card': compact }">
        <template #header v-if="!compact">
            <div class="card-header">
                <div class="customer-info">
                    <h3 class="customer-name">{{ customer.name }}</h3>
                    <p class="customer-document">{{ customer.identity_document }}</p>
                </div>
                <div class="status-badge">
                    <Badge 
                        :value="creditStatus" 
                        :severity="statusSeverity"
                        class="status-indicator"
                    />
                </div>
            </div>
        </template>

        <template #content>
            <!-- Información básica para vista compacta -->
            <div v-if="compact" class="compact-header">
                <div class="customer-info">
                    <h4 class="customer-name">{{ customer.name }}</h4>
                    <p class="customer-document">{{ customer.identity_document }}</p>
                </div>
                <Badge 
                    :value="creditStatus" 
                    :severity="statusSeverity"
                    size="small"
                />
            </div>

            <!-- Información de crédito -->
            <div v-if="customer.credit_enabled" class="credit-info">
                <!-- Indicador de límite -->
                <div class="limit-section">
                    <CreditLimitIndicator
                        :credit-limit="customer.credit_limit"
                        :total-debt="customer.total_debt"
                        :size="compact ? 'small' : 'normal'"
                        :show-labels="!compact"
                    />
                </div>

                <!-- Métricas -->
                <div class="metrics-grid" :class="{ 'compact-metrics': compact }">
                    <div class="metric-item">
                        <div class="metric-value">{{ formatCurrency(customer.credit_limit || 0) }}</div>
                        <div class="metric-label">Límite</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value debt">{{ formatCurrency(customer.total_debt || 0) }}</div>
                        <div class="metric-label">Deuda</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value available">{{ formatCurrency(availableCredit) }}</div>
                        <div class="metric-label">Disponible</div>
                    </div>
                    <div v-if="!compact" class="metric-item">
                        <div class="metric-value">{{ customer.credit_days || 0 }}</div>
                        <div class="metric-label">Días</div>
                    </div>
                </div>

                <!-- Estadísticas adicionales -->
                <div v-if="!compact" class="stats-section">
                    <div class="stat-row">
                        <span class="stat-label">Créditos pendientes:</span>
                        <Badge 
                            :value="customer.pending_credits_count || 0" 
                            :severity="customer.pending_credits_count > 0 ? 'warning' : 'success'"
                        />
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Créditos vencidos:</span>
                        <Badge 
                            :value="customer.overdue_credits_count || 0" 
                            :severity="customer.overdue_credits_count > 0 ? 'danger' : 'success'"
                        />
                    </div>
                    <div v-if="averagePaymentDays > 0" class="stat-row">
                        <span class="stat-label">Días promedio de pago:</span>
                        <span class="stat-value">{{ averagePaymentDays }} días</span>
                    </div>
                </div>

                <!-- Alertas -->
                <div v-if="customer.has_overdue_credits" class="alert-section">
                    <div class="alert overdue-alert">
                        <i class="pi pi-exclamation-triangle"></i>
                        <span>Cliente tiene deudas vencidas</span>
                    </div>
                </div>

                <div v-if="availableCredit < (customer.credit_limit * 0.1)" class="alert-section">
                    <div class="alert limit-alert">
                        <i class="pi pi-info-circle"></i>
                        <span>Límite de crédito casi agotado</span>
                    </div>
                </div>
            </div>

            <!-- Crédito deshabilitado -->
            <div v-else class="disabled-credit">
                <div class="disabled-message">
                    <i class="pi pi-ban"></i>
                    <span>Crédito no habilitado para este cliente</span>
                </div>
            </div>
        </template>

        <template #footer v-if="showActions">
            <div class="actions-footer">
                <Button
                    v-if="customer.credit_enabled && customer.total_debt > 0"
                    icon="pi pi-dollar"
                    label="Registrar Pago"
                    class="p-button-success p-button-sm"
                    @click="handlePaymentRequest"
                />
                <Button
                    icon="pi pi-cog"
                    :label="compact ? '' : 'Configurar'"
                    class="p-button-outlined p-button-sm"
                    @click="handleEditConfig"
                />
                <Button
                    v-if="customer.credit_enabled"
                    icon="pi pi-history"
                    :label="compact ? '' : 'Historial'"
                    class="p-button-text p-button-sm"
                    @click="handleViewHistory"
                />
            </div>
        </template>
    </Card>
</template>

<style scoped>
.credit-summary-card {
    @apply border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg;
}

.compact-card {
    @apply shadow-sm;
}

.card-header {
    @apply flex justify-between items-start p-4 pb-0;
}

.compact-header {
    @apply flex justify-between items-center mb-4;
}

.customer-info {
    @apply flex-1;
}

.customer-name {
    @apply text-lg font-bold text-gray-900 dark:text-white m-0;
}

.compact-card .customer-name {
    @apply text-base;
}

.customer-document {
    @apply text-sm text-gray-600 dark:text-gray-400 m-0;
}

.status-badge {
    @apply flex-shrink-0;
}

.status-indicator {
    @apply font-semibold;
}

.credit-info {
    @apply space-y-4;
}

.limit-section {
    @apply mb-4;
}

.metrics-grid {
    @apply grid grid-cols-4 gap-4 text-center;
}

.compact-metrics {
    @apply grid-cols-3 gap-2;
}

.metric-item {
    @apply space-y-1;
}

.metric-value {
    @apply text-lg font-bold text-gray-900 dark:text-white;
}

.compact-card .metric-value {
    @apply text-sm;
}

.metric-value.debt {
    @apply text-orange-600 dark:text-orange-400;
}

.metric-value.available {
    @apply text-green-600 dark:text-green-400;
}

.metric-label {
    @apply text-xs text-gray-600 dark:text-gray-400 font-medium;
}

.stats-section {
    @apply space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700;
}

.stat-row {
    @apply flex justify-between items-center;
}

.stat-label {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.stat-value {
    @apply text-sm font-semibold text-gray-900 dark:text-white;
}

.alert-section {
    @apply space-y-2;
}

.alert {
    @apply flex items-center gap-2 p-3 rounded-lg text-sm font-medium;
}

.overdue-alert {
    @apply bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700;
}

.limit-alert {
    @apply bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700;
}

.disabled-credit {
    @apply text-center py-6;
}

.disabled-message {
    @apply flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400;
}

.actions-footer {
    @apply flex gap-2 flex-wrap;
}

.compact-card .actions-footer {
    @apply justify-center;
}

/* Estilos para tarjetas de PrimeVue */
:deep(.credit-summary-card .p-card-content) {
    @apply p-4;
}

:deep(.compact-card .p-card-content) {
    @apply p-3;
}

:deep(.credit-summary-card .p-card-footer) {
    @apply p-4 pt-0 bg-gray-50 dark:bg-gray-700/50;
}

:deep(.compact-card .p-card-footer) {
    @apply p-3 pt-0;
}

/* Responsive */
@media (max-width: 640px) {
    .metrics-grid {
        @apply grid-cols-2 gap-2;
    }
    
    .compact-metrics {
        @apply grid-cols-2;
    }
    
    .card-header {
        @apply flex-col gap-2;
    }
    
    .actions-footer {
        @apply justify-center;
    }
}
</style>