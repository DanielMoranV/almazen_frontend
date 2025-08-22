<script setup>
import { useQuotesStore } from '@/stores/quotesStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const quotesStore = useQuotesStore();

const loading = ref(true);
const dateFrom = ref('');
const dateTo = ref('');
const refreshing = ref(false);

// Establecer fechas por defecto (último mes)
const today = new Date();
const lastMonth = new Date(today);
lastMonth.setMonth(today.getMonth() - 1);

dateTo.value = today.toISOString().split('T')[0];
dateFrom.value = lastMonth.toISOString().split('T')[0];

const statistics = computed(() => quotesStore.getStatistics);
const quickMetrics = computed(() => quotesStore.quickMetrics);

onMounted(async () => {
    await loadData();
});

const loadData = async () => {
    loading.value = true;
    try {
        await Promise.all([
            quotesStore.fetchQuotes({ paginate: false }),
            quotesStore.fetchStatistics({
                date_from: dateFrom.value,
                date_to: dateTo.value
            })
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar las estadísticas',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const refresh = async () => {
    refreshing.value = true;
    await loadData();
    refreshing.value = false;

    toast.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Datos actualizados correctamente',
        life: 2000
    });
};

const onDateFilterChange = async () => {
    if (dateFrom.value && dateTo.value) {
        await quotesStore.fetchStatistics({
            date_from: dateFrom.value,
            date_to: dateTo.value
        });
    }
};

const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '$0.00';
};

const formatPercentage = (value) => {
    return value ? `${parseFloat(value).toFixed(1)}%` : '0.0%';
};

const getStatusColor = (status) => {
    switch (status) {
        case 'PENDIENTE':
            return '#f59e0b';
        case 'APROBADO':
            return '#10b981';
        case 'RECHAZADO':
            return '#ef4444';
        case 'VENCIDO':
            return '#6b7280';
        default:
            return '#6b7280';
    }
};

// Datos para gráficos
const chartData = computed(() => {
    if (!statistics.value?.monthly) return null;

    return {
        labels: statistics.value.monthly.map((m) => m.month_name),
        datasets: [
            {
                label: 'Total Cotizaciones',
                data: statistics.value.monthly.map((m) => m.total_quotes),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2
            },
            {
                label: 'Cotizaciones Aprobadas',
                data: statistics.value.monthly.map((m) => m.approved_quotes),
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 2
            }
        ]
    };
});

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        },
        title: {
            display: true,
            text: 'Tendencia de Cotizaciones (Últimos 6 meses)'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

const donutData = computed(() => {
    return {
        labels: ['Pendientes', 'Aprobadas', 'Rechazadas', 'Vencidas'],
        datasets: [
            {
                data: [quickMetrics.value.pending, quickMetrics.value.approved, quickMetrics.value.rejected, quickMetrics.value.expired],
                backgroundColor: [getStatusColor('PENDIENTE'), getStatusColor('APROBADO'), getStatusColor('RECHAZADO'), getStatusColor('VENCIDO')]
            }
        ]
    };
});

const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom'
        },
        title: {
            display: true,
            text: 'Distribución por Estado'
        }
    }
};
</script>

