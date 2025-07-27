<script setup>
import { ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { exportToExcel } from '@/utils/excelUtils';

const { categories, loading } = defineProps({
    categories: {
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
    name: {
        operator: FilterOperator.AND,
        constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]
    }
});

const localFilters = ref(initFilters());

watch(
    () => categories,
    () => {
        localFilters.value = initFilters();
    }
);

const exportCategories = async () => {
    const columns = [{ header: 'Nombre', key: 'name', width: 30 }];

    await exportToExcel(columns, categories, 'Categorias', 'Categorias');
};
</script>
<template>
    <DataTable
        :value="categories"
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Categorias"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        class="p-datatable-sm"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between mb-3">
                <!-- Exportar Excel -->
                <Button type="button" icon="pi pi-file-excel" label="Exportar" outlined @click="exportCategories()" />

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
        <Column :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info m-1" rounded text @click="$emit('edit', slotProps.data)" />
                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger m-1" rounded text @click="$emit('delete', slotProps.data)" />
            </template>
        </Column>
    </DataTable>
</template>
