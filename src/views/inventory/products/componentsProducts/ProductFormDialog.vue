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

onMounted(async () => {
    await unitsStore.fetchUnits();
    await categoriesStore.fetchCategories();
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
    categories: [],
    // Campos para gestión de lotes
    create_batch: false,
    is_perishable: false,
    batch_code: '',
    expiration_date: null
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
        categories: [],
        // Campos para gestión de lotes
        create_batch: false,
        is_perishable: false,
        batch_code: '',
        expiration_date: null
    };
};

const isFormValid = computed(() => {
    const basicValidation = form.value.name && form.value.barcode && form.value.sku && form.value.description && form.value.unit_id;
    
    // Si se está creando un lote, validar que tenga fecha de expiración
    if (form.value.create_batch && form.value.is_perishable && !form.value.expiration_date) {
        return false;
    }
    
    return basicValidation;
});

watch(
    () => props.product,
    (product) => {
        if (product) {
            // Si el producto ya tiene categorías, aseguramos que esté en formato de array
            const productWithCategories = {
                ...product,
                categories: product.categories || (product.category_id ? [product.category_id] : []),
                // Inicializar campos de lote si no existen
                create_batch: product.create_batch || false,
                is_perishable: product.is_perishable || false,
                batch_code: product.batch_code || '',
                expiration_date: product.expiration_date || null
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
        // Limpiar datos antes de enviar
        const dataToSubmit = { ...form.value };
        
        // Si no se va a crear lote, eliminar campos relacionados
        if (!dataToSubmit.create_batch) {
            delete dataToSubmit.is_perishable;
            delete dataToSubmit.batch_code;
            delete dataToSubmit.expiration_date;
        } else {
            // Si no es perecedero, eliminar fecha de vencimiento
            if (!dataToSubmit.is_perishable) {
                delete dataToSubmit.expiration_date;
            }
            
            // Si el código de lote está vacío, eliminarlo para que se genere automáticamente
            if (!dataToSubmit.batch_code || dataToSubmit.batch_code.trim() === '') {
                delete dataToSubmit.batch_code;
            }
        }
        
        emit('submit', dataToSubmit);
        resetForm();
    }
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
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
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '550px', maxWidth: '95vw' }" :header="form.id ? 'Editar Producto' : 'Nuevo Producto'" :modal="true" class="p-fluid product-dialog">
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

            <!-- Sección de Gestión de Lotes -->
            <div class="field">
                <div class="batch-section">
                    <h4 class="batch-title">
                        <i class="pi pi-calendar"></i>
                        Gestión de Lotes
                    </h4>
                    
                    <!-- Checkbox para activar creación de lote -->
                    <div class="field-checkbox mb-3">
                        <Checkbox 
                            id="create_batch" 
                            v-model="form.create_batch" 
                            :binary="true"
                        />
                        <label for="create_batch" class="ml-2 font-medium">
                            ¿Este producto necesita lote?
                        </label>
                    </div>
                    <small class="text-gray-600 block mb-4">
                        Marque esta opción si el producto es perecedero o requiere control de lotes
                    </small>

                    <!-- Campos de lote (se muestran solo si create_batch está activado) -->
                    <div v-if="form.create_batch" class="batch-fields">
                        <!-- Checkbox para producto perecedero -->
                        <div class="field-checkbox">
                            <Checkbox 
                                id="is_perishable" 
                                v-model="form.is_perishable" 
                                :binary="true"
                            />
                            <label for="is_perishable" class="ml-2 font-medium">
                                Producto perecedero (requiere fecha de vencimiento)
                            </label>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Código de lote -->
                            <div class="field">
                                <label for="batch_code" class="font-medium mb-2 block">
                                    Código de lote
                                    <span class="text-gray-500 font-normal">(opcional)</span>
                                </label>
                                <InputText 
                                    id="batch_code" 
                                    v-model="form.batch_code" 
                                    placeholder="Ej: LOTE-2025-001"
                                    maxlength="100"
                                />
                                <small class="text-gray-500">
                                    Si no se especifica, se generará automáticamente
                                </small>
                            </div>

                            <!-- Fecha de vencimiento -->
                            <div class="field">
                                <label for="expiration_date" class="font-medium mb-2 block">
                                    Fecha de vencimiento
                                    <span v-if="form.is_perishable" class="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    id="expiration_date"
                                    v-model="form.expiration_date"
                                    dateFormat="yy-mm-dd"
                                    placeholder="Seleccione fecha"
                                    :minDate="new Date()"
                                    :class="{ 'p-invalid': submitted && form.create_batch && form.is_perishable && !form.expiration_date }"
                                    showIcon
                                />
                                <small class="p-error" v-if="submitted && form.create_batch && form.is_perishable && !form.expiration_date">
                                    La fecha de vencimiento es requerida para productos perecederos
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
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
/* ===== DIALOG STYLES ===== */
:deep(.product-dialog .p-dialog-header) {
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-400) 30%, var(--primary-600) 70%, var(--yellow-400) 100%);
    color: var(--primary-color-text);
    border-radius: 12px 12px 0 0;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(var(--primary), 0.15);
}

