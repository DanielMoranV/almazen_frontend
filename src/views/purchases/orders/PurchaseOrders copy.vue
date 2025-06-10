<script setup>
import PurchaseOrdersTable from './componentsOrders/PurchaseOrdersTable.vue';
import PurchaseOrderStatistics from './componentsOrders/PurchaseOrderStatistics.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Chart from 'primevue/chart';
import PurchaseOrderFormDialog from './componentsOrders/PurchaseOrderFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { usePurchaseStore } from '@/stores/purchaseStore';

const toast = useToast();

const purchaseStore = usePurchaseStore();
const router = useRouter();
const loading = ref(false);
const purchaseOrders = ref([]);
const selectedOrders = ref([]);
const showPurchaseOrderDialog = ref(false);
const selectedOrder = ref(null);
const showDeleteDialog = ref(false);
const globalFilterValue = ref('');
const statusFilter = ref(null);
const dateRange = ref(null);
const showFilters = ref(false);
const exportColumns = ref([]);
const chartData = ref(null);
const chartOptions = ref(null);
const supplierFilter = ref(null);
const supplierOptions = ref([]);
const notificationCount = ref(2);
const showNotifications = ref(false);
const notifications = ref([
    { id: 1, title: 'Orden próxima a vencer', message: 'La orden OC-002 vence en 2 días', severity: 'warning', date: new Date() },
    { id: 2, title: 'Orden recibida', message: 'La orden OC-003 ha sido marcada como recibida', severity: 'success', date: new Date() }
]);

// Configuración de filtros para DataTable
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    supplier: { value: null, matchMode: FilterMatchMode.CONTAINS },
    date: { value: null, matchMode: FilterMatchMode.DATE_IS }
});

// Opciones de estado para filtrar
const statusOptions = [
    { label: 'Pendiente', value: 'pending', severity: 'warning' },
    { label: 'Aprobada', value: 'approved', severity: 'info' },
    { label: 'Recibida', value: 'received', severity: 'success' },
    { label: 'Cancelada', value: 'cancelled', severity: 'danger' }
];

// Datos de ejemplo para las órdenes de compra
const mockPurchaseOrders = [
    {
        id: 'OC-001',
        supplier: 'Proveedor Principal S.A.',
        date: new Date('2025-06-01'),
        expectedDate: new Date('2025-06-10'),
        total: 12500,
        status: 'pending',
        items: 15
    },
    {
        id: 'OC-002',
        supplier: 'Distribuidora Mayorista',
        date: new Date('2025-05-28'),
        expectedDate: new Date('2025-06-08'),
        total: 8700,
        status: 'approved',
        items: 8
    },
    {
        id: 'OC-003',
        supplier: 'Importadora Internacional',
        date: new Date('2025-05-25'),
        expectedDate: new Date('2025-06-15'),
        total: 24300,
        status: 'received',
        items: 12
    },
    {
        id: 'OC-004',
        supplier: 'Fabricante Local',
        date: new Date('2025-06-02'),
        expectedDate: new Date('2025-06-09'),
        total: 5600,
        status: 'pending',
        items: 6
    },
    {
        id: 'OC-005',
        supplier: 'Suministros Industriales',
        date: new Date('2025-05-20'),
        expectedDate: new Date('2025-05-30'),
        total: 3200,
        status: 'cancelled',
        items: 4
    }
];

onMounted(() => {
    loadPurchaseOrders();
    initChartData();
    initExportColumns();
    loadSupplierOptions();
});

const loadPurchaseOrders = () => {
    loading.value = true;
    setTimeout(() => {
        purchaseOrders.value = mockPurchaseOrders;
        loading.value = false;
    }, 500);
};

const createNewPurchaseOrder = () => {
    router.push('/purchases/orders/new');
};

const viewPurchaseOrderDetails = (order) => {
    router.push(`/purchases/orders/${order.id}`);
};

