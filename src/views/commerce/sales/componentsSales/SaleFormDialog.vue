<script setup>
import DiscountCodeInput from '@/components/discounts/DiscountCodeInput.vue';
import DiscountSummary from '@/components/discounts/DiscountSummary.vue';
import { useDiscount } from '@/composables/useDiscount';
import { useCustomersStore } from '@/stores/customersStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { ref, watch } from 'vue';

const submitted = ref(false);
const customersStore = useCustomersStore();
const warehousesStore = useWarehousesStore();

// Discount Composable
const {
    discountCode,
    discountType,
    discountPercentage,
    discountAmount,
    validating,
    error: discountError,
    hasDiscount,
    discountInfo,
    validateCode,
    applyManualDiscount,
    clearDiscount,
    calculateDiscount
} = useDiscount();

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    sale: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    customer_id: null,
    warehouse_id: null,
    sale_date: new Date().toISOString().split('T')[0],
    status: 'PENDIENTE',
    voucher_type: 'ticket',
    document_type: 'ticket',
    document_number: '',
    subtotal_amount: 0, // Changed from implicit to explicit
    total_amount: 0,
    tax_amount: 0,
    discount_amount: 0,
    discount_code: null,
    discount_code_id: null,
    discount_type: 'none',
    discount_percentage: 0,
    discount_code_input: '', // For the input field
    notes: ''
});

// ... (keep voucherTypes, statusOptions, etc.)

// Validate discount code
const handleApplyDiscount = async (code) => {
    if (!form.value.subtotal_amount) {
        // If subtotal is 0, we can't apply discount comfortably
        // Maybe warn user?
        return;
    }
    
    // We validate against the subtotal
    const isValid = await validateCode(code, form.value.subtotal_amount, form.value.customer_id);
    
    if (isValid) {
        updateFormDiscount();
    }
};

const handleRemoveDiscount = () => {
    clearDiscount();
    updateFormDiscount();
};

const updateFormDiscount = () => {
    form.value.discount_amount = discountAmount.value;
    form.value.discount_code = discountCode.value?.code || null;
    form.value.discount_code_id = discountCode.value?.id || null;
    form.value.discount_type = discountType.value;
    form.value.discount_percentage = discountPercentage.value;
    
    calculateTotals();
};

const calculateTotals = () => {
    // Basic calculation assuming manual subtotal entry
    // total = subtotal - discount + tax
    // tax is usually calculated on (subtotal - discount)
    
    const subtotal = form.value.subtotal_amount || 0;
    const discount = form.value.discount_amount || 0;
    
    const taxableBase = Math.max(0, subtotal - discount);
    // Assuming 18% tax for example, or manual entry. 
    // Since this form seems to have manual tax entry, we preserve it or calc it?
    // Let's keep tax manual for now to avoid breaking existing logic, 
    // OR if the user enters tax, we use it.
    
    // BUT, if we change discount, total MUST change.
    form.value.total_amount = taxableBase + (form.value.tax_amount || 0);
};

// Watchers
watch(() => form.value.subtotal_amount, (newSubtotal) => {
    if (hasDiscount.value) {
        // Recalculate discount amount if subtotal changes (e.g. percentage)
        if (discountType.value === 'percentage') {
             applyManualDiscount('percentage', discountPercentage.value, newSubtotal);
             form.value.discount_amount = discountAmount.value;
        } else if (discountType.value === 'fixed') {
             // Re-validate limits maybe?
        }
    }
    calculateTotals();
});

watch(() => form.value.discount_amount, () => {
    calculateTotals();
});


// ... (keep rest of script)

// Update resetForm
const resetForm = () => {
    form.value = {
        id: null,
        customer_id: null,
        warehouse_id: null,
        sale_date: new Date().toISOString().split('T')[0],
        status: 'PENDIENTE',
        voucher_type: 'ticket',
        document_type: 'ticket',
        document_number: '',
        subtotal_amount: 0,
        total_amount: 0,
        tax_amount: 0,
        discount_amount: 0,
        discount_code: null,
        discount_code_id: null,
        discount_type: 'none',
        discount_percentage: 0,
        discount_code_input: '',
        notes: ''
    };
    clearDiscount();
    submitted.value = false;
};