:deep(.product-dialog .p-dialog-header .p-dialog-title) {
    font-size: 1.25rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.product-dialog .p-dialog-header .p-dialog-header-icon) {
    color: white;
    opacity: 0.9;
}

:deep(.product-dialog .p-dialog-header .p-dialog-header-icon:hover) {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

:deep(.product-dialog .p-dialog-content) {
    padding: 2rem;
    background: var(--surface-0);
    border-radius: 0 0 12px 12px;
    border: 1px solid var(--surface-border);
    border-top: none;
}

/* ===== FIELD STYLES ===== */
.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.field label {
    @apply font-semibold text-sm;
    color: var(--text-color);
}

.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
}

/* ===== INPUT FOCUS STATES ===== */
:deep(.p-inputtext:focus) {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 0.2rem rgba(var(--primary), 0.15);
}

:deep(.p-dropdown:not(.p-disabled).p-focus) {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 0.2rem rgba(var(--primary), 0.15);
}

:deep(.p-multiselect:not(.p-disabled).p-focus) {
    border-color: #22c55e;
    box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.15);
}

:deep(.p-calendar:not(.p-disabled).p-focus) {
    border-color: #22c55e;
    box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.15);
}

:deep(.p-textarea:focus) {
    border-color: #22c55e;
    box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.15);
}

/* ===== BATCH SECTION ===== */
.batch-section {
    background: linear-gradient(to right, var(--primary-50), var(--yellow-50));
    border: 1px solid var(--primary-300);
    @apply rounded-xl p-6;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(var(--primary), 0.1);
}

.batch-title {
    @apply font-bold mb-4 flex items-center gap-3 text-lg;
    color: var(--primary-900);
}

.batch-title i {
    @apply text-xl;
    color: var(--primary-700);
}

.batch-fields {
    @apply space-y-4 mt-4;
    border-top: 1px solid rgba(34, 197, 94, 0.3);
    padding-top: 1rem;
}

/* ===== CHECKBOX STYLES ===== */
:deep(.p-checkbox .p-checkbox-box) {
    border-color: var(--primary-500);
    border-width: 2px;
}

:deep(.p-checkbox:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box) {
    border-color: #16a34a;
}

:deep(.p-checkbox:not(.p-disabled):has(.p-checkbox-input:checked) .p-checkbox-box) {
    background: var(--primary-500);
    border-color: var(--primary-500);
}

:deep(.p-checkbox:not(.p-disabled):has(.p-checkbox-input:focus) .p-checkbox-box) {
    box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.15);
}

/* ===== BUTTON STYLES ===== */
:deep(.p-dialog-footer .p-button-primary) {
    background: var(--primary-500);
    border-color: var(--primary-500);
    box-shadow: 0 4px 12px rgba(var(--primary), 0.25);
}

:deep(.p-dialog-footer .p-button-primary:hover) {
    background: #16a34a;
    border-color: #16a34a;
    box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
}

:deep(.p-dialog-footer .p-button-text) {
    color: #6b7280;
    font-weight: 500;
}

:deep(.p-dialog-footer .p-button-text:hover) {
    background: rgba(107, 114, 128, 0.1);
    color: #374151;
}

/* ===== CHIPS IN MULTISELECT ===== */
:deep(.p-multiselect-chip) {
    background: var(--primary-500);
    color: var(--primary-color-text);
    font-weight: 500;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.p-multiselect-chip .p-multiselect-chip-icon) {
    color: rgba(255, 255, 255, 0.9);
}

/* ===== VALIDATION ERRORS ===== */
:deep(.p-invalid) {
    border-color: #dc2626;
}

:deep(.p-invalid:focus) {
    border-color: #dc2626;
    box-shadow: 0 0 0 0.2rem rgba(220, 38, 38, 0.2);
}

.p-error {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

/* ===== SEARCH BUTTON ===== */
:deep(.p-button.p-button-primary) {
    background: #22c55e;
    border-color: #22c55e;
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
}

:deep(.p-button.p-button-primary:hover) {
    background: #16a34a;
    border-color: #16a34a;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

/* PrimeVue automaticamente maneja el modo oscuro */

/* ===== RESPONSIVE ===== */
@media (max-width: 640px) {
    :deep(.product-dialog .p-dialog-content) {
        padding: 1rem;
    }
    
    .batch-section {
        padding: 1rem;
    }
    
    .batch-title {
        font-size: 1rem;
    }
}
</style>
