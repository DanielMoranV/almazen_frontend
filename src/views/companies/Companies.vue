<script setup>
import { useToast } from 'primevue/usetoast';
import { onBeforeMount, onMounted, ref } from 'vue';

import { useCompaniesStore } from '@/stores/companiesStore';

import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
const companiesStore = useCompaniesStore();

const filters = ref(null);

// Estado
const companies = ref([]); // Aquí cargarás tus empresas
const selectedCompany = ref(null);
const companyDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const toast = useToast();

// Datos del formulario
const companyForm = ref({
    id: null,
    company_name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    description: '',
    is_active: true
});

const openNew = () => {
    companyForm.value = { id: null, company_name: '', address: '', phone: '', email: '', website: '', logo: '', description: '', is_active: true };
    submitted.value = false;
    companyDialog.value = true;
};

const editCompany = (company) => {
    companyForm.value = { ...company };
    companyDialog.value = true;
};

const confirmDelete = (company) => {
    selectedCompany.value = company;
    deleteDialog.value = true;
};

const hideDialog = () => {
    companyDialog.value = false;
};

const hideDeleteDialog = () => {
    deleteDialog.value = false;
};

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        company_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        address: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        website: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        logo: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
    };
}

onBeforeMount(() => {
    initFilters();
});

function clearFilter() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
    initFilters();
}

onMounted(async () => {
    await companiesStore.fetchCompanies();
    if (companiesStore.success) {
        companies.value = companiesStore.companiesList;
        toast.add({ severity: 'success', summary: 'Empresas cargadas', detail: companiesStore.message, life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: companiesStore.message, life: 3000 });
    }
});

const submitCompany = async () => {
    if (companyForm.value.id) {
        await companiesStore.updateCompany(companyForm.value, companyForm.value.id);
        if (companiesStore.success) {
            companies.value = companiesStore.companiesList;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa actualizada correctamente', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: companiesStore.message, life: 3000 });
        }
    } else {
        await companiesStore.createCompany(companyForm.value);
        if (companiesStore.success) {
            companies.value = companiesStore.companiesList;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa creada correctamente', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: companiesStore.message, life: 3000 });
        }
    }
    companyDialog.value = false;
};

const deleteCompany = async (company) => {
    let idCompany = company.id;
    await companiesStore.removeCompany(idCompany);
    if (companiesStore.success) {
        companies.value = companiesStore.companiesList;
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empresa eliminada correctamente', life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: companiesStore.message, life: 3000 });
    }

    deleteDialog.value = false;
};

