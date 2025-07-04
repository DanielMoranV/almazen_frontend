<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useBatchesStore } from '@/stores/batchesStore';
import { useProductsStore } from '@/stores/productsStore';

const toast = useToast();
const batchesStore = useBatchesStore();
const productStore = useProductsStore();

const props = defineProps({
    visible: Boolean,
    order: {
        type: Object,
        default: null
    },
    mode: {
        type: String,
        default: 'add' // 'add' | 'edit' | 'view'
    }
});

console.log('BonusManagementDialog props:', props);

const emit = defineEmits(['update:visible', 'submit']);

// Estados del formulario
const bonusForm = ref({
    bonuses: []
});

const submitted = ref(false);
const loadingProducts = ref(false);
const loadingBatches = ref(false);
const availableProducts = ref([]);
const availableBatches = ref({});

// Tipos de bonificación
const bonusTypes = ref([
    { label: 'Promoción', value: 'promotion' },
    { label: 'Descuento por Volumen', value: 'volume_discount' },
    { label: 'Compensación por Defecto', value: 'defect_compensation' },
    { label: 'Recompensa por Fidelidad', value: 'loyalty_reward' },
    { label: 'Otro', value: 'other' }
]);

// Validar restricciones de tiempo
const canAddBonuses = computed(() => {
    console.log('Full order object:', props.order);
    
    // Buscar la fecha de recepción en diferentes posibles ubicaciones
    let receivedDate = null;
    
    // Opción 1: Campo directo received_date
    if (props.order?.received_date) {
        receivedDate = props.order.received_date;
        console.log('Found received_date:', receivedDate);
    }
    // Opción 2: En status_tracking.received_at
    else if (props.order?.status_tracking?.received_at) {
        receivedDate = props.order.status_tracking.received_at;
        console.log('Found status_tracking.received_at:', receivedDate);
    }
    // Opción 3: En status_timeline
    else if (props.order?.status_timeline) {
        const receivedEntry = props.order.status_timeline.find(entry => entry.status === 'RECIBIDO');
        if (receivedEntry?.created_at) {
            receivedDate = receivedEntry.created_at;
            console.log('Found in status_timeline:', receivedDate);
        }
    }
    
    if (!receivedDate) {
        console.log('No received date found, checking available fields:', Object.keys(props.order || {}));
        return false;
    }
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD) ignorando la zona horaria
    const receivedDateStr = receivedDate.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    
    console.log('Received date (original):', receivedDate);
    console.log('Received date (date only):', receivedDateStr);
    console.log('Today (date only):', todayStr);
    console.log('Are equal?', receivedDateStr === todayStr);
    
    // Comparar solo las fechas como strings (YYYY-MM-DD)
    return receivedDateStr === todayStr;
});

const timeRestrictionMessage = computed(() => {
    // Buscar la fecha de recepción
    let receivedDate = null;
    
    if (props.order?.received_date) {
        receivedDate = props.order.received_date;
    } else if (props.order?.status_tracking?.received_at) {
        receivedDate = props.order.status_tracking.received_at;
    } else if (props.order?.status_timeline) {
        const receivedEntry = props.order.status_timeline.find(entry => entry.status === 'RECIBIDO');
        if (receivedEntry?.created_at) {
            receivedDate = receivedEntry.created_at;
        }
    }
    
    if (!receivedDate) return 'Las bonificaciones solo pueden agregarse el mismo día de recepción';
    
    const receivedDateStr = receivedDate.split('T')[0];
    const formattedDate = new Date(receivedDateStr + 'T12:00:00').toLocaleDateString('es-PE');
    
    return `Las bonificaciones solo pueden agregarse el mismo día de recepción (${formattedDate})`;
});

// Inicialización
watch(
    () => props.visible,
    (newVisible) => {
        console.log('Dialog visibility changed:', newVisible, 'Mode:', props.mode);
        if (newVisible) {
            initializeBonusForm();
            loadAvailableProducts();
        }
    },
    { immediate: true }
);

const initializeBonusForm = () => {
    console.log('Initializing bonus form, mode:', props.mode);
    bonusForm.value.bonuses = [createEmptyBonus()];
    submitted.value = false;
    console.log('Bonus form initialized:', bonusForm.value);
};

