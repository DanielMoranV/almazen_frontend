<script setup>
import { usePaymentMethodsStore } from '@/stores/paymentMethodsStore';
import { useCustomersStore } from '@/stores/customersStore';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    quote: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'approve']);

const paymentMethodsStore = usePaymentMethodsStore();
const customersStore = useCustomersStore();

// Estados adicionales
const customerCreditInfo = ref(null);
const loadingCreditInfo = ref(false);

// Estados del formulario
const form = reactive({
    voucher_type: '',
    payment_methods: []
});

const errors = reactive({
    voucher_type: '',
    general: '',
    payment_methods: []
});

// Opciones de tipo de comprobante
const voucherTypeOptions = [
    { label: 'Boleta', value: 'boleta' },
    { label: 'Factura', value: 'factura' },
    { label: 'Ticket', value: 'ticket' }
];

// Computed properties
const availablePaymentMethods = computed(() => {
    if (!props.quote?.total_amount) return [];
    return paymentMethodsStore.getMethodsForSale(props.quote.total_amount);
});

const paymentsTotal = computed(() => {
    return form.payment_methods.reduce((total, payment) => {
        return total + (parseFloat(payment.amount) || 0);
    }, 0);
});

const remainingAmount = computed(() => {
    const quoteTotal = parseFloat(props.quote?.total_amount || 0);
    return quoteTotal - paymentsTotal.value;
});

const canAddPaymentMethod = computed(() => {
    // Verificar si ya hay un método de efectivo (solo uno permitido)
    const hasCashMethod = form.payment_methods.some((payment) => {
        const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === payment.method_id);
        return method?.type === 'CASH';
    });

    // No permitir más métodos si ya hay efectivo y cubre el total
    if (hasCashMethod && Math.abs(remainingAmount.value) <= 0.01) {
        return false;
    }

    return remainingAmount.value > 0.01;
});

const isFormValid = computed(() => {
    if (!form.voucher_type) return false;
    if (form.payment_methods.length === 0) return false;
    if (Math.abs(remainingAmount.value) > 0.01) return false;

    // Validar cada método de pago
    return form.payment_methods.every((payment, index) => {
        if (!payment.method_id || !payment.amount || payment.amount <= 0) return false;
        if (requiresReference(payment.method_id) && !payment.reference) return false;

        // Validar usando el store
        const validation = paymentMethodsStore.validateMethod(payment.method_id, payment.amount, !!payment.reference);
        return validation.valid;
    });
});

// Métodos
const formatCurrency = (value) => {
    if (!value) return 'S/ 0.00';
    return `S/ ${parseFloat(value).toFixed(2)}`;
};

const addPaymentMethod = () => {
    form.payment_methods.push({
        method_id: null,
        amount: remainingAmount.value > 0 ? remainingAmount.value : null,
        reference: ''
    });

    errors.payment_methods.push({});
};

const removePaymentMethod = (index) => {
    form.payment_methods.splice(index, 1);
    errors.payment_methods.splice(index, 1);
};

const requiresReference = (methodId) => {
    if (!methodId) return false;
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === methodId);
    return method?.requires_reference || false;
};

const getPaymentError = (index, field) => {
    return errors.payment_methods[index]?.[field] || '';
};

const onPaymentMethodChange = (index) => {
    const payment = form.payment_methods[index];
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === payment.method_id);

    // Limpiar referencia si el método no la requiere
    if (!requiresReference(payment.method_id)) {
        payment.reference = '';
    }

    // Verificar si es método de efectivo y hay otros métodos
    if (method?.type === 'CASH' && form.payment_methods.length > 1) {
        // Si es efectivo, ajustar el monto al total restante
        payment.amount = remainingAmount.value + (payment.amount || 0);
    }

    validatePaymentMethod(index);
};

