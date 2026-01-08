<script setup>
import { useProductsStore } from '@/stores/productsStore';
import { usePromotionsStore } from '@/stores/promotionsStore';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    promotion: {
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
const promotionsStore = usePromotionsStore();
const productsStore = useProductsStore();

const isEdit = computed(() => props.promotion !== null);

const form = ref({
    product_id: null,
    product: null, // For autocomplete display
    name: '',
    type: 'wholesale',
    price: 0,
    min_quantity: 1,
    start_date: null,
    end_date: null,
    channel: null,
    priority: 10,
    is_stackable_with_coupons: false,
    is_active: true
});

const typeOptions = [
    { label: 'Mayorista', value: 'wholesale' },
    { label: 'Campaña', value: 'campaign' },
    { label: 'Liquidación', value: 'clearance' },
    { label: 'Oferta Especial', value: 'special' }
];

const channelOptions = [
    { label: 'Todos los canales', value: null },
    { label: 'Solo Web', value: 'web' },
    { label: 'Solo POS', value: 'pos' },
    { label: 'Instagram', value: 'instagram' }
];

const submitting = ref(false);
const filteredProducts = ref([]);

/**
 * Search products for autocomplete
 */
const searchProducts = async (event) => {
    try {
        await productsStore.searchProducts(event.query);
        filteredProducts.value = productsStore.productsList || [];
    } catch (error) {
        console.error('Error searching products:', error);
    }
};

/**
 * Load promotion data into form
 */
const loadPromotionData = (promotion) => {
    // If editing, we assume backend provides product details, 
    // but typically we might need to fetch the product name separately if not included.
    // For now, assuming backend sends `product` object or we just show ID if not.
    // In strict implementation, we might need a `fetchProduct(id)` if not present.
    
    // Simulating product object if only ID is present (or using provided object)
    const productObj = promotion.product || (promotion.product_id ? { id: promotion.product_id, name: `Producto #${promotion.product_id}` } : null);

    form.value = {
        product_id: promotion.product_id,
        product: productObj,
        name: promotion.name || '',
        type: promotion.type || 'wholesale',
        price: Number(promotion.price) || 0,
        min_quantity: promotion.min_quantity || 1,
        start_date: promotion.start_date ? new Date(promotion.start_date) : null,
        end_date: promotion.end_date ? new Date(promotion.end_date) : null,
        channel: promotion.channel || null,
        priority: promotion.priority || 10,
        is_stackable_with_coupons: promotion.is_stackable_with_coupons || false,
        is_active: promotion.is_active !== undefined ? promotion.is_active : true
    };
};

/**
 * Reset form to default values
 */
const resetForm = () => {
    form.value = {
        product_id: null,
        product: null,
        name: '',
        type: 'wholesale',
        price: 0,
        min_quantity: 1,
        start_date: null,
        end_date: null,
        channel: null,
        priority: 10,
        is_stackable_with_coupons: false,
        is_active: true
    };
};

// Watch for promotion prop changes
watch(
    () => props.promotion,
    (newPromo) => {
        if (newPromo) {
            loadPromotionData(newPromo);
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
    if (!form.value.product || !form.value.name || form.value.price <= 0) {
        toast.add({
            severity: 'warn',
            summary: 'Campos requeridos',
            detail: 'Por favor complete producto, nombre y precio válido',
            life: 4000
        });
        return;
    }

    // Set product_id from selected object
    form.value.product_id = form.value.product.id;

    // Prepare data
    const data = {
        ...form.value,
        product: undefined, // Remove object, send only ID
        start_date: form.value.start_date ? form.value.start_date.toISOString() : null,
        end_date: form.value.end_date ? form.value.end_date.toISOString() : null
    };

    submitting.value = true;

    try {
        if (isEdit.value) {
            await promotionsStore.updatePromotion(props.promotion.id, data);
            toast.add({
                severity: 'success',
                summary: 'Promoción actualizada',
                detail: `La promoción ${data.name} ha sido actualizada`,
                life: 3000
            });
        } else {
            await promotionsStore.createPromotion(data);
            toast.add({
                severity: 'success',
                summary: 'Promoción creada',
                detail: `La promoción ${data.name} ha sido creada`,
                life: 3000
            });
        }

        emit('saved');
        emit('close');
        resetForm();
    } catch (error) {
        console.error('[PromotionForm] Error saving:', error);
        
        const errorMessage = error.details?.error_message 
            || error.message 
            || 'Error al guardar la promoción';

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
    <div class="promotion-form">
        <form @submit.prevent="handleSubmit">
            <!-- Basic Information -->
            <div class="form-section">
                <h3 class="section-title">Información Principal</h3>

                <div class="form-group mb-4">
                    <label for="product">Producto *</label>
                    <AutoComplete
                        id="product"
                        v-model="form.product"
                        :suggestions="filteredProducts"
                        @complete="searchProducts"
                        optionLabel="name"
                        placeholder="Buscar producto por nombre o código..."
                        forceSelection
                        class="w-full"
                        :disabled="isEdit"
                    >
                        <template #option="slotProps">
                            <div class="flex items-center gap-2">
                                <img v-if="slotProps.option.image_url" :src="slotProps.option.image_url" :alt="slotProps.option.name" class="w-8 h-8 object-cover rounded" />
                                <div>
                                    <div class="font-bold">{{ slotProps.option.name }}</div>
                                    <small>{{ slotProps.option.sku }}</small>
                                </div>
                            </div>
                        </template>
                    </AutoComplete>
                    <small v-if="isEdit" class="text-blue-500">El producto no se puede cambiar al editar</small>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="name">Nombre de Promoción *</label>
                        <InputText id="name" v-model="form.name" placeholder="Ej: Mayorista 12+" required class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="type">Tipo *</label>
                        <Select id="type" v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Pricing & Conditions -->
            <div class="form-section">
                <h3 class="section-title">Precios y Condiciones</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label for="price">Precio Promocional (S/) *</label>
                        <InputNumber id="price" v-model="form.price" :min="0.01" :minFractionDigits="2" :maxFractionDigits="2" placeholder="0.00" class="w-full" required />
                    </div>

                    <div class="form-group">
                        <label for="min_quantity">Cantidad Mínima *</label>
                        <InputNumber id="min_quantity" v-model="form.min_quantity" :min="1" showButtons buttonLayout="horizontal" class="w-full" />
                    </div>
                </div>

                <div class="form-row mt-4">
                    <div class="form-group">
                        <label for="channel">Canal Exclusivo</label>
                        <Select id="channel" v-model="form.channel" :options="channelOptions" optionLabel="label" optionValue="value" class="w-full" />
                    </div>
                    
                    <div class="form-group">
                         <label for="priority">Prioridad (Mayor valor = Gana)</label>
                         <InputNumber id="priority" v-model="form.priority" :min="0" :max="100" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Validity -->
            <div class="form-section">
                <h3 class="section-title">Vigencia</h3>

                <div class="form-row">
                    <div class="form-group">
                        <label for="start_date">Inicio</label>
                        <Calendar id="start_date" v-model="form.start_date" showTime hourFormat="24" dateFormat="dd/mm/yy" placeholder="Inmediato" class="w-full" />
                    </div>

                    <div class="form-group">
                        <label for="end_date">Fin</label>
                        <Calendar id="end_date" v-model="form.end_date" showTime hourFormat="24" dateFormat="dd/mm/yy" placeholder="Indefinido" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Options -->
            <div class="form-section">
                <h3 class="section-title">Opciones Adicionales</h3>
                
                <div class="grid grid-cols-1 gap-4">
                     <div class="checkbox-group">
                        <Checkbox id="is_active" v-model="form.is_active" :binary="true" />
                        <label for="is_active">Promoción Activa</label>
                    </div>

                    <div class="checkbox-group">
                        <Checkbox id="is_stackable" v-model="form.is_stackable_with_coupons" :binary="true" />
                        <label for="is_stackable">Permitir aplicar cupones encima de este precio</label>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="handleCancel" text />
                <Button :label="isEdit ? 'Actualizar' : 'Crear'" icon="pi pi-check" severity="success" type="submit" :loading="submitting" />
            </div>
        </form>
    </div>
</template>

<style scoped>
.promotion-form {
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

.checkbox-group {
    @apply flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors;
}

.checkbox-group label {
    @apply font-normal cursor-pointer text-gray-700 dark:text-gray-300;
}

.form-actions {
    @apply flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700;
}
</style>
