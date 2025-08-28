<script setup>
import { computed, defineEmits, defineProps, ref, watch } from 'vue';

const props = defineProps({
    showMultiplePaymentDialog: Boolean,
    cartTotal: Number,
    selectedPaymentMethods: Array,
    availablePaymentMethods: Array,
    voucherType: String,
    availableVoucherTypes: Array,
    paymentStatus: String,
    loading: Boolean,
    selectedCustomer: Object
});

const emit = defineEmits(['update:showMultiplePaymentDialog', 'update:selectedPaymentMethods', 'update:voucherType', 'update:paymentStatus', 'process-payment']);

// Initialize internal refs with parent prop values
const internalVoucherType = ref(props.voucherType || '');
const internalPaymentStatus = ref(props.paymentStatus || 'PAGADO');

// Watch for changes in parent props to sync internal state
watch(
    () => props.voucherType,
    (newValue) => {
        if (newValue !== internalVoucherType.value) {
            internalVoucherType.value = newValue || '';
        }
    }
);

watch(
    () => props.paymentStatus,
    (newValue) => {
        if (newValue !== internalPaymentStatus.value) {
            internalPaymentStatus.value = newValue || 'PAGADO';
        }
    }
);

watch(
    () => internalVoucherType.value,
    (newValue) => {
        emit('update:voucherType', newValue);
    }
);

watch(
    () => internalPaymentStatus.value,
    (newValue) => {
        emit('update:paymentStatus', newValue);
    }
);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};

const getPaymentMethodIcon = (methodId) => {
    const method = props.availablePaymentMethods.find((pm) => pm.id === methodId);
    if (!method) return 'pi-circle';

    const iconMap = {
        CASH: 'pi-money-bill',
        CARD: 'pi-credit-card',
        TRANSFER: 'pi-send',
        CREDIT: 'pi-clock'
    };

    return iconMap[method.type] || 'pi-circle';
};

const getPaymentMethodColor = (methodId) => {
    const method = props.availablePaymentMethods.find((pm) => pm.id === methodId);
    if (!method) return 'secondary';

    const colorMap = {
        CASH: 'success',
        CARD: 'info',
        TRANSFER: 'warning',
        CREDIT: 'secondary'
    };

    return colorMap[method.type] || 'secondary';
};

const getRemainingAmount = () => {
    const totalPaid = props.selectedPaymentMethods.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
    return Math.max(0, props.cartTotal - totalPaid);
};

const getTotalPaymentAmount = () => {
    return props.selectedPaymentMethods.reduce((sum, pm) => sum + parseFloat(pm.amount || 0), 0);
};

const addPaymentMethod = () => {
    const remainingAmount = getRemainingAmount();
    if (remainingAmount <= 0) {
        return;
    }

    const newPaymentMethods = [
        ...props.selectedPaymentMethods,
        {
            method_id: null,
            method_name: '',
            amount: remainingAmount,
            reference: '',
            requires_reference: false
        }
    ];
    emit('update:selectedPaymentMethods', newPaymentMethods);
};

const removePaymentMethod = (index) => {
    const newPaymentMethods = [...props.selectedPaymentMethods];
    newPaymentMethods.splice(index, 1);
    emit('update:selectedPaymentMethods', newPaymentMethods);
};

// Verificar si un método es de crédito
const isCreditMethod = (methodId) => {
    const method = props.availablePaymentMethods.find((pm) => pm.id === methodId);
    return method && (method.type === 'CREDIT' || method.name.toLowerCase().includes('crédito'));
};

// Calcular crédito disponible
const getAvailableCredit = () => {
    if (!props.selectedCustomer) return 0;
    return (props.selectedCustomer.credit_limit || 0) - (props.selectedCustomer.total_debt || 0);
};

// Verificar si el cliente puede usar crédito
const canUseCredit = () => {
    return props.selectedCustomer && props.selectedCustomer.credit_enabled && !props.selectedCustomer.has_overdue_credits && getAvailableCredit() > 0;
};

const filteredPaymentMethods = computed(() => {
    if (!props.availablePaymentMethods) {
        return [];
    }
    // Excluir permanentemente "Crédito de la casa"
    const methods = props.availablePaymentMethods.filter((method) => method.name !== 'Crédito de la casa');

    // Aplicar la lógica existente para otros tipos de crédito
    return methods.filter((method) => !isCreditMethod(method.id) || canUseCredit());
});

