<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const purchaseOrders = ref([]);
const searchQuery = ref('');
const statusFilter = ref(null);
const dateRange = ref([null, null]);

// Opciones de estado para filtrar
const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Aprobada', value: 'approved' },
    { label: 'Recibida', value: 'received' },
    { label: 'Cancelada', value: 'cancelled' }
];

// Datos de ejemplo para las órdenes de compra
const mockPurchaseOrders = [
    {
        id: 'OC-001',
        supplier: 'Proveedor Principal S.A.',
        date: '2025-06-01',
        expectedDate: '2025-06-10',
        total: 12500,
        status: 'pending',
        items: 15
    },
    {
        id: 'OC-002',
        supplier: 'Distribuidora Mayorista',
        date: '2025-05-28',
        expectedDate: '2025-06-08',
        total: 8700,
        status: 'approved',
        items: 8
    },
    {
        id: 'OC-003',
        supplier: 'Importadora Internacional',
        date: '2025-05-25',
        expectedDate: '2025-06-15',
        total: 24300,
        status: 'received',
        items: 12
    },
    {
        id: 'OC-004',
        supplier: 'Fabricante Local',
        date: '2025-06-02',
        expectedDate: '2025-06-09',
        total: 5600,
        status: 'pending',
        items: 6
    },
    {
        id: 'OC-005',
        supplier: 'Suministros Industriales',
        date: '2025-05-20',
        expectedDate: '2025-05-30',
        total: 3200,
        status: 'cancelled',
        items: 4
    }
];

onMounted(() => {
    loadPurchaseOrders();
});

const loadPurchaseOrders = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        purchaseOrders.value = mockPurchaseOrders;
        loading.value = false;
    }, 500);
};

const createNewPurchaseOrder = () => {
    // Navegar a la página de creación de nueva orden de compra
    router.push('/purchases/orders/new');
};

const viewPurchaseOrderDetails = (order) => {
    // Navegar a la página de detalles de la orden de compra
    router.push(`/purchases/orders/${order.id}`);
};

const receiveOrder = (order, event) => {
    event.stopPropagation();
    
    if (order.status !== 'approved') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden recibir órdenes aprobadas',
            life: 3000
        });
        return;
    }
    
    loading.value = true;
    
    // Simulación de recepción de orden
    setTimeout(() => {
        const index = purchaseOrders.value.findIndex(o => o.id === order.id);
        if (index !== -1) {
            purchaseOrders.value[index].status = 'received';
        }
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Orden ${order.id} marcada como recibida`,
            life: 3000
        });
        
        loading.value = false;
    }, 1000);
};

const cancelOrder = (order, event) => {
    event.stopPropagation();
    
    if (order.status === 'received' || order.status === 'cancelled') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se puede cancelar una orden recibida o ya cancelada',
            life: 3000
        });
        return;
    }
    
    loading.value = true;
    
    // Simulación de cancelación de orden
    setTimeout(() => {
        const index = purchaseOrders.value.findIndex(o => o.id === order.id);
        if (index !== -1) {
            purchaseOrders.value[index].status = 'cancelled';
        }
        
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Orden ${order.id} cancelada correctamente`,
            life: 3000
        });
        
        loading.value = false;
    }, 1000);
};

const filteredPurchaseOrders = computed(() => {
    let result = purchaseOrders.value;
    
    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(order => 
            order.id.toLowerCase().includes(query) || 
            order.supplier.toLowerCase().includes(query)
        );
    }
    
    // Filtrar por estado
    if (statusFilter.value) {
        result = result.filter(order => order.status === statusFilter.value);
    }
    
    // Filtrar por rango de fechas
    if (dateRange.value[0] && dateRange.value[1]) {
        const startDate = new Date(dateRange.value[0]);
        const endDate = new Date(dateRange.value[1]);
        
        result = result.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }
    
    return result;
});

const getStatusClass = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-700';
        case 'approved':
            return 'bg-blue-100 text-blue-700';
        case 'received':
            return 'bg-green-100 text-green-700';
        case 'cancelled':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'pending':
            return 'Pendiente';
        case 'approved':
            return 'Aprobada';
        case 'received':
            return 'Recibida';
        case 'cancelled':
            return 'Cancelada';
        default:
            return status;
    }
};

const formatCurrency = (value) => {
    return value ? `$${value.toLocaleString()}` : '-';
};

const clearFilters = () => {
    searchQuery.value = '';
    statusFilter.value = null;
    dateRange.value = [null, null];
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Órdenes de Compra</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="createNewPurchaseOrder">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nueva Orden</span>
                        </button>
                    </div>
                </div>
                
                <div class="grid mt-4">
                    <div class="col-12 md:col-4 mb-3">
                        <div class="p-input-icon-left w-full">
                            <i class="pi pi-search"></i>
                            <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar..." />
                        </div>
                    </div>
                    
                    <div class="col-6 md:col-3 mb-3">
                        <label for="status-filter" class="block mb-2">Estado</label>
                        <select id="status-filter" v-model="statusFilter" class="p-inputtext p-component w-full">
                            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="col-6 md:col-4 mb-3">
                        <label class="block mb-2">Rango de Fechas</label>
                        <div class="flex">
                            <input type="date" v-model="dateRange[0]" class="p-inputtext p-component w-full mr-2" />
                            <input type="date" v-model="dateRange[1]" class="p-inputtext p-component w-full" />
                        </div>
                    </div>
                    
                    <div class="col-12 md:col-1 mb-3 flex align-items-end">
                        <button class="p-button p-component p-button-outlined w-full" @click="clearFilters">
                            <i class="pi pi-filter-slash"></i>
                        </button>
                    </div>
                </div>
                
                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                
                <div v-else-if="filteredPurchaseOrders.length === 0" class="text-center p-5">
                    <i class="pi pi-shopping-bag text-4xl text-500 mb-3"></i>
                    <p>No hay órdenes de compra que coincidan con los filtros</p>
                </div>
                
                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Orden</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Proveedor</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha Esperada</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Items</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Total</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in filteredPurchaseOrders" :key="order.id" class="cursor-pointer hover:surface-200" @click="viewPurchaseOrderDetails(order)">
                                <td class="p-3 border-bottom-1 surface-border">{{ order.id }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ order.supplier }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ order.date }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ order.expectedDate }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ order.items }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(order.total) }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(order.status)">
                                        {{ getStatusLabel(order.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewPurchaseOrderDetails(order)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button 
                                            class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2"
                                            :class="{'p-button-success': order.status === 'approved'}"
                                            @click.stop="receiveOrder(order, $event)"
                                            :disabled="order.status !== 'approved'"
                                        >
                                            <i class="pi pi-check-square"></i>
                                        </button>
                                        <button 
                                            class="p-button p-component p-button-icon-only p-button-rounded p-button-text"
                                            :class="{'p-button-danger': order.status !== 'received' && order.status !== 'cancelled'}"
                                            @click.stop="cancelOrder(order, $event)"
                                            :disabled="order.status === 'received' || order.status === 'cancelled'"
                                        >
                                            <i class="pi pi-times-circle"></i>
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
