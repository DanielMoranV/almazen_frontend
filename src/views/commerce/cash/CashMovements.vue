<script setup>
import { useCashMovementsStore } from '@/stores/cashMovementsStore';
import { useCashSessionsStore } from '@/stores/cashSessionsStore';
import DatePicker from 'primevue/datepicker';
import { computed, onMounted, ref } from 'vue';

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
                                    <h1 class="text-2xl font-bold text-white">Movimientos de Caja</h1>
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
                                <DatePicker v-model="filters.date_from" dateFormat="yy-mm-dd" @date-select="applyFilters" class="w-full" placeholder="Seleccione una fecha desde" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">Hasta</label>
                                <DatePicker v-model="filters.date_to" dateFormat="yy-mm-dd" @date-select="applyFilters" class="w-full" placeholder="Seleccione una fecha hasta" />
                            </div>
                            <div class="flex gap-2">
                                <Button icon="pi pi-filter-slash" severity="secondary" outlined title="Limpiar" @click="clearFilters" />
                                <Button icon="pi pi-refresh" severity="info" title="Actualizar" @click="applyFilters" />
                            </div>
                        </div>
                    </Panel>

                    <!-- Resumen de Movimientos -->
                    <div class="mb-4">
                        <Panel header="Resumen de Movimientos" :toggleable="true">
                            <div class="flex flex-wrap gap-2">
                                <div class="flex-grow-1 flex-shrink-0" style="min-width: 150px; max-width: 200px">
                                    <div class="p-3 border-round bg-blue-50 shadow-1 h-full">
                                        <div class="text-sm text-blue-800 font-medium">Total</div>
                                        <div class="text-xl font-bold text-blue-900">S/ {{ summary?.total_amount || '0.00' }}</div>
                                    </div>
                                </div>
                                <div class="flex-grow-1 flex-shrink-0" style="min-width: 150px; max-width: 200px">
                                    <div class="p-3 border-round bg-green-50 shadow-1 h-full">
                                        <div class="text-sm text-green-800 font-medium">Ventas</div>
                                        <div class="text-xl font-bold text-green-900">S/ {{ summary?.sales_amount || '0.00' }}</div>
                                    </div>
                                </div>
                                <div class="flex-grow-1 flex-shrink-0" style="min-width: 150px; max-width: 200px">
                                    <div class="p-3 border-round bg-yellow-50 shadow-1 h-full">
                                        <div class="text-sm text-yellow-800 font-medium">Depósitos</div>
                                        <div class="text-xl font-bold text-yellow-900">S/ {{ summary?.deposits_amount || '0.00' }}</div>
                                    </div>
                                </div>
                                <div class="flex-grow-1 flex-shrink-0" style="min-width: 150px; max-width: 200px">
                                    <div class="p-3 border-round bg-red-50 shadow-1 h-full">
                                        <div class="text-sm text-red-800 font-medium">Egresos</div>
                                        <div class="text-xl font-bold text-red-900">S/ {{ summary?.expenses_amount || '0.00' }}</div>
                                    </div>
                                </div>
                                <div class="flex-grow-1 flex-shrink-0" style="min-width: 150px; max-width: 200px">
                                    <div class="p-3 border-round bg-orange-50 shadow-1 h-full">
                                        <div class="text-sm text-orange-800 font-medium">Retiros</div>
                                        <div class="text-xl font-bold text-orange-900">S/ {{ summary?.withdrawals_amount || '0.00' }}</div>
                                    </div>
                                </div>
                                <div class="flex-grow-1 flex-shrink-0" style="min-width: 150px; max-width: 200px">
                                    <div class="p-3 border-round bg-purple-50 shadow-1 h-full">
                                        <div class="text-sm text-purple-800 font-medium">Ajustes</div>
                                        <div class="text-xl font-bold text-purple-900">S/ {{ summary?.adjustments_amount || '0.00' }}</div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>

                    <!-- Tabla -->
                    <DataTable :value="movements" :loading="isLoading" :paginator="true" :rows="15" stripedRows responsiveLayout="scroll">
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
