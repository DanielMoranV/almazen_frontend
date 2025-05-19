<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUnitsStore } from '@/stores/unitsStore';
import { fetchProductByBarcode } from '@/api/openFoodFacts';

const unitsStore = useUnitsStore();

const units = computed(() => unitsStore.unitsList);

const isSearching = ref(false);
const searchError = ref(null);

onMounted(() => {
    unitsStore.fetchUnits();
});

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    product: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    barcode: '',
    sku: '',
    description: '',
    unit_id: null,
    company_name: '',
    image_url: '',
    is_active: true
});

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        barcode: '',
        sku: '',
        description: '',
        unit_id: null,
        company_name: '',
        image_url: '',
        is_active: true
    };
};

const isFormValid = computed(() => {
    return form.value.name && form.value.barcode && form.value.sku && form.value.description && form.value.unit_id && form.value.company_name;
});

watch(
    () => props.product,
    (product) => {
        if (product) {
            form.value = { ...product };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

const handleSubmit = () => {
    emit('submit', form.value);
};

const handleCancel = () => {
    emit('update:visible', false);
};

const searchProduct = async () => {
    if (!form.value.barcode) return;

    isSearching.value = true;
    searchError.value = null;
    try {
        const productData = await fetchProductByBarcode(form.value.barcode);
        if (productData) {
            form.value.name = productData.name || '';
            form.value.description = productData.description || '';
            form.value.sku = productData.brand || '';
            form.value.image_url = productData.image_url || '';
        } else {
            searchError.value = 'Producto no encontrado.';
        }
    } catch (err) {
        searchError.value = 'Error al buscar el producto.';
    } finally {
        isSearching.value = false;
    }
};
</script>
<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px', maxWidth: '95vw' }" :header="form.id ? 'Editar Producto' : 'Nuevo Producto'" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-4">
            <!-- Código de Barras -->
            <div class="field">
                <label for="barcode">Código de barras</label>
                <div class="p-inputgroup">
                    <InputText id="barcode" v-model="form.barcode" placeholder="Ingrese el código de barras" />
                    <Button icon="pi pi-search" @click="searchProduct" :loading="isSearching" label="Buscar" />
                </div>
                <small class="p-error" v-if="!form.barcode">Código de barras es requerido.</small>
                <small class="p-error" v-if="searchError">{{ searchError }}</small>
            </div>

            <!-- Nombre -->
            <div class="field">
                <label for="name">Nombre</label>
                <InputText id="name" v-model="form.name" placeholder="Nombre del producto" :class="{ 'p-invalid': !form.name }" />
                <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
            </div>

            <!-- SKU -->
            <div class="field">
                <label for="sku">SKU</label>
                <InputText id="sku" v-model="form.sku" placeholder="SKU o marca" :class="{ 'p-invalid': !form.sku }" />
                <small class="p-error" v-if="!form.sku">SKU es requerido.</small>
            </div>

            <!-- Unidad -->
            <div class="field">
                <label for="unit_id">Unidad</label>
                <Select id="unit_id" v-model="form.unit_id" :options="units" optionLabel="name" optionValue="id" placeholder="Unidad" :class="{ 'p-invalid': !form.unit_id }" />
                <small class="p-error" v-if="!form.unit_id">Unidad es requerida.</small>
            </div>

            <!-- Empresa -->
            <div class="field">
                <label for="company_name">Empresa</label>
                <InputText id="company_name" v-model="form.company_name" placeholder="Empresa" :class="{ 'p-invalid': !form.company_name }" />
                <small class="p-error" v-if="!form.company_name">Empresa es requerida.</small>
            </div>

            <!-- Descripción -->
            <div class="field">
                <label for="description">Descripción</label>
                <Textarea id="description" v-model="form.description" autoResize rows="3" placeholder="Descripción" :class="{ 'p-invalid': !form.description }" />
                <small class="p-error" v-if="!form.description">Descripción es requerida.</small>
            </div>

            <!-- Imagen -->
            <div class="field" v-if="form.image_url">
                <label>Imagen del producto</label>
                <img :src="form.image_url" alt="Imagen del producto" class="w-full border-round shadow-2" style="max-height: 200px; object-fit: contain" />
            </div>

            <!-- Checkbox Activo -->
            <div class="field-checkbox">
                <Checkbox id="is_active" v-model="form.is_active" :binary="true" />
                <label for="is_active">Producto activo</label>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="handleCancel" />
            <Button label="Guardar" icon="pi pi-check" class="p-button-text" :disabled="!isFormValid" @click="handleSubmit" :loading="loading" />
        </template>
    </Dialog>
</template>

<style scoped>
.field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