const validatePaymentAmount = (index) => {
    const payment = form.payment_methods[index];
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === payment.method_id);

    if (!method) return;

    // Validar usando el store
    const validation = paymentMethodsStore.validateMethod(payment.method_id, payment.amount, !!payment.reference);

    if (!validation.valid) {
        if (!errors.payment_methods[index]) errors.payment_methods[index] = {};
        errors.payment_methods[index].amount = validation.message;
    } else {
        if (errors.payment_methods[index]) {
            delete errors.payment_methods[index].amount;
        }
    }
};

const validatePaymentMethod = (index) => {
    const payment = form.payment_methods[index];
    const paymentErrors = {};

    if (!payment.method_id) {
        paymentErrors.method_id = 'Seleccione un método de pago';
    }

    if (!payment.amount || payment.amount <= 0) {
        paymentErrors.amount = 'Ingrese un monto válido';
    }

    if (requiresReference(payment.method_id) && !payment.reference) {
        paymentErrors.reference = 'Ingrese el número de referencia';
    }

    // Validación específica para métodos de crédito
    if (isCreditsMethod(payment.method_id)) {
        if (!customerCreditInfo.value?.credit_enabled) {
            paymentErrors.method_id = 'El cliente no tiene crédito habilitado';
        } else if (payment.amount && !canUseCredit(payment.amount)) {
            paymentErrors.amount = `Excede el crédito disponible: ${formatCurrency(customerCreditInfo.value?.available_credit || 0)}`;
        }
    }

    errors.payment_methods[index] = paymentErrors;
};

const validateForm = () => {
    // Limpiar errores
    errors.voucher_type = '';
    errors.general = '';

    // Validar tipo de comprobante
    if (!form.voucher_type) {
        errors.voucher_type = 'Seleccione el tipo de comprobante';
    }

    // Validar métodos de pago
    if (form.payment_methods.length === 0) {
        errors.general = 'Debe agregar al menos un método de pago';
        return false;
    }

    // Validar suma de pagos
    if (Math.abs(remainingAmount.value) > 0.01) {
        errors.general = 'La suma de los pagos debe coincidir con el total de la cotización';
        return false;
    }

    // Validar cada método de pago
    let hasErrors = false;
    form.payment_methods.forEach((payment, index) => {
        validatePaymentMethod(index);
        if (Object.keys(errors.payment_methods[index] || {}).length > 0) {
            hasErrors = true;
        }
    });

    // Verificar límite de métodos de efectivo
    const cashMethods = form.payment_methods.filter((payment) => {
        const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === payment.method_id);
        return method?.type === 'CASH';
    });

    if (cashMethods.length > 1) {
        errors.general = 'Solo se permite un método de pago en efectivo por aprobación';
        return false;
    }

    return !hasErrors;
};

const handleApproval = () => {
    if (!validateForm()) return;

    const approvalData = {
        voucher_type: form.voucher_type,
        payment_methods: form.payment_methods.map((payment) => ({
            method_id: payment.method_id,
            amount: parseFloat(payment.amount),
            reference: payment.reference || null
        }))
    };

    emit('approve', approvalData);
};

const resetForm = () => {
    form.voucher_type = '';
    form.payment_methods = [];
    errors.voucher_type = '';
    errors.general = '';
    errors.payment_methods = [];
};

// Métodos para información de crédito
const loadCustomerCreditInfo = async () => {
    if (!props.quote?.customer?.id) return;

    loadingCreditInfo.value = true;
    try {
        await customersStore.fetchCustomer(props.quote.customer.id);
        const customer = customersStore.customer;

        if (customer) {
            customerCreditInfo.value = {
                credit_enabled: customer.credit_enabled || false,
                credit_limit: parseFloat(customer.credit_limit || 0),
                used_credit: parseFloat(customer.used_credit || 0),
                available_credit: parseFloat(customer.credit_limit || 0) - parseFloat(customer.used_credit || 0)
            };
        }
    } catch (error) {
        console.error('Error loading customer credit info:', error);
    } finally {
        loadingCreditInfo.value = false;
    }
};

