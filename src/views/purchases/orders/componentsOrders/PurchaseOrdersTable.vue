<script setup>
import { ref, computed, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

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
    { name: 'Pendiente', value: 'pending' },
    { name: 'Aprobado', value: 'approved' },
    { name: 'Rechazado', value: 'rejected' },
    { name: 'Recibido', value: 'received' },
    { name: 'Cancelado', value: 'cancelled' }
]);

const formatCurrency = (value) => {
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
        case 'pending':
            return 'warning';
        case 'approved':
            return 'success';
        case 'rejected':
            return 'danger';
        case 'received':
            return 'info';
        case 'cancelled':
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

        <Column field="items" header="Items" sortable>
            <template #body="slotProps">
                <Badge :value="slotProps.data.items" severity="secondary" />
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
        <Column field="user.name" header="Creado por" sortable />
        <Column field="status" header="Estado" sortable>
            <template #body="slotProps">
                <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getSeverity(slotProps.data.status)" />
            </template>
        </Column>
        <Column header="Acciones" style="width: 12rem">
            <template #body="slotProps">
                <div class="flex gap-2">
                    <Button icon="pi pi-eye" severity="info" text rounded @click.stop="emit('view-details', slotProps.data)" v-tooltip.top="'Ver detalles'" />
                    <Button icon="pi pi-check-square" severity="success" text rounded @click.stop="emit('receive-order', slotProps.data)" :disabled="slotProps.data.status !== 'approved'" v-tooltip.top="'Marcar como recibida'" />
                    <Button
                        icon="pi pi-times-circle"
                        severity="danger"
                        text
                        rounded
                        @click.stop="emit('cancel-order', slotProps.data)"
                        :disabled="slotProps.data.status === 'received' || slotProps.data.status === 'cancelled'"
                        v-tooltip.top="'Cancelar orden'"
                    />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
/* Puedes agregar estilos específicos de la tabla aquí si es necesario */
</style>
