<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

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
    <Dialog v-model:visible="isVisible" modal :header="`Detalles del Ajuste #${adjustmentData?.id || 'N/A'}`" :style="{ width: '65rem' }" :breakpoints="{ '1199px': '85vw', '768px': '95vw' }" class="details-modal">
        <div v-if="adjustmentData" class="modal-content">
            <!-- Layout mejorado con 2 columnas principales -->
            <div class="main-grid">
                <!-- Columna izquierda -->
                <div class="left-column">
                    <!-- Header del ajuste con información clave -->
                    <div class="adjustment-header">
                        <div class="header-content">
                            <div class="adjustment-type">
                                <Tag :value="adjustmentData.adjustment_type" :class="getTypeClass(adjustmentData.adjustment_type)" class="type-badge">
                                    <i :class="`pi ${getTypeIcon(adjustmentData.adjustment_type)}`"></i>
                                    {{ adjustmentData.adjustment_type }}
                                </Tag>
                            </div>
                            <div class="quantity-display">
                                <span class="quantity-label">Cantidad Ajustada</span>
                                <div
                                    class="quantity-value"
                                    :class="{
                                        'positive': adjustmentData.adjustment_type === 'POSITIVO',
                                        'negative': adjustmentData.adjustment_type === 'NEGATIVO'
                                    }"
                                >
                                    {{ formatQuantity(adjustmentData.quantity, adjustmentData.adjustment_type) }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información del Producto -->
                    <div class="info-card">
                        <div class="card-header">
                            <i class="pi pi-box"></i>
                            <h3>Información del Producto</h3>
                        </div>
                        <div class="card-content">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Producto</label>
                                    <div class="value primary">{{ adjustmentData.product_name || 'N/A' }}</div>
                                </div>
                                <div class="info-item">
                                    <label>SKU</label>
                                    <div class="value secondary">{{ adjustmentData.product_sku || 'Sin SKU' }}</div>
                                </div>
                                <div class="info-item">
                                    <label>Almacén</label>
                                    <div class="value with-icon">
                                        <i class="pi pi-building"></i>
                                        <span>{{ adjustmentData.warehouse_name || 'N/A' }}</span>
                                    </div>
                                </div>
                                <div class="info-item" v-if="adjustmentData.batch_code">
                                    <label>Lote</label>
                                    <div class="value badge">
                                        <span class="batch-code">{{ adjustmentData.batch_code }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna derecha -->
                <div class="right-column">
                    <!-- Información del Ajuste -->
                    <div class="info-card">
                        <div class="card-header">
                            <i class="pi pi-sliders-h"></i>
                            <h3>Información del Ajuste</h3>
                        </div>
                        <div class="card-content">
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Fecha del Ajuste</label>
                                    <div class="value with-icon">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ formatDate(adjustmentData.created_at) }}</span>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <label>Realizado por</label>
                                    <div class="value with-icon">
                                        <i class="pi pi-user"></i>
                                        <span>{{ adjustmentData.user_name || 'N/A' }}</span>
                                    </div>
                                </div>
                                <div class="info-item" v-if="adjustmentData.reference_document">
                                    <label>Documento de Referencia</label>
                                    <div class="value badge">
                                        <span class="reference-doc">{{ adjustmentData.reference_document }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Detalles adicionales -->
                    <div class="info-card">
                        <div class="card-header">
                            <i class="pi pi-info-circle"></i>
                            <h3>Detalles</h3>
                        </div>
                        <div class="card-content">
                            <div class="detail-item">
                                <label>Razón del Ajuste</label>
                                <div class="reason-content">
                                    {{ adjustmentData.reason || 'Sin especificar' }}
                                </div>
                            </div>
                            <div class="detail-item" v-if="adjustmentData.notes">
                                <label>Notas Adicionales</label>
                                <div class="notes-content">
                                    {{ adjustmentData.notes }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer del Modal -->
        <template #footer>
            <div class="modal-footer">
                <Button label="Cerrar" icon="pi pi-times" @click="isVisible = false" class="close-btn" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Modal principal */
.details-modal {
    @apply max-w-6xl;
}

:deep(.details-modal .p-dialog-header) {
    @apply bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 rounded-t-xl;
    padding: 1.5rem 2rem;
}

:deep(.details-modal .p-dialog-header .p-dialog-title) {
    @apply text-lg font-semibold;
}

:deep(.details-modal .p-dialog-content) {
    @apply p-0 border-0;
}

.modal-content {
    padding: 2rem;
}

/* Layout principal con 2 columnas */
.main-grid {
    @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.left-column,
.right-column {
    @apply space-y-6;
}

/* Header destacado del ajuste */
.adjustment-header {
    @apply bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600;
}

.header-content {
    @apply flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4;
}

.adjustment-type .type-badge {
    @apply text-sm font-semibold px-3 py-2 rounded-lg border;
}

.quantity-display {
    @apply text-right;
}

.quantity-label {
    @apply block text-sm text-gray-600 dark:text-gray-400 mb-1;
}

.quantity-value {
    @apply text-3xl font-bold;
}

.quantity-value.positive {
    @apply text-green-600 dark:text-green-400;
}

.quantity-value.negative {
    @apply text-red-600 dark:text-red-400;
}

/* Tarjetas de información */
.info-card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.card-header {
    @apply bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3;
}

.card-header i {
    @apply text-lg text-gray-600 dark:text-gray-400;
}

.card-header h3 {
    @apply text-base font-semibold text-gray-900 dark:text-white;
}

.card-content {
    @apply p-6;
}

/* Grid de información */
.info-grid {
    @apply grid grid-cols-1 sm:grid-cols-2 gap-6;
}

.info-item {
    @apply space-y-2;
}

.info-item label {
    @apply block text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide;
}

.info-item .value {
    @apply text-base;
}

.info-item .value.primary {
    @apply text-gray-900 dark:text-white font-semibold text-lg;
}

.info-item .value.secondary {
    @apply text-gray-600 dark:text-gray-300 font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded;
}

.info-item .value.with-icon {
    @apply flex items-center gap-2 text-gray-700 dark:text-gray-300;
}

.info-item .value.with-icon i {
    @apply text-gray-500 dark:text-gray-400;
}

.info-item .value.badge {
    @apply flex;
}

.batch-code {
    @apply bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-md text-sm font-medium;
}

.reference-doc {
    @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-md text-sm font-medium;
}

/* Elementos de detalle */
.detail-item {
    @apply space-y-3;
}

.detail-item:not(:last-child) {
    @apply mb-6;
}

.detail-item label {
    @apply block text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide;
}

.reason-content,
.notes-content {
    @apply bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-800 dark:text-gray-200 leading-relaxed;
}

/* Footer del modal */
.modal-footer {
    @apply flex justify-end p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700;
}

.close-btn {
    @apply bg-gray-500 hover:bg-gray-600 text-white border-gray-500 hover:border-gray-600 px-6 py-2 rounded-lg transition-all duration-200;
}

/* Responsive */
@media (max-width: 1024px) {
    .main-grid {
        @apply grid-cols-1;
    }
    
    .header-content {
        @apply flex-col items-start;
    }
    
    .quantity-display {
        @apply text-left;
    }
}

@media (max-width: 768px) {
    .modal-content {
        padding: 1rem;
    }
    
    .adjustment-header {
        @apply p-4;
    }
    
    .card-content {
        @apply p-4;
    }
    
    .info-grid {
        @apply grid-cols-1;
    }
    
    .quantity-value {
        @apply text-2xl;
    }
}

/* Clases de tipo mejoradas */
:deep(.type-badge.bg-green-100) {
    @apply bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700;
}

:deep(.type-badge.bg-red-100) {
    @apply bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700;
}

:deep(.type-badge.bg-gray-100) {
    @apply bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700;
}

/* Animaciones suaves */
.info-card {
    transition: all 0.2s ease;
}

.info-card:hover {
    @apply shadow-md;
}
</style>
