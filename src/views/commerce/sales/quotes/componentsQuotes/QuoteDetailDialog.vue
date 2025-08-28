<script setup>
import { useQuotesStore } from '@/stores/quotesStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// PrimeVue components
import Button from 'primevue/button';
import Column from 'primevue/column';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import ProgressSpinner from 'primevue/progressspinner';
import SplitButton from 'primevue/splitbutton';
import Tag from 'primevue/tag';

// Custom components
import QuoteApprovalDialog from './QuoteApprovalDialog.vue';

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    quoteId: {
        type: [String, Number],
        default: null
    }
});

// Emits
const emit = defineEmits(['update:visible', 'quote-updated', 'edit-quote']);

// Composables
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const quotesStore = useQuotesStore();

// Estado
const loading = ref(false);
const actionLoading = ref(false);
const quote = ref(null);
const showApprovalDialog = ref(false);

// Computed properties
const canEdit = computed(() => quote.value && quote.value.status === 'PENDIENTE');
const canApprove = computed(() => quote.value && quotesStore.canApproveQuote(quote.value));
const canReject = computed(() => quote.value && quote.value.status === 'PENDIENTE');
const canDelete = computed(() => quote.value && quote.value.status === 'PENDIENTE');

// Watchers
watch(() => props.visible, (newVal) => {
    if (newVal && props.quoteId) {
        loadQuote();
    }
});

watch(() => props.quoteId, (newVal) => {
    if (newVal && props.visible) {
        loadQuote();
    }
});

// Methods
const loadQuote = async () => {
    if (!props.quoteId) return;
    
    loading.value = true;
    try {
        const result = await quotesStore.getQuote(props.quoteId);
        if (result.success) {
            quote.value = result.data;
        } else {
            throw new Error(result.message || 'Cotización no encontrada');
        }
    } catch (error) {
        console.error('Error loading quote:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar la cotización',
            life: 5000
        });
        closeDialog();
    } finally {
        loading.value = false;
    }
};

const closeDialog = () => {
    emit('update:visible', false);
    quote.value = null;
};

const editQuote = () => {
    if (quote.value?.status !== 'PENDIENTE') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden editar cotizaciones pendientes',
            life: 3000
        });
        return;
    }
    
    // Emitir evento para que el componente padre abra el modal de edición
    closeDialog();
    emit('edit-quote', quote.value);
};

const approveQuote = () => {
    showApprovalDialog.value = true;
};

const handleApproval = async (approvalData) => {
    actionLoading.value = true;
    try {
        const result = await quotesStore.approveQuote(quote.value.id, approvalData);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message || 'Cotización aprobada y venta registrada como pagada exitosamente',
                life: 3000
            });
            showApprovalDialog.value = false;
            await loadQuote(); // Recargar datos
            emit('quote-updated', quote.value);
        }
    } catch (error) {
        console.error('Error approving quote:', error);
        
        // Manejar errores específicos de la nueva API
        let errorMessage = 'Error al aprobar la cotización';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (quotesStore.message) {
            errorMessage = quotesStore.message;
        }
        
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });
    } finally {
        actionLoading.value = false;
    }
};

const rejectQuote = () => {
    confirm.require({
        message: '¿Está seguro de rechazar esta cotización?',
        header: 'Confirmar Rechazo',
        icon: 'pi pi-times',
        acceptClass: 'p-button-danger',
        accept: async () => {
            actionLoading.value = true;
            try {
                const result = await quotesStore.rejectQuote(quote.value.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización rechazada exitosamente',
                        life: 3000
                    });
                    await loadQuote(); // Recargar datos
                    emit('quote-updated', quote.value);
                }
            } catch (error) {
                console.error('Error rejecting quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al rechazar la cotización',
                    life: 5000
                });
            } finally {
                actionLoading.value = false;
            }
        }
    });
};

