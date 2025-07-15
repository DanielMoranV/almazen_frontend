import { createCompany, deleteCompany, fetchCompanies, getCompanyConfig, previewWorkflowChange, updateCompany, updateCompanyConfig } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

// Normaliza la estructura de una empresa para asegurar que tenga todos los campos
function normalizeCompany(company) {
    return {
        id: company.id ?? null,
        company_name: company.company_name ?? '',
        address: company.address ?? '',
        phone: company.phone ?? '',
        email: company.email ?? '',
        website: company.website ?? '',
        logo: company.logo ?? '',
        description: company.description ?? '',
        is_active: company.is_active ?? true
    };
}

export const useCompaniesStore = defineStore('companiesStore', {
    state: () => ({
        companyConfig: cache.getItem('companyConfig') || null,
        companies: [],
        company: cache.getItem('company') || null,
        message: '',
        success: false,
        isLoading: false,
        validationErrors: []
    }),

    getters: {
        companiesList: (state) => state.companies,
        currentCompany: (state) => state.company,
        companyConfigState: (state) => state.companyConfig,
        isLoadingCompanies: (state) => state.isLoading
    },

    actions: {
        async fetchCompanies() {
            this.isLoading = true;
            try {
                const res = await fetchCompanies();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.companies = Array.isArray(processed.data) ? processed.data.map(normalizeCompany) : [];
                    this.success = true;
                    this.message = processed.message || 'Empresas cargadas correctamente';
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al cargar empresas';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async createCompany(payload) {
            this.isLoading = true;
            try {
                const res = await createCompany(payload);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.companies.push(normalizeCompany(processed.data));
                    this.success = true;
                    this.message = processed.message || 'Empresa creada correctamente';
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al crear empresa';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async updateCompany(payload) {
            this.isLoading = true;
            try {
                const res = await updateCompany(payload, payload.id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.companies = this.companies.map((c) => (c.id === payload.id ? normalizeCompany(processed.data) : c));
                    this.success = true;
                    this.message = processed.message || 'Empresa actualizada correctamente';
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al actualizar empresa';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        async updateCompanyConfigAction(config) {
            this.isLoading = true;
            try {
                const res = await updateCompanyConfig(config);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.companyConfig = processed.data ?? config;
                    cache.setItem('companyConfig', this.companyConfig);
                }
                return processed;
            } catch (error) {
                console.error('Error al actualizar la configuración de la empresa', error);
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async fetchCompanyConfig() {
            this.isLoading = true;
            try {
                const res = await getCompanyConfig();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.companyConfig = processed.data;
                    cache.setItem('companyConfig', processed.data);
                }
                return processed;
            } catch (error) {
                handleProcessError(error, this);
                throw error;
            } finally {
                this.isLoading = false;
            }
        },

        async previewWorkflowChangeAction(targetWorkflow) {
            try {
                const res = await previewWorkflowChange(targetWorkflow);
                return res;
            } catch (error) {
                // No actual state change, solo relay error
                console.error('previewWorkflowChange', error);
                throw error;
            }
        },

        async removeCompany(id) {
            this.isLoading = true;
            try {
                const res = await deleteCompany(id);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.companies = this.companies.filter((c) => c.id !== id);
                    this.success = true;
                    this.message = processed.message || 'Empresa eliminada correctamente';
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al eliminar empresa';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        }
    }
});
