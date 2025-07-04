import { getCompanyConfig, previewWorkflowChange, updateCompanyConfig } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useCompanyConfigStore = defineStore('companyConfigStore', {
    state: () => ({
        config: null,
        availableWorkflows: {},
        currentWorkflowDescription: {},
        previewData: null,
        isLoading: false,
        isSaving: false,
        message: '',
        success: false,
        validationErrors: []
    }),
    actions: {
        async fetchConfig() {
            this.isLoading = true;
            try {
                const res = await getCompanyConfig();
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.config = processed.data.config;
                    this.availableWorkflows = processed.data.available_workflows || {};
                    this.currentWorkflowDescription = processed.data.current_workflow_description || {};
                    this.success = true;
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al cargar configuración';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async previewChange(targetWorkflow) {
            this.isLoading = true;
            try {
                const res = await previewWorkflowChange(targetWorkflow);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.previewData = processed.data;
                    this.success = true;
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al previsualizar cambio';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },
        async updateConfig(newConfig) {
            this.isSaving = true;
            try {
                const res = await updateCompanyConfig(newConfig);
                const processed = handleProcessSuccess(res, this);
                if (processed.success) {
                    this.config = { ...this.config, ...newConfig };
                    this.message = processed.message || 'Configuración actualizada';
                    this.success = true;
                } else {
                    this.success = false;
                    this.message = processed.message || 'Error al actualizar configuración';
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isSaving = false;
            }
        }
    }
});