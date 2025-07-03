<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useBatchesStore } from '@/stores/batchesStore';

const toast = useToast();
const batchesStore = useBatchesStore();

const props = defineProps({
    visible: Boolean,
    order: {
        type: Object,
        default: null
    },
    batchData: {
        type: Object,
        default: () => ({
            manualProducts: [],
            autoProducts: []
        })
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'submit']);

// Estados del formulario
const batchForm = ref({
    batches: []
});

const submitted = ref(false);
const loadingBatches = ref(false);
const availableBatches = ref({});

// Inicializar formulario cuando se abra el diálogo
watch(
    () => props.visible,
    (newVisible) => {
        if (newVisible && props.batchData.manualProducts.length > 0) {
            initializeBatchForm();
        }
    },
    { immediate: true }
);

const initializeBatchForm = async () => {
    batchForm.value.batches = props.batchData.manualProducts.map(product => ({
        productId: product.product.id,
        productName: product.product.name,
        productSku: product.product.sku,
        purchaseDetailId: product.id, // ID del detalle de la orden de compra
        requiredQuantity: Number(product.quantity),
        batches: [
            {
                id: null, // ID único para el batch form item
                batchType: 'new', // 'new' o 'existing'
                existingBatchId: null,
                batchNumber: generateBatchNumber(product.product),
                expirationDate: null,
                quantity: Number(product.quantity),
                notes: ''
            }
        ]
    }));
    
    // Cargar lotes disponibles para cada producto
    await loadAvailableBatches();
};

// Cargar lotes disponibles para todos los productos
const loadAvailableBatches = async () => {
    loadingBatches.value = true;
    
    try {
        const productIds = props.batchData.manualProducts.map(p => p.product.id);
        
        const batchPromises = productIds.map(async (productId) => {
            try {
                const response = await batchesStore.getAvailableBatchesForProduct(productId);
                
                if (response.success) {
                    const formattedBatches = response.data.batches.map(batch => 
                        batchesStore.formatBatchForDropdown(batch)
                    );
                    
                    return {
                        productId,
                        batches: formattedBatches
                    };
                }
                return { productId, batches: [] };
            } catch (error) {
                console.error(`Error loading batches for product ${productId}:`, error);
                return { productId, batches: [] };
            }
        });

        const results = await Promise.all(batchPromises);
        
        // Organizar los lotes por producto
        availableBatches.value = results.reduce((acc, result) => {
            acc[result.productId] = result.batches;
            return acc;
        }, {});
        
    } catch (error) {
        console.error('Error loading available batches:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los lotes disponibles',
            life: 4000
        });
    } finally {
        loadingBatches.value = false;
    }
};

const generateBatchNumber = (product) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sku = product.sku ? product.sku.slice(0, 3).toUpperCase() : 'PRD';
    
    return `${sku}${year}${month}${day}001`;
};

const addBatchToProduct = (productIndex) => {
    const product = batchForm.value.batches[productIndex];
    const newBatchNumber = generateBatchNumber({
        sku: product.productSku
    });
    
    product.batches.push({
        id: Date.now(), // ID único temporal
        batchType: 'new',
        existingBatchId: null,
        batchNumber: newBatchNumber,
        expirationDate: null,
        quantity: 0,
        notes: ''
    });
};

const removeBatchFromProduct = (productIndex, batchIndex) => {
    const product = batchForm.value.batches[productIndex];
    if (product.batches.length > 1) {
        product.batches.splice(batchIndex, 1);
    }
};

const getTotalQuantityForProduct = (productIndex) => {
    const product = batchForm.value.batches[productIndex];
    return product.batches.reduce((total, batch) => total + (Number(batch.quantity) || 0), 0);
};

const isProductQuantityValid = (productIndex) => {
    const product = batchForm.value.batches[productIndex];
    const totalQuantity = getTotalQuantityForProduct(productIndex);
    return totalQuantity === product.requiredQuantity;
};

