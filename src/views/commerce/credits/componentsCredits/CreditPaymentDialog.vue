<script setup>
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, reactive, ref, watch } from 'vue';

import { fetchPaymentMethods } from '@/api';
import { useCreditsStore } from '@/stores/creditsStore';

const props = defineProps({
    visible: { type: Boolean, default: false },
    credit: { type: Object, default: null }
});

const emit = defineEmits(['update:visible', 'success']);

const toast = useToast();

// Store
const creditsStore = useCreditsStore();

// Estado del formulario
const payment = reactive({
    customer_id: null,
    payment_amount: 0,
    payment_method_id: null,
    payment_date: new Date(),
    reference_number: '',
    notes: '',
    distribution_mode: 'fifo' // 'fifo' o 'manual'
});

// Estado de carga
const loading = ref(false);

// Datos necesarios
const paymentMethods = ref([]);
const customerCredits = ref([]);
const manualDistribution = ref([]);

// Cargar métodos de pago
const loadPaymentMethods = async () => {
    try {
        const response = await fetchPaymentMethods();
        paymentMethods.value = response.data.results || response.data || [];
    } catch (error) {
        console.error('Error loading payment methods:', error);
        // Datos de ejemplo para desarrollo
        paymentMethods.value = [
            { id: 1, name: 'Efectivo', is_active: true },
            { id: 2, name: 'Transferencia Bancaria', is_active: true },
            { id: 3, name: 'Tarjeta de Crédito', is_active: true }
        ];
    }
};

// Cargar créditos pendientes del cliente
const loadCustomerCredits = async (customerId) => {
    if (!customerId) return;

    try {
        customerCredits.value = await creditsStore.fetchCustomerPendingCredits(customerId);
        // Inicializar distribución manual
        initializeManualDistribution();
    } catch (error) {
        console.error('Error loading customer credits:', error);
    }
};

// Inicializar distribución manual
const initializeManualDistribution = () => {
    manualDistribution.value = customerCredits.value.map((credit) => ({
        credit_id: credit.id,
        credit_info: credit,
        allocated_amount: 0,
        previous_balance: toNumber(credit.amounts?.remaining_amount),
        new_balance: toNumber(credit.amounts?.remaining_amount)
    }));
};

// Calcular distribución automática FIFO
const automaticDistribution = computed(() => {
    const distribution = [];
    let remainingAmount = payment.payment_amount;

    for (const credit of customerCredits.value) {
        if (remainingAmount <= 0) break;

        const allocatedAmount = Math.min(remainingAmount, toNumber(credit.amounts?.remaining_amount));

        if (allocatedAmount > 0) {
            distribution.push({
                credit_id: credit.id,
                credit_info: credit,
                allocated_amount: allocatedAmount,
                previous_balance: toNumber(credit.amounts?.remaining_amount),
                new_balance: toNumber(credit.amounts?.remaining_amount) - allocatedAmount
            });

            remainingAmount -= allocatedAmount;
        }
    }

    return distribution;
});

// Distribución actual (fifo o manual)
const currentDistribution = computed(() => {
    return payment.distribution_mode === 'fifo' ? automaticDistribution.value : manualDistribution.value;
});

// Total distribuido
const totalDistributed = computed(() => {
    return currentDistribution.value.reduce((sum, item) => sum + (item.allocated_amount || 0), 0);
});

// Validaciones
const isValidPayment = computed(() => {
    return payment.payment_amount > 0 && payment.payment_method_id && payment.payment_date && Math.abs(totalDistributed.value - payment.payment_amount) < 0.01;
});

// Formateo de moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount || 0);
};

// Formateo de fecha
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

// Convertir string a número
const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
};

// Convertir fecha a formato YYYY-MM-DD
const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

// Actualizar distribución manual
const updateManualAllocation = (index, amount) => {
    manualDistribution.value[index].allocated_amount = amount || 0;
    manualDistribution.value[index].new_balance = manualDistribution.value[index].previous_balance - (amount || 0);
};

// Resetear formulario
const resetForm = () => {
    payment.customer_id = props.credit?.customer?.id || null;
    payment.payment_amount = toNumber(props.credit?.amounts?.remaining_amount);
    payment.payment_method_id = null;
    payment.payment_date = new Date();
    payment.reference_number = '';
    payment.notes = '';
    payment.distribution_mode = 'fifo';

    if (payment.customer_id) {
        loadCustomerCredits(payment.customer_id);
    }
};

// Cerrar diálogo
const close = () => {
    emit('update:visible', false);
};

