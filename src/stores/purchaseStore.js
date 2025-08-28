import {
    approvePurchaseOrder,
    cancelPurchaseOrder,
    createPurchaseOrder,
    deletePurchaseOrder,
    fetchProviders,
    fetchPurchaseOrders,
    fetchWarehouses,
    receivePurchaseOrder,
    searchPurchaseOrdersAdvanced,
    searchPurchaseOrdersByNumber,
    updatePurchaseOrder
} from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const usePurchaseStore = defineStore('purchaseStore', {
    state: () => ({
        purchaseOrders: [],
        providers: [],
        warehouses: [],
        message: '',
        success: false,
        isLoading: false,
        validationErrors: [],
        isInitialLoad: true
    }),

    getters: {
        purchaseOrdersList: (state) => state.purchaseOrders,
        providersList: (state) => state.providers,
        warehousesList: (state) => state.warehouses,
        isLoadingPurchaseOrders: (state) => state.isLoading
    },
    actions: {
        async fetchPurchaseOrders(params = {}) {
            this.isLoading = true;
            try {
                const res = await fetchPurchaseOrders(params);
                const processed = handleProcessSuccess(res, this);

                console.log(processed);
                if (processed.success) {
                    this.purchaseOrders = processed.data;
                    this.isInitialLoad = false;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async searchPurchaseOrdersAdvanced(params = {}) {
            this.isLoading = true;
            try {
                const res = await searchPurchaseOrdersAdvanced(params);
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

        async searchPurchaseOrdersByNumber(orderNumber) {
            this.isLoading = true;
            try {
                const res = await searchPurchaseOrdersByNumber(orderNumber);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = processed.data;
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchProviders() {
            try {
                const res = await fetchProviders();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.providers = processed.data;
                }
            } catch (error) {
                console.warn('Error loading providers:', error);
            }
        },

        async fetchWarehouses() {
            try {
                const res = await fetchWarehouses();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.warehouses = processed.data;
                }
            } catch (error) {
                console.warn('Error loading warehouses:', error);
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
                    this.purchaseOrders = this.purchaseOrders.map((order) => (order.id === id ? { ...order, status: 'APPROVED' } : order));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async receivePurchaseOrder(id, batchData = null) {
            this.isLoading = true;
            try {
                const res = await receivePurchaseOrder(id, batchData);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.purchaseOrders = this.purchaseOrders.map((order) => (order.id === id ? { ...order, status: 'RECEIVED' } : order));
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
                    this.purchaseOrders = this.purchaseOrders.map((order) => (order.id === id ? { ...order, status: 'CANCELLED' } : order));
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
