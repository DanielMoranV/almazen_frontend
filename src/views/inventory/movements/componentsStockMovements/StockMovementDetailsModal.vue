<script setup>
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { computed, ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    movementData: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible']);

const localVisible = ref(props.visible);

// Computed para el título del modal
const modalTitle = computed(() => {
    if (!props.movementData) return 'Detalles del Movimiento';
    return `Detalles del Movimiento - ${getTypeLabel(props.movementData.type)}`;
});

// Watchers
watch(
    () => props.visible,
    (newVal) => {
        localVisible.value = newVal;
    }
);

watch(localVisible, (newVal) => {
    emit('update:visible', newVal);
});

// Métodos
const closeModal = () => {
    localVisible.value = false;
};

// Funciones de formato y utilidad
const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
};

const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '-';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '-';
    return `S/ ${numValue.toFixed(2)}`;
};

const getTypeClass = (type) => {
    const classes = {
        entry: 'type-entry',
        exit: 'type-exit',
        adjustment: 'type-adjustment',
        transfer: 'type-transfer',
        ENTRADA: 'type-entry',
        SALIDA: 'type-exit',
        AJUSTE: 'type-adjustment',
        TRANSFERENCIA: 'type-transfer'
    };
    return classes[type] || 'type-default';
};

const getTypeIcon = (type) => {
    const icons = {
        entry: 'pi pi-arrow-down',
        exit: 'pi pi-arrow-up',
        adjustment: 'pi pi-cog',
        transfer: 'pi pi-arrow-right-arrow-left',
        ENTRADA: 'pi pi-arrow-down',
        SALIDA: 'pi pi-arrow-up',
        AJUSTE: 'pi pi-cog',
        TRANSFERENCIA: 'pi pi-arrow-right-arrow-left'
    };
    return icons[type] || 'pi pi-circle';
};

const getTypeLabel = (type) => {
    const labels = {
        entry: 'Entrada',
        exit: 'Salida',
        adjustment: 'Ajuste',
        transfer: 'Transferencia',
        ENTRADA: 'Entrada',
        SALIDA: 'Salida',
        AJUSTE: 'Ajuste',
        TRANSFERENCIA: 'Transferencia'
    };
    return labels[type] || type;
};

const getQuantityClass = (type) => {
    if (type === 'entry' || type === 'ENTRADA') return 'quantity-positive';
    if (type === 'exit' || type === 'SALIDA') return 'quantity-negative';
    return 'quantity-neutral';
};

const formatQuantity = (type, quantity) => {
    if (!quantity) return '0';
    const isExit = type === 'exit' || type === 'SALIDA';
    const sign = isExit ? '-' : '+';
    return `${sign}${Math.abs(quantity)}`;
};
</script>