// Enviar pago
const submitPayment = async () => {
    if (!isValidPayment.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Por favor complete todos los campos requeridos',
            life: 3000
        });
        return;
    }

    loading.value = true;

    try {
        const paymentData = {
            ...payment,
            payment_date: formatDateForAPI(payment.payment_date),
            manual_allocations: currentDistribution.value.map((item) => ({
                credit_id: item.credit_id,
                amount: item.allocated_amount
            }))
        };

        await creditsStore.processPayment(paymentData);

        emit('success');
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pago registrado correctamente',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al registrar el pago',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

// Watchers
watch(
    () => props.visible,
    (visible) => {
        if (visible) {
            resetForm();
            loadPaymentMethods();
        }
    }
);

watch(
    () => payment.distribution_mode,
    () => {
        if (payment.distribution_mode === 'manual') {
            initializeManualDistribution();
        }
    }
);
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :style="{ width: '800px', maxWidth: '95vw' }" header="💰 Registrar Pago de Crédito" :modal="true" class="payment-dialog" :closable="true">
        <div v-if="credit" class="payment-form">
            <!-- Información del cliente y crédito -->
            <Card class="customer-info-card">
                <template #content>
                    <div class="customer-header">
                        <div class="customer-details">
                            <h3 class="customer-name">{{ credit.customer?.name }}</h3>
                            <p class="customer-document">{{ credit.customer?.identity_document }}</p>
                        </div>
                        <div class="credit-summary">
                            <div class="credit-amount">
                                <span class="label">Saldo pendiente:</span>
                                <span class="amount pending">{{ formatCurrency(credit.amounts?.remaining_amount) }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>

            <!-- Formulario de pago -->
            <div class="form-grid">
                <!-- Monto del pago -->
                <div class="form-field md:col-span-2">
                    <label class="field-label">Monto del Pago *</label>
                    <InputNumber v-model="payment.payment_amount" mode="currency" currency="PEN" :min="0.01" :max="99999.99" placeholder="0.00" class="form-input" />
                </div>

                <!-- Método de pago -->
                <div class="form-field">
                    <label class="field-label">Método de Pago *</label>
                    <Select v-model="payment.payment_method_id" :options="paymentMethods" optionLabel="name" optionValue="id" placeholder="Seleccione método" class="form-input" />
                </div>

                <!-- Fecha del pago -->
                <div class="form-field">
                    <label class="field-label">Fecha del Pago *</label>
                    <DatePicker v-model="payment.payment_date" dateFormat="dd/mm/yy" :maxDate="new Date()" class="form-input" :showIcon="true" />
                </div>

                <!-- Número de referencia -->
                <div class="form-field">
                    <label class="field-label">Número de Referencia</label>
                    <InputText v-model="payment.reference_number" placeholder="Opcional" class="form-input" />
                </div>

                <!-- Notas -->
                <div class="form-field">
                    <label class="field-label">Notas</label>
                    <Textarea v-model="payment.notes" rows="2" placeholder="Notas adicionales..." class="form-input" />
                </div>
            </div>

            <!-- Modo de distribución -->
            <Card class="distribution-card">
                <template #title>
                    <div class="card-title">
                        <i class="pi pi-percentage"></i>
                        Distribución del Pago
                    </div>
                </template>
                <template #content>
                    <!-- Selector de modo -->
                    <div class="distribution-mode">
                        <div class="mode-option">
                            <RadioButton id="fifo" v-model="payment.distribution_mode" value="fifo" />
                            <label for="fifo" class="mode-label">
                                <span class="mode-title">Automático (FIFO)</span>
                                <span class="mode-description">Se aplicará a los créditos más antiguos primero</span>
                            </label>
                        </div>
                        <div class="mode-option">
                            <RadioButton id="manual" v-model="payment.distribution_mode" value="manual" />
                            <label for="manual" class="mode-label">
                                <span class="mode-title">Manual</span>
                                <span class="mode-description">Asignar montos específicos a cada crédito</span>
                            </label>
                        </div>
                    </div>

                    <!-- Vista previa de distribución -->
                    <div class="distribution-preview">
                        <h4 class="preview-title">Vista Previa de Aplicación</h4>

                        <DataTable :value="currentDistribution" class="distribution-table">
                            <Column field="credit_info.sale.document_number" header="Venta">
                                <template #body="{ data }">
                                    <div class="sale-info">
                                        <div class="sale-number"># {{ data.credit_info.sale?.document_number }}</div>
                                        <div class="sale-date">{{ formatDate(data.credit_info.dates?.credit_date) }}</div>
                                    </div>
                                </template>
                            </Column>

                            <Column field="previous_balance" header="Saldo Actual">
                                <template #body="{ data }">
                                    {{ formatCurrency(data.previous_balance) }}
                                </template>
                            </Column>

                            <Column field="allocated_amount" header="Monto a Aplicar">
                                <template #body="{ data, index }">
                                    <InputNumber
                                        v-if="payment.distribution_mode === 'manual'"
                                        :modelValue="data.allocated_amount"
                                        @update:modelValue="updateManualAllocation(index, $event)"
                                        mode="currency"
                                        currency="PEN"
                                        :min="0"
                                        :max="data.previous_balance"
                                        class="allocation-input"
                                    />
                                    <span v-else class="allocated-amount">
                                        {{ formatCurrency(data.allocated_amount) }}
                                    </span>
                                </template>
                            </Column>

                            <Column field="new_balance" header="Nuevo Saldo">
                                <template #body="{ data }">
                                    <Badge :value="formatCurrency(data.new_balance)" :severity="data.new_balance === 0 ? 'success' : 'warning'" />
                                </template>
                            </Column>
                        </DataTable>

                        <!-- Resumen de distribución -->
                        <div class="distribution-summary">
                            <div class="summary-row">
                                <span class="summary-label">Total a Pagar:</span>
                                <span class="summary-value">{{ formatCurrency(payment.payment_amount) }}</span>
                            </div>
                            <div class="summary-row">
                                <span class="summary-label">Total Distribuido:</span>
                                <span class="summary-value" :class="{ 'text-red-600': totalDistributed !== payment.payment_amount }">
                                    {{ formatCurrency(totalDistributed) }}
                                </span>
                            </div>
                            <div v-if="Math.abs(totalDistributed - payment.payment_amount) > 0.01" class="summary-row error">
                                <span class="summary-label">Diferencia:</span>
                                <span class="summary-value text-red-600">
                                    {{ formatCurrency(payment.payment_amount - totalDistributed) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="close" />
                <Button label="Registrar Pago" icon="pi pi-check" class="p-button-success" :disabled="!isValidPayment" :loading="loading" @click="submitPayment" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.payment-form {
    @apply space-y-6;
}

.customer-info-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.customer-header {
    @apply flex justify-between items-start;
}

.customer-details {
    @apply flex-1;
}

.customer-name {
    @apply text-xl font-bold text-gray-900 dark:text-white m-0;
}

.customer-document {
    @apply text-gray-600 dark:text-gray-400 m-0;
}

.credit-summary {
    @apply text-right;
}

.credit-amount {
    @apply flex flex-col gap-1;
}

.credit-amount .label {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.credit-amount .amount {
    @apply text-lg font-bold;
}

.credit-amount .amount.pending {
    @apply text-orange-600 dark:text-orange-400;
}

.form-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-field {
    @apply flex flex-col gap-2;
}

.field-label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-input {
    @apply w-full;
}

.distribution-card {
    @apply border border-gray-200 dark:border-gray-700;
}

.card-title {
    @apply flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200;
}

.card-title i {
    @apply text-purple-600 dark:text-purple-400;
}

.distribution-mode {
    @apply space-y-4 mb-6;
}

.mode-option {
    @apply flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-700;
}

.mode-label {
    @apply flex flex-col gap-1 cursor-pointer;
}

.mode-title {
    @apply font-semibold text-gray-900 dark:text-white;
}

.mode-description {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.distribution-preview {
    @apply space-y-4;
}

.preview-title {
    @apply text-lg font-semibold text-gray-800 dark:text-gray-200 m-0;
}

.distribution-table {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.sale-info {
    @apply space-y-1;
}

.sale-number {
    @apply font-semibold text-gray-900 dark:text-white;
}

.sale-date {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.allocation-input {
    @apply w-full;
}

.allocated-amount {
    @apply font-mono text-green-600 dark:text-green-400;
}

.distribution-summary {
    @apply mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2;
}

.summary-row {
    @apply flex justify-between items-center;
}

.summary-row.error {
    @apply pt-2 border-t border-red-200 dark:border-red-700;
}

.summary-label {
    @apply font-medium text-gray-700 dark:text-gray-300;
}

.summary-value {
    @apply font-bold text-gray-900 dark:text-white;
}

.dialog-footer {
    @apply flex justify-between items-center w-full;
}

/* Estilos del diálogo */
:deep(.payment-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-green-600 to-emerald-600 text-white;
}

:deep(.payment-dialog .p-dialog-content) {
    @apply p-6;
}

:deep(.payment-dialog .p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-700;
}

/* Estilos de componentes */
:deep(.customer-info-card .p-card-content) {
    @apply p-4;
}

:deep(.distribution-card .p-card-content) {
    @apply p-4;
}

:deep(.distribution-table .p-datatable-thead > tr > th) {
    @apply bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold;
}

/* Responsive */
@media (max-width: 768px) {
    .customer-header {
        @apply flex-col gap-4;
    }

    .form-grid {
        @apply grid-cols-1;
    }

    .form-field.col-span-2 {
        @apply col-span-1;
    }
}
</style>
