<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useProductsStore } from '@/stores/productsStore';
import { useProvidersStore } from '@/stores/providersStore';

const productsStore = useProductsStore();
const providersStore = useProvidersStore();

const products = computed(() => productsStore.productsList);
const providers = computed(() => providersStore.providersList);

const submitted = ref(false);

onMounted(() => {
    productsStore.fetchProducts();
    providersStore.fetchProviders();
});

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    entry: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    // Campos de movement_stock
    id: null,
    stock_id: null,
    movement_type: null,
    quantity: null,
    unit_cost: null,
    reason: null,
    reference_document: null,
    user_id: null,

    // Campos de stock
    warehouse_id: null,
    product_id: null,
    batch_id: null
});

const isFormValid = computed(() => {
    return form.value.stock_id && form.value.movement_type && form.value.quantity && form.value.unit_cost;
});

const handleSubmit = () => {
    submitted.value = true;
    if (isFormValid.value) {
        emit('submit', form.value);
    }
};

const handleCancel = () => {
    emit('update:visible', false);
};

const resetForm = () => {
    form.value = {
        // Campos de movement_stock
        id: null,
        stock_id: null,
        movement_type: null,
        quantity: null,
        unit_cost: null,
        reason: null,
        reference_document: null,
        user_id: null,

        // Campos de stock
        warehouse_id: null,
        product_id: null,
        batch_id: null
    };
    submitted.value = false;
};

watch(
    () => props.entry,
    (entry) => {
        if (entry) {
            form.value = entry;
        } else {
            resetForm();
        }
    },
    { immediate: true }
);
</script>

<template></template>