// ... (keep onMounted, watchers)
// Don't forget to update `handleSubmit` to include new fields

// ...

</script>

<template>
    <!-- ... (keep header parts) -->
            
            <!-- Montos -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-dollar"></i>
                        Montos y Descuentos
                    </h3>
                </div>
                
                <!-- Subtotal Field (New) -->
                 <div class="field mb-4">
                    <label for="subtotal_amount" class="field-label">Subtotal *</label>
                    <InputNumber id="subtotal_amount" v-model="form.subtotal_amount" mode="currency" currency="PEN" locale="es-PE" :min="0" class="form-input" fluid />
                </div>

                <!-- Discount Section -->
                <div class="field mb-4">
                    <label class="field-label">Descuento</label>
                    <div class="discount-container">
                        <DiscountCodeInput 
                            v-if="!hasDiscount"
                            v-model="form.discount_code_input" 
                            :loading="validating"
                            @apply="handleApplyDiscount"
                        />
                        <small v-if="discountError" class="p-error">{{ discountError }}</small>
                        
                        <DiscountSummary 
                            v-if="hasDiscount"
                            :discount="discountInfo"
                            @remove="handleRemoveDiscount"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Impuestos -->
                    <div class="field">
                        <label for="tax_amount" class="field-label">Impuestos</label>
                        <InputNumber id="tax_amount" v-model="form.tax_amount" mode="currency" currency="PEN" locale="es-PE" :min="0" :class="{ 'p-invalid': submitted && !isValidTaxAmount }" class="form-input" fluid />
                    </div>

                    <!-- Descuento (Manual o Calculado) -->
                    <div class="field">
                        <label for="discount_amount" class="field-label">Descuento</label>
                        <InputNumber id="discount_amount" v-model="form.discount_amount" mode="currency" currency="PEN" locale="es-PE" :min="0" :class="{ 'p-invalid': submitted && !isValidDiscountAmount }" :readonly="hasDiscount" class="form-input" fluid />
                        <small class="p-error" v-if="submitted && !isValidDiscountAmount">El monto debe ser mayor o igual a 0.</small>
                    </div>
                    
                     <!-- Total (Read only or calculated) -->
                    <div class="field">
                        <label for="total_amount" class="field-label">Total *</label>
                        <InputNumber id="total_amount" v-model="form.total_amount" mode="currency" currency="PEN" locale="es-PE" :min="0" :class="{ 'p-invalid': submitted && !isValidAmount }" class="form-input" fluid readonly />
                        <small class="p-error" v-if="submitted && !isValidAmount">El monto debe ser mayor o igual a 0.</small>
                    </div>
                </div>
            </div>
            
    <!-- ... (keep rest of template) -->


            <!-- Almacén (solo si el estado es PAGADO) -->
            <div v-if="form.status === 'PAGADO'" class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-home"></i>
                        Almacén para Procesar Stock
                    </h3>
                </div>
                <div class="field">
                    <label for="warehouse_id" class="field-label">Almacén *</label>
                    <Select
                        id="warehouse_id"
                        v-model="form.warehouse_id"
                        :options="warehousesStore.warehousesList"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Seleccione un almacén"
                        :class="{
                            'p-invalid': submitted && form.status === 'PAGADO' && !form.warehouse_id
                        }"
                        class="form-select"
                    />
                    <small class="p-error" v-if="submitted && form.status === 'PAGADO' && !form.warehouse_id"> El almacén es requerido para ventas pagadas. </small>
                    <small class="p-info" v-else> Necesario para procesar la salida de stock al marcar como pagado </small>
                </div>
            </div>

            <!-- Notas -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-file-edit"></i>
                        Observaciones
                    </h3>
                </div>
                <div class="field">
                    <label for="notes" class="field-label">Notas</label>
                    <Textarea id="notes" v-model="form.notes" rows="3" placeholder="Observaciones adicionales..." class="form-input" />
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="handleCancel" />
                <Button :label="isCreating ? 'Crear Venta' : 'Actualizar Venta'" icon="pi pi-check" class="p-button-primary" @click="handleSubmit" :loading="loading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Encabezado del diálogo mejorado */
