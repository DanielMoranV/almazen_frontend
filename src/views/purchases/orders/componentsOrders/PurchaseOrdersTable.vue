<script setup>
import { ref, computed, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const props = defineProps({
    purchaseOrders: { type: Array, required: true },
    loading: { type: Boolean, default: false },
    filters: { type: Object, required: true },
    statusOptions: { type: Array, required: true },
    formatCurrency: { type: Function, required: true },
    formatDate: { type: Function, required: true },
    getStatusLabel: { type: Function, required: true },
    getSeverity: { type: Function, required: true }
});

const emit = defineEmits(['view-details', 'receive-order', 'cancel-order', 'update:selection']);

const selectedOrders = ref([]);

watch(selectedOrders, (val) => {
    emit('update:selection', val);
});
</script>

<template>
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
        <Column field="supplier" header="Proveedor" sortable />
        <Column field="date" header="Fecha" sortable>
            <template #body="slotProps">
                <div class="flex align-items-center">
                    <i class="pi pi-calendar mr-2 text-400"></i>
                    {{ formatDate(slotProps.data.date) }}
                </div>
            </template>
        </Column>
        <Column field="expectedDate" header="Entrega" sortable>
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
                    <Button icon="pi pi-eye" severity="info" text rounded @click.stop="emit('view-details', slotProps.data)" v-tooltip.top="'Ver detalles'" />
                    <Button icon="pi pi-check-square" severity="success" text rounded @click.stop="emit('receive-order', slotProps.data)" :disabled="slotProps.data.status !== 'approved'" v-tooltip.top="'Marcar como recibida'" />
                    <Button
                        icon="pi pi-times-circle"
                        severity="danger"
                        text
                        rounded
                        @click.stop="emit('cancel-order', slotProps.data)"
                        :disabled="slotProps.data.status === 'received' || slotProps.data.status === 'cancelled'"
                        v-tooltip.top="'Cancelar orden'"
                    />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
/* Puedes agregar estilos específicos de la tabla aquí si es necesario */
</style>
