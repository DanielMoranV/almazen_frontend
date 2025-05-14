import { createCompany, deleteCompany, fetchCompanies, updateCompany } from '@/api';
import cache from '@/utils/cache';
import { defineStore } from 'pinia';

// 🔧 Utilidad para manejar errores consistentemente
function handleError(error, fallbackMessage = 'Ocurrió un error') {
    return error?.response?.data?.message || error?.message || fallbackMessage;
}

export const useCompaniesStore = defineStore('companiesStore', {
    state: () => ({
        companies: [], // ✅ Usa array en lugar de {}
        company: cache.getItem('company') || null,
        message: '',
        success: false,
        isLoading: false
    }),

    getters: {
        companiesList: (state) => state.companies,
        currentCompany: (state) => state.company,
        isLoadingCompanies: (state) => state.isLoading
    },

    actions: {
        async fetchCompanies() {
            this.isLoading = true;
            try {
                const { data, message, success } = await fetchCompanies();
                this.companies = data;
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al obtener las empresas');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async createCompany(payload) {
            this.isLoading = true;
            try {
                const { data, message, success } = await createCompany(payload);
                this.companies.push(data);
                this.message = message;
                this.success = success;
            } catch (error) {
                console.log(error);
                this.message = handleError(error, 'Error al crear la empresa');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async updateCompany(payload, id) {
            this.isLoading = true;
            try {
                const { data, message, success } = await updateCompany(payload, id);
                this.companies = this.companies.map((c) => (c.id === id ? data : c));
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al actualizar la empresa');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        },

        async removeCompany(id) {
            this.isLoading = true;
            try {
                const { message, success } = await deleteCompany(id);
                this.companies = this.companies.filter((c) => c.id !== id);
                this.message = message;
                this.success = success;
            } catch (error) {
                this.message = handleError(error, 'Error al eliminar la empresa');
                this.success = false;
            } finally {
                this.isLoading = false;
            }
        }
    }
});
