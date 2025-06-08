<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUnitsStore } from '@/stores/unitsStore';
import { useCategoriesStore } from '@/stores/categoriesStore';
import { fetchProductByBarcode } from '@/api/openFoodFacts';
import { BarcodeType } from '@/constants/barcode_type';

const unitsStore = useUnitsStore();
const categoriesStore = useCategoriesStore();

const units = computed(() => unitsStore.unitsList);
const categories = computed(() => categoriesStore.categoriesList);
const barcodeTypes = computed(() => {
    const types = [];
    for (const key in BarcodeType) {
        if (Object.prototype.hasOwnProperty.call(BarcodeType, key)) {
            types.push({
                name: BarcodeType[key].toUpperCase(),
                value: key
            });
        }
    }
    return types;
});

const isSearching = ref(false);
const searchError = ref(null);
const submitted = ref(false);

onMounted(() => {
    unitsStore.fetchUnits();
    categoriesStore.fetchCategories();
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
    type_barcode: '',
    sku: '',
    description: '',
    brand: '',
    unit_id: null,
    image_url: '',
    presentation: '',
    is_active: true,
    // Cambiamos de category_id a categories como array para permitir múltiples selecciones
    categories: []
});

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        barcode: '',
        type_barcode: '',
        sku: '',
        description: '',
        brand: '',
        unit_id: null,
        image_url: '',
        presentation: '',
        is_active: true,
        categories: []
    };
};

const isFormValid = computed(() => {
    return form.value.name && form.value.barcode && form.value.sku && form.value.description && form.value.unit_id;
});

watch(
    () => props.product,
    (product) => {
        if (product) {
            // Si el producto ya tiene categorías, aseguramos que esté en formato de array
            const productWithCategories = {
                ...product,
                categories: product.categories || (product.category_id ? [product.category_id] : [])
            };
            form.value = productWithCategories;
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

const handleSubmit = () => {
    submitted.value = true;
    if (isFormValid.value) {
        emit('submit', form.value);
    }
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
            form.value.brand = productData.brand || '';
            form.value.sku = productData.sku || '';
            form.value.image_url = productData.image_url || '';
            form.value.presentation = productData.presentation || '';
            form.value.unit_id = productData.unit_id || null;
            form.value.type_barcode = productData.barcode_type || '';
            form.value.categories = productData.categories || [];
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
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '550px', maxWidth: '95vw' }" :header="form.id ? 'Editar Producto' : 'Nuevo Producto'" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-4">
            <!-- Código de Barras con scanner -->
            <div style="display: flex; align-items: center; gap: 0.5rem">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="form.barcode" placeholder="Código de barras" v-keyfilter.int autofocus />
                </IconField>
                <Button label="Buscar" icon="pi pi-search" class="ml-2" @click="searchProduct(form.barcode)" :loading="isSearching" />
            </div>

            <!-- Mensaje de error en la búsqueda -->
            <small class="p-error" v-if="searchError">{{ searchError }}</small>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Código de Barras -->
                <div class="field">
                    <label for="barcode" class="font-medium mb-2 block">Código de barras</label>
                    <InputText id="barcode" v-model="form.barcode" placeholder="Código de barras" :class="{ 'p-invalid': submitted && !form.barcode }" />
                    <small class="p-error" v-if="submitted && !form.barcode">El código de barras es requerido.</small>
                </div>
                <!-- Tipo de Código -->
                <div class="field">
                    <label for="type_barcode" class="font-medium mb-2 block">Tipo de Código</label>
                    <Select id="type_barcode" v-model="form.type_barcode" :options="barcodeTypes" optionLabel="name" optionValue="value" placeholder="Tipo de Código" :class="{ 'p-invalid': submitted && !form.type_barcode }" />
                    <small class="p-error" v-if="submitted && !form.type_barcode">El tipo de código es requerido.</small>
                </div>
                <!-- Nombre -->
                <div class="field col-span-2">
                    <label for="name" class="font-medium mb-2 block">Nombre del producto</label>
                    <InputText id="name" v-model="form.name" placeholder="Nombre del producto" :class="{ 'p-invalid': submitted && !form.name }" />
                    <small class="p-error" v-if="submitted && !form.name">El nombre es requerido.</small>
                </div>

                <!-- Marca -->
                <div class="field">
                    <label for="brand" class="font-medium mb-2 block">Marca</label>
                    <InputText id="brand" v-model="form.brand" placeholder="Marca del producto" :class="{ 'p-invalid': submitted && !form.brand }" />
                    <small class="p-error" v-if="submitted && !form.brand">La marca es requerida.</small>
                </div>

                <!-- Presentación -->
                <div class="field">
                    <label for="presentation" class="font-medium mb-2 block">Presentación</label>
                    <InputText id="presentation" v-model="form.presentation" placeholder="Presentación del producto" :class="{ 'p-invalid': submitted && !form.presentation }" />
                    <small class="p-error" v-if="submitted && !form.presentation">La presentación es requerida.</small>
                </div>

                <!-- SKU -->
                <div class="field">
                    <label for="sku" class="font-medium mb-2 block">SKU</label>
                    <InputText id="sku" v-model="form.sku" placeholder="SKU o código interno" :class="{ 'p-invalid': submitted && !form.sku }" />
                    <small class="p-error" v-if="submitted && !form.sku">El SKU es requerido.</small>
                </div>

                <!-- Unidad -->
                <div class="field">
                    <label for="unit_id" class="font-medium mb-2 block">Unidad de medida</label>
                    <Select id="unit_id" v-model="form.unit_id" :options="units" optionLabel="symbol" optionValue="id" placeholder="Seleccione una unidad" :class="{ 'p-invalid': submitted && !form.unit_id }" />
                    <small class="p-error" v-if="submitted && !form.unit_id">La unidad es requerida.</small>
                </div>
            </div>

            <!-- Descripción -->
            <div class="field">
                <label for="description" class="font-medium mb-2 block">Descripción</label>
                <Textarea id="description" v-model="form.description" autoResize rows="3" placeholder="Descripción del producto" :class="{ 'p-invalid': submitted && !form.description }" />
                <small class="p-error" v-if="submitted && !form.description">La descripción es requerida.</small>
            </div>

            <!-- Imagen -->
            <div class="field">
                <label class="font-medium mb-2 block">Imagen del producto</label>
                <div class="flex items-center gap-4">
                    <div class="relative bg-gray-100 border border-gray-300 rounded-lg h-40 w-40 flex items-center justify-center overflow-hidden">
                        <img v-if="form.image_url" :src="form.image_url" alt="Imagen del producto" class="max-h-full max-w-full object-contain" />
                        <div v-else class="text-gray-400 text-center">
                            <i class="pi pi-image text-4xl mb-2"></i>
                            <p>Sin imagen</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Categorías con MultiSelect (selección múltiple como chips) -->
            <div class="field">
                <label for="categories" class="font-medium mb-2 block">Categorías</label>
                <MultiSelect id="categories" v-model="form.categories" :options="categories" optionLabel="name" optionValue="id" placeholder="Seleccione las categorías" display="chip" filter class="w-full" />
                <small class="text-gray-500">Puede seleccionar múltiples categorías</small>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="handleCancel" />
                <Button label="Guardar" icon="pi pi-check" class="p-button-primary" @click="handleSubmit" :loading="loading" />
            </div>
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
