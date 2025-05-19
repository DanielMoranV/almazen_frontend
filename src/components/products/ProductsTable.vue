<script setup>
import { ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { exportToExcel } from '@/utils/excelUtils';

const { product, loading } = defineProps({
    product: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['edit', 'delete']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    barcode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    sku: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    unit_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    company_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

watch(
    () => product,
    (newProducts) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);

const exportProducts = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Código de barras', key: 'barcode', width: 15 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Descripción', key: 'description', width: 30 },
        { header: 'Unidad', key: 'unit_name', width: 15 },
        { header: 'Empresa', key: 'company_name', width: 30 },
        { header: 'Activo', key: 'is_active', width: 15 }
    ];

    await exportToExcel(columns, product, 'Productos', 'Productos');
};
</script>
<template>
    <DataTable
        :style="{ fontSize: '11px', fontFamily: 'Arial, sans-serif' }"
        :value="product"
        :loading="loading"
        stripedRows
        responsiveLayout="scroll"
        paginator
        scrollable
        scrollHeight="400px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Productos"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        class="p-datatable-sm"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between mb-3">
                <!-- Exportar Excel -->
                <Button type="button" icon="pi pi-file-excel" label="Exportar" outlined @click="exportProducts()" />

                <!-- Buscador  -->
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="localFilters.global.value" placeholder="Buscar..." />
                </IconField>
            </div>
        </template>
        <!-- Mostrar mensaje cuando no hay registros -->
        <template #empty>
            <div class="flex justify-center items-center h-12">No se encontraron registros</div>
        </template>
        <Column field="name" header="Nombre" sortable style="min-width: 8rem" />
        <Column field="barcode" header="Código de barras" sortable style="min-width: 8rem" />
        <Column field="sku" header="SKU" sortable style="min-width: 8rem" />
        <Column field="description" header="Descripción" sortable style="min-width: 8rem" />
        <Column field="unit_name" header="Unidad" sortable style="min-width: 8rem" />
        <Column field="company_name" header="Empresa" sortable style="min-width: 8rem" />
        <Column field="is_active" header="Activo" sortable style="min-width: 8rem">
            <template #body="{ data }">
                <i :class="['pi text-xl', data.is_active ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500']" />
            </template>
        </Column>
        <Column :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info m-1" rounded text @click="$emit('edit', slotProps.data)" />
                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger m-1" rounded text @click="$emit('delete', slotProps.data)" />
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
:deep(.p-datatable) {
    font-size: 0.9rem;
}

:deep(.p-datatable .p-column-header-content) {
    justify-content: center;
}

:deep(.p-datatable-tbody td) {
    padding: 0.5rem 1rem;
}
</style>
