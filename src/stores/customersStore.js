import { createCustomer, deleteCustomer, fetchCustomers, getCustomer, lookupDocument, updateCustomer } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useCustomersStore = defineStore('customersStore', {
    state: () => ({
        customers: [],
        customer: null,
        isLoading: false,
        success: false,
        message: '',
        validationErrors: [],
        // Document lookup state
        documentData: null,
        isLoadingDocument: false,
        documentLookupSuccess: false,
        documentLookupMessage: '',
        documentLookupErrors: []
    }),

    getters: {
        customersList: (state) => state.customers,
        totalCustomers: (state) => state.customers.length,
        isLoadingCustomers: (state) => state.isLoading,
        // Document lookup getters
        isLoadingDocumentLookup: (state) => state.isLoadingDocument,
        documentLookupData: (state) => state.documentData,
        hasDocumentData: (state) => state.documentData !== null
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

        // Document lookup actions
        async lookupDocumentData(payload) {
            this._resetDocumentLookupState();
            try {
                const res = await lookupDocument(payload);
                const processed = handleProcessSuccess(res, this);
                console.log(processed);
                if (processed.success) {
                    this.documentData = processed.data;
                    this.documentLookupSuccess = true;
                    this.documentLookupMessage = processed.message || 'Datos obtenidos exitosamente';
                }
            } catch (err) {
                this.documentLookupSuccess = false;
                this.documentLookupMessage = err.response?.data?.message || 'Error al consultar documento';
                this.documentLookupErrors = err.response?.data?.errors || [];
            } finally {
                this.isLoadingDocument = false;
            }
        },

        clearDocumentData() {
            this.documentData = null;
            this.documentLookupSuccess = false;
            this.documentLookupMessage = '';
            this.documentLookupErrors = [];
        },

        _resetState() {
            this.isLoading = true;
            this.success = false;
            this.message = '';
            this.validationErrors = [];
        },

        _resetDocumentLookupState() {
            this.isLoadingDocument = true;
            this.documentLookupSuccess = false;
            this.documentLookupMessage = '';
            this.documentLookupErrors = [];
        }
    }
});
