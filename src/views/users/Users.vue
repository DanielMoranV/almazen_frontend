<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useUsersStore } from '@/stores/usersStore';
import UsersTable from '@/views/users/componentsUsers/UsersTable.vue';
import UserFormDialog from '@/views/users/componentsUsers/UserFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const usersStore = useUsersStore();

// Estados
const users = ref([]);
const selectedUser = ref(null);
const showUserDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadUsers();
});

// Métodos
const loadUsers = async () => {
    await usersStore.fetchUsers();
    if (usersStore.success) {
        users.value = usersStore.usersList;
        showSuccess('Usuarios cargados', usersStore.message);
    } else {
        if (usersStore.validationErrors && usersStore.validationErrors.length > 0) {
            usersStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(usersStore.message);
        }
    }
};

const handleUserSubmit = async (userData) => {
    const action = userData.id ? usersStore.updateUser : usersStore.createUser;
    await action(userData);
    if (usersStore.success) {
        users.value = usersStore.usersList;
        showSuccess(userData.id ? 'Usuario actualizado' : 'Usuario creado', usersStore.message);
        showUserDialog.value = false;
    } else {
        if (usersStore.validationErrors && usersStore.validationErrors.length > 0) {
            usersStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(usersStore.message);
        }
    }
};

const handleUserDelete = async () => {
    await usersStore.removeUser(selectedUser.value.id);
    if (usersStore.success) {
        users.value = usersStore.usersList;
        showSuccess('Usuario eliminado', usersStore.message);
    } else {
        if (usersStore.validationErrors && usersStore.validationErrors.length > 0) {
            usersStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(usersStore.message);
        }
    }
    showDeleteDialog.value = false;
};

// Helpers
const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (detail) => {
    toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
};
</script>

<template>
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Usuarios</h2>
            <Button
                icon="pi pi-plus"
                class="p-button-success"
                @click="
                    () => {
                        selectedUser = null;
                        showUserDialog = true;
                    }
                "
            />
        </div>

        <UsersTable
            :users="users"
            :loading="usersStore.isLoading"
            @edit="
                (user) => {
                    selectedUser = user;
                    showUserDialog = true;
                }
            "
            @delete="
                (user) => {
                    selectedUser = user;
                    showDeleteDialog = true;
                }
            "
        />

        <UserFormDialog v-model:visible="showUserDialog" :user="selectedUser" @submit="handleUserSubmit" :loading="usersStore.isLoadingUsers" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedUser?.name || ''" @confirm="handleUserDelete" />
    </div>
</template>

<style scoped>
.card {
    background: var(--surface-card);
    border-radius: 10px;
    padding: 2rem;
}
</style>
