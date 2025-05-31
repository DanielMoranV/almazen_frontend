import { defineStore } from 'pinia';
import { fetchWarehouses, createWarehouse, deleteWarehouse, updateWarehouse } from '@/api';
import cache from '@/utils/cache';
import { handleError } from '@/utils/handleError';

export const useWarehousesStore = defineStore('warehousesStore', {
    state: () => ({
        warehouses: [],
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        warehousesList: (state) => state.warehouses,
        isLoadingWarehouses: (state) => state.isLoading
    },
    actions: {
        async fetchWarehouses() {
            this.isLoading = true;
            try {
                const { data, message, success } = await fetchWarehouses();
                this.warehouses = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async createWarehouse(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createWarehouse(payload);
                this.warehouses.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteWarehouse(payload) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteWarehouse(payload, payload.id);
                this.warehouses = this.warehouses.filter((warehouse) => warehouse.id !== payload.id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async updateWarehouse(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateWarehouse(payload, payload.id);
                this.warehouses = this.warehouses.map((warehouse) => (warehouse.id === payload.id ? data : warehouse));
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
