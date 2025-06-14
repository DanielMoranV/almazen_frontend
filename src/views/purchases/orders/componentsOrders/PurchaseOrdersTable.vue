<script setup>
import { ref, computed, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
// Asegúrate de que estos imports estén registrados globalmente o aquí si usas SFC
// import Dialog from 'primevue/dialog';
// import DataTable from 'primevue/datatable';
// import Column from 'primevue/column';

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

const emit = defineEmits(['view-details', 'receive-order', 'cancel-order', 'update:selection']);

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

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 4000 });
};

const showError = (summary) => {
    toast.add({ severity: 'error', summary, life: 4000 });
};
</script>

<template>
    <DataTable
        :value="purchaseOrders"
        :loading="loading"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} órdenes"
        responsiveLayout="scroll"
        :globalFilterFields="['id', 'supplier']"
        stripedRows
        removableSort
        class="p-datatable-gridlines"
    >
        <template #header>
            <div class="flex justify-content-between">
                <span class="text-xl text-900 font-bold">Lista de Órdenes de Compra</span>
            </div>
        </template>
        <template #empty>
            <div class="text-center p-5">
                <i class="pi pi-shopping-bag text-4xl text-400 mb-3"></i>
                <p class="text-600">No se encontraron órdenes de compra</p>
            </div>
        </template>
        <template #loading>
            <div class="text-center p-5">
                <ProgressSpinner />
                <p class="text-600 mt-3">Cargando órdenes...</p>
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
                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getSeverity(slotProps.data.status)" />
            </template>
        </Column>
        <Column header="Acciones" style="width: 13rem">
            <template #body="slotProps">
                <div class="flex gap-2">
                    <Button icon="pi pi-eye" severity="help" text rounded @click.stop="openItemsDialog(slotProps.data)" v-tooltip.top="'Ver items'" />
                    <Button
                        v-if="slotProps.data.status === 'PENDIENTE'"
                        icon="pi pi-check"
                        severity="info"
                        text
                        rounded
                        @click.stop="emit('approve-order', slotProps.data)"
                        v-tooltip.top="'Aprobar orden'"
                    />
                    <Button
                        v-if="slotProps.data.status === 'APROBADO'"
                        icon="pi pi-check-square"
                        severity="success"
                        text
                        rounded
                        @click.stop="emit('receive-order', slotProps.data)"
                        v-tooltip.top="'Marcar como recibida'"
                    />
                    <Button
                        icon="pi pi-times-circle"
                        severity="danger"
                        text
                        rounded
                        @click.stop="emit('cancel-order', slotProps.data)"
                        :disabled="slotProps.data.status === 'RECIBIDO'"
                        v-tooltip.top="'Anular orden'"
                    />
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
</template>

<style scoped>
/* Puedes agregar estilos específicos de la tabla aquí si es necesario */
</style>