const createEmptyBonus = () => ({
    id: Date.now(),
    product_id: null,
    selectedProduct: null,
    batch_id: null,
    selectedBatch: null,
    quantity: 1,
    bonus_type: 'promotion',
    bonus_reason: '',
    expiration_date: null,
    requires_batch: false
});

// Cargar productos disponibles
const loadAvailableProducts = async () => {
    loadingProducts.value = true;
    
    try {
        await productStore.fetchProducts();
        
        if (productStore.success) {
            availableProducts.value = productStore.productsList.map(product => ({
                ...product,
                label: `${product.name} (${product.sku})`
            }));
            console.log('Products loaded:', availableProducts.value.length, 'products');
            console.log('First product:', availableProducts.value[0]);
        } else {
            console.error('Failed to fetch products:', productStore.message);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los productos',
            life: 4000
        });
    } finally {
        loadingProducts.value = false;
    }
};

// Cargar lotes para un producto
const loadBatchesForProduct = async (productId) => {
    if (!productId) return;
    
    loadingBatches.value = true;
    
    try {
        const response = await batchesStore.getAvailableBatchesForProduct(productId);
        
        if (response.success && response.data.batches) {
            const formattedBatches = response.data.batches.map(batch => 
                batchesStore.formatBatchForDropdown(batch)
            );
            
            availableBatches.value[productId] = formattedBatches;
        } else {
            availableBatches.value[productId] = [];
        }
    } catch (error) {
        console.error(`Error loading batches for product ${productId}:`, error);
        availableBatches.value[productId] = [];
    } finally {
        loadingBatches.value = false;
    }
};

// Manejar selección de producto
const handleProductSelect = async (bonusIndex, selectedProduct) => {
    console.log('handleProductSelect called:', { bonusIndex, selectedProduct });
    const bonus = bonusForm.value.bonuses[bonusIndex];
    
    if (selectedProduct) {
        bonus.product_id = selectedProduct.id;
        bonus.selectedProduct = selectedProduct;
        bonus.requires_batch = selectedProduct.requires_batches;
        
        console.log('Product selected:', selectedProduct.name, 'ID:', selectedProduct.id);
        
        // Si requiere lotes, cargarlos
        if (selectedProduct.requires_batches && !selectedProduct.auto_generate_batches) {
            await loadBatchesForProduct(selectedProduct.id);
        }
        
        // Limpiar lote seleccionado si ya no es relevante
        if (!selectedProduct.requires_batches) {
            bonus.batch_id = null;
            bonus.selectedBatch = null;
        }
    } else {
        bonus.product_id = null;
        bonus.selectedProduct = null;
        bonus.requires_batch = false;
        bonus.batch_id = null;
        bonus.selectedBatch = null;
    }
};

// Manejar selección de lote
const handleBatchSelect = (bonusIndex, selectedBatchId) => {
    const bonus = bonusForm.value.bonuses[bonusIndex];
    const productId = bonus.product_id;
    
    if (selectedBatchId && availableBatches.value[productId]) {
        const selectedBatch = availableBatches.value[productId].find(b => b.id === selectedBatchId);
        if (selectedBatch) {
            bonus.batch_id = selectedBatch.id;
            bonus.selectedBatch = selectedBatch;
        }
    } else {
        bonus.batch_id = null;
        bonus.selectedBatch = null;
    }
};

// Obtener lotes disponibles para un producto
const getAvailableBatchesForProduct = (productId) => {
    return availableBatches.value[productId] || [];
};

// Agregar nueva bonificación
const addBonus = () => {
    if (bonusForm.value.bonuses.length < 20) { // Máximo 20 bonificaciones
        bonusForm.value.bonuses.push(createEmptyBonus());
    }
};

// Remover bonificación
const removeBonus = (index) => {
    if (bonusForm.value.bonuses.length > 1) {
        bonusForm.value.bonuses.splice(index, 1);
    }
};

// Validación del formulario
const isFormValid = computed(() => {
    if (!bonusForm.value.bonuses.length) return false;
    
    return bonusForm.value.bonuses.every(bonus => {
        const hasProduct = bonus.product_id && bonus.selectedProduct;
        const hasQuantity = bonus.quantity > 0;
        const hasReason = bonus.bonus_reason && bonus.bonus_reason.trim().length > 0;
        const batchValid = !bonus.requires_batch || bonus.batch_id || bonus.selectedProduct?.auto_generate_batches;
        
        return hasProduct && hasQuantity && hasReason && batchValid;
    });
});