// Métodos para UI mejorada
const getMethodName = (methodId) => {
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === methodId);
    return method?.name || 'Método no encontrado';
};

const getMethodInfo = (methodId) => {
    return paymentMethodsStore.paymentMethods.find((pm) => pm.id === methodId);
};

const getMethodTypeLabel = (type) => {
    const labels = {
        CASH: 'Efectivo',
        CARD: 'Tarjeta',
        TRANSFER: 'Transferencia',
        CREDIT: 'Crédito'
    };
    return labels[type] || type;
};

const getMethodTypeIcon = (methodId) => {
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === methodId);
    if (!method) return 'pi pi-question';

    const icons = {
        CASH: 'pi pi-money-bill',
        CARD: 'pi pi-credit-card',
        TRANSFER: 'pi pi-send',
        CREDIT: 'pi pi-user-plus'
    };
    return icons[method.type] || 'pi pi-circle';
};

const getMethodTypeBadgeClass = (methodId) => {
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === methodId);
    if (!method) return 'method-badge-default';

    const classes = {
        CASH: 'method-badge-cash',
        CARD: 'method-badge-card',
        TRANSFER: 'method-badge-transfer',
        CREDIT: 'method-badge-credit'
    };
    return classes[method.type] || 'method-badge-default';
};

const isCreditsMethod = (methodId) => {
    const method = paymentMethodsStore.paymentMethods.find((pm) => pm.id === methodId);
    return method?.type === 'CREDIT';
};

const canUseCredit = (amount) => {
    if (!customerCreditInfo.value || !customerCreditInfo.value.credit_enabled) {
        return false;
    }

    return amount <= customerCreditInfo.value.available_credit;
};

// Watchers
watch(
    () => props.visible,
    (newVisible) => {
        if (newVisible) {
            resetForm();
            // Cargar métodos de pago si no están cargados
            if (paymentMethodsStore.paymentMethods.length === 0) {
                paymentMethodsStore.fetchPaymentMethods({ active_only: true });
            }
            // Cargar información de crédito del cliente
            loadCustomerCreditInfo();
        }
    }
);

watch(
    () => props.quote?.customer?.id,
    (newCustomerId) => {
        if (newCustomerId && props.visible) {
            loadCustomerCreditInfo();
        }
    }
);

// Lifecycle
onMounted(() => {
    // Cargar métodos de pago
    paymentMethodsStore.fetchPaymentMethods({ active_only: true });
});
</script>

