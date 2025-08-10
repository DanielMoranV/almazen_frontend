<script setup>
import { useProductsStore } from '@/stores/productsStore';
import { useStockAdjustmentsStore } from '@/stores/stockAdjustmentsStore';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'adjustmentCreated']);

const toast = useToast();
const adjustmentsStore = useStockAdjustmentsStore();
const productsStore = useProductsStore();

// Computed para controlar la visibilidad del modal
const isVisible = computed({
    get() {
        return props.visible;
    },
    set(value) {
        emit('update:visible', value);
    }
});

// Estado del formulario
const loading = ref(false);
const formData = ref({
    stock_id: null,
    adjustment_type: 'POSITIVO',
    quantity: null,
    reason: '',
    reference_document: '',
    notes: ''
});

// Búsqueda de productos
const productSearchQuery = ref('');
const productSearchResults = ref([]);
const isSearchingProducts = ref(false);
const selectedProduct = ref(null);

// Opciones para los dropdowns
const adjustmentTypes = [
    { label: 'Ajuste Positivo (+)', value: 'POSITIVO', icon: 'pi-plus-circle', class: 'text-green-600' },
    { label: 'Ajuste Negativo (-)', value: 'NEGATIVO', icon: 'pi-minus-circle', class: 'text-red-600' }
];

// Razones predefinidas según el tipo
const predefinedReasons = {
    POSITIVO: [
        'Diferencia en conteo físico - productos encontrados',
        'Mercadería encontrada en revisión de almacén',
        'Devolución de cliente no registrada',
        'Productos no registrados en entrada',
        'Corrección por error de registro anterior',
        'Ajuste por auditoría de inventario'
    ],
    NEGATIVO: [
        'Diferencia en conteo físico - faltante',
        'Producto dañado por humedad/manipulación',
        'Productos vencidos dados de baja',
        'Merma por deterioro natural',
        'Productos robados/extraviados',
        'Muestras entregadas a clientes',
        'Corrección por error de registro',
        'Ajuste por auditoría de inventario'
    ]
};

// Computed para las razones según el tipo seleccionado
const reasonOptions = computed(() => {
    return predefinedReasons[formData.value.adjustment_type] || [];
});

// Computed para el stock seleccionado específico
const selectedStockInfo = computed(() => {
    if (!selectedProduct.value || !formData.value.stock_id) return null;

    // Buscar el stock específico seleccionado
    for (const stock of selectedProduct.value.available_stock || []) {
        // Si el stock_id coincide con el stock general
        if (stock.id === formData.value.stock_id) {
            return stock;
        }
        // Si el stock_id coincide con un lote específico
        if (stock.batches) {
            const batch = stock.batches.find((b) => b.stock_id === formData.value.stock_id);
            if (batch) {
                return batch;
            }
        }
    }
    return null;
});

// Validaciones
const isFormValid = computed(() => {
    return selectedProduct.value && formData.value.quantity && formData.value.quantity > 0 && formData.value.reason.trim();
});

// Búsqueda de productos con debounce
let searchTimeout = null;
const searchProducts = async (query = '') => {
    if (!query.trim()) {
        productSearchResults.value = [];
        return;
    }

    isSearchingProducts.value = true;
    try {
        await productsStore.searchProductsForSale(query);
        productSearchResults.value = productsStore.saleProductsList || [];

        if (productSearchResults.value.length === 0) {
            toast.add({
                severity: 'info',
                summary: 'Sin resultados',
                detail: 'No se encontraron productos disponibles',
                life: 2000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error de búsqueda',
            detail: 'Error al buscar productos'
        });
        productSearchResults.value = [];
    } finally {
        isSearchingProducts.value = false;
    }
};

// Debounced search
const debouncedSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchProducts(query);
    }, 300);
};

// Watch para búsqueda automática
watch(productSearchQuery, (newQuery) => {
    debouncedSearch(newQuery);
});

// Resetear formulario cuando se cierra el modal
watch(isVisible, (newValue) => {
    if (!newValue) {
        resetForm();
    }
});

