<script setup>
import { useDiscountCodesStore } from '@/stores/discountCodesStore';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    code: {
        type: Object,
        default: null
    },
    visible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const discountCodesStore = useDiscountCodesStore();

const isEdit = computed(() => props.code !== null);
const isPercentage = computed(() => form.value.discount_type === 'percentage');

const form = ref({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    max_discount_amount: null,
    applies_to: 'sales',
    applies_to_total: true,
    max_uses: null,
    max_uses_per_customer: null,
    valid_from: null,
    valid_until: null,
    is_active: true,
    is_stackable: false
});

const discountTypeOptions = [
    { label: 'Porcentaje (%)', value: 'percentage' },
    { label: 'Monto Fijo (S/)', value: 'fixed' }
];

const appliesToOptions = [
    { label: 'Todo (Ventas, Compras, Cotizaciones)', value: 'all' },
    { label: 'Solo Ventas', value: 'sales' },
    { label: 'Solo Compras', value: 'purchases' },
    { label: 'Solo Cotizaciones', value: 'quotes' }
];

const submitting = ref(false);



/**
 * Load code data into form
 */
const loadCodeData = (code) => {
    form.value = {
        code: code.code || '',
        name: code.name || '',
        description: code.description || '',
        discount_type: code.discount_type || 'percentage',
        discount_value: code.discount_value || 0,
        min_purchase_amount: code.min_purchase_amount || 0,
        max_discount_amount: code.max_discount_amount || null,
        applies_to: code.applies_to || 'sales',
        applies_to_total: code.applies_to_total !== undefined ? code.applies_to_total : true,
        max_uses: code.max_uses || null,
        max_uses_per_customer: code.max_uses_per_customer || null,
        valid_from: code.valid_from ? new Date(code.valid_from) : null,
        valid_until: code.valid_until ? new Date(code.valid_until) : null,
        is_active: code.is_active !== undefined ? code.is_active : true,
        is_stackable: code.is_stackable !== undefined ? code.is_stackable : false
    };
};

/**
 * Reset form to default values
 */
const resetForm = () => {
    form.value = {
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_purchase_amount: 0,
        max_discount_amount: null,
        applies_to: 'sales',
        applies_to_total: true,
        max_uses: null,
        max_uses_per_customer: null,
        valid_from: null,
        valid_until: null,
        is_active: true,
        is_stackable: false
    };
};

