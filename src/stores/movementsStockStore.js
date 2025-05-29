import { defineStore } from 'pinia';

export const useMovementsStockStore = defineStore('movementsStockStore', {
    state: () => ({
        movementsStock: [],
        entries: [],
        exits: [],
        outputs: [],
        message: '',
        success: false,
        isLoading: false
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
                const { data, message, success } = await fetchMovementsStock();
                this.movementsStock = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchEntries() {
            this.isLoading = true;

            try {
                const { data, message, success } = await fetchEntries();
                this.entries = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchExits() {
            this.isLoading = true;

            try {
                const { data, message, success } = await fetchExits();
                this.exits = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchOutputs() {
            this.isLoading = true;

            try {
                const { data, message, success } = await fetchOutputs();
                this.outputs = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async createEntry(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createEntry(payload);
                this.entries.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async createExit(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createExit(payload);
                this.exits.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error);
            } finally {
                this.isLoading = false;
            }
        },

        async createOutput(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createOutput(payload);
                this.outputs.push(data);
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
