<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';
import PrintOrderDialog from './PrintOrderDialog.vue';
import PurchaseOrderTimeline from './PurchaseOrderTimeline.vue';

// --- Estados y métodos para Dialog de items ---
const showItemsDialog = ref(false);
const selectedOrderItems = ref([]);
const selectedOrderId = ref(null);
const selectedOrderNumber = ref(null);

// Validar si se pueden gestionar bonificaciones
const canManageBonuses = (order) => {
    console.log('Table - Full order object:', order);

    // Buscar la fecha de recepción en diferentes posibles ubicaciones
    let receivedDate = null;

    // Opción 1: Campo directo received_date
    if (order?.received_date) {
        receivedDate = order.received_date;
        console.log('Table - Found received_date:', receivedDate);
    }
    // Opción 2: En status_tracking.received_at
    else if (order?.status_tracking?.received_at) {
        receivedDate = order.status_tracking.received_at;
        console.log('Table - Found status_tracking.received_at:', receivedDate);
    }
    // Opción 3: En status_timeline
    else if (order?.status_timeline) {
        const receivedEntry = order.status_timeline.find((entry) => entry.status === 'RECIBIDO');
        if (receivedEntry?.created_at) {
            receivedDate = receivedEntry.created_at;
            console.log('Table - Found in status_timeline:', receivedDate);
        }
    }

    if (!receivedDate) {
        console.log('Table - No received date found, checking available fields:', Object.keys(order || {}));
        return false;
    }

    // Extraer solo la parte de la fecha (YYYY-MM-DD) ignorando la zona horaria
    const receivedDateStr = receivedDate.split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    console.log('Table - Received date (original):', receivedDate);
    console.log('Table - Received date (date only):', receivedDateStr);
    console.log('Table - Today (date only):', todayStr);
    console.log('Table - Are equal?', receivedDateStr === todayStr);

    // Comparar solo las fechas como strings (YYYY-MM-DD)
    return receivedDateStr === todayStr;
};

// --- Estados para Dialog de tracking ---
const showTrackingDialog = ref(false);
const selectedOrderTracking = ref(null);

// --- Estados para Dialog de bonificaciones ---
const showBonusDialog = ref(false);
const selectedOrderBonuses = ref([]);
const selectedOrderForBonuses = ref(null);

function openItemsDialog(order) {
    // Combinar items regulares y bonificaciones
    const regularItems = getRegularItems(order);
    const bonusItems = getBonusItems(order);

    // Marcar los items de bonificación para poder distinguirlos
    const markedBonusItems = bonusItems.map((item) => ({
        ...item,
        is_bonus: true
    }));

    selectedOrderItems.value = [...regularItems, ...markedBonusItems];
    selectedOrderId.value = order.id;
    selectedOrderNumber.value = order.order_number;
    showItemsDialog.value = true;
}

function closeItemsDialog() {
    showItemsDialog.value = false;
    selectedOrderItems.value = [];
    selectedOrderId.value = null;
    selectedOrderNumber.value = null;
}

// Métodos para Dialog de tracking
function openTrackingDialog(order) {
    selectedOrderTracking.value = order;
    showTrackingDialog.value = true;
}

function closeTrackingDialog() {
    showTrackingDialog.value = false;
    selectedOrderTracking.value = null;
}

// Métodos auxiliares para el diálogo
const getTotalQuantity = () => {
    if (!selectedOrderItems.value || selectedOrderItems.value.length === 0) return 0;
    return selectedOrderItems.value.reduce((total, item) => total + (Math.trunc(item.quantity) || 0), 0);
};

const getRegularItemsCount = () => {
    if (!selectedOrderItems.value || selectedOrderItems.value.length === 0) return 0;
    return selectedOrderItems.value.filter((item) => !item.is_bonus).length;
};

const getBonusItemsCount = () => {
    if (!selectedOrderItems.value || selectedOrderItems.value.length === 0) return 0;
    return selectedOrderItems.value.filter((item) => item.is_bonus).length;
};

