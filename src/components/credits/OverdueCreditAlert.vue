<script setup>
import { computed } from 'vue';
import InlineMessage from 'primevue/inlinemessage';
import Button from 'primevue/button';

const props = defineProps({
    customer: {
        type: Object,
        required: true
    },
    credits: {
        type: Array,
        default: () => []
    },
    severity: {
        type: String,
        default: 'warn',
        validator: (value) => ['info', 'warn', 'error', 'success'].includes(value)
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

const emit = defineEmits(['payment-request', 'view-details', 'dismiss']);

// Verificar si el cliente tiene créditos vencidos
const hasOverdueCredits = computed(() => {
    return props.customer.has_overdue_credits || props.credits.some((credit) => credit.is_overdue);
});

// Contar créditos vencidos
const overdueCount = computed(() => {
    return props.customer.overdue_credits_count || props.credits.filter((credit) => credit.is_overdue).length || 0;
});

// Calcular monto total vencido
const totalOverdueAmount = computed(() => {
    const overdueCredits = props.credits.filter((credit) => credit.is_overdue);
    return overdueCredits.reduce((sum, credit) => sum + (credit.remaining_amount || 0), 0);
});

// Calcular días de mora máximo
const maxOverdueDays = computed(() => {
    const overdueCredits = props.credits.filter((credit) => credit.is_overdue);
    if (overdueCredits.length === 0) return 0;

    return Math.max(
        ...overdueCredits.map((credit) => {
            const dueDate = new Date(credit.due_date);
            const today = new Date();
            const diffTime = today - dueDate;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        })
    );
});

// Determinar severidad basada en días de mora
const alertSeverity = computed(() => {
    if (!hasOverdueCredits.value) return 'success';
    if (maxOverdueDays.value > 60) return 'error';
    if (maxOverdueDays.value > 30) return 'warn';
    return 'info';
});

// Configurar mensaje
const alertMessage = computed(() => {
    if (!hasOverdueCredits.value) {
        return 'Cliente al día con sus pagos';
    }

    let message = `Cliente tiene ${overdueCount.value} crédito${overdueCount.value !== 1 ? 's' : ''} vencido${overdueCount.value !== 1 ? 's' : ''}`;

    if (maxOverdueDays.value > 0) {
        message += ` (${maxOverdueDays.value} días de mora máximo)`;
    }

    if (totalOverdueAmount.value > 0) {
        const formattedAmount = formatCurrency(totalOverdueAmount.value);
        message += ` por ${formattedAmount}`;
    }

    return message;
});

// Configurar icono
const alertIcon = computed(() => {
    const iconMap = {
        success: 'pi pi-check-circle',
        info: 'pi pi-info-circle',
        warn: 'pi pi-exclamation-triangle',
        error: 'pi pi-times-circle'
    };
    return iconMap[alertSeverity.value] || 'pi pi-info-circle';
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
    emit('payment-request', {
        customer: props.customer,
        overdueCredits: props.credits.filter((credit) => credit.is_overdue)
    });
};

const handleViewDetails = () => {
    emit('view-details', {
        customer: props.customer,
        overdueCredits: props.credits.filter((credit) => credit.is_overdue)
    });
};

const handleDismiss = () => {
    emit('dismiss');
};
</script>

<script>
// Métodos auxiliares
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const getDaysOverdue = (credit) => {
    if (!credit.due_date) return 0;
    const dueDate = new Date(credit.due_date);
    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
</script>

<template>
    <div v-if="hasOverdueCredits || !compact" class="overdue-credit-alert">
        <!-- Mensaje principal -->
        <InlineMessage :severity="alertSeverity" class="alert-message w-full" :class="{ 'compact-message': compact }">
            <template #icon>
                <i :class="alertIcon"></i>
            </template>

            <div class="alert-content">
                <div class="alert-text">
                    <div class="main-message">{{ alertMessage }}</div>

                    <!-- Información adicional (solo en modo no compacto) -->
                    <div v-if="!compact && hasOverdueCredits" class="additional-info">
                        <div v-if="totalOverdueAmount > 0" class="amount-info">
                            Monto total vencido: <strong>{{ formatCurrency(totalOverdueAmount) }}</strong>
                        </div>
                        <div v-if="maxOverdueDays > 0" class="days-info">
                            Días máximos de mora: <strong>{{ maxOverdueDays }} días</strong>
                        </div>
                    </div>
                </div>

                <!-- Acciones -->
                <div v-if="showActions && hasOverdueCredits" class="alert-actions">
                    <Button icon="pi pi-dollar" :label="compact ? '' : 'Registrar Pago'" size="small" class="p-button-sm" :class="alertSeverity === 'error' ? 'p-button-danger' : 'p-button-warning'" @click="handlePaymentRequest" />
                    <Button v-if="!compact" icon="pi pi-eye" label="Ver Detalles" size="small" class="p-button-text p-button-sm" @click="handleViewDetails" />
                </div>
            </div>
        </InlineMessage>

        <!-- Lista de créditos vencidos (modo expandido) -->
        <div v-if="!compact && hasOverdueCredits && credits.length > 0" class="overdue-details">
            <div class="details-header">
                <h5 class="details-title">Créditos Vencidos:</h5>
            </div>
            <div class="overdue-list">
                <div v-for="credit in credits.filter((c) => c.is_overdue)" :key="credit.id" class="overdue-item">
                    <div class="item-info">
                        <div class="sale-number">Venta #{{ credit.sale?.document_number || credit.id }}</div>
                        <div class="due-date">Venció el {{ formatDate(credit.due_date) }} ({{ getDaysOverdue(credit) }} días)</div>
                    </div>
                    <div class="item-amount">
                        {{ formatCurrency(credit.remaining_amount) }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.overdue-credit-alert {
    @apply space-y-3;
}

.alert-message {
    @apply border-l-4;
}

.alert-message[data-pc-severity='error'] {
    @apply border-l-red-500 bg-red-50 dark:bg-red-900/20;
}

.alert-message[data-pc-severity='warn'] {
    @apply border-l-orange-500 bg-orange-50 dark:bg-orange-900/20;
}

.alert-message[data-pc-severity='info'] {
    @apply border-l-blue-500 bg-blue-50 dark:bg-blue-900/20;
}

.alert-message[data-pc-severity='success'] {
    @apply border-l-green-500 bg-green-50 dark:bg-green-900/20;
}

.compact-message {
    @apply text-sm;
}

.alert-content {
    @apply flex justify-between items-start gap-4 w-full;
}

.alert-text {
    @apply flex-1;
}

.main-message {
    @apply font-semibold;
}

.additional-info {
    @apply mt-2 space-y-1 text-sm opacity-90;
}

.alert-actions {
    @apply flex gap-2 flex-shrink-0;
}

.overdue-details {
    @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.details-header {
    @apply mb-3;
}

.details-title {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300 m-0;
}

.overdue-list {
    @apply space-y-2;
}

.overdue-item {
    @apply flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600;
}

.item-info {
    @apply flex-1;
}

.sale-number {
    @apply font-semibold text-gray-900 dark:text-white;
}

.due-date {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.item-amount {
    @apply font-bold text-red-600 dark:text-red-400;
}

/* Estilos para InlineMessage de PrimeVue */
:deep(.alert-message .p-inline-message) {
    @apply w-full;
}

:deep(.alert-message .p-inline-message-icon) {
    @apply mr-3;
}

:deep(.alert-message .p-inline-message-text) {
    @apply flex-1;
}

/* Responsive */
@media (max-width: 640px) {
    .alert-content {
        @apply flex-col gap-2;
    }

    .alert-actions {
        @apply w-full justify-center;
    }

    .overdue-item {
        @apply flex-col items-start gap-2;
    }

    .item-amount {
        @apply self-end;
    }
}
</style>
