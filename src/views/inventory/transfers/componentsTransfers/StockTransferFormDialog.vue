<script setup>
import { useProductsStore } from '@/stores/productsStore';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

// PrimeVue Components
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    transfer: {
        type: Object,
        default: null
    },
    warehouseOptions: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const toast = useToast();
const productsStore = useProductsStore();

// Form data
const formData = ref({
    stock_id: null,
    to_warehouse_id: null,
    quantity: null,
    reason: ''
});

// Product search
const productSearchQuery = ref('');
const productSuggestions = ref([]);
const selectedProduct = ref(null);
const isSearchingProducts = ref(false);
const productDetails = ref(null);
const selectedWarehouse = ref(null);

// Dialog visibility model
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// Form validation
const isFormValid = computed(() => {
    return formData.value.stock_id && formData.value.to_warehouse_id && formData.value.quantity && formData.value.quantity > 0 && formData.value.reason.trim();
});

// Available stock for selected product
const availableStock = computed(() => {
    if (!productDetails.value || !formData.value.stock_id) return 0;

    const stock = productDetails.value.stocks?.find((s) => s.id === formData.value.stock_id);
    return stock ? stock.quantity : 0;
});

// Methods - declare before watchers to avoid hoisting issues
const resetForm = () => {
    formData.value = {
        stock_id: null,
        to_warehouse_id: null,
        quantity: null,
        reason: ''
    };
    selectedProduct.value = null;
    productDetails.value = null;
    productSearchQuery.value = '';
    selectedWarehouse.value = null;
};

const searchProducts = async (event) => {
    isSearchingProducts.value = true;
    try {
        const query = event.query.trim();
        if (query.length < 2) {
            productSuggestions.value = [];
            return;
        }

        // Search products with stock available
        await productsStore.searchProductsForSale(query);

        // Store the full product data separately for later use
        const fullProductsData = (productsStore.saleProductsList || []).map((product) => {
            // Convert available_stock to stocks format for consistency
            const stocks = (product.available_stock || []).map((stockInfo) => ({
                id: stockInfo.stock_id || stockInfo.id,
                warehouse_id: stockInfo.warehouse_id,
                warehouse: { name: stockInfo.warehouse_name },
                quantity: stockInfo.total_stock || stockInfo.available_quantity || 0,
                batch: stockInfo.batches && stockInfo.batches.length > 0 ? stockInfo.batches[0] : null
            }));

            return {
                id: product.id,
                name: product.name,
                sku: product.sku || 'Sin SKU',
                barcode: product.barcode || '',
                stocks: stocks
            };
        });

        // Create simple string suggestions for AutoComplete
        productSuggestions.value = fullProductsData.map((product) => {
            let displayText = `${product.name} - SKU: ${product.sku}`;
            if (product.barcode) {
                displayText += ` - Barcode: ${product.barcode}`;
            }
            return {
                label: displayText,
                value: displayText,
                productData: product // Store the full product data here
            };
        });
    } catch (error) {
        console.error('Error searching products:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al buscar productos',
            life: 3000
        });
        productSuggestions.value = [];
    } finally {
        isSearchingProducts.value = false;
    }
};

const onProductSelect = async (event) => {
    try {
        const selectedItem = event.value;
        const product = selectedItem.productData;

        selectedProduct.value = product;
        productDetails.value = product;

        // Update the search query to show the selected product display text
        productSearchQuery.value = selectedItem.label;

        // If there are stocks available, show options
        if (product.stocks && product.stocks.length > 0) {
            // Pre-select first available stock
            const firstStock = product.stocks[0];
            formData.value.stock_id = firstStock.id;

            // Set source warehouse to prevent same-warehouse transfers
            if (firstStock.warehouse_id) {
                selectedWarehouse.value = firstStock.warehouse_id;
            }
        }
    } catch (error) {
        console.error('Error selecting product:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al seleccionar el producto',
            life: 3000
        });
    }
};

const clearProductSelection = () => {
    selectedProduct.value = null;
    productDetails.value = null;
    formData.value.stock_id = null;
    productSearchQuery.value = '';
    selectedWarehouse.value = null;
};

const selectStock = (stock) => {
    formData.value.stock_id = stock.id;
    selectedWarehouse.value = stock.warehouse_id;
};

const handleSubmit = () => {
    if (!isFormValid.value) return;

    emit('submit', { ...formData.value });
};

const handleCancel = () => {
    dialogVisible.value = false;
};

// Helper function to get warehouse name by ID
const getWarehouseName = (warehouseId) => {
    const warehouse = props.warehouseOptions.find((w) => w.value === warehouseId);
    return warehouse ? warehouse.label : `ID: ${warehouseId}`;
};

