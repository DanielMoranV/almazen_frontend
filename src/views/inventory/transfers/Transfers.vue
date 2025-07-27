<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const transfers = ref([]);
const searchQuery = ref('');
const statusFilter = ref(null);
const dateRange = ref([null, null]);
const displayTransferDialog = ref(false);

// Opciones de estado para filtrar
const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: 'pending' },
    { label: 'En tránsito', value: 'in_transit' },
    { label: 'Completada', value: 'completed' },
    { label: 'Cancelada', value: 'cancelled' }
];

// Opciones de almacenes
const warehouseOptions = [
    { label: 'Almacén Principal', value: 1 },
    { label: 'Almacén Secundario', value: 2 },
    { label: 'Tienda', value: 3 }
];

// Formulario para nueva transferencia
const transferForm = ref({
    sourceWarehouse: null,
    destinationWarehouse: null,
    transferDate: new Date().toISOString().slice(0, 10),
    notes: '',
    items: []
});

// Datos de ejemplo para las transferencias
const mockTransfers = [
    {
        id: 'TR-001',
        sourceWarehouse: 'Almacén Principal',
        destinationWarehouse: 'Tienda',
        date: '2025-06-01',
        expectedDate: '2025-06-03',
        completedDate: null,
        items: 5,
        totalQuantity: 25,
        status: 'in_transit',
        createdBy: 'Juan Pérez'
    },
    {
        id: 'TR-002',
        sourceWarehouse: 'Almacén Principal',
        destinationWarehouse: 'Almacén Secundario',
        date: '2025-05-28',
        expectedDate: '2025-05-30',
        completedDate: '2025-05-30',
        items: 8,
        totalQuantity: 40,
        status: 'completed',
        createdBy: 'María González'
    },
    {
        id: 'TR-003',
        sourceWarehouse: 'Almacén Secundario',
        destinationWarehouse: 'Tienda',
        date: '2025-06-02',
        expectedDate: '2025-06-04',
        completedDate: null,
        items: 3,
        totalQuantity: 15,
        status: 'pending',
        createdBy: 'Carlos Rodríguez'
    },
    {
        id: 'TR-004',
        sourceWarehouse: 'Tienda',
        destinationWarehouse: 'Almacén Principal',
        date: '2025-05-25',
        expectedDate: '2025-05-27',
        completedDate: null,
        items: 2,
        totalQuantity: 10,
        status: 'cancelled',
        createdBy: 'Ana Martínez'
    },
    {
        id: 'TR-005',
        sourceWarehouse: 'Almacén Principal',
        destinationWarehouse: 'Tienda',
        date: '2025-06-02',
        expectedDate: '2025-06-05',
        completedDate: null,
        items: 6,
        totalQuantity: 30,
        status: 'pending',
        createdBy: 'Juan Pérez'
    }
];

onMounted(() => {
    loadTransfers();
});

const loadTransfers = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        transfers.value = mockTransfers;
        loading.value = false;
    }, 500);
};

const openNewTransferDialog = () => {
    transferForm.value = {
        sourceWarehouse: null,
        destinationWarehouse: null,
        transferDate: new Date().toISOString().slice(0, 10),
        notes: '',
        items: []
    };
    displayTransferDialog.value = true;
};

const createTransfer = () => {
    if (!transferForm.value.sourceWarehouse || !transferForm.value.destinationWarehouse) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Debe seleccionar almacén de origen y destino',
            life: 3000
        });
        return;
    }

    if (transferForm.value.sourceWarehouse === transferForm.value.destinationWarehouse) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'El almacén de origen y destino no pueden ser el mismo',
            life: 3000
        });
        return;
    }

    // Aquí se redireccionaría a la página de creación de transferencia con los datos del formulario
    router.push({
        path: '/inventory/transfers/new',
        query: {
            source: transferForm.value.sourceWarehouse,
            destination: transferForm.value.destinationWarehouse,
            date: transferForm.value.transferDate
        }
    });

    displayTransferDialog.value = false;
};

const viewTransferDetails = (transfer) => {
    // Navegar a la página de detalles de la transferencia
    router.push(`/inventory/transfers/${transfer.id}`);
};

const completeTransfer = (transfer, event) => {
    event.stopPropagation();

    if (transfer.status !== 'in_transit') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden completar transferencias en tránsito',
            life: 3000
        });
        return;
    }

    loading.value = true;

    // Simulación de completar transferencia
    setTimeout(() => {
        const index = transfers.value.findIndex((t) => t.id === transfer.id);
        if (index !== -1) {
            transfers.value[index].status = 'completed';
            transfers.value[index].completedDate = new Date().toISOString().slice(0, 10);
        }

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Transferencia ${transfer.id} completada correctamente`,
            life: 3000
        });

        loading.value = false;
    }, 1000);
};

const cancelTransfer = (transfer, event) => {
    event.stopPropagation();

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se puede cancelar una transferencia completada o ya cancelada',
            life: 3000
        });
        return;
    }

    loading.value = true;

    // Simulación de cancelar transferencia
    setTimeout(() => {
        const index = transfers.value.findIndex((t) => t.id === transfer.id);
        if (index !== -1) {
            transfers.value[index].status = 'cancelled';
        }

        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Transferencia ${transfer.id} cancelada correctamente`,
            life: 3000
        });

        loading.value = false;
    }, 1000);
};

