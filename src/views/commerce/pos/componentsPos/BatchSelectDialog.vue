<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    showBatchDialog: Boolean,
    selectedProductForBatch: Object
});

defineEmits(['update:showBatchDialog', 'select-batch']);

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
};
</script>

<template>
    <Dialog
        :visible="props.showBatchDialog"
        @update:visible="$emit('update:showBatchDialog', $event)"
        header="Seleccionar Lote"
        :modal="true"
        :style="{ width: '95vw', maxWidth: '800px' }"
        :pt="{
            header: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
            content: 'p-6'
        }"
    >
        <template #header>
            <div class="flex items-center space-x-3">
                <i class="pi pi-tag text-xl"></i>
                <span class="text-xl font-bold">Seleccionar Lote - {{ props.selectedProductForBatch?.name }}</span>
            </div>
        </template>

        <div v-if="props.selectedProductForBatch" class="space-y-4 mt-2">
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div class="flex items-center space-x-2 mb-2">
                    <i class="pi pi-info-circle text-blue-600"></i>
                    <span class="font-semibold text-blue-800">Información del Producto</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div><strong>SKU:</strong> {{ props.selectedProductForBatch.sku }}</div>
                    <div><strong>Código de Barras:</strong> {{ props.selectedProductForBatch.barcode }}</div>
                    <div><strong>Stock Total:</strong> {{ props.selectedProductForBatch.stock }} unidades</div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
                <Card
                    v-for="batch in props.selectedProductForBatch.stock_info?.batches"
                    :key="batch.batch_id"
                    @click="$emit('select-batch', batch)"
                    class="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-102 border-2 border-gray-200 hover:border-orange-300"
                >
                    <template #content>
                        <div class="space-y-3">
                            <!-- Batch Header -->
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-2">
                                    <i class="pi pi-tag text-orange-600"></i>
                                    <span class="font-bold text-lg text-gray-800">{{ batch.batch_code }}</span>
                                </div>
                                <Tag :value="`${parseFloat(batch.available_quantity).toFixed(2)} unidades`" :severity="batch.available_quantity > 10 ? 'success' : batch.available_quantity > 0 ? 'warning' : 'danger'" class="font-bold" />
                            </div>

                            <!-- Batch Details -->
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div class="bg-green-50 p-3 rounded-lg">
                                    <div class="text-green-600 font-semibold mb-1">Precio de Venta</div>
                                    <div class="text-xl font-bold text-green-700">{{ formatCurrency(parseFloat(batch.sale_price)) }}</div>
                                </div>

                                <div class="bg-blue-50 p-3 rounded-lg">
                                    <div class="text-blue-600 font-semibold mb-1">Stock Disponible</div>
                                    <div class="text-xl font-bold text-blue-700">{{ parseFloat(batch.available_quantity).toFixed(2) }}</div>
                                </div>

                                <div class="bg-purple-50 p-3 rounded-lg">
                                    <div class="text-purple-600 font-semibold mb-1">Fecha de Vencimiento</div>
                                    <div class="font-bold text-purple-700">{{ new Date(batch.expiration_date).toLocaleDateString('es-PE') }}</div>
                                </div>

                                <div class="bg-yellow-50 p-3 rounded-lg">
                                    <div class="text-yellow-600 font-semibold mb-1">Días para Vencer</div>
                                    <div
                                        class="font-bold"
                                        :class="{
                                            'text-red-700': batch.days_to_expire <= 7,
                                            'text-yellow-700': batch.days_to_expire > 7 && batch.days_to_expire <= 30,
                                            'text-green-700': batch.days_to_expire > 30
                                        }"
                                    >
                                        {{ Math.ceil(batch.days_to_expire) }} días
                                    </div>
                                </div>
                            </div>

                            <!-- Warning for near expiration -->
                            <div v-if="batch.days_to_expire <= 30" class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                                <div class="flex items-center space-x-2">
                                    <i class="pi pi-exclamation-triangle text-yellow-600"></i>
                                    <span class="text-yellow-800 font-medium">
                                        <span v-if="batch.days_to_expire <= 7">¡Producto próximo a vencer!</span>
                                        <span v-else>Producto se vence pronto</span>
                                    </span>
                                </div>
                            </div>

                            <!-- Action Hint -->
                            <div class="text-center pt-2">
                                <Button icon="pi pi-plus" label="Seleccionar este lote" severity="success" outlined class="hover:bg-green-50 transition-colors duration-200" />
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Cancel Action -->
            <div class="flex justify-end pt-4 border-t border-gray-200">
                <Button @click="$emit('update:showBatchDialog', false)" label="Cancelar" icon="pi pi-times" severity="secondary" outlined />
            </div>
        </div>
    </Dialog>
</template>