const exportCompanies = async () => {
    const columns = [
        { header: 'Nombre', key: 'company_name', width: 25 },
        { header: 'Dirección', key: 'address', width: 25 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 20 },
        { header: 'Web', key: 'website', width: 20 },
        { header: 'Logo', key: 'logo', width: 20 },
        { header: 'Descripción', key: 'description', width: 25 },
        { header: 'Activo', key: 'is_active', width: 15 },
        { header: 'Acciones', key: 'actions', width: 150 }
    ];

    await exportToExcel(columns, companies.value, 'Empresas', 'Empresas');
};
</script>
<template>
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Empresas</h2>
            <Button icon="pi pi-plus" class="p-button-success" @click="openNew" />
        </div>

        <DataTable
            :style="{ fontSize: '11px', fontFamily: 'Arial, sans-serif' }"
            :value="companies"
            dataKey="id"
            class="p-datatable-sm"
            :scrollable="true"
            stripedRows
            size="small"
            v-model:filters="filters"
            scrollHeight="400px"
            responsiveLayout="scroll"
            paginator
            :rows="5"
            :globalFilterFields="['company_name', 'address', 'phone', 'email', 'website', 'logo', 'description', 'is_active']"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Empresas"
            :loading="companiesStore.isLoadingCompanies"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between mb-3">
                    <!-- Exportar Excel -->
                    <Button type="button" icon="pi pi-file-excel" label="Exportar" outlined @click="exportCompanies()" />

                    <!-- Buscador  -->
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>
            <!-- Mostrar mensaje cuando no hay registros -->
            <template #empty>
                <div class="flex justify-center items-center h-12">No se encontraron registros</div>
            </template>
            <Column field="company_name" header="Nombre" sortable style="min-width: 8rem" />
            <Column field="address" header="Dirección" sortable style="min-width: 8rem" />
            <Column field="phone" header="Teléfono" sortable style="min-width: 5rem" />
            <Column field="email" header="Email" sortable style="min-width: 5rem" />
            <Column field="website" header="Web" sortable style="min-width: 5rem" />
            <!-- <Column field="logo" header="Logo" sortable style="min-width: 5rem" /> -->
            <Column field="description" header="Descripción" sortable style="min-width: 10rem" />
            <Column field="is_active" header="Activo" sortable style="min-width: 5rem">
                <template #body="slotProps">
                    <i class="pi pi-check-circle text-green-500 text-2xl" v-if="slotProps.data.is_active"></i>
                    <i class="pi pi-times-circle text-red-500 text-2xl" v-else></i>
                </template>
            </Column>
            <Column header="Acciones" :exportable="false" style="min-width: 3rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info m-1" @click="editCompany(slotProps.data)" />
                    <!-- <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDelete(slotProps.data)" /> -->
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo Crear/Editar -->
        <Dialog v-model:visible="companyDialog" :style="{ width: '500px' }" header="Empresa" modal class="p-fluid" @hide="hideDialog">
            <div class="field mb-4">
                <label for="company_name" class="font-semibold">Nombre</label>
                <InputText id="company_name" v-model="companyForm.company_name" autofocus required fluid />
            </div>

            <div class="field mb-4">
                <label for="address" class="font-semibold">Dirección</label>
                <InputText id="address" v-model="companyForm.address" required fluid />
            </div>

            <div class="field mb-4">
                <label for="phone" class="font-semibold">Teléfono</label>
                <InputText id="phone" v-model="companyForm.phone" required fluid />
            </div>

            <div class="field mb-4">
                <label for="email" class="font-semibold">Email</label>
                <InputText id="email" v-model="companyForm.email" required fluid />
            </div>

            <div class="field mb-4">
                <label for="website" class="font-semibold">Web</label>
                <InputText id="website" v-model="companyForm.website" required fluid />
            </div>

            <div class="field mb-4">
                <label for="logo" class="font-semibold">Logo</label>
                <InputText id="logo" v-model="companyForm.logo" required fluid />
            </div>

            <div class="field mb-4">
                <label for="description" class="font-semibold">Descripción</label>
                <InputText id="description" v-model="companyForm.description" required fluid />
            </div>

            <div class="field mb-4">
                <label for="is_active" class="font-semibold">Activo </label>
                <Checkbox id="is_active" binary v-model="companyForm.is_active" />
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button
                    label="Guardar"
                    icon="pi pi-check"
                    text
                    severity="success"
                    :disabled="!companyForm.company_name || !companyForm.email || !companyForm.address || !companyForm.phone || !companyForm.logo || !companyForm.description"
                    :loading="companiesStore.isLoadingCompanies"
                    @click="submitCompany"
                />
            </template>
        </Dialog>

        <!-- Confirmación de Eliminación -->
        <Dialog v-model:visible="deleteDialog" :style="{ width: '400px' }" header="Confirmar" modal @hide="hideDeleteDialog">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl" />
                <span
                    >¿Estás seguro de que deseas eliminar a <strong>{{ selectedCompany?.company_name }}</strong
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDeleteDialog" />
                <Button label="Eliminar" icon="pi pi-trash" text severity="danger" :loading="companiesStore.isLoadingCompanies" @click="deleteCompany(selectedCompany)" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.field label {
    display: block;
    margin-bottom: 0.5rem;
}
</style>
