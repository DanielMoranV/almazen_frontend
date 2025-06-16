import { defineStore } from 'pinia';
import { fetchPurchaseOrders, createPurchaseOrder, deletePurchaseOrder, updatePurchaseOrder, approvePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder } from '@/api';
import cache from '@/utils/cache';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const usePurchaseStore = defineStore('purchaseStore', {
    state: () => ({
        purchaseOrders: [],
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        purchaseOrdersList: (state) => state.purchaseOrders,
        isLoadingPurchaseOrders: (state) => state.isLoading
    },
    actions: {
        async fetchPurchaseOrders() {
            this.isLoading = true;
            try {
                const res = await fetchPurchaseOrders();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = processed.data.purchases;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async createPurchaseOrder(payload) {
            this.isLoading = true;
            try {
                const res = await createPurchaseOrder(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders.unshift(processed.data.purchase);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async deletePurchaseOrder(id) {
            this.isLoading = true;
            try {
                const res = await deletePurchaseOrder(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = this.purchaseOrders.filter((purchaseOrder) => purchaseOrder.id !== id);
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updatePurchaseOrder(payload) {
            this.isLoading = true;
            try {
                const res = await updatePurchaseOrder(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = this.purchaseOrders.map((purchaseOrder) => (purchaseOrder.id === payload.id ? processed.data.purchase : purchaseOrder));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async approvePurchaseOrder(id) {
            this.isLoading = true;
            try {
                const res = await approvePurchaseOrder(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = this.purchaseOrders.map((purchaseOrder) => (purchaseOrder.id === id ? { ...purchaseOrder, status: processed.data.purchase.status } : purchaseOrder));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async receivePurchaseOrder(id) {
            this.isLoading = true;
            try {
                const res = await receivePurchaseOrder(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = this.purchaseOrders.map((purchaseOrder) => (purchaseOrder.id === id ? { ...purchaseOrder, status: processed.data.purchase.status } : purchaseOrder));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async cancelPurchaseOrder(id) {
            this.isLoading = true;
            try {
                const res = await cancelPurchaseOrder(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = this.purchaseOrders.map((purchaseOrder) => (purchaseOrder.id === id ? { ...purchaseOrder, status: processed.data.purchase.status } : purchaseOrder));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
