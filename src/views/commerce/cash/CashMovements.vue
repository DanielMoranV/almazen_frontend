<script setup>
import { useCashMovementsStore } from '@/stores/cashMovementsStore';
import { useCashSessionsStore } from '@/stores/cashSessionsStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const movementsStore = useCashMovementsStore();
const sessionsStore = useCashSessionsStore();

const isLoading = computed(() => movementsStore.isLoadingMovements);
const movements = computed(() => movementsStore.movementsList);
const summary = computed(() => movementsStore.movementsSummary);
const filters = ref({
    type: '',
    date_from: '',
    date_to: ''
});

onMounted(async () => {
    // Por defecto filtrar por sesión actual si existe
    if (sessionsStore.currentSession) {
        movementsStore.updateFilters({ cash_session_id: sessionsStore.currentSession.id });
    }
    await movementsStore.fetchMovements();
    console.log('movementsStore.movementsList', movementsStore.movementsList);
});

const typeOptions = [
    { label: 'Todos', value: '' },
    { label: 'Ventas', value: 'SALE' },
    { label: 'Egresos', value: 'EXPENSE' },
    { label: 'Retiros', value: 'WITHDRAWAL' },
    { label: 'Depósitos', value: 'DEPOSIT' },
    { label: 'Ajustes', value: 'ADJUSTMENT' }
];

const applyFilters = async () => {
    movementsStore.updateFilters(filters.value);
    await movementsStore.fetchMovements();
};

const clearFilters = async () => {
    filters.value = { type: '', date_from: '', date_to: '' };
    movementsStore.clearFilters();
    await movementsStore.fetchMovements();
};
</script>

<template>
    <Toast />
    <div class="grid">
        <div class="col-12">
            <Card class="shadow-lg border-0">
                <template #header>
                    <div class="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 rounded-t-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <i class="pi pi-wallet text-2xl"></i>
                                <div>
                                    <h1 class="text-2xl font-bold">Movimientos de Caja</h1>
                                    <p class="text-cyan-100">Ingresos y egresos de efectivo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template #content>
                    <!-- Filtros -->
                    <Panel header="Filtros" :toggleable="true" class="mb-4">
                        <div class="flex flex-col md:flex-row md:items-end md:space-x-4 space-y-4 md:space-y-0">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                                <Select v-model="filters.type" :options="typeOptions" option-label="label" option-value="value" @change="applyFilters" fluid placeholder="Seleccione un tipo" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Desde</label>
                                <Calendar v-model="filters.date_from" dateFormat="yy-mm-dd" @date-select="applyFilters" class="w-full" placeholder="Seleccione una fecha desde" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Hasta</label>
                                <Calendar v-model="filters.date_to" dateFormat="yy-mm-dd" @date-select="applyFilters" class="w-full" placeholder="Seleccione una fecha hasta" />
                            </div>
                            <div class="flex gap-2">
                                <Button icon="pi pi-filter-slash" severity="secondary" outlined title="Limpiar" @click="clearFilters" />
                                <Button icon="pi pi-refresh" severity="info" title="Actualizar" @click="applyFilters" />
                            </div>
                        </div>
                    </Panel>

                    <!-- Tabla -->
                    <div v-if="isLoading" class="flex justify-center py-8">
                        <ProgressSpinner />
                    </div>
                    <DataTable v-else :value="movements" :paginator="true" :rows="15" stripedRows responsiveLayout="scroll">
                        <Column field="created_at" header="Fecha" sortable>
                            <template #body="{ data }">{{ new Date(data.created_at).toLocaleString('es-PE') }}</template>
                        </Column>
                        <Column field="type" header="Tipo" sortable>
                            <template #body="{ data }">
                                <Tag :value="data.type" :severity="data.type === 'SALE' ? 'success' : data.type === 'EXPENSE' ? 'danger' : data.type === 'WITHDRAWAL' ? 'warning' : data.type === 'DEPOSIT' ? 'info' : 'secondary'" />
                            </template>
                        </Column>
                        <Column field="description" header="Descripción" />
                        <Column field="amount" header="Monto" sortable>
                            <template #body="{ data }">{{
                                new Intl.NumberFormat('es-PE', {
                                    style: 'currency',
                                    currency: 'PEN'
                                }).format(data.amount)
                            }}</template>
                        </Column>
                        <template #empty>
                            <div class="text-center py-8">
                                <i class="pi pi-inbox text-5xl text-gray-400"></i>
                                <h3 class="text-xl font-semibold text-gray-600 mt-4">No se encontraron movimientos</h3>
                                <p class="text-gray-500">Parece que no hay registros que coincidan con los filtros seleccionados.</p>
                            </div>
                        </template>
                    </DataTable>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

.col-12 {
    grid-column: span 12;
}
</style>
