import { defineStore } from 'pinia';
import { fetchMovementsStock, fetchEntries, fetchExits, fetchOutputs, createEntry, createExit, createOutput } from '@/api';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useMovementsStockStore = defineStore('movementsStockStore', {
    state: () => ({
        movementsStock: [],
        entries: [],
        exits: [],
        outputs: [],
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        movementsStockList: (state) => state.movementsStock,
        entriesList: (state) => state.entries,
        exitsList: (state) => state.exits,
        outputsList: (state) => state.outputs,
        isLoadingMovementsStock: (state) => state.isLoading
    },
    actions: {
        async fetchMovementsStock() {
            this.isLoading = true;

            try {
                const res = await fetchMovementsStock();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.movementsStock = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchEntries() {
            this.isLoading = true;

            try {
                const res = await fetchEntries();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.entries = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchExits() {
            this.isLoading = true;

            try {
                const res = await fetchExits();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.exits = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchOutputs() {
            this.isLoading = true;

            try {
                const res = await fetchOutputs();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.outputs = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createEntry(payload) {
            this.isLoading = true;
            try {
                const res = await createEntry(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.entries.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createExit(payload) {
            this.isLoading = true;
            try {
                const res = await createExit(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.exits.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createOutput(payload) {
            this.isLoading = true;
            try {
                const res = await createOutput(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.outputs.push(processed.data);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