const deleteQuote = () => {
    confirm.require({
        message: '¿Está seguro de eliminar esta cotización? Esta acción no se puede deshacer.',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-trash',
        acceptClass: 'p-button-danger',
        accept: async () => {
            actionLoading.value = true;
            try {
                const result = await quotesStore.removeQuote(quote.value.id);
                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: result.message || 'Cotización eliminada exitosamente',
                        life: 3000
                    });
                    closeDialog();
                    emit('quote-updated', quote.value);
                }
            } catch (error) {
                console.error('Error deleting quote:', error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: quotesStore.message || 'Error al eliminar la cotización',
                    life: 5000
                });
            } finally {
                actionLoading.value = false;
            }
        }
    });
};

const downloadPdf = async () => {
    try {
        const result = await quotesStore.downloadPdf(quote.value.id);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el PDF',
            life: 3000
        });
    }
};

const downloadExcel = async () => {
    try {
        const result = await quotesStore.downloadExcel(quote.value.id);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message,
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error downloading Excel:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el Excel',
            life: 3000
        });
    }
};

// Utility functions
const getStatusSeverity = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'warning';
        case 'APROBADO':
            return 'success';
        case 'RECHAZADO':
            return 'danger';
        case 'VENCIDO':
            return 'secondary';
        default:
            return 'secondary';
    }
};