// Manejar cambio de tipo de lote
const handleBatchTypeChange = (productIndex, batchIndex) => {
    const batch = batchForm.value.batches[productIndex].batches[batchIndex];
    
    if (batch.batchType === 'existing') {
        // Limpiar campos para usar lote existente
        batch.batchNumber = '';
        batch.expirationDate = null;
        batch.existingBatchId = null;
    } else {
        // Generar nuevo número de lote
        const product = batchForm.value.batches[productIndex];
        batch.batchNumber = generateBatchNumber({ sku: product.productSku });
        batch.existingBatchId = null;
    }
};

// Manejar selección de lote existente
const handleExistingBatchSelect = (productIndex, batchIndex, event) => {
    const batch = batchForm.value.batches[productIndex].batches[batchIndex];
    const productId = batchForm.value.batches[productIndex].productId;
    
    // Extraer el valor real del evento de PrimeVue
    const selectedBatchId = event?.value || event;
    
    if (selectedBatchId) {
        // Buscar el lote completo por ID
        const selectedBatch = getAvailableBatchesForProduct(productId).find(b => b.id === selectedBatchId);
        
        if (selectedBatch) {
            batch.existingBatchId = selectedBatch.id;
            batch.batchNumber = selectedBatch.code;
            batch.expirationDate = selectedBatch.expirationDate ? new Date(selectedBatch.expirationDate) : null;
        }
    } else {
        batch.existingBatchId = null;
        batch.batchNumber = '';
        batch.expirationDate = null;
    }
};

// Obtener lotes disponibles para un producto específico
const getAvailableBatchesForProduct = (productId) => {
    return availableBatches.value[productId] || [];
};

const isFormValid = computed(() => {
    if (!batchForm.value.batches.length) return false;
    
    return batchForm.value.batches.every((product, index) => {
        // Verificar que todas las cantidades coincidan
        if (!isProductQuantityValid(index)) return false;
        
        // Verificar que todos los lotes tengan datos válidos
        return product.batches.every(batch => {
            if (batch.batchType === 'existing') {
                return batch.existingBatchId && batch.quantity > 0;
            } else {
                return batch.batchNumber && 
                       batch.quantity > 0 && 
                       batch.expirationDate;
            }
        });
    });
});

const autoProducts = computed(() => {
    return (props.batchData.autoProducts || []).map(product => ({
        ...product,
        quantity: Number(product.quantity)
    }));
});

const handleSubmit = () => {
    submitted.value = true;
    
    if (!isFormValid.value) {
        toast.add({
            severity: 'error',
            summary: 'Validación',
            detail: 'Por favor complete todos los campos y verifique las cantidades',
            life: 4000
        });
        return;
    }
    
    const submitData = {
        manualBatches: batchForm.value.batches,
        autoGenerateProducts: autoProducts.value.map(product => ({
            productId: product.product.id,
            purchaseDetailId: product.id, // ID del detalle de la orden de compra
            quantity: product.quantity
        }))
    };
    
    emit('submit', submitData);
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};

const resetForm = () => {
    batchForm.value = { batches: [] };
    submitted.value = false;
};