const updatePaymentMethod = (index, field, value) => {
    const newPaymentMethods = [...props.selectedPaymentMethods];
    const paymentMethod = newPaymentMethods[index];

    if (field === 'method_id') {
        const method = props.availablePaymentMethods.find((pm) => pm.id === value);
        if (method) {
            paymentMethod.method_id = method.id;
            paymentMethod.method_name = method.name;
            paymentMethod.requires_reference = method.requires_reference;

            if (!method.requires_reference) {
                paymentMethod.reference = '';
            }

            // Si es método de crédito, ajustar el monto máximo al crédito disponible
            if (isCreditMethod(method.id)) {
                const availableCredit = getAvailableCredit();
                if (paymentMethod.amount > availableCredit) {
                    paymentMethod.amount = Math.min(availableCredit, getRemainingAmount());
                }
            }
        }
    } else {
        paymentMethod[field] = value;
    }
    emit('update:selectedPaymentMethods', newPaymentMethods);
};

// Validaciones para cliente anónimo
const isAnonymousCustomer = computed(() => {
    return props.selectedCustomer && (props.selectedCustomer.name === 'Cliente Anónimo' || props.selectedCustomer.id === 'anonymous');
});

const anonymousCustomerValidation = computed(() => {
    if (!isAnonymousCustomer.value) {
        return { isValid: true, message: '', severity: '' };
    }

    const voucherType = props.voucherType;
    const total = props.cartTotal;

    // Nunca permitido para facturas
    if (voucherType === 'factura') {
        return {
            isValid: false,
            message: 'Cliente anónimo no puede usar facturas. Debe seleccionar un cliente con RUC.',
            severity: 'error'
        };
    }

    // Para boletas, solo permitido si es menor a S/700
    if (voucherType === 'boleta' && total >= 700) {
        return {
            isValid: false,
            message: `Cliente anónimo solo puede usar boletas menores a S/700. Total actual: ${formatCurrency(total)}`,
            severity: 'error'
        };
    }

    // Para tickets y boletas menores a S/700, está permitido
    if (voucherType === 'ticket' || (voucherType === 'boleta' && total < 700)) {
        return {
            isValid: true,
            message: `Cliente anónimo permitido para ${voucherType}${voucherType === 'boleta' ? ' menor a S/700' : ''}`,
            severity: 'success'
        };
    }

    return { isValid: true, message: '', severity: '' };
});
</script>

