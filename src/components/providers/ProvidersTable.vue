<script setup>
import { ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { exportToExcel } from '@/utils/excelUtils';

const { providers, loading } = defineProps({
    providers: {
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
    contact_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] }
});

const localFilters = ref(initFilters());

watch(
    () => providers,
    () => {
        localFilters.value = initFilters();
    }
);

const exportProviders = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Nombre Contacto', key: 'contact_name', width: 30 },
        { header: 'Teléfono', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 30 }
    ];

    await exportToExcel(columns, providers, 'Proveedores', 'Proveedores');
};
</script>
<template>
    <DataTable
        :value="providers"
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
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Proveedores"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        class="p-datatable-sm"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between mb-3">
                <!-- Exportar Excel -->
                <Button type="button" icon="pi pi-file-excel" label="Exportar" outlined @click="exportProviders()" />

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
        <Column field="name" header="Nombre" sortable style="min-width: 10rem" />
        <Column field="contact_name" header="Nombre Contacto" sortable style="min-width: 10rem" />
        <Column field="phone" header="Teléfono" sortable style="min-width: 8rem" />
        <Column field="email" header="Email" sortable style="min-width: 10rem" />
        <Column :exportable="false" style="min-width: 8rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-info m-1" rounded text @click="$emit('edit', slotProps.data)" />
                <Button icon="pi pi-trash" class="p-button-rounded p-button-danger m-1" rounded text @click="$emit('delete', slotProps.data)" />
            </template>
        </Column>
    </DataTable>
</template>