const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-PE');
};
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="(val) => emit('update:visible', val)" 
        :style="{ width: '90vw', maxWidth: '1000px' }" 
        header="Gestión de Lotes para Recepción"
        :modal="true" 
        class="batch-dialog"
        @hide="resetForm"
    >
        <div class="dialog-content">
            <!-- Información de la orden -->
            <div class="order-info">
                <div class="info-header">
                    <h3 class="order-title">
                        <i class="pi pi-shopping-cart"></i>
                        Orden #{{ order?.order_number }}
                    </h3>
                    <div class="order-details">
                        <span class="provider">{{ order?.provider?.name }}</span>
                        <span class="date">{{ formatDate(order?.purchase_date) }}</span>
                    </div>
                </div>
            </div>

            <!-- Productos con auto-generación -->
            <div v-if="autoProducts.length > 0" class="auto-products-section">
                <div class="section-header">
                    <h4 class="section-title">
                        <i class="pi pi-cog text-purple-500"></i>
                        Productos con Auto-generación de Lotes
                    </h4>
                    <p class="section-description">
                        Estos productos generarán lotes automáticamente
                    </p>
                </div>
                
                <div class="auto-products-grid">
                    <div 
                        v-for="product in autoProducts" 
                        :key="product.product.id"
                        class="auto-product-card"
                    >
                        <div class="product-info">
                            <div class="product-name">{{ product.product.name }}</div>
                            <div class="product-sku">SKU: {{ product.product.sku }}</div>
                        </div>
                        <div class="product-quantity">
                            <span class="quantity-label">Cantidad:</span>
                            <span class="quantity-value">{{ product.quantity }}</span>
                        </div>
                        <div class="auto-badge">
                            <i class="pi pi-check-circle"></i>
                            Auto-lote
                        </div>
                    </div>
                </div>
            </div>

            <!-- Productos que requieren gestión manual -->
            <div v-if="batchForm.batches.length > 0" class="manual-products-section">
                <div class="section-header">
                    <h4 class="section-title">
                        <i class="pi pi-list text-blue-500"></i>
                        Productos que Requieren Gestión Manual de Lotes
                    </h4>
                    <p class="section-description">
                        Configure los lotes para los siguientes productos
                    </p>
                </div>

                <div class="manual-products-container">
                    <div 
                        v-for="(productBatch, productIndex) in batchForm.batches" 
                        :key="productBatch.productId"
                        class="product-batch-section"
                    >
                        <!-- Header del producto -->
                        <div class="product-header">
                            <div class="product-info">
                                <h5 class="product-name">{{ productBatch.productName }}</h5>
                                <span class="product-sku">SKU: {{ productBatch.productSku }}</span>
                            </div>
                            <div class="quantity-info">
                                <div class="quantity-required">
                                    Requerido: <strong>{{ productBatch.requiredQuantity }}</strong>
                                </div>
                                <div class="quantity-assigned" :class="{ 'quantity-valid': isProductQuantityValid(productIndex), 'quantity-invalid': !isProductQuantityValid(productIndex) }">
                                    Asignado: <strong>{{ getTotalQuantityForProduct(productIndex) }}</strong>
                                </div>
                            </div>
                        </div>

                        <!-- Lotes del producto -->
                        <div class="batches-container">
                            <div 
                                v-for="(batch, batchIndex) in productBatch.batches" 
                                :key="batch.id || batchIndex"
                                class="batch-form-row"
                            >
                                <div class="batch-fields">
                                    <!-- Toggle: Nuevo lote vs Lote existente -->
                                    <div class="field batch-type-field">
                                        <label>Tipo de Lote</label>
                                        <div class="batch-type-toggle">
                                            <SelectButton 
                                                v-model="batch.batchType" 
                                                :options="[
                                                    { label: 'Nuevo Lote', value: 'new' },
                                                    { label: 'Lote Existente', value: 'existing' }
                                                ]"
                                                optionLabel="label"
                                                optionValue="value"
                                                @change="handleBatchTypeChange(productIndex, batchIndex)"
                                                class="batch-type-selector"
                                            />
                                        </div>
                                    </div>

                                    <!-- Lote existente -->
                                    <div v-if="batch.batchType === 'existing'" class="field">
                                        <label>Seleccionar Lote Existente</label>
                                        <Select 
                                            :model-value="batch.existingBatchId"
                                            :options="getAvailableBatchesForProduct(productBatch.productId)"
                                            optionLabel="label"
                                            optionValue="id"
                                            dataKey="id"
                                            placeholder="Seleccionar lote disponible"
                                            filter
                                            filterPlaceholder="Buscar lote..."
                                            @change="handleExistingBatchSelect(productIndex, batchIndex, $event)"
                                            :class="{ 'p-invalid': submitted && batch.batchType === 'existing' && !batch.existingBatchId }"
                                            :loading="loadingBatches"
                                        >
                                            <template #option="slotProps">
                                                <div class="batch-option">
                                                    <div class="batch-option-header">
                                                        <span class="batch-code">{{ slotProps.option.code }}</span>
                                                        <span class="batch-stock" v-if="slotProps.option.totalStock > 0">
                                                            Stock: {{ slotProps.option.totalStock }}
                                                        </span>
                                                    </div>
                                                    <div class="batch-option-details">
                                                        <span class="batch-expiration">{{ slotProps.option.expirationDate ? formatDate(slotProps.option.expirationDate) : 'Sin vencimiento' }}</span>
                                                        <span v-if="slotProps.option.daysToExpire !== null" class="batch-days" 
                                                              :class="{ 'text-red-500': slotProps.option.daysToExpire < 30, 'text-yellow-500': slotProps.option.daysToExpire < 90 }">
                                                            {{ Math.floor(slotProps.option.daysToExpire) }} días
                                                        </span>
                                                    </div>
                                                </div>
                                            </template>
                                            <template #empty>
                                                <div class="text-center p-3">
                                                    <i class="pi pi-info-circle text-gray-400 text-2xl mb-2"></i>
                                                    <p class="text-gray-500">No hay lotes disponibles para este producto</p>
                                                </div>
                                            </template>
                                        </Select>
                                        <small v-if="submitted && batch.batchType === 'existing' && !batch.existingBatchId" class="p-error">
                                            Debe seleccionar un lote existente
                                        </small>
                                    </div>

                                    <!-- Campos para nuevo lote -->
                                    <template v-if="batch.batchType === 'new'">
                                        <!-- Número de lote -->
                                        <div class="field">
                                            <label>Número de Lote</label>
                                            <InputText 
                                                v-model="batch.batchNumber" 
                                                placeholder="Ej: ABC240101001"
                                                :class="{ 'p-invalid': submitted && batch.batchType === 'new' && !batch.batchNumber }"
                                            />
                                            <small v-if="submitted && batch.batchType === 'new' && !batch.batchNumber" class="p-error">
                                                Número de lote requerido
                                            </small>
                                        </div>

                                        <!-- Fecha de vencimiento -->
                                        <div class="field">
                                            <label>Fecha de Vencimiento</label>
                                            <DatePicker 
                                                v-model="batch.expirationDate" 
                                                placeholder="Seleccionar fecha"
                                                dateFormat="dd/mm/yy"
                                                showIcon
                                                iconDisplay="input"
                                                :class="{ 'p-invalid': submitted && batch.batchType === 'new' && !batch.expirationDate }"
                                                :minDate="new Date()"
                                            />
                                            <small v-if="submitted && batch.batchType === 'new' && !batch.expirationDate" class="p-error">
                                                Fecha de vencimiento requerida
                                            </small>
                                        </div>
                                    </template>

                                    <!-- Información del lote existente (solo lectura) -->
                                    <template v-if="batch.batchType === 'existing' && batch.existingBatchId">
                                        <div class="field">
                                            <label>Número de Lote</label>
                                            <InputText 
                                                :model-value="batch.batchNumber" 
                                                readonly
                                                class="readonly-field"
                                            />
                                        </div>

                                        <div class="field" v-if="batch.expirationDate">
                                            <label>Fecha de Vencimiento</label>
                                            <InputText 
                                                :model-value="formatDate(batch.expirationDate)" 
                                                readonly
                                                class="readonly-field"
                                            />
                                        </div>
                                    </template>

                                    <!-- Cantidad (siempre visible) -->
                                    <div class="field">
                                        <label>Cantidad</label>
                                        <InputNumber 
                                            v-model="batch.quantity" 
                                            :min="1"
                                            :max="Number(productBatch.requiredQuantity)"
                                            placeholder="0"
                                            :class="{ 'p-invalid': submitted && (!batch.quantity || batch.quantity <= 0) }"
                                        />
                                        <small v-if="submitted && (!batch.quantity || batch.quantity <= 0)" class="p-error">
                                            Cantidad debe ser mayor a 0
                                        </small>
                                    </div>

                                    <!-- Notas (siempre visible) -->
                                    <div class="field">
                                        <label>Notas (Opcional)</label>
                                        <InputText 
                                            v-model="batch.notes" 
                                            placeholder="Observaciones del lote"
                                        />
                                    </div>
                                </div>

                                <!-- Acciones del lote -->
                                <div class="batch-actions">
                                    <Button 
                                        icon="pi pi-trash" 
                                        severity="danger" 
                                        text 
                                        rounded 
                                        size="small"
                                        @click="removeBatchFromProduct(productIndex, batchIndex)"
                                        :disabled="productBatch.batches.length === 1"
                                        v-tooltip.top="'Eliminar lote'"
                                    />
                                </div>
                            </div>

                            <!-- Botón para agregar lote -->
                            <div class="add-batch-section">
                                <Button 
                                    icon="pi pi-plus" 
                                    label="Agregar Lote" 
                                    outlined 
                                    size="small"
                                    @click="addBatchToProduct(productIndex)"
                                    class="add-batch-btn"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estado cuando no hay productos manuales -->
            <div v-else-if="autoProducts.length === 0" class="empty-state">
                <div class="empty-icon">
                    <i class="pi pi-check-circle"></i>
                </div>
                <h3 class="empty-title">No se requiere gestión manual</h3>
                <p class="empty-description">
                    Todos los productos en esta orden generan lotes automáticamente
                </p>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="dialog-footer">
                <div class="footer-info">
                    <div v-if="batchForm.batches.length > 0" class="validation-status">
                        <i :class="isFormValid ? 'pi pi-check-circle text-green-500' : 'pi pi-exclamation-circle text-red-500'"></i>
                        <span :class="isFormValid ? 'text-green-600' : 'text-red-600'">
                            {{ isFormValid ? 'Lotes configurados correctamente' : 'Verifique la configuración de lotes' }}
                        </span>
                    </div>
                </div>
                <div class="footer-actions">
                    <Button 
                        label="Cancelar" 
                        icon="pi pi-times" 
                        outlined 
                        @click="handleCancel" 
                    />
                    <Button 
                        label="Recibir Orden" 
                        icon="pi pi-check" 
                        @click="handleSubmit" 
                        :loading="loading"
                        :disabled="batchForm.batches.length > 0 && !isFormValid"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Dialog principal */
