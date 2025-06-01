import { defineStore } from 'pinia';
import { fetchWarehouses, createWarehouse, deleteWarehouse, updateWarehouse } from '@/api';
import cache from '@/utils/cache';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useWarehousesStore = defineStore('warehousesStore', {
    state: () => ({
        warehouses: [],
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        warehousesList: (state) => state.warehouses,
        isLoadingWarehouses: (state) => state.isLoading
    },
    actions: {
        async fetchWarehouses() {
            this.isLoading = true;
            try {
                const res = await fetchWarehouses();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.warehouses = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async createWarehouse(payload) {
            this.isLoading = true;
            try {
                const res = await createWarehouse(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.warehouses.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteWarehouse(payload) {
            this.isLoading = true;
            try {
                const res = await deleteWarehouse(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.warehouses = this.warehouses.filter((warehouse) => warehouse.id !== payload.id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updateWarehouse(payload) {
            this.isLoading = true;
            try {
                const res = await updateWarehouse(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.warehouses = this.warehouses.map((warehouse) => (warehouse.id === payload.id ? processed.data : warehouse));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        resetState() {
            this.isLoading = false;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        }
    }
});