// Get filtered warehouse options (exclude source warehouse)
const filteredWarehouseOptions = computed(() => {
    if (!selectedWarehouse.value) return props.warehouseOptions;

    return props.warehouseOptions.filter((warehouse) => warehouse.value !== selectedWarehouse.value);
});

// Watch for transfer prop changes (edit mode)
watch(
    () => props.transfer,
    (newTransfer) => {
        if (newTransfer) {
            formData.value = {
                id: newTransfer.id,
                stock_id: newTransfer.stock_id,
                to_warehouse_id: newTransfer.to_warehouse_id,
                quantity: newTransfer.quantity,
                reason: newTransfer.reason || ''
            };

            // Load product details if editing
            if (newTransfer.product) {
                selectedProduct.value = newTransfer.product;
                productDetails.value = newTransfer.product;
            }
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

// Watch for dialog visibility changes
watch(dialogVisible, (visible) => {
    if (!visible) {
        resetForm();
    }
});

// Prevent transferring to same warehouse
watch([() => formData.value.to_warehouse_id, () => selectedWarehouse.value], ([toWarehouse, fromWarehouse]) => {
    if (toWarehouse && fromWarehouse && toWarehouse === fromWarehouse) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'El almacén de destino debe ser diferente al de origen',
            life: 3000
        });
        formData.value.to_warehouse_id = null;
    }
});
</script>