// Validar productos duplicados
const hasDuplicateProducts = computed(() => {
    const productIds = bonusForm.value.bonuses
        .filter(bonus => bonus.product_id)
        .map(bonus => bonus.product_id);
    
    return new Set(productIds).size !== productIds.length;
});

// Enviar formulario
const handleSubmit = () => {
    submitted.value = true;
    
    // Validar restricción de tiempo primero
    if (!canAddBonuses.value) {
        toast.add({
            severity: 'error',
            summary: 'Restricción de tiempo',
            detail: timeRestrictionMessage.value,
            life: 6000
        });
        return;
    }
    
    if (!isFormValid.value) {
        toast.add({
            severity: 'error',
            summary: 'Validación',
            detail: 'Por favor complete todos los campos requeridos',
            life: 4000
        });
        return;
    }
    
    if (hasDuplicateProducts.value) {
        toast.add({
            severity: 'error',
            summary: 'Productos duplicados',
            detail: 'No puede agregar el mismo producto múltiples veces',
            life: 4000
        });
        return;
    }
    
    // Preparar datos para envío
    const bonusData = {
        bonuses: bonusForm.value.bonuses.map(bonus => ({
            product_id: bonus.product_id,
            batch_id: bonus.batch_id,
            quantity: Number(bonus.quantity),
            bonus_type: bonus.bonus_type,
            bonus_reason: bonus.bonus_reason.trim(),
            expiration_date: bonus.expiration_date ? 
                new Date(bonus.expiration_date).toISOString().split('T')[0] : null
        }))
    };
    
    emit('submit', bonusData);
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};