const receiveOrder = (order) => {
    if (order.status !== 'approved') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Solo se pueden recibir órdenes aprobadas',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: `¿Está seguro de marcar como recibida la orden ${order.id}?`,
        header: 'Confirmar Recepción',
        icon: 'pi pi-check-square',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Recibir',
        accept: () => {
            loading.value = true;

            setTimeout(() => {
                const index = purchaseOrders.value.findIndex((o) => o.id === order.id);
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
        }
    });
};

const cancelOrder = (order) => {
    if (order.status === 'received' || order.status === 'cancelled') {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'No se puede cancelar una orden recibida o ya cancelada',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: `¿Está seguro de cancelar la orden ${order.id}?`,
        header: 'Confirmar Cancelación',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'No',
        acceptLabel: 'Sí, Cancelar',
        acceptClass: 'p-button-danger',
        accept: () => {
            loading.value = true;

            setTimeout(() => {
                const index = purchaseOrders.value.findIndex((o) => o.id === order.id);
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
        }
    });
};

const getSeverity = (status) => {
    const statusOption = statusOptions.find((option) => option.value === status);
    return statusOption ? statusOption.severity : 'secondary';
};

const getStatusLabel = (status) => {
    const statusOption = statusOptions.find((option) => option.value === status);
    return statusOption ? statusOption.label : status;
};

function formatCurrencyPEN(value) {
    // Siempre muestra el símbolo S/ para el sol peruano
    if (typeof value !== 'number') return '';
    return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Alias para mantener compatibilidad con el template original
const formatCurrency = formatCurrencyPEN;

const formatDate = (date) => {
    return date ? date.toLocaleDateString('es-ES') : '-';
};

const clearFilters = () => {
    filters.value.global.value = null;
    filters.value.status.value = null;
    filters.value.supplier.value = null;
    filters.value.date.value = null;
    globalFilterValue.value = '';
    statusFilter.value = null;
    dateRange.value = null;
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
        supplier: { value: null, matchMode: FilterMatchMode.CONTAINS },
        date: { value: null, matchMode: FilterMatchMode.DATE_IS }
    };
    globalFilterValue.value = '';
};

const onGlobalFilterChange = () => {
    filters.value['global'].value = globalFilterValue.value;
};

const deleteSelectedOrders = () => {
    if (selectedOrders.value.length === 0) {
        toast.add({
            severity: 'warn',
            summary: 'Advertencia',
            detail: 'Seleccione al menos una orden para eliminar',
            life: 3000
        });
        return;
    }

    confirm.require({
        message: `¿Está seguro de eliminar ${selectedOrders.value.length} orden(es) seleccionada(s)?`,
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined',
        rejectLabel: 'Cancelar',
        acceptLabel: 'Eliminar',
        acceptClass: 'p-button-danger',
        accept: () => {
            const idsToDelete = selectedOrders.value.map((order) => order.id);
            purchaseOrders.value = purchaseOrders.value.filter((order) => !idsToDelete.includes(order.id));
            selectedOrders.value = [];

            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `${idsToDelete.length} orden(es) eliminada(s) correctamente`,
                life: 3000
            });
        }
    });
};

// Estadísticas computadas
const statistics = computed(() => {
    const total = purchaseOrders.value.length;
    const pending = purchaseOrders.value.filter((o) => o.status === 'pending').length;
    const approved = purchaseOrders.value.filter((o) => o.status === 'approved').length;
    const received = purchaseOrders.value.filter((o) => o.status === 'received').length;
    const cancelled = purchaseOrders.value.filter((o) => o.status === 'cancelled').length;
    const totalAmount = purchaseOrders.value.reduce((sum, o) => sum + o.total, 0);
    const pendingAmount = purchaseOrders.value.filter((o) => o.status === 'pending').reduce((sum, o) => sum + o.total, 0);
    const approvedAmount = purchaseOrders.value.filter((o) => o.status === 'approved').reduce((sum, o) => sum + o.total, 0);
    const receivedAmount = purchaseOrders.value.filter((o) => o.status === 'received').reduce((sum, o) => sum + o.total, 0);
    const cancelledAmount = purchaseOrders.value.filter((o) => o.status === 'cancelled').reduce((sum, o) => sum + o.total, 0);

    // Calcular órdenes próximas a vencer (menos de 3 días)
    const today = new Date();
    const soonToExpire = purchaseOrders.value.filter((order) => {
        if (order.status !== 'pending' && order.status !== 'approved') return false;
        const diffTime = order.expectedDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    }).length;

    return {
        total,
        pending,
        approved,
        received,
        cancelled,
        totalAmount,
        pendingAmount,
        approvedAmount,
        receivedAmount,
        cancelledAmount,
        soonToExpire
    };
});

