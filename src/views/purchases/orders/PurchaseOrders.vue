<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Chart from 'primevue/chart';

const toast = useToast();
const confirm = useConfirm();
const router = useRouter();
const loading = ref(false);
const purchaseOrders = ref([]);
const selectedOrders = ref([]);
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

// Verificar fechas próximas a vencer
const isCloseToExpire = (date) => {
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = () => {
    notificationCount.value = 0;
    showNotifications.value = false;

    toast.add({
        severity: 'info',
        summary: 'Notificaciones',
        detail: 'Todas las notificaciones han sido marcadas como leídas',
        life: 3000
    });
};
</script>

<template>
    <div class="grid">
        <!-- Estadísticas modernas y responsivas -->
        <div class="col-12">
            <div class="flex flex-wrap gap-3 justify-content-center md:justify-content-start">
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-blue flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-blue-500">Órdenes</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-list text-4xl text-blue-100"></i>
                            <span class="text-4xl font-bold text-white">{{ statistics.total }}</span>
                        </div>
                        <span class="stat-label mt-2">Total Órdenes</span>
                    </div>
                </div>
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-orange flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-orange-500">Pendientes</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-clock text-4xl text-orange-100"></i>
                            <span class="text-4xl font-bold text-white">{{ statistics.pending }}</span>
                        </div>
                        <span class="stat-label mt-2">Pendientes</span>
                    </div>
                </div>
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-cyan flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-cyan-500">Aprobadas</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-check-circle text-4xl text-cyan-100"></i>
                            <span class="text-4xl font-bold text-white">{{ statistics.approved }}</span>
                        </div>
                        <span class="stat-label mt-2">Aprobadas</span>
                    </div>
                </div>
                <div class="stat-card flex-1 min-w-16rem max-w-20rem p-0">
                    <div class="stat-gradient stat-green flex flex-column align-items-start p-4 border-round-xl shadow-3 relative">
                        <span class="stat-badge bg-green-500">Total S/</span>
                        <div class="flex align-items-center gap-2 mt-2">
                            <i class="pi pi-money-bill text-4xl text-green-100"></i>
                            <span class="text-2xl font-bold text-white">{{ formatCurrencyPEN(statistics.totalAmount) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

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

                <DataTable
                    v-model:selection="selectedOrders"
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
                    @row-click="viewPurchaseOrderDetails($event.data)"
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

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

                    <Column field="id" header="# Orden" sortable>
                        <template #body="slotProps">
                            <Badge :value="slotProps.data.id" severity="info" />
                        </template>
                    </Column>

                    <Column field="supplier" header="Proveedor" sortable>
                        <template #body="slotProps">
                            <div class="flex align-items-center">
                                <i class="pi pi-building mr-2 text-400"></i>
                                {{ slotProps.data.supplier }}
                            </div>
                        </template>
                    </Column>

                    <Column field="date" header="Fecha" sortable>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.date) }}
                        </template>
                    </Column>

                    <Column field="expectedDate" header="Fecha Esperada" sortable>
                        <template #body="slotProps">
                            <div class="flex align-items-center">
                                <i class="pi pi-calendar mr-2 text-400"></i>
                                {{ formatDate(slotProps.data.expectedDate) }}
                            </div>
                        </template>
                    </Column>

                    <Column field="items" header="Items" sortable>
                        <template #body="slotProps">
                            <Badge :value="slotProps.data.items" severity="secondary" />
                        </template>
                    </Column>

                    <Column field="total" header="Total" sortable>
                        <template #body="slotProps">
                            <div class="font-semibold text-900">
                                {{ formatCurrency(slotProps.data.total) }}
                            </div>
                        </template>
                    </Column>

                    <Column field="status" header="Estado" sortable>
                        <template #body="slotProps">
                            <Tag :value="getStatusLabel(slotProps.data.status)" :severity="getSeverity(slotProps.data.status)" />
                        </template>
                    </Column>

                    <Column header="Acciones" style="width: 12rem">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button icon="pi pi-eye" severity="info" text rounded @click.stop="viewPurchaseOrderDetails(slotProps.data)" v-tooltip.top="'Ver detalles'" />
                                <Button icon="pi pi-check-square" severity="success" text rounded @click.stop="receiveOrder(slotProps.data)" :disabled="slotProps.data.status !== 'approved'" v-tooltip.top="'Marcar como recibida'" />
                                <Button
                                    icon="pi pi-times-circle"
                                    severity="danger"
                                    text
                                    rounded
                                    @click.stop="cancelOrder(slotProps.data)"
                                    :disabled="slotProps.data.status === 'received' || slotProps.data.status === 'cancelled'"
                                    v-tooltip.top="'Cancelar orden'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
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
