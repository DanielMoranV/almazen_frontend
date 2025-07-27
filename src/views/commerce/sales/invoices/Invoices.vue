<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const invoices = ref([]);
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    status: { value: null, matchMode: 'equals' }
});
const statuses = ref([
    { label: 'Todos', value: null },
    { label: 'Pagada', value: 'paid' },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Vencida', value: 'overdue' },
    { label: 'Cancelada', value: 'cancelled' }
]);

// Datos de ejemplo para las facturas
const mockInvoices = [
    {
        id: 'INV-001',
        orderNumber: 'SO-001',
        customer: 'Empresa ABC',
        issueDate: '2025-06-01',
        dueDate: '2025-06-15',
        total: 5600,
        status: 'paid',
        paymentMethod: 'Transferencia'
    },
    {
        id: 'INV-002',
        orderNumber: 'SO-002',
        customer: 'Distribuidora XYZ',
        issueDate: '2025-06-01',
        dueDate: '2025-06-15',
        total: 3200,
        status: 'pending',
        paymentMethod: 'Crédito'
    },
    {
        id: 'INV-003',
        orderNumber: 'SO-003',
        customer: 'Comercial 123',
        issueDate: '2025-06-02',
        dueDate: '2025-06-16',
        total: 1800,
        status: 'pending',
        paymentMethod: 'Efectivo'
    },
    {
        id: 'INV-004',
        orderNumber: 'SO-004',
        customer: 'Tienda Retail',
        issueDate: '2025-06-02',
        dueDate: '2025-05-30',
        total: 4500,
        status: 'overdue',
        paymentMethod: 'Transferencia'
    },
    {
        id: 'INV-005',
        orderNumber: 'SO-005',
        customer: 'Cliente Final',
        issueDate: '2025-06-02',
        dueDate: '2025-06-16',
        total: 950,
        status: 'cancelled',
        paymentMethod: 'Efectivo'
    }
];

onMounted(() => {
    loadInvoices();
});

const loadInvoices = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        invoices.value = mockInvoices;
        loading.value = false;
    }, 500);
};

const viewInvoiceDetails = (invoice) => {
    // Navegar a la página de detalles de la factura
    router.push(`/invoices/${invoice.id}`);
};

const downloadInvoice = (invoice, event) => {
    event.stopPropagation();
    loading.value = true;

    // Simulación de descarga
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Factura ${invoice.id} descargada correctamente`,
            life: 3000
        });
        loading.value = false;
    }, 1000);
};

const sendInvoiceByEmail = (invoice, event) => {
    event.stopPropagation();
    loading.value = true;

    // Simulación de envío por correo
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Factura ${invoice.id} enviada por correo correctamente`,
            life: 3000
        });
        loading.value = false;
    }, 1000);
};

const getStatusClass = (status) => {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-700';
        case 'pending':
            return 'bg-yellow-100 text-yellow-700';
        case 'overdue':
            return 'bg-red-100 text-red-700';
        case 'cancelled':
            return 'bg-gray-100 text-gray-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'paid':
            return 'Pagada';
        case 'pending':
            return 'Pendiente';
        case 'overdue':
            return 'Vencida';
        case 'cancelled':
            return 'Cancelada';
        default:
            return status;
    }
};

const formatCurrency = (value) => {
    return value ? `$${value.toLocaleString()}` : '-';
};

const onStatusChange = (value) => {
    filters.value.status.value = value;
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Facturas</h5>
                </div>

                <div class="flex flex-column md:flex-row justify-content-between mt-4">
                    <div class="p-input-icon-left mb-3 md:mb-0 w-full md:w-4">
                        <i class="pi pi-search"></i>
                        <input type="text" v-model="filters.global.value" class="p-inputtext p-component w-full" placeholder="Buscar..." />
                    </div>

                    <div class="flex align-items-center">
                        <label for="status-filter" class="mr-2">Estado:</label>
                        <select id="status-filter" v-model="filters.status.value" class="p-inputtext p-component" @change="onStatusChange($event.target.value)">
                            <option v-for="status in statuses" :key="status.value" :value="status.value">
                                {{ status.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>

                <div v-else-if="invoices.length === 0" class="text-center p-5">
                    <i class="pi pi-file-pdf text-4xl text-500 mb-3"></i>
                    <p>No hay facturas registradas</p>
                </div>

                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Factura</th>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Orden</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Cliente</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha Emisión</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha Vencimiento</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Total</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="invoice in invoices" :key="invoice.id" class="cursor-pointer hover:surface-200" @click="viewInvoiceDetails(invoice)">
                                <td class="p-3 border-bottom-1 surface-border">{{ invoice.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ invoice.orderNumber }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ invoice.customer }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ invoice.issueDate }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ invoice.dueDate }}
                                </td>
                                <td class="text-right p-3 border-bottom-1 surface-border">
                                    {{ formatCurrency(invoice.total) }}
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(invoice.status)">
                                        {{ getStatusLabel(invoice.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewInvoiceDetails(invoice)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="downloadInvoice(invoice, $event)">
                                            <i class="pi pi-download"></i>
                                        </button>
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click.stop="sendInvoiceByEmail(invoice, $event)">
                                            <i class="pi pi-envelope"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.overflow-x-auto {
    overflow-x: auto;
}
</style>