:deep(.batch-dialog) {
    font-family: 'Inter', sans-serif;
}

:deep(.batch-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl p-6;
}

:deep(.batch-dialog .p-dialog-title) {
    @apply text-xl font-bold;
}

:deep(.batch-dialog .p-dialog-header-icon) {
    @apply text-white;
}

:deep(.batch-dialog .p-dialog-content) {
    @apply p-0 max-h-96 overflow-y-auto;
}

:deep(.batch-dialog .p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
}

/* Contenido del diálogo */
.dialog-content {
    @apply p-6 space-y-6;
}

/* Información de la orden */
.order-info {
    @apply bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800;
}

.info-header {
    @apply flex justify-between items-start;
}

.order-title {
    @apply text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2;
}

.order-details {
    @apply flex flex-col gap-1 text-sm text-blue-600 dark:text-blue-300;
}

.provider {
    @apply font-medium;
}

.date {
    @apply text-blue-500 dark:text-blue-400;
}

/* Secciones */
.section-header {
    @apply mb-4;
}

.section-title {
    @apply text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-2;
}

.section-description {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Productos con auto-generación */
.auto-products-section {
    @apply bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800;
}

.auto-products-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.auto-product-card {
    @apply bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700 shadow-sm;
}

.product-info {
    @apply mb-2;
}

.product-name {
    @apply font-medium text-gray-900 dark:text-gray-100;
}

.product-sku {
    @apply text-sm text-gray-500 dark:text-gray-400 font-mono;
}

.product-quantity {
    @apply flex justify-between items-center mb-2;
}

.quantity-label {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

.quantity-value {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.auto-badge {
    @apply inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium;
}

/* Productos manuales */
.manual-products-section {
    @apply bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800;
}

.manual-products-container {
    @apply space-y-6;
}

.product-batch-section {
    @apply bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden;
}

.product-header {
    @apply bg-blue-100 dark:bg-blue-900/30 p-4 flex justify-between items-center;
}

.product-header .product-info h5 {
    @apply font-semibold text-blue-800 dark:text-blue-200 mb-1;
}

.product-header .product-sku {
    @apply text-sm text-blue-600 dark:text-blue-300 font-mono;
}

.quantity-info {
    @apply text-right;
}

.quantity-required,
.quantity-assigned {
    @apply text-sm;
}

.quantity-required {
    @apply text-blue-600 dark:text-blue-300 mb-1;
}

.quantity-valid {
    @apply text-green-600 dark:text-green-400;
}

.quantity-invalid {
    @apply text-red-600 dark:text-red-400;
}

/* Contenedor de lotes */
.batches-container {
    @apply p-4 space-y-4;
}

.batch-form-row {
    @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex gap-4 items-start;
}

.batch-fields {
    @apply flex-1 grid grid-cols-1 md:grid-cols-4 gap-4;
}

.field {
    @apply flex flex-col gap-2;
}

.field label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.batch-actions {
    @apply flex flex-col gap-2;
}

.add-batch-section {
    @apply pt-4 border-t border-gray-200 dark:border-gray-600;
}

.add-batch-btn {
    @apply w-full;
}

/* Estado vacío */
.empty-state {
    @apply text-center py-12;
}

.empty-icon {
    @apply mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center;
}

.empty-icon i {
    @apply text-3xl text-green-600 dark:text-green-400;
}

.empty-title {
    @apply text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2;
}

.empty-description {
    @apply text-gray-600 dark:text-gray-400;
}

/* Footer */
.dialog-footer {
    @apply flex justify-between items-center;
}

.footer-info {
    @apply flex-1;
}

.validation-status {
    @apply flex items-center gap-2 text-sm;
}

.footer-actions {
    @apply flex gap-3;
}

/* Campos de formulario */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-calendar),
:deep(.p-inputnumber) {
    @apply border-2 rounded-lg transition-all;
}

:deep(.p-inputtext:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus),
:deep(.p-calendar:not(.p-disabled).p-focus),
:deep(.p-inputnumber:not(.p-disabled).p-focus) {
    @apply border-blue-500 ring-2 ring-blue-500/20;
}

:deep(.p-invalid) {
    @apply border-red-500 bg-red-50 dark:bg-red-900/20;
}

.p-error {
    @apply text-red-600 dark:text-red-400 text-xs mt-1;
}

/* Estilos para tipo de lote */
.batch-type-field {
    @apply col-span-full;
}

.batch-type-toggle {
    @apply flex justify-center;
}

.batch-type-selector {
    @apply w-full max-w-md;
}

/* Estilos para dropdown de lotes */
.batch-option {
    @apply py-2;
}

.batch-option-header {
    @apply flex justify-between items-center mb-1;
}

.batch-code {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.batch-stock {
    @apply text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full;
}

.batch-option-details {
    @apply flex justify-between items-center text-sm text-gray-600 dark:text-gray-400;
}

.batch-expiration {
    @apply font-medium;
}

.batch-days {
    @apply text-xs font-medium px-2 py-1 rounded-full;
}

.batch-days.text-red-500 {
    @apply bg-red-100 dark:bg-red-900/30;
}

.batch-days.text-yellow-500 {
    @apply bg-yellow-100 dark:bg-yellow-900/30;
}

/* Campo de solo lectura */
.readonly-field {
    @apply bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed;
}

/* Ajuste de grid para los nuevos campos */
.batch-fields {
    @apply flex-1 grid grid-cols-1 md:grid-cols-6 gap-4;
}

.batch-type-field {
    @apply md:col-span-6;
}

.field:not(.batch-type-field) {
    @apply md:col-span-2;
}

/* Estilos para SelectButton */
:deep(.batch-type-selector .p-selectbutton) {
    @apply flex w-full;
}

:deep(.batch-type-selector .p-button) {
    @apply flex-1 justify-center;
}

:deep(.batch-type-selector .p-button.p-highlight) {
    @apply bg-blue-600 border-blue-600 text-white;
}

/* Responsive */
@media (max-width: 768px) {
    .batch-fields {
        @apply grid-cols-1;
    }
    
    .batch-type-field,
    .field:not(.batch-type-field) {
        @apply col-span-1;
    }
    
    .auto-products-grid {
        @apply grid-cols-1;
    }
    
    .product-header {
        @apply flex-col gap-3 items-start;
    }
    
    .quantity-info {
        @apply text-left;
    }
    
    .dialog-footer {
        @apply flex-col gap-4;
    }
    
    .footer-actions {
        @apply w-full;
    }

    .batch-option-header {
        @apply flex-col items-start gap-1;
    }

    .batch-option-details {
        @apply flex-col items-start gap-1;
    }
}
</style>