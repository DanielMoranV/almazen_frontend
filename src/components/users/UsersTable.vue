<script setup>
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { ref, watch } from 'vue';
import { exportToExcel } from '@/utils/excelUtils';

const { users, loading } = defineProps({
    users: { type: Array, required: true },
    loading: { type: Boolean, default: false }
});

defineEmits(['edit', 'delete']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    dni: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    position: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

watch(
    () => users,
    (newUsers) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);
const exportUsers = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Cargo', key: 'position', width: 15 },
        { header: 'Activo', key: 'is_active', width: 15 },
        { header: 'Empresa', key: 'company_name', width: 30 }
    ];

    await exportToExcel(columns, users, 'Usuarios', 'Usuarios');
};
</script>

<template>
    <DataTable
        :style="{ fontSize: '11px', fontFamily: 'Arial, sans-serif' }"
        :value="users"
        dataKey="id"
        scrollable
        scrollHeight="400px"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        :filters="localFilters"
        :loading="loading"
        stripedRows
        removableSort
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Usuarios"
        class="p-datatable-sm"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between mb-3">
                <!-- Exportar Excel -->
                <Button type="button" icon="pi pi-file-excel" label="Exportar" outlined @click="exportUsers()" />

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
        <Column field="dni" header="DNI" sortable style="min-width: 5rem" />
        <Column field="email" header="Email" sortable style="min-width: 8rem" />
        <Column field="phone" header="Teléfono" sortable style="min-width: 5rem" />
        <Column field="position" header="Cargo" sortable style="min-width: 5rem" />
        <Column field="is_active" header="Activo" sortable style="min-width: 5rem">
            <template #body="{ data }">
                <i :class="['pi text-xl', data.is_active ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500']" />
            </template>
        </Column>

        <Column header="Acciones" :exportable="false" style="min-width: 5rem">
            <template #body="{ data }">
                <div class="flex gap-2">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-info" @click="$emit('edit', data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="$emit('delete', data)" />
                </div>
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