// Métodos
const resetForm = () => {
    formData.value = {
        stock_id: null,
        adjustment_type: 'POSITIVO',
        quantity: null,
        reason: '',
        reference_document: '',
        notes: ''
    };
    productSearchQuery.value = '';
    productSearchResults.value = [];
    selectedProduct.value = null;
};

const selectProduct = (product) => {
    selectedProduct.value = product;

    // Debug: Verificar estructura de datos del producto
    console.log('Producto seleccionado:', product);
    console.log('Available stock:', product.available_stock);

    if (product.available_stock && product.available_stock.length > 0) {
        product.available_stock.forEach((stock, index) => {
            console.log(`Stock ${index}:`, stock);
            if (stock.batches && stock.batches.length > 0) {
                console.log(`Lotes del stock ${index}:`, stock.batches);
                stock.batches.forEach((batch, batchIndex) => {
                    console.log(`Lote ${batchIndex}:`, batch);
                    console.log(`Cantidad del lote ${batchIndex}:`, batch.quantity, batch.available_quantity, batch.stock_quantity);
                });
            }
        });
    }

    // Obtener el stock_id del primer stock disponible
    const stockInfo = product.available_stock?.[0];
    if (stockInfo) {
        formData.value.stock_id = stockInfo.stock_id || stockInfo.id;
    }

    // Limpiar búsqueda
    productSearchQuery.value = '';
    productSearchResults.value = [];

    toast.add({
        severity: 'success',
        summary: 'Producto seleccionado',
        detail: `${product.name} seleccionado para ajuste`,
        life: 2000
    });
};

const selectPredefinedReason = (reason) => {
    formData.value.reason = reason;
};

// Selección de stock_id por almacén/lote
const selectStockId = (stockId) => {
    formData.value.stock_id = stockId;
    toast.add({
        severity: 'success',
        summary: 'Stock seleccionado',
        detail: 'Stock seleccionado correctamente',
        life: 1500
    });
};

