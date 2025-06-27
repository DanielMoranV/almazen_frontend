<script setup>
import { ref, computed, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import PrintOrderDialog from './PrintOrderDialog.vue';

// --- Estados y métodos para Dialog de items ---
const showItemsDialog = ref(false);
const selectedOrderItems = ref([]);
const selectedOrderId = ref(null);

function openItemsDialog(order) {
    selectedOrderItems.value = order.details || [];
    selectedOrderId.value = order.id;
    showItemsDialog.value = true;
}

function closeItemsDialog() {
    showItemsDialog.value = false;
    selectedOrderItems.value = [];
    selectedOrderId.value = null;
}
// --- Fin Dialog ---

const props = defineProps({
    purchaseOrders: { type: Array, required: true },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['view-details', 'receive-order', 'cancel-order', 'approve-order', 'update:selection', 'edit', 'delete']);

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
    if (isNaN(value)) return '-';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
};

const formatDate = (value) => {
    return new Intl.DateTimeFormat('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
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
                                <InputIcon class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Buscar por ID, proveedor, comprobante..." class="search-input" v-tooltip.top="'Buscar en ID, proveedor, comprobante y usuario creador'" />
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
        <Column field="id" header="#" sortable>
            <template #body="slotProps">
                <Badge :value="slotProps.data.id" severity="info" />
            </template>
        </Column>
        <Column field="provider.name" header="Proveedor" sortable />
        <Column field="purchase_date" header="Fecha" sortable>
            <template #body="slotProps">
                <div class="flex align-items-center">
                    <i class="pi pi-calendar mr-2 text-400"></i>
                    {{ formatDate(slotProps.data.purchase_date) }}
                </div>
            </template>
        </Column>
        <Column field="document_number" header="Comprobante" sortable />

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
        <Column field="user.name" header="Creado por" sortable />
        <Column field="status" header="Estado" sortable>
            <template #body="slotProps">
                <div class="status-container">
                    <i :class="['status-icon', getStatusIcon(slotProps.data.status), getStatusClass(slotProps.data.status)]" v-tooltip.top="getStatusLabel(slotProps.data.status)"></i>
                    <span :class="['status-label', getStatusClass(slotProps.data.status)]">
                        {{ getStatusLabel(slotProps.data.status) }}
                    </span>
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

                        <!-- Estados finales (sin acciones adicionales) -->
                        <template v-else>
                            <span class="no-actions-text">Sin acciones disponibles</span>
                        </template>
                    </div>
                </div>
            </template>
        </Column>

        <!-- Dialog para mostrar los items de la orden seleccionada -->
        <Dialog v-model:visible="showItemsDialog" :modal="true" :closable="true" :header="`Items de la Orden #${selectedOrderId}`" :style="{ width: '900px' }" @hide="closeItemsDialog">
            <template #default>
                <DataTable
                    :value="selectedOrderItems"
                    stripedRows
                    responsiveLayout="scroll"
                    paginator
                    scrollable
                    scrollHeight="400px"
                    removableSort
                    dataKey="id"
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Productos"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    class="products-table p-datatable-gridlines"
                >
                    <Column field="product.image_url" header="Imagen" style="width: 60px">
                        <template #body="slotProps">
                            <img :src="slotProps.data.product?.image_url" alt="img" style="width: 40px; height: 40px; object-fit: contain" v-if="slotProps.data.product?.image_url" />
                        </template>
                    </Column>
                    <Column field="product.name" header="Producto" />
                    <Column field="product.sku" header="SKU" />
                    <Column field="product.brand" header="Marca" />
                    <Column field="product.presentation" header="Presentación" />
                    <Column field="quantity" header="Cantidad">
                        <template #body="slotProps">
                            {{ Math.trunc(slotProps.data.quantity) }}
                        </template>
                    </Column>
                    <Column field="unit_price" header="P. Unit.">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.unit_price) }}
                        </template>
                    </Column>
                    <Column field="total_amount" header="Subtotal">
                        <template #body="slotProps">
                            {{ formatCurrency(slotProps.data.total_amount) }}
                        </template>
                    </Column>
                </DataTable>
            </template>
        </Dialog>
    </DataTable>
    <PrintOrderDialog v-if="showPrintDialog" :order="orderToPrint" @close="showPrintDialog = false" />
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
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/70 rounded-xl px-4 py-3 font-medium transition-all duration-300;
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

.no-actions-text {
    @apply text-xs text-gray-400 dark:text-gray-500 italic text-center py-2;
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
</style>
