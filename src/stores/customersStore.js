import { defineStore } from 'pinia';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomer } from '@/api';
import { handleProcessSuccess, handleProcessError } from '@/utils/apiHelpers';

export const useCustomersStore = defineStore('customersStore', {
    state: () => ({
        customers: [],
        customer: null,
        isLoading: false,
        success: false,
        message: '',
        validationErrors: []
    }),

    getters: {
        customersList: (state) => state.customers,
        totalCustomers: (state) => state.customers.length,
        isLoadingCustomers: (state) => state.isLoading
    },

    actions: {
        async fetchCustomers(params = {}) {
            this._resetState();
            try {
                const res = await fetchCustomers(params);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.customers = processed.data;
                }
            } catch (err) {
                handleProcessError(err, this);
            } finally {
                this.isLoading = false;
            }
        },

        async fetchCustomer(id) {
            this._resetState();
            try {
                const res = await getCustomer(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.customer = processed.data;
                }
            } catch (err) {
                handleProcessError(err, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createCustomer(payload) {
            this._resetState();
            try {
                const res = await createCustomer(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.customers.unshift(processed.data);
                }
            } catch (err) {
                handleProcessError(err, this);
            } finally {
                this.isLoading = false;
            }
        },

        async updateCustomer(payload) {
            this._resetState();
            try {
                const res = await updateCustomer(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.customers = this.customers.map((c) => (c.id === payload.id ? processed.data : c));
                }
            } catch (err) {
                handleProcessError(err, this);
            } finally {
                this.isLoading = false;
            }
        },

        async removeCustomer(id) {
            this._resetState();
            try {
                const res = await deleteCustomer(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.customers = this.customers.filter((c) => c.id !== id);
                }
            } catch (err) {
                handleProcessError(err, this);
            } finally {
                this.isLoading = false;
            }
        },

        _resetState() {
            this.isLoading = true;
            this.success = false;
            this.message = '';
            this.validationErrors = [];
        }
    }
});