const getTotalAmount = () => {
    if (!selectedOrderItems.value || selectedOrderItems.value.length === 0) return 0;
    return selectedOrderItems.value.reduce((total, item) => total + (Number(item.total_amount) || 0), 0);
};

// Métodos para manejar bonificaciones
const getRegularItems = (order) => {
    return order.regular_details || order.details?.filter((d) => !d.is_bonus) || [];
};

const getBonusItems = (order) => {
    return order.bonuses || order.details?.filter((d) => d.is_bonus) || [];
};

const getTotalBonusQuantity = (order) => {
    return order.totals?.bonus_quantity || getBonusItems(order).reduce((total, item) => total + (item.quantity || 0), 0);
};

const getLastUserAction = (order) => {
    if (!order.status_tracking) return null;

    const tracking = order.status_tracking;
    switch (order.status) {
        case 'PENDIENTE':
            return tracking.requested_by;
        case 'APROBADO':
            return tracking.approved_by;
        case 'RECIBIDO':
            return tracking.received_by;
        case 'ANULADO':
            return tracking.cancelled_by;
        default:
            return null;
    }
};

const handleImageError = (event) => {
    event.target.src = '/placeholder-product.png';
    event.target.style.objectFit = 'cover';
};
// --- Fin Dialog ---

const props = defineProps({
    purchaseOrders: { type: Array, required: true },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['view-details', 'receive-order', 'cancel-order', 'approve-order', 'update:selection', 'edit', 'delete', 'manage-bonuses']);

const selectedOrders = ref([]);

watch(selectedOrders, (val) => {
    emit('update:selection', val);
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    supplier: { value: null, matchMode: FilterMatchMode.EQUALS },
    date: { value: null, matchMode: FilterMatchMode.EQUALS },
    expectedDate: { value: null, matchMode: FilterMatchMode.EQUALS },
    items: { value: null, matchMode: FilterMatchMode.EQUALS },
    total: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS }
});

const statusOptions = ref([
    { name: 'Pendiente', value: 'PENDIENTE' },
    { name: 'Aprobado', value: 'APROBADO' },
    { name: 'Rechazado', value: 'RECHAZADO' },
    { name: 'Recibido', value: 'RECIBIDO' },
    { name: 'Cancelado', value: 'CANCELADO' }
]);

const formatCurrency = (value) => {
    // Si el valor es string, conviértelo a número
    if (typeof value === 'string') {
        value = parseFloat(value);
    }
    if (isNaN(value) || value === null || value === undefined) return '-';
    // Ocultar cuando el valor es 0
    if (value === 0) return '-';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
};

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const getStatusLabel = (status) => {
    const statusOption = statusOptions.value.find((option) => option.value === status);
    return statusOption ? statusOption.name : status;
};

const getSeverity = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'warning';
        case 'APROBADO':
            return 'success';
        case 'RECHAZADO':
            return 'danger';
        case 'RECIBIDO':
            return 'info';
        case 'CANCELADO':
            return 'secondary';
        default:
            return 'info';
    }
};

const toast = useToast();
const showPrintDialog = ref(false);
const orderToPrint = ref(null);
function printOrder(order) {
    orderToPrint.value = order;
    showPrintDialog.value = true;
}

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 4000 });
};

const showError = (summary) => {
    toast.add({ severity: 'error', summary, life: 4000 });
};
const getStatusClass = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'status-pending';
        case 'APROBADO':
            return 'status-approved';
        case 'RECIBIDO':
            return 'status-received';
        case 'ANULADO':
            return 'status-cancelled';
        case 'RECHAZADO':
            return 'status-rejected';
        default:
            return 'status-default';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return 'pi pi-clock';
        case 'APROBADO':
            return 'pi pi-check-circle';
        case 'RECIBIDO':
            return 'pi pi-box';
        case 'ANULADO':
            return 'pi pi-times-circle';
        case 'RECHAZADO':
            return 'pi pi-ban';
        default:
            return 'pi pi-question-circle';
    }
};
</script>

