<script setup>
import { useProductStocksStore } from '@/stores/productStocksStore';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    productData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'bulk-updated']);

const toast = useToast();
const stocksStore = useProductStocksStore();

const scope = ref('all');
const selectedWarehouse = ref(null);
const selectedBatch = ref(null);

const formData = ref({
    sale_price: null,
    min_stock: null,
    max_stock: null,
    unit_cost: null
});

const loading = computed(() => stocksStore.isLoadingBulk);
const previewData = computed(() => stocksStore.bulkPreview);

const scopeOptions = [
    { label: 'Todos los stocks del producto', value: 'all' },
    { label: 'Solo un almacén específico', value: 'warehouse' },
    { label: 'Solo un lote específico', value: 'batch' }
];

const warehouseOptions = computed(() => {
    if (!props.productData?.stock_by_warehouse) return [];

    return props.productData.stock_by_warehouse.map((warehouse) => ({
        label: warehouse.warehouse_name,
        value: warehouse.warehouse_id
    }));
});

const batchOptions = computed(() => {
    if (!props.productData?.stock_by_warehouse) return [];

    const batches = [];
    props.productData.stock_by_warehouse.forEach((warehouse) => {
        if (warehouse.batches) {
            warehouse.batches.forEach((batch) => {
                batches.push({
                    label: `${batch.batch_code} (${warehouse.warehouse_name})`,
                    value: batch.batch_id
                });
            });
        }
    });

    return batches;
});

watch(
    () => props.visible,
    (newValue) => {
        if (newValue) {
            resetForm();
            stocksStore.clearBulkPreview();
        }
    }
);

const closeDialog = () => {
    emit('update:visible', false);
    resetForm();
    stocksStore.clearBulkPreview();
};

const resetForm = () => {
    scope.value = 'all';
    selectedWarehouse.value = null;
    selectedBatch.value = null;
    formData.value = {
        sale_price: null,
        min_stock: null,
        max_stock: null,
        unit_cost: null
    };
};

const loadPreview = async () => {
    if (!props.productData?.id) return;

    const params = { scope: scope.value };

    if (scope.value === 'warehouse' && selectedWarehouse.value) {
        params.warehouse_id = selectedWarehouse.value;
    } else if (scope.value === 'batch' && selectedBatch.value) {
        params.batch_id = selectedBatch.value;
    }

    try {
        await stocksStore.getBulkPreviewData(props.productData.id, params);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar vista previa',
            life: 3000
        });
    }
};