// Inicializar datos para el gráfico
const initChartData = () => {
    chartData.value = {
        labels: ['Pendientes', 'Aprobadas', 'Recibidas', 'Canceladas'],
        datasets: [
            {
                data: [statistics.value.pending, statistics.value.approved, statistics.value.received, statistics.value.cancelled],
                backgroundColor: ['#FFB300', '#2196F3', '#4CAF50', '#F44336'],
                hoverBackgroundColor: ['#FFD54F', '#64B5F6', '#81C784', '#E57373']
            }
        ]
    };

    chartOptions.value = {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: '#495057'
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    };
};

// Actualizar datos del gráfico cuando cambian las órdenes
watch(
    () => statistics.value,
    (newStats) => {
        if (chartData.value && chartData.value.datasets) {
            chartData.value.datasets[0].data = [newStats.pending, newStats.approved, newStats.received, newStats.cancelled];
        }
    },
    { deep: true }
);

// Inicializar columnas para exportación
const initExportColumns = () => {
    exportColumns.value = [
        { field: 'id', header: 'ID Orden' },
        { field: 'supplier', header: 'Proveedor' },
        { field: 'date', header: 'Fecha Emisión', format: (value) => formatDate(value) },
        { field: 'expectedDate', header: 'Fecha Esperada', format: (value) => formatDate(value) },
        { field: 'items', header: 'Cantidad Items' },
        { field: 'total', header: 'Total', format: (value) => value.toLocaleString('es-ES') },
        { field: 'status', header: 'Estado', format: (value) => getStatusLabel(value) }
    ];
};

// Cargar opciones de proveedores para filtrado
const loadSupplierOptions = () => {
    const uniqueSuppliers = [...new Set(purchaseOrders.value.map((order) => order.supplier))];
    supplierOptions.value = uniqueSuppliers.map((supplier) => ({ label: supplier, value: supplier }));
};