:deep(.sale-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white rounded-t-xl p-6 relative overflow-hidden;
}

/* Efecto de patrón de puntos en el encabezado */
:deep(.sale-dialog .p-dialog-header::before) {
    content: '';
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 2px, transparent 2px);
    background-size: 40px 40px;
}

/* Título del diálogo */
:deep(.sale-dialog .p-dialog-title) {
    @apply text-xl font-bold relative z-10;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Icono de cierre del diálogo */
:deep(.sale-dialog .p-dialog-header .p-dialog-header-icon) {
    @apply text-white opacity-90 relative z-10 transition-all rounded-xl w-10 h-10 hover:bg-white/20;
}

/* Contenido del diálogo */
:deep(.sale-dialog .p-dialog-content) {
    @apply p-6 bg-white dark:bg-gray-800 rounded-b-2xl border border-gray-200 dark:border-gray-700 border-t-0;
}

.form-content {
    @apply space-y-6;
}

/* Secciones del formulario */
.form-section {
    @apply bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-600;
}

.section-header {
    @apply mb-4 pb-3 border-b border-gray-200 dark:border-gray-600;
}

.section-title {
    @apply text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 m-0;
}

.section-title i {
    @apply text-emerald-600 dark:text-emerald-400;
}

/* Campos de formulario mejorados */
.field {
    @apply flex flex-col gap-2;
}

.field-label {
    @apply font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select {
    @apply transition-all duration-200;
}

/* Estilos base para componentes de entrada de PrimeVue */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputnumber .p-inputtext) {
    @apply border-2 rounded-xl font-medium transition-all border-gray-300 dark:border-gray-600;
}

/* Estado de foco para componentes de entrada */
:deep(.p-inputtext:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus),
:deep(.p-calendar:not(.p-disabled).p-focus),
:deep(.p-inputnumber:not(.p-disabled).p-focus .p-inputtext) {
    @apply border-emerald-500 ring-2 ring-emerald-500/20;
}

/* Pie de página del diálogo y botones */
:deep(.p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700;
}

:deep(.p-dialog-footer .p-button-primary) {
    @apply bg-emerald-600 hover:bg-emerald-700 border-none py-3 px-6 rounded-xl font-bold text-base transition-all;
}

:deep(.p-dialog-footer .p-button-text) {
    @apply text-gray-600 dark:text-gray-400 font-semibold py-3 px-6 rounded-xl text-base transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200;
}

/* Estados de validación mejorados */
:deep(.p-invalid) {
    @apply border-red-400 bg-red-50 dark:bg-red-900/20 shadow-sm;
}

:deep(.p-invalid:focus) {
    @apply border-red-500 ring-2 ring-red-500/20 bg-red-50 dark:bg-red-900/20;
}

.p-error {
    @apply text-red-700 dark:text-red-300 text-sm mt-2 font-medium p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2;
}

.p-error::before {
    content: '⚠';
    @apply text-red-500 font-bold;
}

.p-info {
    @apply text-blue-700 dark:text-blue-300 text-sm mt-2 font-medium p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-2;
}

.p-info::before {
    content: 'ℹ';
    @apply text-blue-500 font-bold;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    :deep(.sale-dialog .p-dialog-header) {
        @apply p-6;
    }

    .form-section {
        @apply p-4;
    }

    .section-title {
        @apply text-base;
    }
}

@media (max-width: 480px) {
    :deep(.sale-dialog .p-dialog-header) {
        @apply p-4;
    }

    .form-section {
        @apply p-3;
    }
}
</style>