<template>
    <Dialog :visible="visible" modal header="Aprobar Cotización" :style="{ width: '800px' }" class="quote-approval-dialog" @update:visible="emit('update:visible', $event)">
        <div class="approval-content">
            <!-- Información de la cotización en layout de dos columnas -->
            <div class="quote-info-section">
                <div class="quote-overview">
                    <div class="quote-basic-info">
                        <div class="quote-header">
                            <div class="quote-icon">
                                <i class="pi pi-file-edit"></i>
                            </div>
                            <div class="quote-details">
                                <h3 class="quote-title">{{ quote?.quote_number || 'Sin número' }}</h3>
                                <p class="customer-name">{{ quote?.customer?.name || 'Cliente no especificado' }}</p>
                            </div>
                        </div>
                        <div class="quote-amount">
                            <div class="amount-label">Total a Pagar</div>
                            <div class="amount-value">{{ formatCurrency(quote?.total_amount) }}</div>
                        </div>
                    </div>

                    <!-- Información de crédito separada -->
                    <div v-if="customerCreditInfo || loadingCreditInfo" class="credit-section">
                        <div class="section-title">
                            <i class="pi pi-credit-card mr-2"></i>
                            <span>Estado de Crédito</span>
                        </div>

                        <div v-if="loadingCreditInfo" class="credit-loading-state">
                            <i class="pi pi-spinner pi-spin mr-2"></i>
                            <span>Verificando crédito del cliente...</span>
                        </div>

                        <div v-else-if="customerCreditInfo" class="credit-info-card">
                            <div class="credit-status">
                                <Tag v-if="customerCreditInfo.credit_enabled" severity="success" icon="pi pi-check" value="Crédito Habilitado" />
                                <Tag v-else severity="danger" icon="pi pi-times" value="Sin Crédito" />
                            </div>

                            <div v-if="customerCreditInfo.credit_enabled" class="credit-details-grid">
                                <div class="credit-stat">
                                    <div class="stat-label">Límite de Crédito</div>
                                    <div class="stat-value">{{ formatCurrency(customerCreditInfo.credit_limit) }}</div>
                                </div>
                                <div class="credit-stat">
                                    <div class="stat-label">Crédito Usado</div>
                                    <div class="stat-value text-red-600">{{ formatCurrency(customerCreditInfo.used_credit) }}</div>
                                </div>
                                <div class="credit-stat">
                                    <div class="stat-label">Crédito Disponible</div>
                                    <div class="stat-value text-green-600">{{ formatCurrency(customerCreditInfo.available_credit) }}</div>
                                </div>

                                <div class="credit-progress-section">
                                    <div class="progress-header">
                                        <span class="progress-label">Uso del Crédito</span>
                                        <span class="progress-percentage">{{ ((customerCreditInfo.used_credit / customerCreditInfo.credit_limit) * 100).toFixed(1) }}%</span>
                                    </div>
                                    <ProgressBar :value="(customerCreditInfo.used_credit / customerCreditInfo.credit_limit) * 100" :showValue="false" class="credit-progress-bar" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Layout de dos columnas para configuración -->
            <div class="configuration-section">
                <div class="config-grid">
                    <!-- Tipo de comprobante -->
                    <div class="config-item">
                        <div class="config-header">
                            <i class="pi pi-file mr-2"></i>
                            <label class="config-label required">Tipo de Comprobante</label>
                        </div>
                        <Select v-model="form.voucher_type" :options="voucherTypeOptions" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" class="w-full voucher-select" :class="{ 'p-invalid': errors.voucher_type }" />
                        <small v-if="errors.voucher_type" class="p-error">{{ errors.voucher_type }}</small>
                    </div>

                    <!-- Resumen rápido -->
                    <div class="config-item">
                        <div class="config-header">
                            <i class="pi pi-calculator mr-2"></i>
                            <span class="config-label">Resumen de Pago</span>
                        </div>
                        <div class="payment-quick-summary">
                            <div class="summary-item">
                                <span class="summary-label">Total:</span>
                                <span class="summary-value">{{ formatCurrency(quote?.total_amount) }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Pagos:</span>
                                <span
                                    class="summary-value"
                                    :class="{
                                        'text-green-600': Math.abs(remainingAmount) <= 0.01,
                                        'text-red-600': Math.abs(remainingAmount) > 0.01
                                    }"
                                    >{{ formatCurrency(paymentsTotal) }}</span
                                >
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Diferencia:</span>
                                <span
                                    class="summary-value"
                                    :class="{
                                        'text-green-600': Math.abs(remainingAmount) <= 0.01,
                                        'text-red-600': Math.abs(remainingAmount) > 0.01
                                    }"
                                >
                                    {{ formatCurrency(Math.abs(remainingAmount)) }}
                                    <i v-if="Math.abs(remainingAmount) <= 0.01" class="pi pi-check ml-1 text-green-600"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Métodos de pago con mejor estructura -->
            <div class="payment-methods-section">
                <div class="payment-methods-header">
                    <div class="section-title-container">
                        <i class="pi pi-wallet section-icon"></i>
                        <h4 class="section-title">Métodos de Pago</h4>
                        <span class="required-indicator">*</span>
                    </div>
                    <Button icon="pi pi-plus" label="Agregar Método" size="small" outlined @click="addPaymentMethod" :disabled="!canAddPaymentMethod" class="add-payment-btn" />
                </div>

                <div v-if="form.payment_methods.length === 0" class="empty-payment-state">
                    <div class="empty-state-content">
                        <i class="pi pi-wallet empty-icon"></i>
                        <h5 class="empty-title">No hay métodos de pago</h5>
                        <p class="empty-description">Agrega al menos un método de pago para continuar con la aprobación</p>
                        <Button icon="pi pi-plus" label="Agregar Primer Método" @click="addPaymentMethod" class="empty-state-button" />
                    </div>
                </div>

                <div v-else class="payment-methods-list">
                    <div v-for="(payment, index) in form.payment_methods" :key="index" class="payment-method-item">
                        <div class="payment-method-header">
                            <div class="method-identifier">
                                <div class="method-badge">{{ index + 1 }}</div>
                                <div class="method-info">
                                    <span class="method-title">Método de Pago {{ index + 1 }}</span>
                                    <span v-if="payment.method_id" class="method-type">{{ getMethodTypeLabel(getMethodInfo(payment.method_id)?.type) }}</span>
                                </div>
                            </div>
                            <Button icon="pi pi-trash" severity="danger" text size="small" @click="removePaymentMethod(index)" v-tooltip="'Eliminar método de pago'" class="remove-method-btn" />
                        </div>

                        <div class="payment-method-content">
                            <!-- Selector de método -->
                            <div class="method-selector-section">
                                <label class="field-label">Seleccionar Método</label>
                                <Select
                                    v-model="payment.method_id"
                                    :options="availablePaymentMethods"
                                    optionLabel="name"
                                    optionValue="id"
                                    placeholder="Seleccionar método de pago"
                                    class="w-full payment-method-select"
                                    :class="{ 'p-invalid': getPaymentError(index, 'method_id') }"
                                    @change="onPaymentMethodChange(index)"
                                >
                                    <template #value="{ value, placeholder }">
                                        <div v-if="value" class="selected-method-display">
                                            <div class="method-badge-container" :class="getMethodTypeBadgeClass(value)">
                                                <i :class="getMethodTypeIcon(value)"></i>
                                            </div>
                                            <span class="method-name">{{ getMethodName(value) }}</span>
                                        </div>
                                        <span v-else class="placeholder-text">{{ placeholder }}</span>
                                    </template>
                                    <template #option="{ option }">
                                        <div class="payment-method-option">
                                            <div class="method-badge-container" :class="getMethodTypeBadgeClass(option.id)">
                                                <i :class="getMethodTypeIcon(option.id)"></i>
                                            </div>
                                            <div class="option-info">
                                                <div class="option-name">{{ option.name }}</div>
                                                <div class="option-type">{{ getMethodTypeLabel(option.type) }}</div>
                                            </div>
                                        </div>
                                    </template>
                                </Select>
                                <small v-if="getPaymentError(index, 'method_id')" class="error-message">
                                    {{ getPaymentError(index, 'method_id') }}
                                </small>
                            </div>

                            <!-- Campos de entrada organizados -->
                            <div class="payment-inputs-section">
                                <div class="inputs-grid">
                                    <!-- Campo de monto -->
                                    <div class="input-field amount-field">
                                        <label class="field-label">Monto a Pagar</label>
                                        <InputNumber
                                            v-model="payment.amount"
                                            mode="currency"
                                            currency="PEN"
                                            locale="es-PE"
                                            :min="0"
                                            :max="remainingAmount + (payment.amount || 0)"
                                            placeholder="0.00"
                                            class="w-full amount-input-field"
                                            :class="{ 'p-invalid': getPaymentError(index, 'amount') }"
                                            @input="validatePaymentAmount(index)"
                                        />
                                        <small v-if="getPaymentError(index, 'amount')" class="error-message">
                                            {{ getPaymentError(index, 'amount') }}
                                        </small>
                                    </div>

                                    <!-- Campo de referencia -->
                                    <div v-if="requiresReference(payment.method_id)" class="input-field reference-field">
                                        <label class="field-label">Número de Referencia</label>
                                        <InputText v-model="payment.reference" placeholder="Ej: 123456789" class="w-full reference-input-field" :class="{ 'p-invalid': getPaymentError(index, 'reference') }" />
                                        <small v-if="getPaymentError(index, 'reference')" class="error-message">
                                            {{ getPaymentError(index, 'reference') }}
                                        </small>
                                    </div>
                                </div>

                                <!-- Validación de crédito -->
                                <div v-if="isCreditsMethod(payment.method_id) && payment.amount" class="credit-validation-section">
                                    <div v-if="!canUseCredit(payment.amount)" class="validation-message validation-warning">
                                        <i class="pi pi-exclamation-triangle"></i>
                                        <span>Excede crédito disponible: {{ formatCurrency(customerCreditInfo?.available_credit || 0) }}</span>
                                    </div>
                                    <div v-else class="validation-message validation-success">
                                        <i class="pi pi-check"></i>
                                        <span>Crédito disponible suficiente</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Tags informativos -->
                            <div v-if="payment.method_id" class="method-tags-section">
                                <div class="method-tags">
                                    <Tag v-if="getMethodInfo(payment.method_id)?.requires_reference" severity="info" icon="pi pi-info-circle" value="Requiere Referencia" />
                                    <Tag v-if="getMethodInfo(payment.method_id)?.requires_cash_register" severity="warning" icon="pi pi-desktop" value="Requiere Caja" />
                                    <Tag v-if="isCreditsMethod(payment.method_id)" severity="help" icon="pi pi-credit-card" value="Método de Crédito" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen final mejorado -->
            <div v-if="form.payment_methods.length > 0" class="final-summary-section">
                <div class="summary-header">
                    <i class="pi pi-calculator mr-2"></i>
                    <h4 class="summary-title">Resumen Final</h4>
                </div>

                <div class="summary-content">
                    <div class="summary-grid">
                        <div class="summary-item total-item">
                            <div class="item-label">Total de la Cotización</div>
                            <div class="item-value primary-value">{{ formatCurrency(quote?.total_amount) }}</div>
                        </div>

                        <div class="summary-item payments-item">
                            <div class="item-label">Total de Pagos</div>
                            <div
                                class="item-value"
                                :class="{
                                    'success-value': paymentsTotal >= (quote?.total_amount || 0),
                                    'error-value': paymentsTotal < (quote?.total_amount || 0)
                                }"
                            >
                                {{ formatCurrency(paymentsTotal) }}
                            </div>
                        </div>

                        <div class="summary-item difference-item">
                            <div class="item-label">Diferencia</div>
                            <div
                                class="item-value"
                                :class="{
                                    'success-value': Math.abs(remainingAmount) <= 0.01,
                                    'error-value': Math.abs(remainingAmount) > 0.01
                                }"
                            >
                                {{ formatCurrency(Math.abs(remainingAmount)) }}
                                <div class="difference-status">
                                    <span v-if="remainingAmount > 0.01" class="status-text error">Falta pagar</span>
                                    <span v-else-if="remainingAmount < -0.01" class="status-text warning">Sobra dinero</span>
                                    <span v-else class="status-text success"> <i class="pi pi-check mr-1"></i>Pagos completos </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Errores generales -->
            <div v-if="errors.general" class="general-error-section">
                <Message severity="error" :closable="false" class="error-message-display">
                    <template #messageicon>
                        <i class="pi pi-exclamation-triangle"></i>
                    </template>
                    {{ errors.general }}
                </Message>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancelar" severity="secondary" @click="emit('update:visible', false)" :disabled="loading" />
                <Button label="Aprobar Cotización" icon="pi pi-check" :loading="loading" @click="handleApproval" :disabled="!isFormValid || loading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.quote-approval-dialog {
    @apply font-sans;
}

