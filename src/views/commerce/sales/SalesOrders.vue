<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const orders = ref([]);
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    status: { value: null, matchMode: 'equals' }
});
const statuses = ref([
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Procesando', value: 'processing' },
    { label: 'Completado', value: 'completed' },
    { label: 'Cancelado', value: 'cancelled' }
]);

// Datos de ejemplo para las órdenes de venta
const mockOrders = [
    {
        id: 'SO-001',
        customer: 'Empresa ABC',
        date: '2025-06-01',
        total: 5600,
        status: 'completed',
        items: 8,
        paymentMethod: 'Transferencia'
    },
    {
        id: 'SO-002',
        customer: 'Distribuidora XYZ',
        date: '2025-06-01',
        total: 3200,
        status: 'processing',
        items: 5,
        paymentMethod: 'Crédito'
    },
    {
        id: 'SO-003',
        customer: 'Comercial 123',
        date: '2025-06-02',
        total: 1800,
        status: 'pending',
        items: 3,
        paymentMethod: 'Efectivo'
    },
    {
        id: 'SO-004',
        customer: 'Tienda Retail',
        date: '2025-06-02',
        total: 4500,
        status: 'completed',
        items: 6,
        paymentMethod: 'Transferencia'
    },
    {
        id: 'SO-005',
        customer: 'Cliente Final',
        date: '2025-06-02',
        total: 950,
        status: 'cancelled',
        items: 2,
        paymentMethod: 'Efectivo'
    }
];

onMounted(() => {
    loadOrders();
});

const loadOrders = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        orders.value = mockOrders;
        loading.value = false;
    }, 500);
};

const createNewOrder = () => {
    // Por ahora mostrar toast, luego se implementará la ruta
    toast.add({
        severity: 'info', 
        summary: 'Funcionalidad en Desarrollo', 
        detail: 'La creación de órdenes estará disponible pronto', 
        life: 3000
    });
};

const viewOrderDetails = (order) => {
    // Por ahora mostrar toast, luego se implementará la ruta
    toast.add({
        severity: 'info', 
        summary: 'Funcionalidad en Desarrollo', 
        detail: `Detalles de orden ${order.id} estarán disponibles pronto`, 
        life: 3000
    });
};

const getStatusClass = (status) => {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-700';
        case 'processing':
            return 'bg-blue-100 text-blue-700';
        case 'pending':
            return 'bg-yellow-100 text-yellow-700';
        case 'cancelled':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'completed':
            return 'Completado';
        case 'processing':
            return 'Procesando';
        case 'pending':
            return 'Pendiente';
        case 'cancelled':
            return 'Cancelado';
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
                    <h5 class="m-0">Órdenes de Venta</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="createNewOrder">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nueva Orden</span>
                        </button>
                    </div>
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
                
                <div v-else-if="orders.length === 0" class="text-center p-5">
                    <i class="pi pi-shopping-bag text-4xl text-500 mb-3"></i>
                    <p>No hay órdenes de venta registradas</p>
                </div>
                
                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Orden</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Cliente</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Items</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Total</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Método de Pago</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in orders" :key="order.id" class="cursor-pointer hover:surface-200" @click="viewOrderDetails(order)">
                                <td class="p-3 border-bottom-1 surface-border">{{ order.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ order.customer }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ order.date }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ order.items }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(order.total) }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ order.paymentMethod }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(order.status)">
                                        {{ getStatusLabel(order.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click.stop="viewOrderDetails(order)">
                                        <i class="pi pi-eye"></i>
                                    </button>
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
