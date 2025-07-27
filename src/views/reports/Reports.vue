<script setup>
import { useReportsStore } from '@/stores/reportsStore';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const reportsStore = useReportsStore();

const searchTerm = ref('');
const selectedCategory = ref(null);
const downloadingReports = ref(new Set());

const categories = ref([
    { label: 'Todas las categorías', value: null },
    { label: 'Ventas', value: 'ventas' },
    { label: 'Inventario', value: 'inventario' },
    { label: 'Compras', value: 'compras' },
    { label: 'Finanzas', value: 'finanzas' },
    { label: 'Clientes', value: 'clientes' }
]);

const reports = ref([
    {
        id: 1,
        type: 'ventas_diarias',
        name: 'Ventas Diarias',
        icon: 'pi pi-chart-bar',
        category: 'ventas',
        color: 'bg-blue-500',
        description: 'Reporte detallado de las ventas realizadas en el día, incluyendo productos y métodos de pago.',
        estimatedTime: '2-3 min',
        popularity: 'high'
    },
    {
        id: 2,
        type: 'inventario',
        name: 'Inventario Actual',
        icon: 'pi pi-box',
        category: 'inventario',
        color: 'bg-green-500',
        description: 'Listado completo del stock de productos, con SKU, descripción, unidad y estado de reabastecimiento.',
        estimatedTime: '1-2 min',
        popularity: 'high'
    },
    {
        id: 3,
        type: 'compras_mensuales',
        name: 'Compras Mensuales',
        icon: 'pi pi-shopping-cart',
        category: 'compras',
        color: 'bg-purple-500',
        description: 'Reporte de las compras realizadas en el mes, con desglose de productos, cantidades y costos unitarios.',
        estimatedTime: '3-4 min',
        popularity: 'medium'
    },
    {
        id: 4,
        type: 'productos_mas_vendidos',
        name: 'Top Productos',
        icon: 'pi pi-star',
        category: 'ventas',
        color: 'bg-yellow-500',
        description: 'Ranking de los productos más vendidos por cantidad y monto total de ventas en el mes.',
        estimatedTime: '1-2 min',
        popularity: 'high'
    },
    {
        id: 5,
        type: 'lotes_por_vencer',
        name: 'Lotes por Vencer',
        icon: 'pi pi-calendar-times',
        category: 'inventario',
        color: 'bg-red-500',
        description: 'Reporte de lotes con fecha de caducidad próxima o ya vencida, con detalles del producto y estado.',
        estimatedTime: '2-3 min',
        popularity: 'medium'
    },
    {
        id: 6,
        type: 'movimientos_stock',
        name: 'Movimientos Stock',
        icon: 'pi pi-arrows-h',
        category: 'inventario',
        color: 'bg-indigo-500',
        description: 'Historial completo de entradas, salidas y transferencias de stock, con usuario y referencia.',
        estimatedTime: '4-5 min',
        popularity: 'low'
    },
    {
        id: 7,
        type: 'sesiones_caja',
        name: 'Sesiones de Caja',
        icon: 'pi pi-wallet',
        category: 'finanzas',
        color: 'bg-teal-500',
        description: 'Reporte de las sesiones de caja, incluyendo saldos, ventas, ingresos y egresos por sesión.',
        estimatedTime: '2-3 min',
        popularity: 'medium'
    },
    {
        id: 8,
        type: 'historial_compras_clientes',
        name: 'Historial Clientes',
        icon: 'pi pi-history',
        category: 'clientes',
        color: 'bg-pink-500',
        description: 'Detalle de las compras realizadas por cada cliente, listando los productos adquiridos en cada venta.',
        estimatedTime: '3-4 min',
        popularity: 'medium'
    },
    {
        id: 9,
        type: 'rentabilidad_productos',
        name: 'Rentabilidad',
        icon: 'pi pi-money-bill',
        category: 'finanzas',
        color: 'bg-emerald-500',
        description: 'Análisis de la ganancia bruta y el margen de ganancia por producto, basado en ventas y costos.',
        estimatedTime: '3-4 min',
        popularity: 'high'
    }
]);

const filteredReports = computed(() => {
    let filtered = reports.value;

    // Filtrar por categoría
    if (selectedCategory.value) {
        filtered = filtered.filter((report) => report.category === selectedCategory.value);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.value.trim()) {
        const term = searchTerm.value.toLowerCase();
        filtered = filtered.filter((report) => report.name.toLowerCase().includes(term) || report.description.toLowerCase().includes(term));
    }

    // Ordenar por popularidad
    return filtered.sort((a, b) => {
        const popularityOrder = { high: 3, medium: 2, low: 1 };
        return popularityOrder[b.popularity] - popularityOrder[a.popularity];
    });
});

const popularReports = computed(() => {
    return reports.value.filter((report) => report.popularity === 'high').slice(0, 3);
});

onMounted(() => {
    toast.add({
        severity: 'info',
        summary: 'Bienvenido',
        detail: 'Módulo de reportes listo para usar',
        life: 3000
    });
});

const downloadReport = async (report) => {
    if (downloadingReports.value.has(report.id)) return;

    downloadingReports.value.add(report.id);

    try {
        toast.add({
            severity: 'info',
            summary: 'Generando...',
            detail: `Preparando reporte: ${report.name}`,
            life: 2000
        });

        const blob = await reportsStore.download(report.type);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${report.type}_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();

        toast.add({
            severity: 'success',
            summary: 'Descarga completada',
            detail: `${report.name} descargado exitosamente`,
            life: 4000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error en descarga',
            detail: error.message || 'No se pudo generar el reporte',
            life: 5000
        });
    } finally {
        downloadingReports.value.delete(report.id);
    }
};