const filteredTransfers = computed(() => {
    let result = transfers.value;

    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(
            (transfer) => transfer.id.toLowerCase().includes(query) || transfer.sourceWarehouse.toLowerCase().includes(query) || transfer.destinationWarehouse.toLowerCase().includes(query) || transfer.createdBy.toLowerCase().includes(query)
        );
    }

    // Filtrar por estado
    if (statusFilter.value) {
        result = result.filter((transfer) => transfer.status === statusFilter.value);
    }

    // Filtrar por rango de fechas
    if (dateRange.value[0] && dateRange.value[1]) {
        const startDate = new Date(dateRange.value[0]);
        const endDate = new Date(dateRange.value[1]);

        result = result.filter((transfer) => {
            const transferDate = new Date(transfer.date);
            return transferDate >= startDate && transferDate <= endDate;
        });
    }

    return result;
});

const getStatusClass = (status) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-700';
        case 'in_transit':
            return 'bg-blue-100 text-blue-700';
        case 'completed':
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
        case 'in_transit':
            return 'En tránsito';
        case 'completed':
            return 'Completada';
        case 'cancelled':
            return 'Cancelada';
        default:
            return status;
    }
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
                    <h5 class="m-0">Transferencias de Inventario</h5>
                    <div class="mt-3 md:mt-0">
                        <button class="p-button p-component" @click="openNewTransferDialog">
                            <i class="pi pi-plus mr-2"></i>
                            <span class="p-button-label">Nueva Transferencia</span>
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

                <div v-else-if="filteredTransfers.length === 0" class="text-center p-5">
                    <i class="pi pi-arrows-h text-4xl text-500 mb-3"></i>
                    <p>No hay transferencias que coincidan con los filtros</p>
                </div>

                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border"># Transferencia</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Origen</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Destino</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Fecha Esperada</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Items</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Cantidad</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="transfer in filteredTransfers" :key="transfer.id" class="cursor-pointer hover:surface-200" @click="viewTransferDetails(transfer)">
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ transfer.id }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ transfer.sourceWarehouse }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ transfer.destinationWarehouse }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ transfer.date }}
                                </td>
                                <td class="p-3 border-bottom-1 surface-border">
                                    {{ transfer.expectedDate }}
                                </td>
                                <td class="text-right p-3 border-bottom-1 surface-border">
                                    {{ transfer.items }}
                                </td>
                                <td class="text-right p-3 border-bottom-1 surface-border">
                                    {{ transfer.totalQuantity }}
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(transfer.status)">
                                        {{ getStatusLabel(transfer.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewTransferDetails(transfer)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button
                                            class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2"
                                            :class="{
                                                'p-button-success': transfer.status === 'in_transit'
                                            }"
                                            @click.stop="completeTransfer(transfer, $event)"
                                            :disabled="transfer.status !== 'in_transit'"
                                        >
                                            <i class="pi pi-check-square"></i>
                                        </button>
                                        <button
                                            class="p-button p-component p-button-icon-only p-button-rounded p-button-text"
                                            :class="{
                                                'p-button-danger': transfer.status !== 'completed' && transfer.status !== 'cancelled'
                                            }"
                                            @click.stop="cancelTransfer(transfer, $event)"
                                            :disabled="transfer.status === 'completed' || transfer.status === 'cancelled'"
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

        <!-- Diálogo de Nueva Transferencia -->
        <div v-if="displayTransferDialog" class="fixed top-0 left-0 w-full h-full flex justify-content-center align-items-center bg-black-alpha-40" style="z-index: 1000">
            <div class="surface-card p-4 shadow-2 border-round w-full md:w-6">
                <div class="flex justify-content-between align-items-center mb-4">
                    <h5 class="m-0">Nueva Transferencia</h5>
                    <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click="displayTransferDialog = false">
                        <i class="pi pi-times"></i>
                    </button>
                </div>

                <div class="grid formgrid">
                    <div class="field col-12 md:col-6 mb-4">
                        <label for="source-warehouse" class="block mb-2">Almacén de Origen*</label>
                        <select id="source-warehouse" v-model="transferForm.sourceWarehouse" class="p-inputtext p-component w-full">
                            <option v-for="option in warehouseOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="field col-12 md:col-6 mb-4">
                        <label for="destination-warehouse" class="block mb-2">Almacén de Destino*</label>
                        <select id="destination-warehouse" v-model="transferForm.destinationWarehouse" class="p-inputtext p-component w-full">
                            <option v-for="option in warehouseOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>

                    <div class="field col-12 mb-4">
                        <label for="transfer-date" class="block mb-2">Fecha de Transferencia</label>
                        <input id="transfer-date" type="date" v-model="transferForm.transferDate" class="p-inputtext p-component w-full" />
                    </div>

                    <div class="field col-12 mb-4">
                        <label for="notes" class="block mb-2">Notas</label>
                        <textarea id="notes" v-model="transferForm.notes" rows="3" class="p-inputtextarea p-component w-full" placeholder="Ingrese notas o comentarios sobre esta transferencia..."></textarea>
                    </div>
                </div>

                <div class="flex justify-content-end">
                    <button class="p-button p-component p-button-secondary mr-2" @click="displayTransferDialog = false">
                        <span class="p-button-label">Cancelar</span>
                    </button>
                    <button class="p-button p-component" @click="createTransfer">
                        <span class="p-button-label">Continuar</span>
                    </button>
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