<template>
    <Dialog
        :visible="showMultiplePaymentDialog"
        @update:visible="$emit('update:showMultiplePaymentDialog', $event)"
        header="Métodos de Pago"
        :modal="true"
        :style="{ width: '98vw', maxWidth: '900px' }"
        :pt="{
            header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
            content: 'p-6'
        }"
    >
        <template #header>
            <div class="flex items-center space-x-3">
                <i class="pi pi-credit-card text-xl"></i>
                <span class="text-xl font-bold">Configurar Métodos de Pago</span>
            </div>
        </template>

        <div class="space-y-6 mt-2">
            <!-- Order Summary -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-bold text-gray-800">TOTAL A PAGAR:</span>
                    <span class="text-2xl font-black text-blue-600">{{ formatCurrency(cartTotal) }}</span>
                </div>
            </div>

            <!-- Información de crédito del cliente -->
            <div v-if="selectedCustomer" class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-user text-purple-600"></i>
                        <span class="font-bold text-gray-800">{{ selectedCustomer.name }}</span>
                        <span v-if="isAnonymousCustomer" class="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                            <i class="pi pi-user-minus mr-1"></i>
                            Anónimo
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <i class="pi pi-credit-card text-purple-600"></i>
                        <span v-if="selectedCustomer.credit_enabled" class="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full"> Crédito Habilitado </span>
                        <span v-else class="text-sm px-2 py-1 bg-gray-100 text-gray-600 rounded-full"> Sin Crédito </span>
                    </div>
                </div>

                <div v-if="selectedCustomer.credit_enabled" class="grid grid-cols-3 gap-4 text-sm">
                    <div class="text-center">
                        <div class="text-gray-600">Límite</div>
                        <div class="font-bold text-blue-600">{{ formatCurrency(selectedCustomer.credit_limit || 0) }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-gray-600">Deuda Actual</div>
                        <div class="font-bold text-orange-600">{{ formatCurrency(selectedCustomer.total_debt || 0) }}</div>
                    </div>
                    <div class="text-center">
                        <div class="text-gray-600">Disponible</div>
                        <div class="font-bold" :class="getAvailableCredit() > 0 ? 'text-green-600' : 'text-red-600'">
                            {{ formatCurrency(getAvailableCredit()) }}
                        </div>
                    </div>
                </div>

                <!-- Advertencias -->
                <div v-if="selectedCustomer.has_overdue_credits" class="mt-3 p-2 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-2">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>Cliente tiene deudas vencidas</span>
                </div>
            </div>

            <!-- Validaciones para cliente anónimo -->
            <div
                v-if="isAnonymousCustomer && anonymousCustomerValidation.message"
                class="p-4 rounded-xl border-2"
                :class="{
                    'bg-red-50 border-red-200': anonymousCustomerValidation.severity === 'error',
                    'bg-green-50 border-green-200': anonymousCustomerValidation.severity === 'success'
                }"
            >
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-full flex items-center justify-center"
                        :class="{
                            'bg-red-500': anonymousCustomerValidation.severity === 'error',
                            'bg-green-500': anonymousCustomerValidation.severity === 'success'
                        }"
                    >
                        <i
                            :class="{
                                'pi pi-exclamation-triangle text-white': anonymousCustomerValidation.severity === 'error',
                                'pi pi-check-circle text-white': anonymousCustomerValidation.severity === 'success'
                            }"
                        ></i>
                    </div>
                    <div>
                        <h4
                            class="font-bold"
                            :class="{
                                'text-red-800': anonymousCustomerValidation.severity === 'error',
                                'text-green-800': anonymousCustomerValidation.severity === 'success'
                            }"
                        >
                            {{ anonymousCustomerValidation.severity === 'error' ? 'Restricción de Cliente Anónimo' : 'Cliente Anónimo Válido' }}
                        </h4>
                        <p
                            class="text-sm"
                            :class="{
                                'text-red-700': anonymousCustomerValidation.severity === 'error',
                                'text-green-700': anonymousCustomerValidation.severity === 'success'
                            }"
                        >
                            {{ anonymousCustomerValidation.message }}
                        </p>
                    </div>
                </div>

                <div v-if="anonymousCustomerValidation.severity === 'error'" class="mt-3 text-xs bg-red-100 p-2 rounded-lg" :class="'text-red-800'">
                    <i class="pi pi-info-circle mr-1"></i>
                    <strong>Recuerda:</strong> Cliente anónimo solo para tickets o boletas menores a S/700
                </div>
            </div>

            <!-- Payment Methods Configuration -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-800">
                        <i class="pi pi-wallet mr-2 text-purple-600"></i>
                        Métodos de Pago
                    </h3>
                    <Button @click="addPaymentMethod" label="Agregar Método" icon="pi pi-plus" size="small" class="touch-manipulation py-2 px-3" severity="success" outlined :disabled="selectedPaymentMethods.length >= 10" />
                </div>

                <!-- Payment Methods List -->
                <div class="space-y-3" v-if="props.selectedPaymentMethods.length > 0">
                    <Card v-for="(payment, index) in props.selectedPaymentMethods" :key="index" class="shadow-sm border border-gray-200">
                        <template #content>
                            <div class="space-y-3 sm:space-y-4">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-semibold text-gray-800">Método de Pago {{ index + 1 }}</h4>
                                    <Button @click="removePaymentMethod(index)" icon="pi pi-trash" size="small" severity="danger" text rounded v-if="props.selectedPaymentMethods.length > 1" />
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <!-- Method Selection -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">Método</label>
                                        <Select
                                            :modelValue="payment.method_id"
                                            @update:modelValue="updatePaymentMethod(index, 'method_id', $event)"
                                            :options="filteredPaymentMethods"
                                            option-label="name"
                                            option-value="id"
                                            placeholder="Seleccionar método..."
                                            class="w-full"
                                            :pt="{
                                                root: 'border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-lg',
                                                input: 'py-2 px-3 text-sm'
                                            }"
                                        >
                                            <template #option="{ option }">
                                                <div class="flex items-center space-x-2">
                                                    <i
                                                        :class="getPaymentMethodIcon(option.id)"
                                                        :style="{
                                                            color:
                                                                getPaymentMethodColor(option.id) === 'success'
                                                                    ? '#10b981'
                                                                    : getPaymentMethodColor(option.id) === 'info'
                                                                      ? '#3b82f6'
                                                                      : getPaymentMethodColor(option.id) === 'warning'
                                                                        ? '#f59e0b'
                                                                        : '#6b7280'
                                                        }"
                                                    ></i>
                                                    <span>{{ option.name }}</span>
                                                    <Tag :value="option.type" size="small" :severity="getPaymentMethodColor(option.id)" />
                                                </div>
                                            </template>
                                        </Select>
                                    </div>

                                    <!-- Amount -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">
                                            Monto
                                            <span v-if="isCreditMethod(payment.method_id)" class="text-xs text-purple-600"> (Máx: {{ formatCurrency(Math.min(getAvailableCredit(), getRemainingAmount())) }}) </span>
                                        </label>
                                        <div class="p-inputgroup">
                                            <span class="p-inputgroup-addon">S/</span>
                                            <InputNumber
                                                :modelValue="payment.amount"
                                                @update:modelValue="updatePaymentMethod(index, 'amount', $event)"
                                                :min="0"
                                                :max="isCreditMethod(payment.method_id) ? Math.min(getAvailableCredit(), props.cartTotal) : props.cartTotal"
                                                mode="decimal"
                                                :minFractionDigits="2"
                                                :maxFractionDigits="2"
                                                class="flex-1"
                                                :pt="{
                                                    input: 'py-2 px-3 text-sm border-l-0'
                                                }"
                                            />
                                        </div>
                                        <!-- Advertencia si excede crédito -->
                                        <div v-if="isCreditMethod(payment.method_id) && payment.amount > getAvailableCredit()" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                                            <i class="pi pi-exclamation-triangle"></i>
                                            <span>Excede crédito disponible</span>
                                        </div>
                                    </div>

                                    <!-- Reference -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">
                                            Referencia
                                            <span v-if="payment.requires_reference" class="text-red-500">*</span>
                                        </label>
                                        <InputText
                                            :modelValue="payment.reference"
                                            @update:modelValue="updatePaymentMethod(index, 'reference', $event)"
                                            :placeholder="payment.requires_reference ? 'Número de referencia' : 'Opcional'"
                                            :disabled="!payment.method_id"
                                            class="w-full"
                                            :pt="{
                                                root: 'border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-lg',
                                                input: 'py-2 px-3 text-sm'
                                            }"
                                        />
                                    </div>
                                </div>

                                <!-- Method Info -->
                                <div v-if="payment.method_id" class="bg-gray-50 p-3 rounded-lg">
                                    <div class="flex items-center justify-between text-sm">
                                        <div class="flex items-center space-x-2">
                                            <i :class="getPaymentMethodIcon(payment.method_id)" class="text-gray-600"></i>
                                            <span class="font-medium">{{ payment.method_name }}</span>
                                        </div>
                                        <div class="flex items-center space-x-4 text-xs text-gray-600">
                                            <span v-if="payment.requires_reference">
                                                <i class="pi pi-info-circle mr-1"></i>
                                                Requiere referencia
                                            </span>
                                            <span>
                                                <i class="pi pi-calculator mr-1"></i>
                                                {{ formatCurrency(payment.amount || 0) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Payment Summary -->
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl border-2 border-green-200">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-sm text-gray-600">Total a Pagar</div>
                            <div class="text-lg font-bold text-gray-800">
                                {{ formatCurrency(props.cartTotal) }}
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600">Total Pagos</div>
                            <div class="text-lg font-bold" :class="getTotalPaymentAmount() === props.cartTotal ? 'text-green-600' : 'text-orange-600'">
                                {{ formatCurrency(getTotalPaymentAmount()) }}
                            </div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600">Restante</div>
                            <div class="text-lg font-bold" :class="getRemainingAmount() === 0 ? 'text-green-600' : 'text-red-600'">
                                {{ formatCurrency(getRemainingAmount()) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Voucher Type and Payment Status -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">
                        <i class="pi pi-file-text mr-2 text-purple-600"></i>
                        Tipo de Comprobante
                    </label>
                    <Select
                        :modelValue="props.voucherType"
                        @update:modelValue="$emit('update:voucherType', $event)"
                        :options="props.availableVoucherTypes"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        :pt="{
                            root: 'border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl shadow-sm transition-all duration-300',
                            input: 'py-3 px-4 text-base font-medium',
                            dropdown: 'p-3'
                        }"
                    />
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-3">
                        <i class="pi pi-check-circle mr-2 text-purple-600"></i>
                        Estado del Pago
                    </label>
                    <div class="flex gap-3">
                        <Button
                            @click="$emit('update:paymentStatus', 'PAGADO')"
                            :label="'Pagado'"
                            :icon="'pi pi-check'"
                            :outlined="props.paymentStatus !== 'PAGADO'"
                            :severity="props.paymentStatus === 'PAGADO' ? 'success' : 'secondary'"
                            class="flex-1 h-12 font-semibold"
                        />
                        <Button
                            @click="$emit('update:paymentStatus', 'PENDIENTE')"
                            :label="'Pendiente'"
                            :icon="'pi pi-clock'"
                            :outlined="props.paymentStatus !== 'PENDIENTE'"
                            :severity="props.paymentStatus === 'PENDIENTE' ? 'warning' : 'secondary'"
                            class="flex-1 h-12 font-semibold"
                        />
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-200">
                <Button @click="$emit('update:showMultiplePaymentDialog', false)" label="Cancelar" icon="pi pi-times" severity="secondary" outlined class="flex-1 h-12 sm:h-14 text-base sm:text-lg font-semibold touch-manipulation" />
                <Button
                    @click="$emit('process-payment')"
                    label="Confirmar Pago"
                    icon="pi pi-check"
                    severity="success"
                    class="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold touch-manipulation"
                    :loading="props.loading"
                    :disabled="getRemainingAmount() !== 0 || props.selectedPaymentMethods.length === 0 || !anonymousCustomerValidation.isValid"
                />
            </div>
        </div>
    </Dialog>
</template>