const isDownloading = (reportId) => {
    return downloadingReports.value.has(reportId);
};

const getPopularityBadge = (popularity) => {
    const badges = {
        high: { severity: 'success', label: 'Popular' },
        medium: { severity: 'warning', label: 'Moderado' },
        low: { severity: 'secondary', label: 'Ocasional' }
    };
    return badges[popularity];
};
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-6 px-4">
        <Toast />

        <div class="container mx-auto 2xl:max-w-none">
            <!-- Header mejorado -->
            <div class="mb-8">
                <div class="flex flex-wrap items-center justify-between gap-8 mb-6">
                    <div>
                        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            <i class="pi pi-chart-line mr-3 text-blue-600"></i>
                            Centro de Reportes
                        </h1>
                        <p class="text-gray-600 dark:text-gray-300 text-lg">Genera y descarga reportes de tu negocio</p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border dark:border-gray-700">
                            <div class="text-sm text-gray-500 dark:text-gray-400">Reportes disponibles</div>
                            <div class="text-2xl font-bold text-gray-900">{{ reports.length }}</div>
                        </div>
                    </div>
                </div>

                <!-- Reportes populares -->
                <div class="mb-6 dark:bg-gray-800 dark:text-gray-200">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                        <i class="pi pi-star-fill text-yellow-500 mr-2"></i>
                        Reportes más utilizados
                    </h2>
                    <div class="flex flex-wrap gap-2">
                        <Button
                            v-for="report in popularReports"
                            :key="report.id"
                            :label="report.name"
                            :icon="report.icon"
                            size="small"
                            outlined
                            class="popular-btn bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                            @click="downloadReport(report)"
                            :loading="isDownloading(report.id)"
                        />
                    </div>
                </div>
            </div>

            <!-- Filtros mejorados -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 mb-8 sticky top-4 z-10">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="relative sm:col-span-2">
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchTerm" placeholder="Buscar reportes..." class="w-full pl-10" size="large" />
                        </IconField>
                    </div>
                    <Dropdown v-model="selectedCategory" :options="categories" optionLabel="label" optionValue="value" placeholder="Filtrar por categoría" class="w-full" size="large" />
                </div>
            </div>

            <!-- Grid de reportes mejorado -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                <div v-for="report in filteredReports" :key="report.id" class="group relative">
                    <Card class="report-card h-full cursor-pointer overflow-hidden hover:ring-2 hover:ring-blue-300 hover:ring-offset-2">
                        <template #header>
                            <div class="relative sm:col-span-2">
                                <div :class="[report.color, 'h-2 w-full']"></div>
                                <div class="absolute top-2 right-2">
                                    <Badge :value="getPopularityBadge(report.popularity).label" :severity="getPopularityBadge(report.popularity).severity" size="small" />
                                </div>
                            </div>
                        </template>

                        <template #title>
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <div :class="[report.color, 'p-3 rounded-lg text-white shadow-lg']">
                                        <i :class="[report.icon, 'text-xl']"></i>
                                    </div>
                                    <div>
                                        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                                            {{ report.name }}
                                        </h3>
                                        <div class="flex items-center text-sm text-gray-500 mt-1">
                                            <i class="pi pi-clock mr-1"></i>
                                            {{ report.estimatedTime }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #content>
                            <p class="text-gray-600 mb-4 text-sm leading-relaxed">
                                {{ report.description }}
                            </p>

                            <Button
                                :label="isDownloading(report.id) ? 'Generando...' : 'Descargar Reporte'"
                                :icon="isDownloading(report.id) ? 'pi pi-spin pi-spinner' : 'pi pi-download'"
                                :loading="isDownloading(report.id)"
                                :disabled="isDownloading(report.id)"
                                class="w-full download-btn"
                                size="large"
                                @click="downloadReport(report)"
                            />
                        </template>
                    </Card>
                </div>
            </div>

            <!-- Mensaje cuando no hay resultados -->
            <div v-if="filteredReports.length === 0" class="text-center py-12">
                <i class="pi pi-search text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron reportes</h3>
                <p class="text-gray-500">Intenta con otros términos de búsqueda o cambia los filtros</p>
                <Button
                    label="Limpiar filtros"
                    icon="pi pi-times"
                    text
                    @click="
                        searchTerm = '';
                        selectedCategory = null;
                    "
                    class="mt-4"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.report-card {
    @apply transform transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-xl border-0 shadow-md;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.report-card:hover {
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.download-btn {
    @apply bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 font-medium;
    transition: all 0.3s ease;
}

.download-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.popular-btn {
    @apply transition-all duration-200 hover:scale-105;
}

.popular-btn:hover {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white !important;
    border-color: transparent !important;
}

/* Animaciones para mejorar la UX */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.report-card {
    animation: fadeInUp 0.5s ease-out;
}

/* Responsive improvements */
@media (max-width: 768px) {
    .report-card {
        @apply hover:scale-100;
    }
}

/* UX: reduce text size and margin in card description */
.report-card p {
    @apply mb-3 text-[0.925rem];
}

/* Dark mode card background */
.dark .report-card {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

/* Only animate when motion allowed */
@media (prefers-reduced-motion: no-preference) {
    .report-card {
        animation: fadeInUp 0.5s ease-out;
    }
}
</style>
