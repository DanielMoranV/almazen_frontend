<script setup>
import { defineProps, defineEmits, ref, watch, computed } from 'vue';

const props = defineProps({
    showMultiplePaymentDialog: Boolean,
    cartTotal: Number,
    selectedPaymentMethods: Array,
    availablePaymentMethods: Array,
    voucherType: String,
    availableVoucherTypes: Array,
    paymentStatus: String,
    loading: Boolean
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

const _getPaymentMethodIcon = (methodId) => {
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
        }
    } else {
        paymentMethod[field] = value;
    }
    emit('update:selectedPaymentMethods', newPaymentMethods);
};
</script>

<template>
    <Dialog
        :visible="showMultiplePaymentDialog"
        @update:visible="$emit('update:showMultiplePaymentDialog', $event)"
        header="Métodos de Pago"
        :modal="true"
        :style="{ width: '95vw', maxWidth: '900px' }"
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

            <!-- Payment Methods Configuration -->
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-bold text-gray-800">
                        <i class="pi pi-wallet mr-2 text-purple-600"></i>
                        Métodos de Pago
                    </h3>
                    <Button @click="addPaymentMethod" label="Agregar Método" icon="pi pi-plus" size="small" severity="success" outlined :disabled="selectedPaymentMethods.length >= 10" />
                </div>

                <!-- Payment Methods List -->
                <div class="space-y-3" v-if="props.selectedPaymentMethods.length > 0">
                    <Card v-for="(payment, index) in props.selectedPaymentMethods" :key="index" class="shadow-sm border border-gray-200">
                        <template #content>
                            <div class="space-y-4">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-semibold text-gray-800">Método de Pago {{ index + 1 }}</h4>
                                    <Button @click="removePaymentMethod(index)" icon="pi pi-trash" size="small" severity="danger" text rounded v-if="props.selectedPaymentMethods.length > 1" />
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <!-- Method Selection -->
                                    <div>
                                        <label class="block text-sm font-bold text-gray-700 mb-2">Método</label>
                                        <Select
                                            :modelValue="payment.method_id"
                                            @update:modelValue="updatePaymentMethod(index, 'method_id', $event)"
                                            :options="props.availablePaymentMethods"
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
                                        <label class="block text-sm font-bold text-gray-700 mb-2">Monto</label>
                                        <div class="p-inputgroup">
                                            <span class="p-inputgroup-addon">S/</span>
                                            <InputNumber
                                                :modelValue="payment.amount"
                                                @update:modelValue="updatePaymentMethod(index, 'amount', $event)"
                                                :min="0"
                                                :max="props.cartTotal"
                                                mode="decimal"
                                                :minFractionDigits="2"
                                                :maxFractionDigits="2"
                                                class="flex-1"
                                                :pt="{
                                                    input: 'py-2 px-3 text-sm border-l-0'
                                                }"
                                            />
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
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                    <div class="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div class="text-sm text-gray-600">Total a Pagar</div>
                            <div class="text-lg font-bold text-gray-800">{{ formatCurrency(props.cartTotal) }}</div>
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div class="flex space-x-4 pt-6 border-t border-gray-200">
                <Button @click="$emit('update:showMultiplePaymentDialog', false)" label="Cancelar" icon="pi pi-times" severity="secondary" outlined class="flex-1 h-14 text-lg font-semibold" />
                <Button
                    @click="$emit('process-payment')"
                    label="Confirmar Pago"
                    icon="pi pi-check"
                    severity="success"
                    class="flex-1 h-14 text-lg font-bold"
                    :loading="props.loading"
                    :disabled="getRemainingAmount() !== 0 || props.selectedPaymentMethods.length === 0"
                />
            </div>
        </div>
    </Dialog>
</template>
