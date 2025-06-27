<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useUsersStore } from '@/stores/usersStore';
import UserFormDialog from '@/views/users/componentsUsers/UserFormDialog.vue';
import UsersTable from '@/views/users/componentsUsers/UsersTable.vue';
import UserToolbar from '@/views/users/componentsUsers/UserToolbar.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const usersStore = useUsersStore();

// Estados locales
const selectedUser = ref(null);
const showUserDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

// Estados computados del store
const totalUsers = computed(() => usersStore.totalUsers);
const isLoading = computed(() => usersStore.isLoading);
const hasUsers = computed(() => usersStore.usersList.length > 0);

// Inicialización
onMounted(async () => {
    await loadUsers();
});

// Gestión de carga inicial
const loadUsers = async () => {
    await usersStore.fetchUsers();
    if (usersStore.success) {
        showSuccess('Usuarios cargados', 'Lista actualizada correctamente');
    }
};

// Gestión de usuarios
const openCreateDialog = () => {
    selectedUser.value = null;
    isCreating.value = true;
    showUserDialog.value = true;
};

const openEditDialog = (user) => {
    selectedUser.value = { ...user };
    isCreating.value = false;
    showUserDialog.value = true;
};

const openDeleteDialog = (user) => {
    selectedUser.value = user;
    showDeleteDialog.value = true;
};

const handleUserSubmit = async (userData) => {
    const action = isCreating.value ? usersStore.createUser : usersStore.updateUser;
    await action(userData);

    if (usersStore.success) {
        const message = isCreating.value ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente';
        showSuccess(message, usersStore.message);
        showUserDialog.value = false;
        // Recargar la página actual para mostrar el nuevo/editado usuario
        await usersStore.fetchUsers();
    } else {
        handleApiErrors(usersStore);
    }
};

const handleUserDelete = async () => {
    await usersStore.removeUser(selectedUser.value.id);

    if (usersStore.success) {
        showSuccess('Usuario eliminado', usersStore.message);
        showDeleteDialog.value = false;
        // Recargar para reflejar la eliminación
        await usersStore.fetchUsers();
    } else {
        handleApiErrors(usersStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await usersStore.fetchUsers();
    showSuccess('Datos actualizados', 'Lista de usuarios actualizada');
};

// Helpers para manejo de respuestas API
const handleApiErrors = (store) => {
    if (store.validationErrors && store.validationErrors.length > 0) {
        store.validationErrors.forEach((err) => {
            toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
        });
    } else {
        showError('Error', store.message || 'Ha ocurrido un error inesperado');
    }
};

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (summary, detail) => {
    toast.add({ severity: 'error', summary, detail, life: 4000 });
};
</script>

<template>
    <div class="users-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal Mejorado -->
        <UserToolbar :total-users="totalUsers" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Área Principal de Contenido con Animaciones -->
        <div class="content-wrapper">
            <!-- Estado Vacío Mejorado -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasUsers" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-users"></i>
                        </div>
                        <h3 class="empty-title">
                            {{ usersStore.getCurrentSearchTerm ? 'No se encontraron usuarios' : 'Aún no tienes usuarios' }}
                        </h3>
                        <p class="empty-description">
                            {{ usersStore.getCurrentSearchTerm ? 'Intenta con otros términos de búsqueda o limpia los filtros.' : 'Crea tu primer usuario para empezar a gestionar el sistema.' }}
                        </p>
                        <div class="empty-actions">
                            <Button v-if="!usersStore.getCurrentSearchTerm" icon="pi pi-plus" label="Agregar Usuario" class="primary-action-btn" @click="openCreateDialog" />
                            <Button v-else icon="pi pi-times" label="Limpiar Búsqueda" class="secondary-action-btn" @click="usersStore.clearSearch && usersStore.clearSearch()" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Usuarios con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasUsers" class="table-container">
                    <UsersTable :users="usersStore.usersList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </transition>

            <!-- Estado de Carga Mejorado -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando usuarios...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <UserFormDialog v-model:visible="showUserDialog" :user="selectedUser" :loading="isLoading" @submit="handleUserSubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedUser?.name || ''" @confirm="handleUserDelete" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de usuarios */
.users-page {
    @apply min-h-screen;
}

/* Contenedor de contenido con espaciado y diseño mejorado */
.content-wrapper {
    @apply mt-6 space-y-6;
}

/* Contenedor de tabla con efecto de elevación */
.table-container {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Estado vacío mejorado con diseño centrado */
.empty-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-purple-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

/* Contenedor del ícono mejorado */
.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg;
}

/* Estilo del ícono con animación */
.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

/* Título del estado vacío mejorado */
.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Descripción del estado vacío */
.empty-description {
    @apply text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed;
}

/* Contenedor de acciones en estado vacío */
.empty-actions {
    @apply flex justify-center gap-4;
}

/* Botón de acción principal */
.primary-action-btn {
    @apply bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-none text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105;
}

/* Botón de acción secundaria */
.secondary-action-btn {
    @apply bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300;
}

/* Estado de carga mejorado */
.loading-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl;
}

.loading-content {
    @apply text-center px-8 py-12;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

/* Animaciones de transición */
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

.slide-up-enter-active {
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
    transform: translateY(20px);
    opacity: 0;
}

/* Animaciones de CSS */
@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .empty-content {
        @apply px-4 py-8;
    }
    
    .empty-title {
        @apply text-2xl;
    }
    
    .empty-description {
        @apply text-base;
    }
    
    .empty-actions {
        @apply flex-col gap-3;
    }
    
    .primary-action-btn,
    .secondary-action-btn {
        @apply w-full;
    }
}

/* Mejoras adicionales para modo oscuro */
@media (prefers-color-scheme: dark) {
    .table-container {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
