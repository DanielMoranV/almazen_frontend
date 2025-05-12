// src/stores/userStore.ts

import { createUser, deleteUser, fetchUsers, updateUser } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

// 🔧 Utilidad para manejar errores consistentemente
function handleError(error, fallbackMessage = 'Ocurrió un error') {
    return error?.response?.data?.message || error?.message || fallbackMessage;
}

export const useUsersStore = defineStore('userStore', {
    state: () => ({
        users: [], // ✅ Usa array en lugar de {}
        user: cache.getItem('user') || null,
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        usersList: (state) => state.users,
        currentUser: (state) => state.user,
        isLoadingUsers: (state) => state.isLoading
    },

    actions: {
        async fetchUsers() {
            this.isLoading = true;
            try {
                const { data, message, success } = await fetchUsers();
                this.users = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al obtener los usuarios');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async createUser(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createUser(payload);
                this.users.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al crear el usuario');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async updateUser(payload, id) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateUser(payload, id);
                this.users = this.users.map((u) => (u.id === id ? data : u));
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al actualizar el usuario');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async removeUser(id) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteUser(id);
                this.users = this.users.filter((u) => u.id !== id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al eliminar el usuario');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
