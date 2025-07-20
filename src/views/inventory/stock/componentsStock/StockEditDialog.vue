<script setup>
import { useProductStocksStore } from '@/stores/productStocksStore';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    stockData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'stock-updated']);

const toast = useToast();
const stocksStore = useProductStocksStore();

const formData = ref({
    sale_price: null,
    min_stock: null,
    max_stock: null,
    unit_cost: null
});

const loading = computed(() => stocksStore.isLoadingStock);

watch(() => props.stockData, (newData) => {
    if (newData) {
        formData.value = {
            sale_price: newData.sale_price || null,
            min_stock: newData.min_stock || null,
            max_stock: newData.max_stock || null,
            unit_cost: newData.unit_cost || null
        };
    }
}, { immediate: true });

const closeDialog = () => {
    emit('update:visible', false);
    resetForm();
};

const resetForm = () => {
    formData.value = {
        sale_price: null,
        min_stock: null,
        max_stock: null,
        unit_cost: null
    };
};

const saveStock = async () => {
    if (!props.stockData?.id) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'ID de stock no válido',
            life: 3000
        });
        return;
    }

    try {
        const payload = {};
        
        // Solo enviar campos que no sean null
        Object.keys(formData.value).forEach(key => {
            if (formData.value[key] !== null && formData.value[key] !== '') {
                payload[key] = formData.value[key];
            }
        });

        if (Object.keys(payload).length === 0) {
            toast.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay cambios para guardar',
                life: 3000
            });
            return;
        }

        await stocksStore.updateStockById(props.stockData.id, payload);
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Stock actualizado correctamente',
            life: 3000
        });

        emit('stock-updated');
        closeDialog();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: stocksStore.message || 'Error al actualizar el stock',
            life: 3000
        });
    }
};
</script>

<template>
    <Dialog
        :visible="visible"
        modal
        header="Editar Stock Individual"
        :style="{ width: '50rem' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
        @update:visible="closeDialog"
    >
        <div v-if="stockData" class="space-y-6">
            <!-- Información del Stock -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-2">Información del Stock</h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="font-medium">Producto:</span>
                        {{ stockData.product?.name }}
                    </div>
                    <div>
                        <span class="font-medium">SKU:</span>
                        {{ stockData.product?.sku }}
                    </div>
                    <div>
                        <span class="font-medium">Almacén:</span>
                        {{ stockData.warehouse?.name }}
                    </div>
                    <div v-if="stockData.batch">
                        <span class="font-medium">Lote:</span>
                        {{ stockData.batch.code }}
                    </div>
                    <div>
                        <span class="font-medium">Cantidad Actual:</span>
                        {{ stockData.actual_quantity }}
                    </div>
                </div>
            </div>

            <!-- Formulario de Edición -->
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Precio de Venta</label>
                        <InputNumber
                            v-model="formData.sale_price"
                            mode="currency"
                            currency="PEN"
                            locale="es-PE"
                            :min="0"
                            :max-fraction-digits="2"
                            placeholder="Ingrese precio de venta"
                            class="w-full"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Costo Unitario</label>
                        <InputNumber
                            v-model="formData.unit_cost"
                            mode="currency"
                            currency="PEN"
                            locale="es-PE"
                            :min="0"
                            :max-fraction-digits="2"
                            placeholder="Ingrese costo unitario"
                            class="w-full"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Stock Mínimo</label>
                        <InputNumber
                            v-model="formData.min_stock"
                            :min="0"
                            :max-fraction-digits="0"
                            placeholder="Ingrese stock mínimo"
                            class="w-full"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Stock Máximo</label>
                        <InputNumber
                            v-model="formData.max_stock"
                            :min="0"
                            :max-fraction-digits="0"
                            placeholder="Ingrese stock máximo"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>

            <!-- Valores Actuales para Referencia -->
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="text-sm font-medium mb-2 text-blue-800">Valores Actuales</h4>
                <div class="grid grid-cols-2 gap-4 text-xs text-blue-700">
                    <div>Precio Venta: S/ {{ stockData.sale_price || 'No definido' }}</div>
                    <div>Costo Unitario: S/ {{ stockData.unit_cost || 'No definido' }}</div>
                    <div>Stock Mínimo: {{ stockData.min_stock || 'No definido' }}</div>
                    <div>Stock Máximo: {{ stockData.max_stock || 'No definido' }}</div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button
                label="Cancelar"
                icon="pi pi-times"
                text
                @click="closeDialog"
            />
            <Button
                label="Guardar"
                icon="pi pi-check"
                :loading="loading"
                @click="saveStock"
            />
        </template>
    </Dialog>
</template>