<template>
    <Dialog v-model:visible="dialogVisible" modal
        :header="transfer ? 'Editar Transferencia' : 'Nueva Transferencia de Stock'" :style="{ width: '800px' }"
        :closable="!loading" :draggable="false" class="transfer-dialog">
        <form @submit.prevent="handleSubmit" class="transfer-form">
            <!-- Product Search Section -->
            <div class="form-section">
                <h3 class="section-title">
                    <i class="pi pi-search"></i>
                    Selección de Producto
                </h3>

                <div class="field">
                    <label class="field-label">Buscar Producto *</label>
                    <div class="search-input-group">
                        <AutoComplete v-model="productSearchQuery" :suggestions="productSuggestions"
                            :loading="isSearchingProducts"
                            placeholder="Buscar por nombre, código, SKU o código de barras" optionLabel="label"
                            @complete="searchProducts" @item-select="onProductSelect" :dropdown="true"
                            :forceSelection="false" class="product-search">
                            <template #empty>
                                <div class="search-empty">
                                    <i class="pi pi-search"></i>
                                    <p>No se encontraron productos</p>
                                    <small>Intenta con otro término de búsqueda</small>
                                </div>
                            </template>

                            <template #item="slotProps">
                                <div class="product-suggestion">
                                    <div class="product-main">
                                        <div class="product-name">{{ slotProps.item.productData.name }}</div>
                                        <div class="product-codes">
                                            <span class="product-sku">SKU: {{ slotProps.item.productData.sku }}</span>
                                            <span v-if="slotProps.item.productData.barcode"
                                                class="product-barcode">Barcode: {{ slotProps.item.productData.barcode
                                                }}</span>
                                        </div>
                                    </div>
                                    <div class="product-stock-count">
                                        <Tag :value="`${slotProps.item.productData.stocks.length} stock${slotProps.item.productData.stocks.length !== 1 ? 's' : ''}`"
                                            severity="info" />
                                    </div>
                                </div>
                            </template>

                            <template #loader>
                                <div class="search-loader">
                                    <ProgressSpinner style="width: 1.5rem; height: 1.5rem" strokeWidth="4" />
                                    <span>Buscando productos...</span>
                                </div>
                            </template>
                        </AutoComplete>

                        <Button icon="pi pi-times" severity="secondary" @click="clearProductSelection"
                            v-tooltip.top="'Limpiar selección'" :disabled="!selectedProduct" />
                    </div>
                    <small class="field-help">Busque el producto que desea transferir</small>
                </div>
            </div>

            <!-- Product Details Section -->
            <div v-if="productDetails" class="form-section">
                <h3 class="section-title">
                    <i class="pi pi-info-circle"></i>
                    Detalles del Producto
                </h3>

                <div class="product-details">
                    <div class="product-header">
                        <h4 class="product-title">{{ productDetails.name }}</h4>
                        <div class="product-meta">
                            <span class="meta-item">SKU: {{ productDetails.sku || 'N/A' }}</span>
                            <span v-if="productDetails.barcode" class="meta-item">Barcode: {{ productDetails.barcode
                                }}</span>
                        </div>
                    </div>

                    <div class="stocks-section">
                        <h5 class="stocks-title">Stocks Disponibles:</h5>
                        <div v-if="productDetails.stocks && productDetails.stocks.length > 0" class="stocks-grid">
                            <div v-for="stock in productDetails.stocks" :key="stock.id" class="stock-card"
                                :class="{ selected: formData.stock_id === stock.id }">
                                <div class="stock-info">
                                    <div class="stock-warehouse">
                                        <i class="pi pi-warehouse"></i>
                                        <span>{{ stock.warehouse?.name || `ID: ${stock.warehouse_id}` }}</span>
                                    </div>
                                    <div class="stock-quantity">
                                        <span class="quantity-value">{{ stock.quantity }}</span>
                                        <span class="quantity-label">unidades</span>
                                    </div>
                                    <div v-if="stock.batch" class="stock-batch">
                                        <i class="pi pi-tag"></i>
                                        <span>Lote: {{ stock.batch.code }}</span>
                                    </div>
                                </div>
                                <Button icon="pi pi-check"
                                    :severity="formData.stock_id === stock.id ? 'success' : 'secondary'" size="small"
                                    @click="selectStock(stock)" :disabled="formData.stock_id === stock.id"
                                    v-tooltip.left="'Seleccionar este stock'" />
                            </div>
                        </div>
                        <div v-else class="no-stocks">
                            <i class="pi pi-exclamation-triangle"></i>
                            <p>No hay stock disponible para este producto</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Transfer Details Section -->
            <div class="form-section">
                <h3 class="section-title">
                    <i class="pi pi-arrow-right-arrow-left"></i>
                    Detalles de la Transferencia
                </h3>

                <!-- Transfer Summary Card -->
                <div v-if="formData.stock_id" class="transfer-summary-card">
                    <div class="summary-header">
                        <i class="pi pi-info-circle"></i>
                        <span>Resumen de la Transferencia</span>
                    </div>
                    <div class="summary-content">
                        <div class="summary-item">
                            <span class="summary-label">Stock ID:</span>
                            <Tag :value="`#${formData.stock_id}`" severity="info" />
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Disponible:</span>
                            <Tag :value="`${availableStock} unidades`" severity="success" />
                        </div>
                        <div v-if="selectedWarehouse" class="summary-item">
                            <span class="summary-label">Desde:</span>
                            <div class="warehouse-info">
                                <i class="pi pi-warehouse text-orange-500"></i>
                                <span>{{ getWarehouseName(selectedWarehouse) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="transfer-form-grid">
                    <!-- Destination Warehouse -->
                    <div class="transfer-field-card">
                        <div class="field-card-header">
                            <i class="pi pi-warehouse"></i>
                            <span>Almacén Destino</span>
                            <span class="required-indicator">*</span>
                        </div>
                        <div class="field-card-content">
                            <Dropdown v-model="formData.to_warehouse_id" :options="filteredWarehouseOptions"
                                optionLabel="label" optionValue="value" placeholder="Seleccione el almacén destino"
                                :filter="true" filterPlaceholder="Buscar almacén..."
                                :invalid="!formData.to_warehouse_id" class="w-full">
                                <template #value="slotProps">
                                    <div v-if="slotProps.value" class="selected-warehouse">
                                        <i class="pi pi-warehouse text-green-500"></i>
                                        <span>{{ getWarehouseName(slotProps.value) }}</span>
                                    </div>
                                    <span v-else class="placeholder-text">Seleccione el almacén destino</span>
                                </template>
                            </Dropdown>
                            <small class="field-help">Almacén donde se transferirá el stock</small>
                        </div>
                    </div>

                    <!-- Quantity -->
                    <div class="transfer-field-card">
                        <div class="field-card-header">
                            <i class="pi pi-calculator"></i>
                            <span>Cantidad</span>
                            <span class="required-indicator">*</span>
                        </div>
                        <div class="field-card-content">
                            <InputNumber v-model="formData.quantity" :min="1" :max="availableStock"
                                placeholder="Ingrese la cantidad"
                                :invalid="!formData.quantity || formData.quantity <= 0 || formData.quantity > availableStock"
                                class="w-full" />
                            <small class="field-help"> Cantidad a transferir (máximo: {{ availableStock }} unidades
                                disponibles)
                            </small>
                        </div>
                    </div>
                </div>

                <!-- Reason -->
                <div class="transfer-field-card full-width">
                    <div class="field-card-header">
                        <i class="pi pi-file-edit"></i>
                        <span>Motivo</span>
                        <span class="required-indicator">*</span>
                    </div>
                    <div class="field-card-content">
                        <Textarea v-model="formData.reason" rows="3"
                            placeholder="Describa el motivo de la transferencia" :invalid="!formData.reason.trim()"
                            class="w-full" />
                        <small class="field-help">Describa el motivo de la transferencia</small>
                    </div>
                </div>
            </div>
        </form>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="handleCancel"
                    :disabled="loading" />
                <Button :label="transfer ? 'Actualizar Transferencia' : 'Crear Transferencia'" icon="pi pi-check"
                    @click="handleSubmit" :loading="loading" :disabled="!isFormValid" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.transfer-dialog :deep(.p-dialog-content) {
    @apply p-0;
}

.transfer-form {
    @apply space-y-6 p-6;
}

.form-section {
    @apply space-y-4;
}

.section-title {
    @apply text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700;
}

.section-title i {
    @apply text-purple-500;
}

.field {
    @apply space-y-2;
}

.field-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.field-help {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.search-input-group {
    @apply flex gap-2;
}

.product-search {
    @apply flex-1;
}

.search-empty {
    @apply text-center py-4 space-y-2;
}

.search-empty i {
    @apply text-2xl text-gray-400;
}

.search-empty p {
    @apply text-gray-600 dark:text-gray-400;
}

.search-empty small {
    @apply text-gray-500 dark:text-gray-500;
}

.search-loader {
    @apply flex items-center justify-center gap-2 py-2;
}

.product-suggestion {
    @apply flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors;
}

.product-main {
    @apply flex-1;
}

.product-name {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.product-codes {
    @apply flex gap-2 mt-1;
}

.product-sku,
.product-code,
.product-barcode {
    @apply text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded;
}

.product-stock-count {
    @apply ml-2;
}

.product-details {
    @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4;
}

.product-header {
    @apply space-y-2;
}

.product-title {
    @apply text-lg font-semibold text-gray-900 dark:text-gray-100;
}

.product-meta {
    @apply flex gap-3;
}

.meta-item {
    @apply text-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded border border-gray-200 dark:border-gray-600;
}

.stocks-section {
    @apply space-y-3;
}

.stocks-title {
    @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.stocks-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.stock-card {
    @apply bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center justify-between transition-all;
}

.stock-card:hover {
    @apply shadow-md;
}

.stock-card.selected {
    @apply border-green-500 bg-green-50 dark:bg-green-900/20;
}

.stock-info {
    @apply space-y-2;
}

.stock-warehouse {
    @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300;
}

.stock-warehouse i {
    @apply text-orange-500;
}

.stock-quantity {
    @apply flex items-baseline gap-1;
}

.quantity-value {
    @apply text-lg font-bold text-gray-900 dark:text-gray-100;
}

.quantity-label {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.stock-batch {
    @apply flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400;
}

.stock-batch i {
    @apply text-blue-500;
}

.no-stocks {
    @apply text-center py-6 space-y-2 text-gray-500 dark:text-gray-400;
}

.no-stocks i {
    @apply text-2xl text-yellow-500;
}

.form-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.field.full-width {
    @apply md:col-span-2;
}

.dialog-footer {
    @apply flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700;
}

/* Transfer form styles */
.transfer-summary-card {
    @apply bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-4;
}

.summary-header {
    @apply flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold mb-3;
}

.summary-content {
    @apply space-y-2;
}

.summary-item {
    @apply flex items-center justify-between;
}

.summary-label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.warehouse-info {
    @apply flex items-center gap-2 text-sm;
}

.transfer-form-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 mb-4;
}

.transfer-field-card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700;
}

.transfer-field-card.full-width {
    @apply md:col-span-2;
}

.field-card-header {
    @apply flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold mb-3;
}

.field-card-header i {
    @apply text-purple-500;
}

.required-indicator {
    @apply text-red-500 font-bold;
}

.field-card-content {
    @apply space-y-2;
}

.selected-warehouse {
    @apply flex items-center gap-2;
}

.placeholder-text {
    @apply text-gray-500 dark:text-gray-400;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .transfer-dialog {
        @apply w-full max-w-none m-4;
    }

    .transfer-form {
        @apply p-4 space-y-4;
    }

    .section-title {
        @apply text-base;
    }

    .stocks-grid {
        @apply grid-cols-1;
    }

    .transfer-form-grid {
        @apply grid-cols-1;
    }

    .product-codes {
        @apply flex-col gap-1;
    }

    .product-meta {
        @apply flex-col gap-2;
    }
}
</style>