.approval-content {
    @apply space-y-8;
}

/* ===== SECCIÓN DE INFORMACIÓN DE COTIZACIÓN ===== */
.quote-info-section {
    @apply space-y-6;
}

.quote-overview {
    @apply space-y-6;
}

.quote-basic-info {
    @apply bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6 flex justify-between items-start;
}

.quote-header {
    @apply flex items-start gap-4;
}

.quote-icon {
    @apply w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-md;
}

.quote-icon i {
    @apply text-lg;
}

.quote-details {
    @apply space-y-1;
}

.quote-title {
    @apply text-xl font-bold text-gray-800 dark:text-white;
}

.customer-name {
    @apply text-sm text-gray-600 dark:text-gray-300;
}

.quote-amount {
    @apply text-right;
}

.amount-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-300 mb-1;
}

.amount-value {
    @apply text-3xl font-bold text-blue-600 dark:text-blue-400;
}

/* Sección de crédito */
.credit-section {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm;
}

.section-title {
    @apply flex items-center text-lg font-semibold text-gray-800 dark:text-white mb-4;
}

.credit-loading-state {
    @apply flex items-center justify-center py-4 text-gray-500;
}

.credit-info-card {
    @apply space-y-4;
}

.credit-status {
    @apply flex justify-center;
}