const formatCurrency = (value) => {
    return value ? `S/ ${parseFloat(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/ 0.00';
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE');
};

const isExpiringSoon = (validUntil) => {
    if (!validUntil) return false;
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="(val) => emit('update:visible', val)"
        :style="{ width: '95vw', maxWidth: '1400px', maxHeight: '95vh' }"
        :header="quote ? `📄 ${quote.quote_number || 'Cotización'}` : '📄 Detalles de Cotización'"
        :modal="true"
        class="quote-detail-dialog"
        :closable="true"
        :draggable="false"
    >
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <div class="loading-content">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
                <p>Cargando detalles de la cotización...</p>
            </div>
        </div>

        <!-- Quote Content -->
        <div v-else-if="quote" class="quote-content">
            <!-- Header con acciones -->
            <div class="quote-header-actions">
                <div class="header-info">
                    <div class="status-info">
                        <Tag :value="quote.status_display || quote.status" :severity="getStatusSeverity(quote.status)" class="status-tag" />
                        <span v-if="isExpiringSoon(quote.valid_until)" class="expiry-warning">
                            <i class="pi pi-exclamation-triangle"></i>
                            Expira pronto
                        </span>
                    </div>
                    <div class="total-amount">
                        <span class="amount-label">Total:</span>
                        <span class="amount-value">{{ formatCurrency(quote.total_amount) }}</span>
                    </div>
                </div>

                <div class="action-buttons">
                    <Button
                        v-if="canEdit"
                        icon="pi pi-pencil"
                        label="Editar"
                        severity="success"
                        outlined
                        @click="editQuote"
                        class="action-btn"
                    />
                    
                    <Button
                        v-if="canApprove"
                        icon="pi pi-check"
                        label="Aprobar"
                        severity="success"
                        @click="approveQuote"
                        :loading="actionLoading"
                        class="action-btn"
                    />
                    
                    <Button
                        v-if="canReject"
                        icon="pi pi-times"
                        label="Rechazar"
                        severity="danger"
                        outlined
                        @click="rejectQuote"
                        :loading="actionLoading"
                        class="action-btn"
                    />

                    <!-- Menu de descargas -->
                    <SplitButton
                        icon="pi pi-download"
                        label="Descargar"
                        outlined
                        @click="downloadPdf"
                        :model="[
                            {
                                label: 'PDF',
                                icon: 'pi pi-file-pdf',
                                command: downloadPdf
                            },
                            {
                                label: 'Excel',
                                icon: 'pi pi-file-excel',
                                command: downloadExcel
                            },
                            { separator: true },
                            {
                                label: 'Eliminar',
                                icon: 'pi pi-trash',
                                command: deleteQuote,
                                disabled: !canDelete,
                                class: 'text-red-600'
                            }
                        ]"
                        class="action-btn"
                    />
                </div>
            </div>

            <Divider />

            <!-- Información principal en dos columnas -->
            <div class="quote-main-content">
                <div class="content-left">
                    <!-- Información del cliente y fechas -->
                    <div class="info-sections">
                        <div class="info-section">
                            <h6 class="section-title">👤 Cliente</h6>
                            <div v-if="quote.customer" class="info-card">
                                <div class="customer-name">{{ quote.customer.name }}</div>
                                <div class="customer-details">
                                    <div v-if="quote.customer.email" class="detail-item">
                                        <i class="pi pi-envelope"></i>
                                        {{ quote.customer.email }}
                                    </div>
                                    <div v-if="quote.customer.phone" class="detail-item">
                                        <i class="pi pi-phone"></i>
                                        {{ quote.customer.phone }}
                                    </div>
                                    <div v-if="quote.customer.identity_document" class="detail-item">
                                        <i class="pi pi-id-card"></i>
                                        {{ quote.customer.identity_document_type }}: {{ quote.customer.identity_document }}
                                    </div>
                                </div>
                            </div>
                            <div v-else class="info-card empty">
                                <i class="pi pi-user-plus"></i>
                                Cliente Anónimo
                            </div>
                        </div>

                        <div class="info-section">
                            <h6 class="section-title">📅 Fechas</h6>
                            <div class="info-card">
                                <div class="date-item">
                                    <span class="date-label">Fecha de cotización:</span>
                                    <span class="date-value">{{ formatDate(quote.quote_date) }}</span>
                                </div>
                                <div class="date-item">
                                    <span class="date-label">Válido hasta:</span>
                                    <span class="date-value" :class="{ 'expiring': isExpiringSoon(quote.valid_until) }">
                                        {{ formatDate(quote.valid_until) }}
                                    </span>
                                </div>
                                <div v-if="quote.approved_at" class="date-item">
                                    <span class="date-label">Aprobado:</span>
                                    <span class="date-value">{{ formatDate(quote.approved_at) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Productos -->
                    <div class="products-section">
                        <h6 class="section-title">📦 Productos ({{ quote.details?.length || 0 }})</h6>
                        <div class="products-table-container">
                            <DataTable 
                                :value="quote.details" 
                                class="products-table"
                                responsiveLayout="scroll"
                                :paginator="quote.details && quote.details.length > 10"
                                :rows="10"
                            >
                                <Column field="stock.product.name" header="Producto" style="width: 40%">
                                    <template #body="{ data }">
                                        <div class="product-info">
                                            <span class="product-name">{{ data.stock?.product?.name }}</span>
                                            <div class="product-details">
                                                <small class="product-sku">SKU: {{ data.stock?.product?.sku }}</small>
                                                <small class="product-warehouse">{{ data.stock?.warehouse?.name }}</small>
                                            </div>
                                        </div>
                                    </template>
                                </Column>

                                <Column field="quantity" header="Cantidad" class="text-center" style="width: 15%">
                                    <template #body="{ data }">
                                        <Tag :value="parseFloat(data.quantity).toFixed(2)" severity="info" />
                                    </template>
                                </Column>

                                <Column field="unit_price" header="Precio Unit." class="text-right" style="width: 15%">
                                    <template #body="{ data }">
                                        <span class="unit-price">{{ formatCurrency(data.unit_price) }}</span>
                                    </template>
                                </Column>

                                <Column field="discount_amount" header="Descuento" class="text-right" style="width: 15%">
                                    <template #body="{ data }">
                                        <span v-if="data.discount_amount > 0" class="discount-amount">
                                            -{{ formatCurrency(data.discount_amount) }}
                                        </span>
                                        <span v-else class="no-discount">-</span>
                                    </template>
                                </Column>

                                <Column field="total_amount" header="Total" class="text-right" style="width: 15%">
                                    <template #body="{ data }">
                                        <span class="total-price">{{ formatCurrency(data.total_amount) }}</span>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </div>

                <div class="content-right">
                    <!-- Información adicional -->
                    <div class="additional-info">
                        <h6 class="section-title">ℹ️ Información Adicional</h6>
                        
                        <!-- Usuario que creó -->
                        <div v-if="quote.user" class="info-item">
                            <div class="info-label">Creado por:</div>
                            <div class="info-value">{{ quote.user.name }}</div>
                        </div>

                        <!-- Fecha de creación -->
                        <div class="info-item">
                            <div class="info-label">Creado:</div>
                            <div class="info-value">{{ formatDate(quote.created_at) }}</div>
                        </div>

                        <!-- Venta asociada -->
                        <div v-if="quote.sale_id" class="info-item">
                            <div class="info-label">Venta generada:</div>
                            <Button 
                                :label="`Ver Venta #${quote.sale_id}`" 
                                icon="pi pi-external-link" 
                                size="small"
                                text
                                @click="router.push({ name: 'sale-detail', params: { id: quote.sale_id } }); closeDialog();"
                            />
                        </div>
                    </div>

                    <!-- Totales -->
                    <div class="totals-section">
                        <h6 class="section-title">💰 Resumen de Totales</h6>
                        <div class="totals-card">
                            <div class="total-row">
                                <span class="total-label">Subtotal:</span>
                                <span class="total-value">{{ formatCurrency(quote.subtotal_amount) }}</span>
                            </div>
                            <div class="total-row">
                                <span class="total-label">Impuestos:</span>
                                <span class="total-value">{{ formatCurrency(quote.tax_amount) }}</span>
                            </div>
                            <div v-if="quote.discount_amount > 0" class="total-row">
                                <span class="total-label">Descuento:</span>
                                <span class="total-value discount">-{{ formatCurrency(quote.discount_amount) }}</span>
                            </div>
                            <Divider class="totals-divider" />
                            <div class="total-row final">
                                <span class="total-label">Total:</span>
                                <span class="total-value">{{ formatCurrency(quote.total_amount) }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Notas -->
                    <div v-if="quote.notes" class="notes-section">
                        <h6 class="section-title">📝 Notas</h6>
                        <div class="notes-content">
                            {{ quote.notes }}
                        </div>
                    </div>

                    <!-- Términos y condiciones -->
                    <div v-if="quote.terms_and_conditions" class="terms-section">
                        <h6 class="section-title">📋 Términos y Condiciones</h6>
                        <div class="terms-content">
                            {{ quote.terms_and_conditions }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div v-else class="error-state">
            <i class="pi pi-exclamation-triangle error-icon"></i>
            <h3>Error al cargar</h3>
            <p>No se pudo cargar la información de la cotización.</p>
        </div>

        <!-- Dialog de aprobación -->
        <QuoteApprovalDialog
            v-model:visible="showApprovalDialog"
            :quote="quote"
            :loading="actionLoading"
            @approve="handleApproval"
        />

        <!-- Confirmaciones -->
        <ConfirmDialog />
    </Dialog>
</template>

<style scoped>
/* Dialog principal */
.quote-detail-dialog {
    font-family: 'Inter', sans-serif;
}

:deep(.p-dialog-content) {
    padding: 0 !important;
    overflow: hidden;
}

/* Estados de carga y error */
.loading-state,
.error-state {
    @apply flex flex-col items-center justify-center py-12 px-6 text-center;
}

.loading-content p {
    @apply mt-4 text-gray-600 text-lg;
}

.error-icon {
    @apply text-6xl text-red-500 mb-4;
}

/* Contenido de la cotización */
.quote-content {
    @apply p-6;
    max-height: calc(95vh - 120px);
    overflow-y: auto;
}

/* Header con acciones */
.quote-header-actions {
    @apply flex justify-between items-center mb-4;
}

.header-info {
    @apply flex flex-col gap-2;
}

.status-info {
    @apply flex items-center gap-3;
}

.status-tag {
    @apply font-semibold;
}

.expiry-warning {
    @apply text-orange-600 text-sm font-medium flex items-center gap-1;
}

.total-amount {
    @apply flex items-center gap-2;
}

.amount-label {
    @apply text-gray-600 font-medium;
}

.amount-value {
    @apply text-2xl font-bold text-primary;
}

.action-buttons {
    @apply flex items-center gap-2 flex-wrap;
}

.action-btn {
    @apply transition-all duration-200;
}

/* Contenido principal */
.quote-main-content {
    @apply grid grid-cols-1 lg:grid-cols-3 gap-6;
}

.content-left {
    @apply lg:col-span-2 space-y-6;
}

.content-right {
    @apply space-y-6;
}

/* Secciones de información */
.info-sections {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.info-section {
    @apply space-y-3;
}

.section-title {
    @apply text-lg font-semibold text-gray-900 mb-3;
}

.info-card {
    @apply bg-gray-50 p-4 rounded-lg border border-gray-200;
}

.info-card.empty {
    @apply text-center text-gray-500 py-6;
}

.customer-name {
    @apply text-lg font-semibold text-gray-900 mb-2;
}

.customer-details {
    @apply space-y-1;
}

.detail-item {
    @apply text-sm text-gray-600 flex items-center gap-2;
}

.detail-item i {
    @apply text-gray-400;
}

.date-item {
    @apply flex justify-between items-center py-1;
}

.date-label {
    @apply text-sm text-gray-600;
}

.date-value {
    @apply font-semibold text-gray-900;
}

.date-value.expiring {
    @apply text-orange-600;
}

/* Sección de productos */
.products-section {
    @apply space-y-3;
}

.products-table-container {
    @apply bg-white rounded-lg border border-gray-200 overflow-hidden;
}

:deep(.products-table) {
    @apply text-sm;
}

:deep(.products-table .p-datatable-thead th) {
    @apply bg-gray-50 text-gray-700 font-semibold text-xs uppercase tracking-wide;
}

.product-info {
    @apply space-y-1;
}

.product-name {
    @apply font-semibold text-gray-900;
}

.product-details {
    @apply space-y-0.5;
}

.product-sku,
.product-warehouse {
    @apply text-gray-500 block;
}

.unit-price,
.total-price {
    @apply font-semibold text-gray-900;
}

.discount-amount {
    @apply text-red-600 font-semibold;
}

.no-discount {
    @apply text-gray-400;
}

/* Información adicional */
.additional-info {
    @apply bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3;
}

.info-item {
    @apply space-y-1;
}

.info-label {
    @apply text-sm text-gray-600 font-medium;
}

.info-value {
    @apply font-semibold text-gray-900;
}

/* Sección de totales */
.totals-section {
    @apply space-y-3;
}

.totals-card {
    @apply bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200;
}

.total-row {
    @apply flex justify-between items-center py-1;
}

.total-row.final {
    @apply text-lg font-bold text-primary pt-2;
}

.total-label {
    @apply text-gray-700;
}

.total-value {
    @apply font-semibold text-gray-900;
}

.total-value.discount {
    @apply text-red-600;
}

.totals-divider {
    @apply my-2;
}

/* Notas y términos */
.notes-section,
.terms-section {
    @apply space-y-3;
}

.notes-content,
.terms-content {
    @apply bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-gray-700 text-sm leading-relaxed;
}

/* Responsive */
@media (max-width: 768px) {
    .quote-header-actions {
        @apply flex-col items-start gap-4;
    }
    
    .action-buttons {
        @apply w-full justify-start;
    }
    
    .quote-main-content {
        @apply grid-cols-1;
    }
    
    .info-sections {
        @apply grid-cols-1;
    }
    
    .action-btn {
        @apply text-sm px-3 py-2;
    }
}

/* Scrollbar personalizado */
.quote-content::-webkit-scrollbar {
    width: 6px;
}

.quote-content::-webkit-scrollbar-track {
    @apply bg-gray-100 rounded-lg;
}

.quote-content::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded-lg;
}

.quote-content::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
}
</style>