// Exportar a CSV
const exportCSV = () => {
    const exportData = purchaseOrders.value.map((order) => {
        const row = {};
        exportColumns.value.forEach((col) => {
            const value = order[col.field];
            row[col.header] = col.format ? col.format(value) : value;
        });
        return row;
    });

    const headers = exportColumns.value.map((col) => col.header);
    const csvContent = [headers.join(','), ...exportData.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `ordenes_compra_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.add({
        severity: 'success',
        summary: 'Exportación Exitosa',
        detail: 'Datos exportados a CSV correctamente',
        life: 3000
    });
};

// Exportar a PDF (simulado)
const exportPDF = () => {
    toast.add({
        severity: 'info',
        summary: 'Exportando PDF',
        detail: 'La exportación a PDF se está procesando...',
        life: 3000
    });

    // Simulación de tiempo de procesamiento
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Exportación Exitosa',
            detail: 'Datos exportados a PDF correctamente',
            life: 3000
        });
    }, 2000);
};
</script>

<template>
    <div class="grid">
        <Toast />
        <ConfirmDialog />
        <!-- Estadísticas modernas y responsivas -->
        <PurchaseOrderStatistics :statistics="statistics" :formatCurrencyPEN="formatCurrencyPEN" class="mb-3" />

        <!-- Tabla Principal -->
        <div class="col-12">
            <div class="card">
                <Toolbar class="mb-4">
                    <template #start>
                        <div class="my-2">
                            <h5 class="m-0">Órdenes de Compra</h5>
                        </div>
                    </template>

                    <template #end>
                        <div class="flex gap-2">
                            <Button label="Eliminar Seleccionadas" icon="pi pi-trash" severity="danger" @click="deleteSelectedOrders" :disabled="!selectedOrders || !selectedOrders.length" outlined />
                            <Button label="Nueva Orden" icon="pi pi-plus" @click="createNewPurchaseOrder" />
                        </div>
                    </template>
                </Toolbar>

                <!-- Filtros -->
                <div class="surface-card shadow-2 border-round-xl p-4 mb-4">
                    <div class="flex flex-column md:flex-row align-items-stretch gap-3">
                        <!-- Buscador global -->
                        <div class="flex-1 min-w-[200px] flex align-items-center gap-2">
                            <IconField iconPosition="left" class="w-full">
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="globalFilterValue" placeholder="Buscar órdenes..." @input="onGlobalFilterChange" class="w-full" />
                            </IconField>
                        </div>
                        <!-- Filtro de estado -->
                        <div class="flex-1 min-w-[180px] flex align-items-center gap-2">
                            <Select v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Estado" showClear class="w-full" @change="filters.status.value = statusFilter" />
                        </div>
                        <!-- Filtro de fechas -->
                        <div class="flex-1 min-w-[200px] flex align-items-center gap-2">
                            <DatePicker v-model="dateRange" selectionMode="range" :manualInput="false" placeholder="Rango de fechas" showIcon class="w-full" />
                        </div>
                        <!-- Botón limpiar -->
                        <div class="flex align-items-center">
                            <Button label="Limpiar" icon="pi pi-filter-slash" @click="clearFilters" outlined rounded class="px-3 py-2" />
                        </div>
                    </div>
                </div>

                <PurchaseOrdersTable
                    :purchaseOrders="purchaseOrders"
                    :loading="loading"
                    :filters="filters"
                    :statusOptions="statusOptions"
                    :formatCurrency="formatCurrency"
                    :formatDate="formatDate"
                    :getStatusLabel="getStatusLabel"
                    :getSeverity="getSeverity"
                    @view-details="viewPurchaseOrderDetails"
                    @receive-order="receiveOrder"
                    @cancel-order="cancelOrder"
                    @update:selection="(val) => (selectedOrders = val)"
                />
            </div>
        </div>
    </div>
    <!-- Diálogos -->
    <PurchaseOrderFormDialog v-model:visible="showPurchaseOrderDialog" :order="selectedOrder" @submit="handlePurchaseOrderSubmit" :loading="purchaseStore.isLoadingPurchaseOrders" dialog-class="max-w-full w-[95vw] sm:w-[500px]" />
    <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProduct?.name || ''" @confirm="handleProductDelete" dialog-class="max-w-full w-[90vw] sm:w-[400px]" />
</template>

<style scoped>
.stat-card {
    flex-basis: 100%;
}
@media (min-width: 600px) {
    .stat-card {
        flex-basis: 48%;
    }
}
@media (min-width: 992px) {
    .stat-card {
        flex-basis: 23%;
    }
}
.stat-gradient.stat-blue {
    background: linear-gradient(135deg, #2563eb 40%, #60a5fa 100%);
}
.stat-gradient.stat-orange {
    background: linear-gradient(135deg, #f59e42 40%, #fbbf24 100%);
}
.stat-gradient.stat-cyan {
    background: linear-gradient(135deg, #06b6d4 40%, #67e8f9 100%);
}
.stat-gradient.stat-green {
    background: linear-gradient(135deg, #22c55e 40%, #bbf7d0 100%);
}
.stat-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.4rem 1rem;
    border-radius: 1rem;
    color: #fff;
    font-size: 0.9rem;
    font-weight: bold;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
    z-index: 2;
}
.stat-label {
    color: #e0e7ef;
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.85;
}
</style>