.credit-details-grid {
    @apply grid grid-cols-3 gap-4 mt-4;
}

.credit-stat {
    @apply text-center;
}

.stat-label {
    @apply text-xs font-medium text-gray-500 dark:text-gray-400 mb-1;
}

.stat-value {
    @apply text-lg font-bold text-gray-900 dark:text-white;
}

.credit-progress-section {
    @apply col-span-3 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg;
}

.progress-header {
    @apply flex justify-between items-center mb-2;
}

.progress-label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.progress-percentage {
    @apply text-sm font-semibold text-blue-600 dark:text-blue-400;
}

.credit-progress-bar {
    @apply h-2;
}

/* ===== SECCIÓN DE CONFIGURACIÓN ===== */
.configuration-section {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm;
}

.config-grid {
    @apply grid grid-cols-2 gap-6;
}

.config-item {
    @apply space-y-3;
}

.config-header {
    @apply flex items-center;
}

.config-label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.config-label.required::after {
    content: ' *';
    @apply text-red-500 ml-1;
}

.voucher-select {
    @apply border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg transition-colors;
}

.payment-quick-summary {
    @apply space-y-2;
}

.summary-item {
    @apply flex justify-between items-center;
}

.summary-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.summary-value {
    @apply text-sm font-bold;
}

/* ===== SECCIÓN DE MÉTODOS DE PAGO ===== */
.payment-methods-section {
    @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden;
}