const saveBulkUpdate = async () => {
    if (!props.productData?.id) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'ID de producto no válido',
            life: 3000
        });
        return;
    }

    const payload = { scope: scope.value };

    // Agregar parámetros de scope
    if (scope.value === 'warehouse' && selectedWarehouse.value) {
        payload.warehouse_id = selectedWarehouse.value;
    } else if (scope.value === 'batch' && selectedBatch.value) {
        payload.batch_id = selectedBatch.value;
    }

    // Agregar campos de actualización
    Object.keys(formData.value).forEach((key) => {
        if (formData.value[key] !== null && formData.value[key] !== '') {
            payload[key] = formData.value[key];
        }
    });

    if (Object.keys(payload).length === 1) {
        // Solo scope
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No hay cambios para aplicar',
            life: 3000
        });
        return;
    }

    try {
        const result = await stocksStore.bulkUpdateProductStocks(props.productData.id, payload);

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Actualización masiva completada: ${result.affected_rows} registros actualizados`,
            life: 5000
        });

        emit('bulk-updated');
        closeDialog();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: stocksStore.message || 'Error al realizar la actualización masiva',
            life: 3000
        });
    }
};

watch([scope, selectedWarehouse, selectedBatch], () => {
    if (props.visible && props.productData?.id) {
        loadPreview();
    }
});
</script>

<template>
    <Dialog :visible="visible" modal header="Actualización Masiva de Stocks" :style="{ width: '70rem' }" :breakpoints="{ '1199px': '85vw', '575px': '95vw' }" @update:visible="closeDialog">
        <div v-if="productData" class="space-y-6">
            <!-- Información del Producto -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Producto Seleccionado</h3>
                <div class="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <span class="font-medium">Nombre:</span>
                        {{ productData.name }}
                    </div>
                    <div>
                        <span class="font-medium">SKU:</span>
                        {{ productData.sku }}
                    </div>
                    <div>
                        <span class="font-medium">Stock Total:</span>
                        {{ productData.total_stock }}
                    </div>
                </div>
            </div>

            <!-- Configuración de Alcance -->
            <div class="space-y-4">
                <h4 class="text-md font-semibold">Alcance de la Actualización</h4>

                <div>
                    <label class="block text-sm font-medium mb-2">Seleccionar Alcance</label>
                    <Select v-model="scope" :options="scopeOptions" option-label="label" option-value="value" placeholder="Seleccione el alcance" class="w-full" />
                </div>

                <div v-if="scope === 'warehouse'" class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Almacén</label>
                        <Select v-model="selectedWarehouse" :options="warehouseOptions" option-label="label" option-value="value" placeholder="Seleccione un almacén" class="w-full" />
                    </div>
                </div>

                <div v-if="scope === 'batch'" class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Lote</label>
                        <Select v-model="selectedBatch" :options="batchOptions" option-label="label" option-value="value" placeholder="Seleccione un lote" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Vista Previa -->
            <div v-if="previewData" class="bg-blue-50 p-4 rounded-lg">
                <h4 class="text-md font-semibold mb-3 text-blue-800">Vista Previa - {{ previewData.total_stocks }} registros serán afectados</h4>

                <div class="max-h-40 overflow-y-auto">
                    <div v-for="stock in previewData.stocks" :key="stock.stock_id" class="bg-white p-3 mb-2 rounded border text-sm">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <strong>{{ stock.warehouse_name }}</strong>
                                <span v-if="stock.batch_code" class="ml-2 text-gray-600"> - Lote: {{ stock.batch_code }} </span>
                            </div>
                            <div class="text-right text-xs text-gray-600">
                                <div>Precio: S/ {{ stock.current_values.sale_price || 'N/A' }}</div>
                                <div>Costo: S/ {{ stock.current_values.unit_cost || 'N/A' }}</div>
                                <div>
                                    Min: {{ stock.current_values.min_stock || 'N/A' }} | Max:
                                    {{ stock.current_values.max_stock || 'N/A' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Formulario de Actualización -->
            <div class="space-y-4">
                <h4 class="text-md font-semibold">Nuevos Valores (dejar vacío para mantener actual)</h4>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Precio de Venta</label>
                        <InputNumber v-model="formData.sale_price" mode="currency" currency="PEN" locale="es-PE" :min="0" :max-fraction-digits="2" placeholder="Nuevo precio de venta" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Costo Unitario</label>
                        <InputNumber v-model="formData.unit_cost" mode="currency" currency="PEN" locale="es-PE" :min="0" :max-fraction-digits="2" placeholder="Nuevo costo unitario" class="w-full" />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Stock Mínimo</label>
                        <InputNumber v-model="formData.min_stock" :min="0" :max-fraction-digits="0" placeholder="Nuevo stock mínimo" class="w-full" />
                    </div>

                    <div>
                        <label class="block text-sm font-medium mb-2">Stock Máximo</label>
                        <InputNumber v-model="formData.max_stock" :min="0" :max-fraction-digits="0" placeholder="Nuevo stock máximo" class="w-full" />
                    </div>
                </div>
            </div>

            <!-- Advertencia -->
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div class="flex items-start">
                    <i class="pi pi-exclamation-triangle text-yellow-600 mr-2 mt-1"></i>
                    <div class="text-sm text-yellow-800">
                        <strong>Advertencia:</strong> Esta acción modificará múltiples registros de stock. Los campos que no especifique mantendrán sus valores actuales. Verifique la vista previa antes de continuar.
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeDialog" />
            <Button label="Actualizar Vista Previa" icon="pi pi-refresh" severity="secondary" :loading="loading" @click="loadPreview" />
            <Button label="Aplicar Cambios" icon="pi pi-check" :loading="loading" :disabled="!previewData || previewData.total_stocks === 0" @click="saveBulkUpdate" />
        </template>
    </Dialog>
</template>