// Watch for code prop changes
watch(
    () => props.code,
    (newCode) => {
        if (newCode) {
            loadCodeData(newCode);
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

/**
 * Handle form submission
 */
const handleSubmit = async () => {
    // Validate required fields
    if (!form.value.code || !form.value.name || !form.value.discount_value) {
        toast.add({
            severity: 'warn',
            summary: 'Campos requeridos',
            detail: 'Por favor completa todos los campos obligatorios',
            life: 4000
        });
        return;
    }

    // Convert code to uppercase
    form.value.code = form.value.code.toUpperCase().trim();

    // Prepare data
    const data = {
        ...form.value,
        valid_from: form.value.valid_from ? form.value.valid_from.toISOString() : null,
        valid_until: form.value.valid_until ? form.value.valid_until.toISOString() : null
    };

    submitting.value = true;

    try {
        if (isEdit.value) {
            await discountCodesStore.updateDiscountCode(props.code.id, data);
            toast.add({
                severity: 'success',
                summary: 'Código actualizado',
                detail: `El código ${data.code} ha sido actualizado correctamente`,
                life: 3000
            });
        } else {
            await discountCodesStore.createDiscountCode(data);
            toast.add({
                severity: 'success',
                summary: 'Código creado',
                detail: `El código ${data.code} ha sido creado correctamente`,
                life: 3000
            });
        }

        emit('saved');
        emit('close');
        resetForm();
    } catch (error) {
        console.error('[DiscountCodeForm] Error saving code:', error);
        
        const errorMessage = error.response?.data?.details?.error_message 
            || error.response?.data?.message 
            || 'Error al guardar el código de descuento';

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 4000
        });
    } finally {
        submitting.value = false;
    }
};

/**
 * Handle cancel
 */
const handleCancel = () => {
    emit('close');
    resetForm();
};
</script>

<template>
    <div class="discount-code-form">
        <form @submit.prevent="handleSubmit">
            <!-- Basic Information -->
            <div class="form-section">
                <h3 class="section-title">Información Básica</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label for="code">Código *</label>
                        <InputText id="code" v-model="form.code" placeholder="VERANO2025" required maxlength="50" class="w-full" :disabled="isEdit" />
                        <small>Se convertirá a MAYÚSCULAS automáticamente</small>
                    </div>

                    <div class="form-group">
                        <label for="name">Nombre *</label>
                        <InputText id="name" v-model="form.name" placeholder="Promoción de Verano" required class="w-full" />
                    </div>
                </div>

                <div class="form-group">
                    <label for="description">Descripción</label>
                    <Textarea id="description" v-model="form.description" rows="3" placeholder="Descripción del código de descuento" class="w-full" />
                </div>
            </div>

            <!-- Discount Configuration -->
            <div class="form-section">
                <h3 class="section-title">Configuración del Descuento</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label for="discount_type">Tipo de Descuento *</label>
                        <Select id="discount_type" v-model="form.discount_type" :options="discountTypeOptions" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="discount_value">Valor *</label>
                        <InputNumber id="discount_value" v-model="form.discount_value" :min="0.01" :max="isPercentage ? 100 : undefined" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" class="w-full" required />
                        <small v-if="isPercentage">Máximo 100%</small>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="min_purchase">Compra Mínima (S/)</label>
                        <InputNumber id="min_purchase" v-model="form.min_purchase_amount" :min="0" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="max_discount">Descuento Máximo (S/)</label>
                        <InputNumber id="max_discount" v-model="form.max_discount_amount" :min="0" :minFractionDigits="2" :maxFractionDigits="2" placeholder="Ilimitado" class="w-full" />
                        <small v-if="isPercentage">Recomendado para porcentajes</small>
                    </div>
                </div>
            </div>

            <!-- Application Scope -->
            <div class="form-section">
                <h3 class="section-title">Ámbito de Aplicación</h3>

                <div class="form-group">
                    <label for="applies_to">Aplica a *</label>
                    <Select id="applies_to" v-model="form.applies_to" :options="appliesToOptions" optionLabel="label" optionValue="value" placeholder="Seleccionar ámbito" class="w-full" />
                </div>

                <div class="form-group">
                    <div class="checkbox-group">
                        <Checkbox id="applies_to_total" v-model="form.applies_to_total" :binary="true" />
                        <label for="applies_to_total">Aplicar al total (si no, se aplica por línea)</label>
                    </div>
                </div>
            </div>

            <!-- Usage Limits -->
            <div class="form-section">
                <h3 class="section-title">Límites de Uso</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label for="max_uses">Usos Máximos Totales</label>
                        <InputNumber id="max_uses" v-model="form.max_uses" :min="1" placeholder="Ilimitado" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="max_uses_customer">Usos Máximos por Cliente</label>
                        <InputNumber id="max_uses_customer" v-model="form.max_uses_per_customer" :min="1" placeholder="Ilimitado" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Validity Period -->
            <div class="form-section">
                <h3 class="section-title">Vigencia</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label for="valid_from">Válido Desde</label>
                        <Calendar id="valid_from" v-model="form.valid_from" showTime hourFormat="24" dateFormat="dd/mm/yy" placeholder="Seleccionar fecha" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="valid_until">Válido Hasta</label>
                        <Calendar id="valid_until" v-model="form.valid_until" showTime hourFormat="24" dateFormat="dd/mm/yy" placeholder="Seleccionar fecha" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Status Options -->
            <div class="form-section">
                <h3 class="section-title">Estado</h3>

                <div class="form-group">
                    <div class="checkbox-group">
                        <Checkbox id="is_active" v-model="form.is_active" :binary="true" />
                        <label for="is_active">Activo</label>
                    </div>
                </div>

                <div class="form-group">
                    <div class="checkbox-group">
                        <Checkbox id="is_stackable" v-model="form.is_stackable" :binary="true" />
                        <label for="is_stackable">Permite combinarse con otros descuentos</label>
                    </div>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="handleCancel" text />
                <Button :label="isEdit ? 'Actualizar' : 'Crear'" icon="pi pi-check" severity="success" type="submit" :loading="submitting" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.discount-code-form {
    @apply p-6;
}

.form-section {
    @apply mb-6 pb-6 border-b border-gray-200 dark:border-gray-700;
}

.form-section:last-of-type {
    @apply border-b-0;
}

.section-title {
    @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4;
}

.form-row {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.form-group {
    @apply flex flex-col gap-2;
}

.form-group label {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.form-group small {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.checkbox-group {
    @apply flex items-center gap-2;
}

.checkbox-group label {
    @apply font-normal cursor-pointer;
}

.form-actions {
    @apply flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}
</style>