.payment-methods-header {
    @apply bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center;
}

.section-title-container {
    @apply flex items-center gap-3;
}

.section-icon {
    @apply text-green-600 dark:text-green-400 text-xl;
}

.section-title {
    @apply text-lg font-bold text-gray-800 dark:text-white m-0;
}

.required-indicator {
    @apply text-red-500 text-lg font-bold;
}

.add-payment-btn {
    @apply border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-colors;
}

/* Estado vacío */
.empty-payment-state {
    @apply p-12;
}

.empty-state-content {
    @apply text-center space-y-4;
}

.empty-icon {
    @apply text-6xl text-gray-400 dark:text-gray-600;
}

.empty-title {
    @apply text-xl font-bold text-gray-700 dark:text-gray-300 m-0;
}

.empty-description {
    @apply text-gray-500 dark:text-gray-400 max-w-md mx-auto;
}

.empty-state-button {
    @apply bg-blue-500 hover:bg-blue-600 text-white;
}

/* Lista de métodos de pago */
.payment-methods-list {
    @apply p-6 space-y-6;
}

.payment-method-item {
    @apply border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow;
}

.payment-method-header {
    @apply bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 p-4 flex justify-between items-center;
}

.method-identifier {
    @apply flex items-center gap-3;
}

.method-badge {
    @apply w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold;
}

.method-info {
    @apply space-y-1;
}

.method-title {
    @apply font-semibold text-gray-800 dark:text-white;
}

.method-type {
    @apply text-sm text-gray-500 dark:text-gray-400;
}

