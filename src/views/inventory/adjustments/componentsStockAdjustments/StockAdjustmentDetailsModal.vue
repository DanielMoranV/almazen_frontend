<script setup>
import { computed } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    adjustmentData: {
        type: Object,
        default: () => null
    }
});

const emit = defineEmits(['update:visible']);

// Computed para controlar la visibilidad del modal
const isVisible = computed({
    get() {
        return props.visible;
    },
    set(value) {
        emit('update:visible', value);
    }
});

// Formatear fecha
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Obtener clase CSS para el tipo de ajuste
const getTypeClass = (type) => {
    switch (type) {
        case 'POSITIVO':
            return 'bg-green-100 text-green-700 border-green-200';
        case 'NEGATIVO':
            return 'bg-red-100 text-red-700 border-red-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// Obtener icono para el tipo de ajuste
const getTypeIcon = (type) => {
    switch (type) {
        case 'POSITIVO':
            return 'pi-plus-circle';
        case 'NEGATIVO':
            return 'pi-minus-circle';
        default:
            return 'pi-sliders-h';
    }
};

// Formatear cantidad con signo
const formatQuantity = (quantity, type) => {
    if (!quantity) return '0';
    const num = parseFloat(quantity);
    const sign = type === 'POSITIVO' ? '+' : '-';
    return `${sign}${Math.abs(num).toLocaleString()}`;
};
</script>

<template>
    <Dialog v-model:visible="isVisible" modal :header="`Detalles del Ajuste #${adjustmentData?.id || 'N/A'}`" :style="{ width: '50rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" class="p-fluid">
        <div v-if="adjustmentData" class="grid">
            <!-- Información del Ajuste -->
            <div class="col-12">
                <div class="card">
                    <h6 class="text-900 font-semibold mb-3">
                        <i class="pi pi-sliders-h mr-2"></i>
                        Información del Ajuste
                    </h6>

                    <div class="grid">
                        <!-- Tipo de Ajuste -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">Tipo de Ajuste</label>
                            <Tag :value="adjustmentData.adjustment_type" :class="getTypeClass(adjustmentData.adjustment_type)" class="border-1">
                                <i :class="`pi ${getTypeIcon(adjustmentData.adjustment_type)} mr-1`"></i>
                                {{ adjustmentData.adjustment_type }}
                            </Tag>
                        </div>

                        <!-- Cantidad -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">Cantidad Ajustada</label>
                            <div
                                class="text-xl font-bold"
                                :class="{
                                    'text-green-600': adjustmentData.adjustment_type === 'POSITIVO',
                                    'text-red-600': adjustmentData.adjustment_type === 'NEGATIVO'
                                }"
                            >
                                {{ formatQuantity(adjustmentData.quantity, adjustmentData.adjustment_type) }}
                            </div>
                        </div>

                        <!-- Fecha -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">Fecha del Ajuste</label>
                            <div class="flex align-items-center">
                                <i class="pi pi-calendar mr-2 text-500"></i>
                                <span>{{ formatDate(adjustmentData.created_at) }}</span>
                            </div>
                        </div>

                        <!-- Usuario -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">Realizado por</label>
                            <div class="flex align-items-center">
                                <i class="pi pi-user mr-2 text-500"></i>
                                <span>{{ adjustmentData.user_name || 'N/A' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información del Producto -->
            <div class="col-12">
                <div class="card">
                    <h6 class="text-900 font-semibold mb-3">
                        <i class="pi pi-box mr-2"></i>
                        Información del Producto
                    </h6>

                    <div class="grid">
                        <!-- Nombre del Producto -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">Producto</label>
                            <div class="font-medium">{{ adjustmentData.product_name || 'N/A' }}</div>
                        </div>

                        <!-- SKU -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">SKU</label>
                            <div class="text-500">{{ adjustmentData.product_sku || 'Sin SKU' }}</div>
                        </div>

                        <!-- Almacén -->
                        <div class="col-12 md:col-6">
                            <label class="block text-900 font-medium mb-2">Almacén</label>
                            <div class="flex align-items-center">
                                <i class="pi pi-building mr-2 text-500"></i>
                                <span>{{ adjustmentData.warehouse_name || 'N/A' }}</span>
                            </div>
                        </div>

                        <!-- Lote -->
                        <div class="col-12 md:col-6" v-if="adjustmentData.batch_code">
                            <label class="block text-900 font-medium mb-2">Lote</label>
                            <div class="text-sm bg-gray-100 px-2 py-1 border-round inline-block">
                                {{ adjustmentData.batch_code }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detalles del Ajuste -->
            <div class="col-12">
                <div class="card">
                    <h6 class="text-900 font-semibold mb-3">
                        <i class="pi pi-info-circle mr-2"></i>
                        Detalles del Ajuste
                    </h6>

                    <div class="grid">
                        <!-- Razón -->
                        <div class="col-12">
                            <label class="block text-900 font-medium mb-2">Razón del Ajuste</label>
                            <div class="p-3 bg-gray-50 border-round">
                                {{ adjustmentData.reason || 'Sin especificar' }}
                            </div>
                        </div>

                        <!-- Documento de Referencia -->
                        <div class="col-12 md:col-6" v-if="adjustmentData.reference_document">
                            <label class="block text-900 font-medium mb-2">Documento de Referencia</label>
                            <div class="text-sm bg-blue-100 text-blue-700 px-2 py-1 border-round inline-block">
                                {{ adjustmentData.reference_document }}
                            </div>
                        </div>

                        <!-- Notas -->
                        <div class="col-12" v-if="adjustmentData.notes">
                            <label class="block text-900 font-medium mb-2">Notas Adicionales</label>
                            <div class="p-3 bg-gray-50 border-round">
                                {{ adjustmentData.notes }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer del Modal -->
        <template #footer>
            <Button label="Cerrar" icon="pi pi-times" @click="isVisible = false" class="p-button-text" />
        </template>
    </Dialog>
</template>

<style scoped>
.card {
    padding: 1.5rem;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
}

.card:last-child {
    margin-bottom: 0;
}

:deep(.p-tag) {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
}

@media (max-width: 768px) {
    .card {
        padding: 1rem;
    }
}
</style>