<template>
    <Dialog v-model:visible="localVisible" modal :header="modalTitle" :style="{ width: '45rem' }" :breakpoints="{ '1199px': '70vw', '575px': '95vw' }" class="movement-details-modal">
        <div v-if="movementData" class="movement-details">
            <!-- Header compacto con información clave -->
            <div class="movement-header">
                <div class="header-left">
                    <span class="movement-id">#{{ movementData.id }}</span>
                    <span class="type-badge" :class="getTypeClass(movementData.movement_type || movementData.type)">
                        <i :class="getTypeIcon(movementData.movement_type || movementData.type)"></i>
                        {{ getTypeLabel(movementData.movement_type || movementData.type) }}
                    </span>
                </div>
                <div class="header-right">
                    <span class="quantity-badge" :class="getQuantityClass(movementData.movement_type || movementData.type)">
                        {{ formatQuantity(movementData.movement_type || movementData.type, movementData.quantity) }}
                    </span>
                    <span class="movement-date">{{ formatDateTime(movementData.created_at) }}</span>
                </div>
            </div>

            <!-- Información principal en cards compactas -->
            <div class="info-cards">
                <!-- Producto -->
                <div class="info-card">
                    <div class="card-header">
                        <i class="pi pi-box"></i>
                        <span>Producto</span>
                    </div>
                    <div class="card-content">
                        <div class="product-name">{{ movementData.product_name }}</div>
                        <div class="product-details">
                            <span v-if="movementData.product_sku" class="detail-chip">
                                <i class="pi pi-tag"></i>
                                {{ movementData.product_sku }}
                            </span>
                            <span v-if="movementData.product_barcode" class="detail-chip">
                                <i class="pi pi-qrcode"></i>
                                {{ movementData.product_barcode }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Almacén y Lote -->
                <div class="info-card">
                    <div class="card-header">
                        <i class="pi pi-warehouse"></i>
                        <span>Ubicación</span>
                    </div>
                    <div class="card-content">
                        <div class="warehouse-info">
                            <i class="pi pi-building"></i>
                            {{ movementData.warehouse_name || 'No especificado' }}
                        </div>
                        <div v-if="movementData.batch_code" class="batch-info">
                            <span class="detail-chip batch-chip">
                                <i class="pi pi-tag"></i>
                                Lote: {{ movementData.batch_code }}
                            </span>
                            <span v-if="movementData.batch_expiration" class="expiration-date"> Vence: {{ formatDate(movementData.batch_expiration) }} </span>
                        </div>
                        <div v-else class="no-batch">Sin lote asignado</div>
                    </div>
                </div>

                <!-- Detalles adicionales -->
                <div class="info-card full-width">
                    <div class="card-header">
                        <i class="pi pi-info-circle"></i>
                        <span>Detalles</span>
                    </div>
                    <div class="card-content">
                        <div class="details-row">
                            <div class="detail-group">
                                <label>Usuario:</label>
                                <span>{{ movementData.user_name || 'No especificado' }}</span>
                            </div>
                            <div class="detail-group">
                                <label>Documento:</label>
                                <span>{{ movementData.document || movementData.reference_document || 'No especificado' }}</span>
                            </div>
                        </div>
                        <div v-if="movementData.reason" class="reason-section">
                            <label>Razón:</label>
                            <span class="reason-text">{{ movementData.reason }}</span>
                        </div>
                        <div v-if="movementData.notes" class="notes-section">
                            <label>Notas:</label>
                            <div class="notes-content">{{ movementData.notes }}</div>
                        </div>
                    </div>
                </div>

                <!-- Costos (si están disponibles) -->
                <div v-if="movementData.unit_cost || movementData.total_cost" class="info-card cost-card">
                    <div class="card-header">
                        <i class="pi pi-dollar"></i>
                        <span>Costos</span>
                    </div>
                    <div class="card-content">
                        <div class="cost-details">
                            <div v-if="movementData.unit_cost" class="cost-item">
                                <label>Unitario:</label>
                                <span>{{ formatCurrency(movementData.unit_cost) }}</span>
                            </div>
                            <div v-if="movementData.total_cost" class="cost-item total">
                                <label>Total:</label>
                                <span class="total-amount">{{ formatCurrency(movementData.total_cost) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="modal-footer">
                <Button label="Cerrar" icon="pi pi-times" @click="closeModal" class="p-button-secondary" autofocus />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Modal principal */
:deep(.movement-details-modal .p-dialog-header) {
    @apply bg-gradient-to-r from-green-600 to-blue-600 text-white;
}

:deep(.movement-details-modal .p-dialog-content) {
    @apply p-0;
}

/* Contenedor de detalles */
.movement-details {
    @apply p-4 space-y-4;
}

/* Header compacto */
.movement-header {
    @apply flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600;
}

.header-left {
    @apply flex items-center gap-3;
}

.header-right {
    @apply flex items-center gap-3 text-right;
}

.movement-id {
    @apply font-mono text-lg font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg;
}

.movement-date {
    @apply text-sm text-gray-600 dark:text-gray-400 font-medium;
}

/* Cards de información */
.info-cards {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.info-card {
    @apply bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-card.full-width {
    @apply md:col-span-2;
}

.info-card.cost-card {
    @apply border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10;
}

.card-header {
    @apply flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-800 dark:text-gray-200;
}

.card-header i {
    @apply text-blue-600 dark:text-blue-400;
}

.card-content {
    @apply p-4 space-y-3;
}

/* Producto */
.product-name {
    @apply text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2;
}

.product-details {
    @apply flex flex-wrap gap-2;
}

.detail-chip {
    @apply inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium;
}

.detail-chip i {
    @apply text-xs;
}

.batch-chip {
    @apply bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200;
}

/* Ubicación */
.warehouse-info {
    @apply flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium mb-2;
}

.batch-info {
    @apply space-y-1;
}

.expiration-date {
    @apply block text-xs text-orange-600 dark:text-orange-400 font-medium;
}

.no-batch {
    @apply text-gray-500 dark:text-gray-400 italic text-sm;
}

/* Detalles */
.details-row {
    @apply grid grid-cols-1 sm:grid-cols-2 gap-3;
}

.detail-group {
    @apply space-y-1;
}

.detail-group label {
    @apply block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide;
}

.detail-group span {
    @apply block text-gray-900 dark:text-gray-100 font-medium;
}

.reason-section,
.notes-section {
    @apply space-y-1 pt-2 border-t border-gray-200 dark:border-gray-600;
}

.reason-section label,
.notes-section label {
    @apply block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide;
}

.reason-text {
    @apply text-gray-900 dark:text-gray-100 font-medium;
}

.notes-content {
    @apply bg-gray-50 dark:bg-gray-700 p-3 rounded-md text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600;
}

/* Costos */
.cost-details {
    @apply space-y-2;
}

.cost-item {
    @apply flex justify-between items-center;
}

.cost-item label {
    @apply text-sm font-medium text-gray-600 dark:text-gray-400;
}

.cost-item span {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.cost-item.total {
    @apply pt-2 border-t border-green-200 dark:border-green-800;
}

.total-amount {
    @apply text-lg font-bold text-green-600 dark:text-green-400;
}

/* Badges */
.type-badge {
    @apply inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold;
}

.type-entry {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.type-exit {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.type-adjustment {
    @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.type-transfer {
    @apply bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200;
}

.quantity-badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-lg font-bold;
}

.quantity-positive {
    @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.quantity-negative {
    @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.quantity-neutral {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

/* Footer del modal */
.modal-footer {
    @apply flex justify-end p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600;
}

/* Responsive */
@media (max-width: 768px) {
    .movement-details {
        @apply p-3 space-y-3;
    }

    .movement-header {
        @apply flex-col gap-3 text-center;
    }

    .header-left,
    .header-right {
        @apply justify-center;
    }

    .info-cards {
        @apply grid-cols-1;
    }

    .info-card.full-width {
        @apply col-span-1;
    }

    .details-row {
        @apply grid-cols-1;
    }

    .card-content {
        @apply p-3;
    }

    .movement-id {
        @apply text-base;
    }

    .quantity-badge {
        @apply text-base;
    }
}

/* Animaciones suaves */
.info-card {
    transition: all 0.2s ease;
}

.info-card:hover {
    @apply shadow-md;
    transform: translateY(-1px);
}
</style>
