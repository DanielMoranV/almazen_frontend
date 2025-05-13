<script setup>
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

import Toast from 'primevue/toast';
import { onMounted } from 'vue';

import { Positions } from '@/constants/positions';
import { useUsersStore } from '@/stores/usersStore';
import { onBeforeMount } from 'vue';

const usersStore = useUsersStore();

const filters = ref(null);

// Estado
const users = ref([]); // Aquí cargarás tus usuarios
const selectedUser = ref(null);
const userDialog = ref(false);
const deleteDialog = ref(false);
const submitted = ref(false);
const toast = useToast();

// Datos del formulario
const userForm = ref({
    id: null,
    name: '',
    dni: '',
    email: '',
    phone: '',
    position: '',
    is_active: true
});

// Roles de ejemplo (puedes reemplazar con datos reales)

const positions = Object.entries(Positions).map(([key, value]) => ({
    label: value,
    value: value
}));

// Métodos
const openNew = () => {
    userForm.value = { id: null, name: '', dni: '', email: '', phone: '', position: '', is_active: true };
    submitted.value = false;
    userDialog.value = true;
};

const editUser = (user) => {
    userForm.value = { ...user };
    userDialog.value = true;
};

const confirmDelete = (user) => {
    selectedUser.value = user;
    deleteDialog.value = true;
};

const hideDialog = () => {
    userDialog.value = false;
};

const hideDeleteDialog = () => {
    deleteDialog.value = false;
};

function initFilters() {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        dni: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        position: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
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
    await usersStore.fetchUsers();
    if (usersStore.success) {
        users.value = usersStore.usersList;
        toast.add({ severity: 'success', summary: 'Usuarios cargados', detail: usersStore.message, life: 3000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: usersStore.message, life: 3000 });
    }
});

const submitUser = async () => {
    if (userForm.value.id) {
        await usersStore.updateUser(userForm.value, userForm.value.id);
        if (usersStore.success) {
            users.value = usersStore.usersList;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario actualizado correctamente', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: usersStore.message, life: 3000 });
        }
    } else {
        await usersStore.createUser(userForm.value);
        if (usersStore.success) {
            users.value = usersStore.usersList;
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario creado correctamente', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: usersStore.message, life: 3000 });
        }
    }
    userDialog.value = false;
};
</script>

<template>
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold text-gray-800 dark:text-white">Gestión de Usuarios</h2>
            <Button label="Nuevo Usuario" icon="pi pi-plus" class="p-button-success" @click="openNew" />
        </div>

        <DataTable
            :value="users"
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
            :globalFilterFields="['name', 'dni', 'email', 'phone', 'position', 'is_active']"
            :rowsPerPageOptions="[5, 10, 20, 50]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Usuarios"
            :loading="usersStore.isLoadingUsers"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between mb-2">
                    <!-- Exportar Excel -->
                    <Button type="button" icon="pi pi-file-excel" label="Exportar Excel" outlined @click="exportUsers()" />

                    <!-- Buscador  -->
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Buscar..." />
                    </IconField>
                </div>
            </template>
            <Column field="name" header="Nombre" sortable />
            <Column field="dni" header="DNI" sortable />
            <Column field="phone" header="Teléfono" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="position" header="Cargo" sortable />
            <Column field="is_active" header="Activo" sortable>
                <template #body="slotProps">
                    <i class="pi pi-check-circle text-green-500 text-2xl" v-if="slotProps.data.is_active"></i>
                    <i class="pi pi-times-circle text-red-500 text-2xl" v-else></i>
                </template>
            </Column>
            <Column field="company_name" header="Empresa" sortable />
            <Column header="Acciones" :exportable="false" style="width: 150px">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info mr-2" @click="editUser(slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="confirmDelete(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <!-- Diálogo Crear/Editar -->
        <Dialog v-model:visible="userDialog" :style="{ width: '500px' }" header="Usuario" modal class="p-fluid" @hide="hideDialog">
            <div class="field mb-4">
                <label for="name" class="font-semibold">Nombre</label>
                <InputText id="name" v-model="userForm.name" autofocus required fluid />
            </div>

            <div class="field mb-4">
                <label for="dni" class="font-semibold">DNI</label>
                <InputText id="dni" v-model="userForm.dni" required fluid />
            </div>

            <div class="field mb-4">
                <label for="phone" class="font-semibold">Teléfono</label>
                <InputText id="phone" v-model="userForm.phone" required fluid />
            </div>

            <div class="field mb-4">
                <label for="email" class="font-semibold">Email</label>
                <InputText id="email" v-model="userForm.email" required fluid />
            </div>

            <div class="field mb-4">
                <label for="position" class="font-semibold">Cargo</label>
                <Select id="position" v-model="userForm.position" :options="positions" optionLabel="label" optionValue="value" placeholder="Selecciona un cargo" fluid />
            </div>

            <div class="field mb-4">
                <label for="is_active" class="font-semibold">Activo </label>
                <Checkbox id="is_active" binary v-model="userForm.is_active" />
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Guardar" icon="pi pi-check" text severity="success" :disabled="!userForm.name || !userForm.email || !userForm.position" :loading="usersStore.isLoadingUsers" @click="submitUser" />
            </template>
        </Dialog>

        <!-- Confirmación de Eliminación -->
        <Dialog v-model:visible="deleteDialog" :style="{ width: '400px' }" header="Confirmar" modal @hide="hideDeleteDialog">
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl" />
                <span
                    >¿Estás seguro de que deseas eliminar a <strong>{{ selectedUser?.name }}</strong
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" text @click="hideDeleteDialog" />
                <Button label="Eliminar" icon="pi pi-trash" text severity="danger" />
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
