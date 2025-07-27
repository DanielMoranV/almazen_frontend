<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useReportsStore } from '@/stores/reportsStore';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const authStore = useAuthStore();
const reportsStore = useReportsStore();
const loading = ref(false);
const reports = ref([
    { id: 1, name: 'Ventas Diarias', type: 'ventas_diarias', icon: 'pi pi-chart-bar', description: 'Reporte de ventas del día actual' },
    { id: 2, name: 'Inventario', type: 'inventario', icon: 'pi pi-chart-line', description: 'Estado actual del inventario' },
    { id: 3, name: 'Compras Mensuales', type: 'compras_mensuales', icon: 'pi pi-chart-pie', description: 'Reporte de compras del mes' },
    { id: 4, name: 'Productos Más Vendidos', type: 'productos_mas_vendidos', icon: 'pi pi-sort-amount-down', description: 'Top productos vendidos' }
]);

onMounted(() => {
    toast.add({ severity: 'info', summary: 'Información', detail: 'Módulo de reportes cargado', life: 3000 });
});

const downloadReport = async (report) => {
    loading.value = true;
    try {
        const blob = await reportsStore.download(report.type);


        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${report.type}.xlsx`;
        link.click();
        toast.add({ severity: 'success', summary: 'Éxito', detail: `Reporte ${report.name} descargado`, life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <h5>Reportes</h5>
                <p>Seleccione un reporte para generar</p>
                
                <div class="grid">
                    <div v-for="report in reports" :key="report.id" class="col-12 md:col-6 lg:col-3">
                        <div class="card cursor-pointer p-3 hover:surface-200" @click="downloadReport(report)">
                            <div class="flex flex-column align-items-center">
                                <i :class="[report.icon, 'text-2xl text-primary mb-3']"></i>
                                <h6 class="mb-1">{{ report.name }}</h6>
                                <p class="text-sm text-center text-600">{{ report.description }}</p>
                                <button class="p-button p-component p-button-sm">
                                    <span class="p-button-label">Descargar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}
</style>