const submitAdjustment = async () => {
    if (!isFormValid.value) {
        toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: 'Por favor complete todos los campos requeridos',
            life: 3000
        });
        return;
    }

    // Validación adicional para ajustes negativos
    if (formData.value.adjustment_type === 'NEGATIVO' && selectedStockInfo.value) {
        const currentStock = selectedStockInfo.value.total_stock || selectedStockInfo.value.available_quantity || 0;
        if (formData.value.quantity > currentStock) {
            toast.add({
                severity: 'error',
                summary: 'Cantidad Inválida',
                detail: `No se puede ajustar ${formData.value.quantity} unidades. Stock actual: ${currentStock}`,
                life: 5000
            });
            return;
        }
    }

    loading.value = true;

    try {
        // Usar el store para crear el ajuste
        const result = await adjustmentsStore.createAdjustment(formData.value);

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Ajuste Creado',
                detail: result.message || 'Ajuste de stock procesado exitosamente',
                life: 3000
            });

            emit('adjustmentCreated', result.data);
            isVisible.value = false;
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al crear el ajuste',
                life: 3000
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al procesar el ajuste de stock',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <Dialog v-model:visible="isVisible" modal header="Nuevo Ajuste de Stock" :style="{ width: '60rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" class="p-fluid">
        <form @submit.prevent="submitAdjustment">
            <div class="grid">
                <!-- Búsqueda de Producto -->
                <div class="col-12">
                    <div class="mb-4">
                        <label for="product-search" class="block text-900 font-semibold mb-3">
                            <i class="pi pi-search mr-2 text-blue-600"></i>
                            Buscar Producto *
                        </label>
                        <div class="relative">
                            <InputText id="product-search" v-model="productSearchQuery" placeholder="Buscar por nombre, SKU o código de barras..." class="w-full p-3" :class="{ 'p-invalid': !selectedProduct }" :loading="isSearchingProducts" />
                            <i v-if="isSearchingProducts" class="pi pi-spin pi-spinner absolute right-3 top-1/2 transform -translate-y-1/2 text-500"> </i>
                        </div>

                        <!-- Resultados de búsqueda -->
                        <div v-if="productSearchResults.length > 0" class="mt-3 max-h-60 overflow-y-auto border rounded-lg shadow-sm bg-white">
                            <div v-for="product in productSearchResults" :key="product.id" @click="selectProduct(product)" class="p-4 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors duration-200">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <div class="font-semibold text-gray-900 text-lg">{{ product.name }}</div>
                                        <div class="text-sm text-gray-600 mt-1"><i class="pi pi-tag mr-1"></i>SKU: {{ product.sku }} | <i class="pi pi-barcode mr-1"></i>Código: {{ product.barcode }}</div>
                                        <div v-if="product.available_stock && product.available_stock.length > 0" class="text-xs text-blue-600 mt-2 font-medium">
                                            <i class="pi pi-box mr-1"></i>Stock disponible: {{ product.available_stock[0].total_stock || product.available_stock[0].available_quantity || 0 }} unidades
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <i class="pi pi-arrow-right text-blue-500 text-lg"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Producto seleccionado -->
                        <div v-if="selectedProduct" class="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex items-center">
                                    <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <i class="pi pi-check-circle text-green-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-green-800 text-lg">{{ selectedProduct.name }}</div>
                                        <div class="text-sm text-green-600"><i class="pi pi-tag mr-1"></i>SKU: {{ selectedProduct.sku }}</div>
                                    </div>
                                </div>
                                <Button
                                    icon="pi pi-times"
                                    class="p-button-text p-button-sm p-button-rounded"
                                    @click="
                                        selectedProduct = null;
                                        formData.stock_id = null;
                                    "
                                    v-tooltip.left="'Cambiar producto'"
                                />
                            </div>

                            <!-- Detalle por almacén y lotes -->
                            <div class="space-y-4">
                                <div class="text-sm font-semibold text-gray-700 mb-3">
                                    <i class="pi pi-building mr-2 text-blue-600"></i>
                                    Selecciona el stock a ajustar:
                                </div>
                                <div v-for="stock in selectedProduct.available_stock" :key="stock.id" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                    <div class="flex items-center justify-between mb-3">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <i class="pi pi-building text-blue-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-bold text-gray-900">{{ stock.warehouse_name || stock.warehouse?.name }}</div>
                                                <div class="text-sm text-gray-500"><i class="pi pi-box mr-1"></i>Stock total: {{ stock.total_stock || stock.available_quantity || 0 }} unidades</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="stock.batches && stock.batches.length > 0">
                                        <div class="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                            <i class="pi pi-list mr-2 text-purple-600"></i>
                                            Lotes disponibles ({{ stock.batches.length }}):
                                        </div>
                                        <div class="space-y-2">
                                            <div v-for="batch in stock.batches" :key="batch.id" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                                                <div class="flex-1">
                                                    <div class="flex items-center space-x-3">
                                                        <span class="font-semibold text-gray-900">{{ batch.batch_code }}</span>
                                                        <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                            {{ parseFloat(batch.available_quantity).toFixed(2) }}
                                                            unidades
                                                        </span>
                                                    </div>
                                                    <div class="text-xs text-gray-500 mt-1"><i class="pi pi-calendar mr-1"></i>Vence: {{ batch.expiration_date }}</div>
                                                </div>
                                                <Button
                                                    size="small"
                                                    :label="formData.stock_id === batch.stock_id ? 'Seleccionado' : 'Seleccionar'"
                                                    :class="formData.stock_id === batch.stock_id ? 'p-button-success' : 'p-button-outlined'"
                                                    @click="selectStockId(batch.stock_id)"
                                                    class="ml-3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="mt-3">
                                        <Button
                                            size="small"
                                            :label="formData.stock_id === stock.id ? 'Seleccionado' : 'Seleccionar'"
                                            :class="formData.stock_id === stock.id ? 'p-button-success' : 'p-button-outlined'"
                                            @click="selectStockId(stock.id)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tipo de Ajuste -->
                <div class="col-12 md:col-6">
                    <label for="type" class="block text-900 font-semibold mb-3">
                        <i class="pi pi-sliders-h mr-2 text-orange-600"></i>
                        Tipo de Ajuste *
                    </label>
                    <Dropdown id="type" v-model="formData.adjustment_type" :options="adjustmentTypes" option-label="label" option-value="value" class="w-full">
                        <template #option="{ option }">
                            <div class="flex align-items-center">
                                <i :class="`pi ${option.icon} mr-3 ${option.class} text-lg`"></i>
                                <span class="font-medium">{{ option.label }}</span>
                            </div>
                        </template>
                        <template #value="{ value }">
                            <div v-if="value" class="flex align-items-center">
                                <i :class="`pi ${adjustmentTypes.find((t) => t.value === value)?.icon} mr-2 ${adjustmentTypes.find((t) => t.value === value)?.class}`"></i>
                                <span class="font-medium">{{ adjustmentTypes.find((t) => t.value === value)?.label }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>

                <!-- Cantidad -->
                <div class="col-12 md:col-6">
                    <label for="quantity" class="block text-900 font-semibold mb-3">
                        <i class="pi pi-calculator mr-2 text-green-600"></i>
                        Cantidad *
                    </label>
                    <InputNumber id="quantity" v-model="formData.quantity" :min="0.01" :step="0.01" mode="decimal" placeholder="0.00" class="w-full p-3" :class="{ 'p-invalid': !formData.quantity || formData.quantity <= 0 }" />
                    <small v-if="formData.adjustment_type === 'NEGATIVO' && selectedStockInfo" class="text-500 flex items-center mt-2">
                        <i class="pi pi-exclamation-triangle mr-1 text-orange-500"></i>
                        Máximo disponible: {{ selectedStockInfo.total_stock || selectedStockInfo.available_quantity || 0 }}
                    </small>
                </div>

                <!-- Razón -->
                <div class="col-12">
                    <label for="reason" class="block text-900 font-semibold mb-3">
                        <i class="pi pi-comment mr-2 text-purple-600"></i>
                        Razón del Ajuste *
                    </label>
                    <div class="mb-3">
                        <div class="text-sm text-gray-600 mb-2">Razones predefinidas:</div>
                        <div class="flex flex-wrap gap-2">
                            <Button v-for="reason in reasonOptions" :key="reason" :label="reason" size="small" class="p-button-outlined p-button-sm" @click="selectPredefinedReason(reason)" />
                        </div>
                    </div>
                    <Textarea id="reason" v-model="formData.reason" rows="3" placeholder="Describe la razón del ajuste..." class="w-full" :class="{ 'p-invalid': !formData.reason.trim() }" />
                </div>

                <!-- Documento de Referencia -->
                <div class="col-12 md:col-6">
                    <label for="reference" class="block text-900 font-semibold mb-3">
                        <i class="pi pi-file mr-2 text-blue-600"></i>
                        Documento de Referencia
                    </label>
                    <InputText id="reference" v-model="formData.reference_document" placeholder="Ej: INV-2024-001" class="w-full" />
                </div>

                <!-- Notas -->
                <div class="col-12 md:col-6">
                    <label for="notes" class="block text-900 font-semibold mb-3">
                        <i class="pi pi-sticky-note mr-2 text-gray-600"></i>
                        Notas Adicionales
                    </label>
                    <Textarea id="notes" v-model="formData.notes" rows="3" placeholder="Notas adicionales (opcional)..." class="w-full" />
                </div>
            </div>

            <!-- Footer con botones -->
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button type="button" label="Cancelar" icon="pi pi-times" class="p-button-outlined" @click="isVisible = false" />
                <Button type="submit" label="Crear Ajuste" icon="pi pi-check" class="p-button-success" :loading="loading" :disabled="!isFormValid" />
            </div>
        </form>
    </Dialog>
</template>

<style scoped>
:deep(.p-dropdown-panel .p-dropdown-items .p-dropdown-item) {
    padding: 0.75rem;
}

:deep(.p-invalid) {
    border-color: #e24c4c;
}

.p-button-sm {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

@media (max-width: 768px) {
    :deep(.p-dialog) {
        margin: 1rem;
    }
}
</style>
