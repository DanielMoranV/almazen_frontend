import { defineStore } from 'pinia';
import { fetchUnits, createUnit, deleteUnit, updateUnit } from '@/api';
import cache from '@/utils/cache';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useUnitsStore = defineStore('unitsStore', {
    state: () => ({
        units: [],
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        unitsList: (state) => state.units,
        isLoadingUnits: (state) => state.isLoading
    },
    actions: {
        async fetchUnits() {
            this.isLoading = true;
            try {
                const res = await fetchUnits();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.units = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async createUnit(payload) {
            this.isLoading = true;
            try {
                const res = await createUnit(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.units.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteUnit(id) {
            this.isLoading = true;
            try {
                const res = await deleteUnit(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.units = this.units.filter((unit) => unit.id !== id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updateUnit(payload) {
            this.isLoading = true;
            try {
                const res = await updateUnit(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.units = this.units.map((unit) => (unit.id === payload.id ? processed.data : unit));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
