import { createUser, deleteUser, fetchUsers, updateUser } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useUsersStore = defineStore('userStore', {
    state: () => ({
        users: [],
        user: cache.getItem('user') || null,
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        usersList: (state) => state.users,
        currentUser: (state) => state.user,
        isLoadingUsers: (state) => state.isLoading
    },

    actions: {
        async fetchUsers() {
            this.resetState();
            try {
                const res = await fetchUsers();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.users = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createUser(payload) {
            this.resetState();
            try {
                const res = await createUser(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.users.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async updateUser(payload) {
            this.resetState();
            try {
                const res = await updateUser(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.users = this.users.map((u) => (u.id === payload.id ? processed.data : u));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async removeUser(id) {
            this.resetState();
            try {
                const res = await deleteUser(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.users = this.users.filter((u) => u.id !== id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        resetState() {
            this.isLoading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        }
    }
});
