import { createStockTransfer, fetchStockTransfers, restoreStockTransfer } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useStockTransfersStore = defineStore('stockTransfers', {
    state: () => ({
        transfers: [],
        isLoading: false,
        success: false,
        message: '',
        validationErrors: [],
        filters: {
            from_date: null,
            to_date: null,
            from_warehouse_id: null,
            to_warehouse_id: null,
            product_id: null,
            product_search: null,
            batch_id: null,
            user_id: null,
            status: null
        }
    }),
    actions: {
        async loadTransfers(params = {}) {
            this.isLoading = true;
            try {
                const mergedParams = { ...this.filters, ...params };
                const finalParams = Object.fromEntries(Object.entries(mergedParams).filter(([, v]) => v !== null && v !== ''));
                const res = await fetchStockTransfers(finalParams);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.transfers = processed.data || [];
                }
                console.log('Transfers loaded:', this.transfers);
                return processed;
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async createTransfer(payload) {
            this.isLoading = true;
            try {
                const res = await createStockTransfer(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.transfers.unshift(processed.data.transfer);
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        async restoreTransfer(id) {
            this.isLoading = true;
            try {
                const res = await restoreStockTransfer(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    // Opcional: recargar lista o actualizar transferencias localmente
                    await this.loadTransfers();
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },
        clearFilters() {
            this.filters = {
                from_date: null,
                to_date: null,
                from_warehouse_id: null,
                to_warehouse_id: null,
                product_id: null,
                product_search: null,
                batch_id: null,
                user_id: null,
                status: null
            };
        },
        clearMessage() {
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        },
        async fetchTransfers() {
            return await this.loadTransfers();
        },
        async updateTransfer(payload) {
            // For now, just call createTransfer as the API might handle updates
            // This would need to be implemented based on your API structure
            return await this.createTransfer(payload);
        }
    }
});