const resetForm = () => {
    bonusForm.value = { bonuses: [] };
    submitted.value = false;
    availableBatches.value = {};
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
        :style="{ width: '90vw', maxWidth: '1200px' }" 
        header="Gestión de Bonificaciones"
        :modal="true" 
        class="bonus-dialog"
        @hide="resetForm"
    >
        <div class="dialog-content">
            <!-- Información de la orden -->
            <div class="order-info">
                <div class="info-header">
                    <h3 class="order-title">
                        <i class="pi pi-gift"></i>
                        Bonificaciones para Orden #{{ order?.order_number }}
                    </h3>
                    <div class="order-details">
                        <span class="provider">{{ order?.provider?.name }}</span>
                        <span class="date">{{ formatDate(order?.purchase_date) }}</span>
                        <span class="status">{{ order?.status }}</span>
                    </div>
                </div>
            </div>

            <!-- Instrucciones -->
            <div class="instructions">
                <div class="instruction-item">
                    <i class="pi pi-info-circle"></i>
                    <span>Las bonificaciones son productos adicionales gratuitos que no afectan el costo del inventario</span>
                </div>
                <div class="instruction-item">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>Solo se pueden agregar bonificaciones a órdenes en estado RECIBIDO</span>
                </div>
                <div class="instruction-item">
                    <i class="pi pi-clock"></i>
                    <span>Las bonificaciones solo pueden agregarse el mismo día de recepción</span>
                </div>
            </div>
            
            <!-- Alerta de restricción de tiempo -->
            <div v-if="!canAddBonuses" class="time-restriction-alert">
                <i class="pi pi-exclamation-triangle"></i>
                <span>{{ timeRestrictionMessage }}</span>
            </div>

            <!-- Formulario de bonificaciones -->
            <div class="bonuses-section">
                <div class="section-header">
                    <h4 class="section-title">
                        <i class="pi pi-plus text-blue-500"></i>
                        Agregar Bonificaciones
                    </h4>
                    <Button 
                        icon="pi pi-plus" 
                        label="Agregar Bonificación" 
                        outlined 
                        size="small"
                        @click="addBonus"
                        :disabled="!canAddBonuses || bonusForm.bonuses.length >= 20"
                        v-tooltip.top="!canAddBonuses ? 'No se pueden agregar bonificaciones fuera del día de recepción' : 'Agregar nueva bonificación (máximo 20)'"
                    />
                </div>

                <div class="bonuses-container">
                    <div 
                        v-for="(bonus, index) in bonusForm.bonuses" 
                        :key="bonus.id"
                        class="bonus-form-row"
                    >
                        <div class="bonus-header">
                            <span class="bonus-number">Bonificación #{{ index + 1 }}</span>
                            <Button 
                                icon="pi pi-trash" 
                                severity="danger" 
                                text 
                                rounded 
                                size="small"
                                @click="removeBonus(index)"
                                :disabled="!canAddBonuses || bonusForm.bonuses.length === 1"
                                v-tooltip.top="'Eliminar bonificación'"
                            />
                        </div>

                        <div class="bonus-fields">
                            <!-- Producto -->
                            <div class="field">
                                <label>Producto <span class="required">*</span></label>
                                <Select 
                                    v-model="bonus.selectedProduct"
                                    :options="availableProducts"
                                    optionLabel="label"
                                    placeholder="Seleccionar producto"
                                    filter
                                    filterPlaceholder="Buscar producto..."
                                    @update:modelValue="(value) => handleProductSelect(index, value)"
                                    :class="{ 'p-invalid': submitted && !bonus.product_id }"
                                    :loading="loadingProducts"
                                    :disabled="!canAddBonuses"
                                />
                                <small v-if="submitted && !bonus.product_id" class="p-error">
                                    Producto requerido
                                </small>
                            </div>

                            <!-- Lote (si el producto lo requiere) -->
                            <div v-if="bonus.requires_batch && !bonus.selectedProduct?.auto_generate_batches" class="field">
                                <label>Lote <span class="required">*</span></label>
                                <Select 
                                    v-model="bonus.batch_id"
                                    :options="getAvailableBatchesForProduct(bonus.product_id)"
                                    optionLabel="label"
                                    optionValue="id"
                                    placeholder="Seleccionar lote"
                                    filter
                                    filterPlaceholder="Buscar lote..."
                                    @update:modelValue="(value) => handleBatchSelect(index, value)"
                                    :class="{ 'p-invalid': submitted && bonus.requires_batch && !bonus.batch_id }"
                                    :loading="loadingBatches"
                                    :disabled="!canAddBonuses"
                                >
                                    <template #empty>
                                        <div class="text-center p-3">
                                            <p class="text-gray-500">No hay lotes disponibles</p>
                                        </div>
                                    </template>
                                </Select>
                                <small v-if="submitted && bonus.requires_batch && !bonus.batch_id" class="p-error">
                                    Lote requerido para este producto
                                </small>
                            </div>

                            <!-- Nota para auto-generación -->
                            <div v-else-if="bonus.requires_batch && bonus.selectedProduct?.auto_generate_batches" class="field">
                                <div class="auto-batch-notice">
                                    <i class="pi pi-info-circle"></i>
                                    <span>Este producto generará un lote automáticamente</span>
                                </div>
                            </div>

                            <!-- Cantidad -->
                            <div class="field">
                                <label>Cantidad <span class="required">*</span></label>
                                <InputNumber 
                                    v-model="bonus.quantity" 
                                    :min="0.0001"
                                    :max="999999.9999"
                                    :minFractionDigits="0"
                                    :maxFractionDigits="4"
                                    placeholder="0"
                                    :class="{ 'p-invalid': submitted && (!bonus.quantity || bonus.quantity <= 0) }"
                                    :disabled="!canAddBonuses"
                                />
                                <small v-if="submitted && (!bonus.quantity || bonus.quantity <= 0)" class="p-error">
                                    Cantidad debe ser mayor a 0
                                </small>
                            </div>

                            <!-- Tipo de bonificación -->
                            <div class="field">
                                <label>Tipo de Bonificación <span class="required">*</span></label>
                                <Select 
                                    v-model="bonus.bonus_type"
                                    :options="bonusTypes"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Seleccionar tipo"
                                    :disabled="!canAddBonuses"
                                />
                            </div>

                            <!-- Razón -->
                            <div class="field field-full">
                                <label>Razón de la Bonificación <span class="required">*</span></label>
                                <InputText 
                                    v-model="bonus.bonus_reason" 
                                    placeholder="Ej: Promoción por compra mayor a $1000"
                                    :class="{ 'p-invalid': submitted && (!bonus.bonus_reason || !bonus.bonus_reason.trim()) }"
                                    :disabled="!canAddBonuses"
                                />
                                <small v-if="submitted && (!bonus.bonus_reason || !bonus.bonus_reason.trim())" class="p-error">
                                    Razón requerida
                                </small>
                            </div>

                            <!-- Fecha de vencimiento (opcional) -->
                            <div class="field">
                                <label>Fecha de Vencimiento (Opcional)</label>
                                <DatePicker 
                                    v-model="bonus.expiration_date" 
                                    placeholder="Seleccionar fecha"
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    iconDisplay="input"
                                    :minDate="new Date()"
                                    :disabled="!canAddBonuses"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alertas de validación -->
            <div v-if="hasDuplicateProducts" class="validation-alert">
                <i class="pi pi-exclamation-triangle"></i>
                <span>No puede agregar el mismo producto múltiples veces</span>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="dialog-footer">
                <div class="footer-info">
                    <div class="validation-status">
                        <i :class="isFormValid ? 'pi pi-check-circle text-green-500' : 'pi pi-exclamation-circle text-red-500'"></i>
                        <span :class="isFormValid ? 'text-green-600' : 'text-red-600'">
                            {{ isFormValid ? 'Bonificaciones válidas' : 'Complete todos los campos requeridos' }}
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
                        label="Agregar Bonificaciones" 
                        icon="pi pi-gift" 
                        @click="handleSubmit" 
                        :disabled="!canAddBonuses || !isFormValid || hasDuplicateProducts"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Dialog principal */
:deep(.bonus-dialog) {
    font-family: 'Inter', sans-serif;
}

:deep(.bonus-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-xl p-6;
}

:deep(.bonus-dialog .p-dialog-title) {
    @apply text-xl font-bold;
}

:deep(.bonus-dialog .p-dialog-content) {
    @apply p-0 max-h-96 overflow-y-auto;
}

:deep(.bonus-dialog .p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
}

/* Contenido del diálogo */
.dialog-content {
    @apply p-6 space-y-6;
}

/* Información de la orden */
.order-info {
    @apply bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800;
}

.order-title {
    @apply text-lg font-semibold text-orange-800 dark:text-orange-200 flex items-center gap-2;
}

.order-details {
    @apply flex gap-4 text-sm text-orange-600 dark:text-orange-300 mt-2;
}

.provider {
    @apply font-medium;
}

/* Instrucciones */
.instructions {
    @apply bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 space-y-2;
}

.instruction-item {
    @apply flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300;
}

/* Alerta de restricción de tiempo */
.time-restriction-alert {
    @apply flex items-center gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg border border-yellow-200 dark:border-yellow-800;
}

/* Sección de bonificaciones */
.bonuses-section {
    @apply bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700;
}

.section-header {
    @apply flex justify-between items-center mb-4;
}

.section-title {
    @apply text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2;
}

.bonuses-container {
    @apply space-y-4;
}

.bonus-form-row {
    @apply bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600;
}

.bonus-header {
    @apply flex justify-between items-center mb-4;
}

.bonus-number {
    @apply font-semibold text-gray-700 dark:text-gray-300;
}

.bonus-fields {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.field {
    @apply flex flex-col gap-2;
}

.field-full {
    @apply md:col-span-3;
}

.field label {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.required {
    @apply text-red-500;
}

.auto-batch-notice {
    @apply flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm;
}

/* Alertas */
.validation-alert {
    @apply flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800;
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
    @apply border-orange-500 ring-2 ring-orange-500/20;
}

:deep(.p-invalid) {
    @apply border-red-500 bg-red-50 dark:bg-red-900/20;
}

.p-error {
    @apply text-red-600 dark:text-red-400 text-xs mt-1;
}

/* Responsive */
@media (max-width: 768px) {
    .bonus-fields {
        @apply grid-cols-1;
    }
    
    .section-header {
        @apply flex-col gap-2;
    }
    
    .order-details {
        @apply flex-col gap-1;
    }
    
    .dialog-footer {
        @apply flex-col gap-4;
    }
    
    .footer-actions {
        @apply w-full;
    }
}
</style>