<template>
    <DataTable
        :value="purchaseOrders"
        :loading="loading"
        dataKey="id"
        :paginator="true"
        :rows="15"
        :filters="filters"
        v-model:filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        :globalFilterFields="['id', 'provider.name', 'document_number', 'user.name']"
        stripedRows
        removableSort
        class="orders-table green-theme p-datatable-gridlines"
    >
        <template #header>
            <div class="table-header">
                <div class="header-backdrop"></div>
                <div class="header-content">
                    <div class="search-section">
                        <div class="search-container">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search text-white" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" placeholder="Buscar por ID, proveedor, comprobante..." class="search-input" v-tooltip.top="'Buscar en ID, proveedor, comprobante y usuario creador'" fluid />
                            </IconField>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-shopping-bag"></i>
                </div>
                <h3 class="empty-title">No se encontraron órdenes de compra</h3>
                <p class="empty-description">Intenta ajustar los filtros o términos de búsqueda</p>
                <Button icon="pi pi-filter-slash" label="Limpiar filtros" class="p-button-outlined" @click="filters.global.value = null" />
            </div>
        </template>
        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando órdenes...</p>
            </div>
        </template>
        <Column field="order_number" header="# Orden" sortable style="width: 100px">
            <template #body="slotProps">
                <div class="order-number-cell">
                    <Badge :value="slotProps.data.order_number" severity="info" class="order-badge" />
                    <span class="order-id">ID: {{ slotProps.data.id }}</span>
                </div>
            </template>
        </Column>
        <Column field="provider.name" header="Proveedor" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.provider?.name && slotProps.data.provider?.name !== 'N/A'">
                    {{ slotProps.data.provider.name }}
                </span>
                <span v-else class="text-gray-400 italic">Sin asignar</span>
            </template>
        </Column>
        <Column field="purchase_date" header="Fecha" sortable>
            <template #body="slotProps">
                <div class="flex align-items-center">
                    <i class="pi pi-calendar mr-2 text-400"></i>
                    {{ formatDate(slotProps.data.purchase_date) }}
                </div>
            </template>
        </Column>
        <Column field="document_number" header="Comprobante" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.document_number && slotProps.data.document_number !== 'N/A'">
                    {{ slotProps.data.document_number }}
                </span>
                <span v-else class="text-gray-400 italic">Sin comprobante</span>
            </template>
        </Column>

        <Column field="discount_amount" header="Descuento" sortable>
            <template #body="slotProps">
                <div class="font-semibold text-900">
                    {{ formatCurrency(slotProps.data.discount_amount) }}
                </div>
            </template>
        </Column>
        <Column field="tax_amount" header="IGV" sortable>
            <template #body="slotProps">
                <div class="font-semibold text-900">
                    {{ formatCurrency(slotProps.data.tax_amount) }}
                </div>
            </template>
        </Column>

        <Column field="total_amount" header="Total" sortable>
            <template #body="slotProps">
                <div class="font-semibold text-900">
                    {{ formatCurrency(slotProps.data.total_amount) }}
                </div>
            </template>
        </Column>
        <Column field="user.name" header="Creado por" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.user?.name && slotProps.data.user?.name !== 'N/A'">
                    {{ slotProps.data.user.name }}
                </span>
                <span v-else class="text-gray-400 italic">Sistema</span>
            </template>
        </Column>

        <!-- Nueva columna de seguimiento -->
        <Column field="status" header="Seguimiento" style="width: 180px" sortable>
            <template #body="slotProps">
                <div class="tracking-info">
                    <div class="status-container">
                        <i :class="['status-icon', getStatusIcon(slotProps.data.status), getStatusClass(slotProps.data.status)]" v-tooltip.top="getStatusLabel(slotProps.data.status)"></i>
                        <span :class="['status-label', getStatusClass(slotProps.data.status)]">
                            {{ getStatusLabel(slotProps.data.status) }}
                        </span>
                    </div>

                    <!-- Usuario de la última acción -->
                    <div v-if="getLastUserAction(slotProps.data)" class="last-action-user">
                        <i class="pi pi-user"></i>
                        <span>{{ getLastUserAction(slotProps.data).name }}</span>
                    </div>

                    <!-- Indicador de bonificaciones -->
                    <div v-if="getTotalBonusQuantity(slotProps.data) > 0" class="bonus-indicator">
                        <i class="pi pi-gift"></i>
                        <span>{{ getTotalBonusQuantity(slotProps.data) }} bonus</span>
                    </div>

                    <!-- Botón para ver timeline completo -->
                    <Button icon="pi pi-history" text size="small" severity="info" @click.stop="openTrackingDialog(slotProps.data)" v-tooltip.top="'Ver timeline completo'" class="tracking-btn" />
                </div>
            </template>
        </Column>
        <Column header="Acciones" style="width: 16rem">
            <template #body="slotProps">
                <div class="actions-container">
                    <!-- Acciones principales -->
                    <div class="primary-actions">
                        <Button icon="pi pi-eye" severity="help" text rounded size="small" @click.stop="openItemsDialog(slotProps.data)" v-tooltip.top="'Ver detalles de la orden'" class="action-btn view-btn" />
                        <Button icon="pi pi-print" severity="info" text rounded size="small" @click.stop="printOrder(slotProps.data)" v-tooltip.top="'Imprimir orden de compra'" class="action-btn print-btn" />
                    </div>

                    <!-- Acciones condicionales por estado -->
                    <div class="conditional-actions">
                        <!-- Estado PENDIENTE -->
                        <template v-if="slotProps.data.status === 'PENDIENTE'">
                            <Button icon="pi pi-pencil" severity="warning" text rounded size="small" @click.stop="emit('edit', slotProps.data)" v-tooltip.top="'Editar orden'" class="action-btn edit-btn" />
                            <Button icon="pi pi-check" severity="success" text rounded size="small" @click.stop="emit('approve-order', slotProps.data)" v-tooltip.top="'Aprobar orden'" class="action-btn approve-btn" />
                            <Button icon="pi pi-times-circle" severity="danger" text rounded size="small" @click.stop="emit('cancel-order', slotProps.data)" v-tooltip.top="'Cancelar orden'" class="action-btn cancel-btn" />
                        </template>

                        <!-- Estado APROBADO -->
                        <template v-else-if="slotProps.data.status === 'APROBADO'">
                            <Button icon="pi pi-check-square" severity="success" text rounded size="small" @click.stop="emit('receive-order', slotProps.data)" v-tooltip.top="'Marcar como recibida'" class="action-btn receive-btn" />
                            <Button icon="pi pi-times-circle" severity="danger" text rounded size="small" @click.stop="emit('cancel-order', slotProps.data)" v-tooltip.top="'Cancelar orden'" class="action-btn cancel-btn" />
                        </template>

                        <!-- Estado RECIBIDO -->
                        <template v-else-if="slotProps.data.status === 'RECIBIDO'">
                            <Button
                                v-if="canManageBonuses(slotProps.data)"
                                icon="pi pi-gift"
                                severity="secondary"
                                text
                                rounded
                                size="small"
                                @click.stop="emit('manage-bonuses', slotProps.data)"
                                v-tooltip.top="'Gestionar bonificaciones'"
                                class="action-btn bonus-btn"
                            />
                            <span v-else class="time-restriction-notice" v-tooltip.top="'Las bonificaciones solo pueden gestionarse el mismo día de recepción'">
                                <i class="pi pi-clock text-gray-400"></i>
                            </span>
                        </template>

                        <!-- Estados finales (sin acciones adicionales) -->
                        <template v-else>
                            <span class="no-actions-text">Sin acciones disponibles</span>
                        </template>
                    </div>
                </div>
            </template>
        </Column>

        <!-- Dialog minimalista para items de la orden -->
        <Dialog v-model:visible="showItemsDialog" :modal="true" :closable="true" :style="{ width: '90vw', maxWidth: '900px' }" class="items-dialog" @hide="closeItemsDialog">
            <template #header>
                <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Orden #{{ selectedOrderNumber }}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ getRegularItemsCount() }} items
                            <span v-if="getBonusItemsCount() > 0" class="ml-2 text-orange-600 dark:text-orange-400">• {{ getBonusItemsCount() }} bonificaciones</span>
                            • {{ formatCurrency(getTotalAmount()) }}
                        </p>
                    </div>
                </div>
            </template>

            <template #default>
                <div class="p-0">
                    <DataTable
                        :value="selectedOrderItems"
                        responsiveLayout="scroll"
                        paginator
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        :rows="20"
                        :rowsPerPageOptions="[10, 20, 50]"
                        currentPageReportTemplate="{first}-{last} de {totalRecords}"
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        class="border-0"
                        size="small"
                    >
                        <!-- Producto -->
                        <Column header="Producto" :style="{ minWidth: '280px' }" frozen>
                            <template #body="slotProps">
                                <div class="flex items-center gap-3 py-1">
                                    <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <img :src="slotProps.data.product?.image_url || '/placeholder-product.png'" :alt="slotProps.data.product?.name || 'Producto'" class="w-full h-full object-cover" @error="handleImageError" />
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="font-medium text-gray-900 dark:text-white text-sm truncate flex items-center gap-2">
                                            {{ slotProps.data.product?.name }}
                                            <span v-if="slotProps.data.is_bonus" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                                <i class="pi pi-gift text-xs"></i>
                                                Bonificación
                                            </span>
                                        </div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            {{ slotProps.data.product?.sku }}
                                            <span v-if="slotProps.data.product?.brand" class="ml-2">• {{ slotProps.data.product.brand }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <!-- Cantidad -->
                        <Column field="quantity" header="Cant." :style="{ width: '80px' }" sortable>
                            <template #body="slotProps">
                                <div class="text-center font-medium" :class="slotProps.data.is_bonus ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'">
                                    {{ Math.trunc(slotProps.data.quantity) }}
                                </div>
                            </template>
                        </Column>

                        <!-- Precio unitario -->
                        <Column field="unit_price" header="Precio" :style="{ width: '100px' }" sortable>
                            <template #body="slotProps">
                                <div class="text-right font-mono text-sm" :class="slotProps.data.is_bonus ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'">
                                    <span v-if="slotProps.data.is_bonus">GRATIS</span>
                                    <span v-else>{{ formatCurrency(slotProps.data.unit_price) }}</span>
                                </div>
                            </template>
                        </Column>

                        <!-- Subtotal -->
                        <Column field="total_amount" header="Total" :style="{ width: '100px' }" sortable>
                            <template #body="slotProps">
                                <div class="text-right font-mono text-sm font-semibold" :class="slotProps.data.is_bonus ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'">
                                    <span v-if="slotProps.data.is_bonus">GRATIS</span>
                                    <span v-else>{{ formatCurrency(slotProps.data.total_amount) }}</span>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </template>

            <template #footer>
                <div class="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            {{ getRegularItemsCount() }} items
                            <span v-if="getBonusItemsCount() > 0" class="ml-2 text-orange-600 dark:text-orange-400">+ {{ getBonusItemsCount() }} bonificaciones</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-lg font-semibold text-gray-900 dark:text-white font-mono">
                                {{ formatCurrency(getTotalAmount()) }}
                            </div>
                            <Button label="Cerrar" @click="closeItemsDialog" size="small" autofocus />
                        </div>
                    </div>
                </div>
            </template>
        </Dialog>
    </DataTable>
    <PrintOrderDialog v-if="showPrintDialog" :order="orderToPrint" @close="showPrintDialog = false" />

    <!-- Dialog de Timeline de Seguimiento -->
    <Dialog v-model:visible="showTrackingDialog" :style="{ width: '800px' }" header="Seguimiento de Orden" :modal="true" class="timeline-dialog" @hide="closeTrackingDialog">
        <template #header>
            <div class="dialog-header">
                <h3 class="dialog-title">
                    <i class="pi pi-history"></i>
                    Seguimiento de Orden #{{ selectedOrderTracking?.order_number }}
                </h3>
                <div class="order-summary">
                    <span class="provider-name">{{ selectedOrderTracking?.provider?.name }}</span>
                    <span class="order-total">{{ formatCurrency(selectedOrderTracking?.total_amount) }}</span>
                </div>
            </div>
        </template>

        <PurchaseOrderTimeline v-if="selectedOrderTracking" :status-timeline="selectedOrderTracking.status_timeline || []" :status-tracking="selectedOrderTracking.status_tracking || {}" :current-status="selectedOrderTracking.status" />

        <template #footer>
            <Button label="Cerrar" icon="pi pi-times" @click="closeTrackingDialog" autofocus />
        </template>
    </Dialog>
</template>

<style scoped>
/* Encabezado de la tabla mejorado */
.table-header {
    @apply relative overflow-hidden mb-0 rounded-t-2xl;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    padding: 1.5rem 2rem;
}

/* Fondo decorativo */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size:
        40px 40px,
        25px 25px;
    animation: pattern-drift 25s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

/* Sección de búsqueda mejorada */
.search-section {
    @apply flex-1 max-w-md;
}

.search-container {
    @apply relative;
}

.search-input {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white rounded-xl px-4 py-3 font-medium transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
    @apply bg-white/30 border-white/50 ring-2 ring-white/20;
    transform: translateY(-1px);
}

.search-input::placeholder {
    @apply text-white/70;
}

/* Icono de búsqueda */
:deep(.search-container .p-icon-field .p-input-icon) {
    @apply text-white/80;
}

/* Estados de tabla vacía y carga mejorados */
.empty-table-state {
    @apply text-center py-16 px-8;
}

.empty-icon {
    @apply mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center;
}

.empty-icon i {
    @apply text-3xl text-gray-400 dark:text-gray-500;
}

.empty-title {
    @apply text-xl font-bold text-gray-700 dark:text-gray-300 mb-2;
}

.empty-description {
    @apply text-gray-500 dark:text-gray-400 mb-6;
}

.loading-table-state {
    @apply text-center py-16 px-8;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

/* Animación del patrón */
@keyframes pattern-drift {
    0% {
        background-position:
            0% 0%,
            0% 0%;
    }
    100% {
        background-position:
            100% 100%,
            -100% -100%;
    }
}

/* Tema principal de la tabla mejorado */
:deep(.green-theme) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.green-theme .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

/* Encabezado de las columnas de la tabla */
:deep(.green-theme .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-green-600 text-white font-bold text-sm py-4 px-3 border-none text-center;
}

/* Cuerpo de la tabla */
:deep(.green-theme .p-datatable-tbody > tr > td) {
    @apply py-4 px-3 align-middle border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

/* Estilo para filas pares */
:deep(.green-theme .p-datatable-tbody > tr:nth-child(even) > td) {
    @apply bg-gray-50 dark:bg-gray-700/50;
}

/* Efecto hover en las filas */
:deep(.green-theme .p-datatable-tbody > tr:hover > td) {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800;
}

/* Paginador */
:deep(.green-theme .p-paginator) {
    @apply bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    @apply text-green-600 border border-green-600 font-semibold rounded-xl mx-1 w-10 h-10 transition-colors;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    @apply bg-green-600 text-white;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    @apply bg-green-50 dark:bg-green-900/30 border-green-700;
}

:deep(.green-theme .p-paginator .p-dropdown) {
    @apply border-green-600 font-medium rounded-xl;
}

/* Mensaje de tabla vacía */
:deep(.green-theme .p-datatable-emptymessage) {
    @apply bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-12 font-medium rounded-xl m-6 border-2 border-dashed border-gray-300 dark:border-gray-600;
}

/* Contenedor de estado centrado */
.status-container {
    @apply flex flex-col items-center justify-center gap-1;
}

/* Estados de estado (mantener estilos originales) */
.status-icon {
    width: 2em;
    height: 2em;
    font-size: 1.15em;
    border-radius: 50%;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.06);
    cursor: help;
    background: inherit;
    transition: box-shadow 0.2s;
}

.status-icon:hover {
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.13);
}

/* Label de estado */
.status-label {
    font-size: 0.8rem;
    font-weight: 500;
    text-align: center;
    font-style: italic;
    letter-spacing: 0.02em;
    text-transform: lowercase;
    min-width: 70px;
    border: none;
    padding: 0;
    margin: 0;
    background: none !important;
}

/* Estilos por estado - Iconos */
.status-pending {
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.status-approved {
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
}

.status-received {
    background: linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%);
}

.status-cancelled {
    background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.status-rejected {
    background: linear-gradient(90deg, #6b7280 0%, #9ca3af 100%);
}

.status-default {
    background: #64748b;
}

/* Estilos por estado - Labels */
.status-label.status-pending {
    color: #f59e0b;
}

.status-label.status-approved {
    color: #10b981;
}

.status-label.status-received {
    color: #06b6d4;
}

.status-label.status-cancelled {
    color: #ef4444;
}

.status-label.status-rejected {
    color: #6b7280;
}

.status-label.status-default {
    color: #64748b;
}

/* Estilos para las acciones organizadas */
.actions-container {
    @apply flex flex-col gap-2;
}

.primary-actions {
    @apply flex gap-1 justify-center;
}

.conditional-actions {
    @apply flex gap-1 justify-center flex-wrap;
}

.action-btn {
    @apply transition-all duration-200 hover:scale-105;
}

.view-btn:hover {
    @apply bg-purple-50 dark:bg-purple-900/20;
}

.print-btn:hover {
    @apply bg-blue-50 dark:bg-blue-900/20;
}

.edit-btn:hover {
    @apply bg-orange-50 dark:bg-orange-900/20;
}

.approve-btn:hover {
    @apply bg-green-50 dark:bg-green-900/20;
}

.receive-btn:hover {
    @apply bg-emerald-50 dark:bg-emerald-900/20;
}

.cancel-btn:hover {
    @apply bg-red-50 dark:bg-red-900/20;
}

.bonus-btn:hover {
    @apply bg-orange-50 dark:bg-orange-900/20;
}

.no-actions-text {
    @apply text-xs text-gray-400 dark:text-gray-500 italic text-center py-2;
}

.time-restriction-notice {
    @apply inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-help;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    .table-header {
        @apply p-4;
    }

    .header-content {
        @apply flex-col gap-4;
    }

    .search-section {
        @apply max-w-none w-full;
    }

    .search-input {
        @apply w-full;
    }

    :deep(.green-theme .p-datatable-thead > tr > th),
    :deep(.green-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
    }
}

@media (max-width: 480px) {
    .table-header {
        @apply p-3;
    }

    .search-input {
        @apply py-2.5 text-sm;
    }
}

/* Estilos para la columna order_number */
.order-number-cell {
    @apply flex flex-col items-center gap-1;
}

.order-badge {
    @apply font-bold;
}

.order-id {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

/* Estilos para la nueva columna de tracking */
.tracking-info {
    @apply space-y-2;
}

.last-action-user {
    @apply flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400;
}

.last-action-user i {
    @apply text-xs;
}

.bonus-indicator {
    @apply flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium;
}

.bonus-indicator i {
    @apply text-xs;
}

.tracking-btn {
    @apply mt-1;
}

/* Estilos para el diálogo de timeline */
.timeline-dialog .dialog-header {
    @apply flex flex-col gap-2;
}

.dialog-title {
    @apply text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2;
}

.order-summary {
    @apply flex justify-between items-center text-sm;
}

.provider-name {
    @apply text-gray-600 dark:text-gray-400;
}

.order-total {
    @apply font-semibold text-green-600 dark:text-green-400;
}

/* Estilos mínimos para el diálogo - usando Tailwind */
:deep(.items-dialog .p-dialog-header) {
    padding: 0;
    border: none;
}

:deep(.items-dialog .p-dialog-content) {
    padding: 0;
}

:deep(.items-dialog .p-dialog-footer) {
    padding: 0;
    border: none;
}

:deep(.timeline-dialog .p-dialog-content) {
    @apply p-0;
}
</style>