<template>
    <div class="grid">
        <!-- Header -->
        <div class="col-12">
            <div class="card">
                <div class="flex justify-content-between align-items-center">
                    <div>
                        <h5 class="m-0 mb-2">Dashboard de Cotizaciones</h5>
                        <p class="text-500 m-0">Análisis y estadísticas de cotizaciones</p>
                    </div>
                    <div class="flex gap-2 align-items-center">
                        <!-- Filtros de fecha -->
                        <div class="flex gap-2 align-items-center">
                            <label class="text-sm">Desde:</label>
                            <Calendar v-model="dateFrom" dateFormat="yy-mm-dd" @date-select="onDateFilterChange" class="w-auto" />
                            <label class="text-sm">Hasta:</label>
                            <Calendar v-model="dateTo" dateFormat="yy-mm-dd" @date-select="onDateFilterChange" class="w-auto" />
                        </div>

                        <Button icon="pi pi-refresh" label="Actualizar" @click="refresh" :loading="refreshing" outlined />
                    </div>
                </div>
            </div>
        </div>

        <!-- Métricas principales -->
        <div class="col-12" v-if="!loading">
            <div class="grid">
                <div class="col-12 lg:col-3 md:col-6">
                    <div class="card bg-blue-100 border-left-3 border-blue-500">
                        <div class="flex justify-content-between align-items-start">
                            <div>
                                <div class="text-blue-700 font-medium text-sm">Total Cotizaciones</div>
                                <div class="text-blue-900 font-bold text-2xl mt-1">{{ quickMetrics.total }}</div>
                            </div>
                            <div class="bg-blue-500 text-white border-round p-2">
                                <i class="pi pi-file text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-3 md:col-6">
                    <div class="card bg-yellow-100 border-left-3 border-yellow-500">
                        <div class="flex justify-content-between align-items-start">
                            <div>
                                <div class="text-yellow-700 font-medium text-sm">Pendientes</div>
                                <div class="text-yellow-900 font-bold text-2xl mt-1">{{ quickMetrics.pending }}</div>
                            </div>
                            <div class="bg-yellow-500 text-white border-round p-2">
                                <i class="pi pi-clock text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-3 md:col-6">
                    <div class="card bg-green-100 border-left-3 border-green-500">
                        <div class="flex justify-content-between align-items-start">
                            <div>
                                <div class="text-green-700 font-medium text-sm">Aprobadas</div>
                                <div class="text-green-900 font-bold text-2xl mt-1">{{ quickMetrics.approved }}</div>
                            </div>
                            <div class="bg-green-500 text-white border-round p-2">
                                <i class="pi pi-check text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 lg:col-3 md:col-6">
                    <div class="card bg-purple-100 border-left-3 border-purple-500">
                        <div class="flex justify-content-between align-items-start">
                            <div>
                                <div class="text-purple-700 font-medium text-sm">Valor Total</div>
                                <div class="text-purple-900 font-bold text-2xl mt-1">{{ formatCurrency(quickMetrics.totalAmount) }}</div>
                            </div>
                            <div class="bg-purple-500 text-white border-round p-2">
                                <i class="pi pi-dollar text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="col-12">
            <div class="card text-center p-6">
                <ProgressSpinner strokeWidth="4" />
                <p class="mt-3">Cargando estadísticas...</p>
            </div>
        </div>

        <!-- Gráficos y estadísticas detalladas -->
        <div v-if="!loading && statistics" class="col-12">
            <div class="grid">
                <!-- Estadísticas generales -->
                <div class="col-12 xl:col-8">
                    <div class="card">
                        <h6 class="text-900 font-semibold mb-3">Estadísticas Generales</h6>
                        <div class="grid">
                            <div class="col-12 md:col-4">
                                <div class="text-center p-3 border-1 surface-border border-round">
                                    <div class="text-2xl font-bold text-blue-600">{{ statistics.general?.total_quotes || 0 }}</div>
                                    <div class="text-500 text-sm">Total Cotizaciones</div>
                                </div>
                            </div>
                            <div class="col-12 md:col-4">
                                <div class="text-center p-3 border-1 surface-border border-round">
                                    <div class="text-2xl font-bold text-green-600">{{ formatPercentage(statistics.general?.approval_rate) }}</div>
                                    <div class="text-500 text-sm">Tasa de Aprobación</div>
                                </div>
                            </div>
                            <div class="col-12 md:col-4">
                                <div class="text-center p-3 border-1 surface-border border-round">
                                    <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(statistics.general?.average_quote_value) }}</div>
                                    <div class="text-500 text-sm">Valor Promedio</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Distribución por estado (gráfico de dona) -->
                <div class="col-12 xl:col-4">
                    <div class="card h-full">
                        <h6 class="text-900 font-semibold mb-3">Distribución por Estado</h6>
                        <div style="height: 250px">
                            <Chart type="doughnut" :data="donutData" :options="donutOptions" class="w-full h-full" />
                        </div>
                    </div>
                </div>

                <!-- Gráfico de tendencias -->
                <div class="col-12" v-if="chartData">
                    <div class="card">
                        <h6 class="text-900 font-semibold mb-3">Tendencia Mensual</h6>
                        <div style="height: 400px">
                            <Chart type="line" :data="chartData" :options="chartOptions" class="w-full h-full" />
                        </div>
                    </div>
                </div>

                <!-- Tabla de estadísticas por estado -->
                <div class="col-12">
                    <div class="card">
                        <h6 class="text-900 font-semibold mb-3">Resumen por Estado</h6>
                        <DataTable
                            :value="[
                                {
                                    estado: 'Pendientes',
                                    cantidad: quickMetrics.pending,
                                    porcentaje: quickMetrics.total > 0 ? ((quickMetrics.pending / quickMetrics.total) * 100).toFixed(1) : 0,
                                    monto: formatCurrency((quickMetrics.totalAmount / quickMetrics.total) * quickMetrics.pending),
                                    color: getStatusColor('PENDIENTE')
                                },
                                {
                                    estado: 'Aprobadas',
                                    cantidad: quickMetrics.approved,
                                    porcentaje: quickMetrics.total > 0 ? ((quickMetrics.approved / quickMetrics.total) * 100).toFixed(1) : 0,
                                    monto: formatCurrency(quickMetrics.approvedAmount),
                                    color: getStatusColor('APROBADO')
                                },
                                {
                                    estado: 'Rechazadas',
                                    cantidad: quickMetrics.rejected,
                                    porcentaje: quickMetrics.total > 0 ? ((quickMetrics.rejected / quickMetrics.total) * 100).toFixed(1) : 0,
                                    monto: formatCurrency(0),
                                    color: getStatusColor('RECHAZADO')
                                },
                                {
                                    estado: 'Vencidas',
                                    cantidad: quickMetrics.expired,
                                    porcentaje: quickMetrics.total > 0 ? ((quickMetrics.expired / quickMetrics.total) * 100).toFixed(1) : 0,
                                    monto: formatCurrency(0),
                                    color: getStatusColor('VENCIDO')
                                }
                            ]"
                            class="p-datatable-sm"
                        >
                            <Column field="estado" header="Estado">
                                <template #body="{ data }">
                                    <div class="flex align-items-center">
                                        <div class="border-round w-1rem h-1rem mr-2" :style="{ backgroundColor: data.color }"></div>
                                        <span class="font-semibold">{{ data.estado }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="cantidad" header="Cantidad" class="text-center">
                                <template #body="{ data }">
                                    <Tag :value="data.cantidad" />
                                </template>
                            </Column>

                            <Column field="porcentaje" header="Porcentaje" class="text-center">
                                <template #body="{ data }">
                                    <span class="font-semibold">{{ data.porcentaje }}%</span>
                                </template>
                            </Column>

                            <Column field="monto" header="Monto Estimado" class="text-right">
                                <template #body="{ data }">
                                    <span class="font-semibold">{{ data.monto }}</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="!loading && quickMetrics.total === 0" class="col-12">
            <div class="card text-center p-6">
                <i class="pi pi-chart-bar text-6xl text-300 mb-3 block"></i>
                <h5 class="text-500 mb-2">Sin datos disponibles</h5>
                <p class="text-color-secondary m-0">No hay cotizaciones en el rango de fechas seleccionado</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
