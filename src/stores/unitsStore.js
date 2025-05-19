import { defineStore } from 'pinia';
import { fetchUnits, createUnit, deleteUnit, updateUnit } from '@/api';
import cache from '@/utils/cache';
import { handleError } from '@/utils/handleError';

export const useUnitsStore = defineStore('unitsStore', {
    state: () => ({
        units: [],
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        unitsList: (state) => state.units,
        isLoadingUnits: (state) => state.isLoading
    },
    actions: {
        async fetchUnits() {
            this.isLoading = true;
            try {
                const { data, message, success } = await fetchUnits();
                this.units = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async createUnit(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createUnit(payload);
                this.units.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async deleteUnit(id) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteUnit(id);
                this.units = this.units.filter((unit) => unit.id !== id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },
        async updateUnit(payload, id) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateUnit(payload, id);
                this.units = this.units.map((unit) => (unit.id === id ? data : unit));
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