.remove-method-btn {
    @apply hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 rounded-lg;
}

.payment-method-content {
    @apply p-6 space-y-6;
}

/* Selector de método */
.method-selector-section {
    @apply space-y-3;
}

.field-label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block;
}

.payment-method-select {
    @apply border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg transition-colors;
}

.selected-method-display,
.payment-method-option {
    @apply flex items-center gap-3;
}

.method-badge-container {
    @apply w-8 h-8 rounded-full flex items-center justify-center text-white text-sm;
}

.method-badge-cash {
    @apply bg-green-500;
}
.method-badge-card {
    @apply bg-blue-500;
}
.method-badge-transfer {
    @apply bg-purple-500;
}
.method-badge-credit {
    @apply bg-orange-500;
}
.method-badge-default {
    @apply bg-gray-500;
}

.method-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.placeholder-text {
    @apply text-gray-500 dark:text-gray-400;
}

.option-info {
    @apply flex flex-col;
}

.option-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.option-type {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.error-message {
    @apply text-red-500 text-sm mt-1;
}

/* Inputs */
.payment-inputs-section {
    @apply space-y-4;
}

.inputs-grid {
    @apply grid grid-cols-2 gap-4;
}

.input-field {
    @apply space-y-2;
}

.amount-input-field,
.reference-input-field {
    @apply border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 rounded-lg transition-colors;
}

/* Validación de crédito */
.credit-validation-section {
    @apply mt-4;
}

.validation-message {
    @apply flex items-center gap-2 p-3 rounded-lg text-sm;
}

.validation-warning {
    @apply bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800;
}

.validation-success {
    @apply bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800;
}

/* Tags del método */
.method-tags-section {
    @apply pt-4 border-t border-gray-200 dark:border-gray-700;
}

.method-tags {
    @apply flex flex-wrap gap-2;
}

/* ===== RESUMEN FINAL ===== */
.final-summary-section {
    @apply bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl overflow-hidden;
}

.summary-header {
    @apply bg-blue-600 dark:bg-blue-700 text-white p-4 flex items-center;
}

.summary-title {
    @apply text-lg font-bold m-0;
}

.summary-content {
    @apply p-6;
}

.summary-grid {
    @apply grid grid-cols-3 gap-6;
}

.summary-item {
    @apply text-center;
}

.item-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400 mb-2;
}

.item-value {
    @apply text-xl font-bold mb-2;
}

.primary-value {
    @apply text-blue-600 dark:text-blue-400;
}

.success-value {
    @apply text-green-600 dark:text-green-400;
}

.error-value {
    @apply text-red-600 dark:text-red-400;
}

.difference-status {
    @apply text-xs;
}

.status-text {
    @apply font-medium;
}

.status-text.success {
    @apply text-green-600 dark:text-green-400;
}

.status-text.error {
    @apply text-red-600 dark:text-red-400;
}

.status-text.warning {
    @apply text-orange-600 dark:text-orange-400;
}

/* Errores generales */
.general-error-section {
    @apply mt-6;
}

.error-message-display {
    @apply border-2 border-red-200 dark:border-red-700 rounded-lg;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .quote-approval-dialog {
        width: 95vw !important;
        max-width: 95vw !important;
    }

    .config-grid {
        @apply grid-cols-1 gap-4;
    }

    .credit-details-grid {
        @apply grid-cols-1 gap-3;
    }

    .credit-progress-section {
        @apply col-span-1;
    }

    .inputs-grid {
        @apply grid-cols-1 gap-3;
    }

    .summary-grid {
        @apply grid-cols-1 gap-4;
    }

    .quote-basic-info {
        @apply flex-col gap-4 items-start;
    }

    .amount-value {
        @apply text-2xl;
    }
}

@media (max-width: 480px) {
    .payment-methods-header {
        @apply flex-col gap-3 items-start;
    }

    .section-title-container {
        @apply w-full;
    }

    .add-payment-btn {
        @apply w-full;
    }
}
</style>
