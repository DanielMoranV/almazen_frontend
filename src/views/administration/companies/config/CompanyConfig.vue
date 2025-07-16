<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import ConfigPreview from './components/ConfigPreview.vue';
import WorkflowConfigCard from './components/WorkflowConfigCard.vue';

const companiesStore = useCompaniesStore();
const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const saving = ref(false);

const companyConfig = ref({
    company_id: null,
    purchase_workflow: 'standard'
});

const currentCompany = computed(() => authStore.currentUser?.company_config);
const workflowPreview = computed(() => companiesStore.workflowPreviewState);
const hasValidCompany = computed(() => currentCompany.value && currentCompany.value.id);

// Nuevos computed para manejar la estructura del preview
const canChangeWorkflow = computed(() => companiesStore.canChangeWorkflow);
const blockingIssues = computed(() => companiesStore.workflowBlockingIssues);
const previewWarnings = computed(() => companiesStore.workflowWarnings);
const recommendedActions = computed(() => companiesStore.workflowRecommendedActions);
const currentData = computed(() => companiesStore.workflowCurrentData);

onMounted(async () => {
    if (hasValidCompany.value) {
        await loadCompanyConfig();
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error de Configuración',
            detail: 'No se pudo cargar la información de la empresa',
            life: 5000
        });
    }
});

const loadCompanyConfig = async () => {
    loading.value = true;
    try {
        await companiesStore.fetchCompanyConfig();

        if (!companiesStore.success) {
            throw new Error(companiesStore.message || 'Error al obtener la configuración');
        }

        const cfg = companiesStore.companyConfigState?.config;
        if (!cfg) {
            throw new Error('Configuración no encontrada');
        }

        companyConfig.value = {
            company_id: cfg.company_id || currentCompany.value?.id,
            purchase_workflow: cfg.purchase_workflow || 'standard'
        };

        if (companyConfig.value.company_id) {
            authStore.setCompanyConfig(companyConfig.value);
        }
    } catch (error) {
        console.error('Error loading company config:', error);
        toast.add({
            severity: 'error',
            summary: 'Error de Carga',
            detail: error.message || 'No se pudo cargar la configuración de la empresa',
            life: 5000
        });

        companyConfig.value = {
            company_id: currentCompany.value?.id || null,
            purchase_workflow: 'standard'
        };
    } finally {
        loading.value = false;
    }
};

const updateWorkflowConfig = async (newConfig) => {
    // Mantener referencia al flujo actual por si necesitamos revertir
    const previousWorkflow = companyConfig.value.purchase_workflow;
    if (!newConfig || !newConfig.purchase_workflow) {
        toast.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: 'Configuración inválida',
            life: 3000
        });
        return;
    }

    saving.value = true;
    try {
        await companiesStore.previewWorkflowChangeAction(newConfig.purchase_workflow);

        const blocking = companiesStore.workflowBlockingIssues;
        const canChange = companiesStore.canChangeWorkflow;

        console.log('canChange', canChange);
        console.log('blocking', blocking);

        if (!canChange || blocking > 0) {
            const warnings = companiesStore.workflowWarnings;
            const warningMessage = warnings.length > 0 ? warnings[0] : `Hay ${blocking} compra${blocking > 1 ? 's' : ''} que impide${blocking > 1 ? 'n' : ''} el cambio de flujo.`;

            toast.add({
                severity: 'warn',
                summary: 'Cambio Bloqueado',
                detail: warningMessage,
                life: 7000
            });
            saving.value = false;
            // Revertir visualmente al flujo anterior y limpiar vista previa
            companyConfig.value.purchase_workflow = previousWorkflow;
            companiesStore.clearWorkflowPreview();
            return;
        } else {
            await persistWorkflow(newConfig);
        }

        async function persistWorkflow(configToSave) {
            await companiesStore.updateCompanyConfigAction(configToSave);

            if (!companiesStore.success) {
                throw new Error(companiesStore.message || 'Error al guardar la configuración');
            }

            toast.add({
                severity: 'success',
                summary: 'Configuración Actualizada',
                detail: companiesStore.message || 'El flujo de compras ha sido configurado exitosamente',
                life: 4000
            });
        } // fin persistWorkflow
    } catch (error) {
        console.error('Error updating workflow config:', error);
        toast.add({
            severity: 'error',
            summary: 'Error al Guardar',
            detail: error.message || 'No se pudo actualizar la configuración',
            life: 5000
        });
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <ConfirmDialog />
    <div class="company-config-container">
        <div class="page-header">
            <div class="header-content">
                <h1 class="page-title">
                    <i class="pi pi-cog"></i>
                    Configuración de Empresa
                </h1>
                <p class="page-subtitle">Configure las preferencias de flujo de trabajo para su empresa</p>
            </div>
        </div>

        <div v-if="loading" class="loading-container">
            <ProgressSpinner />
            <p>Cargando configuración...</p>
        </div>

        <div v-else class="config-grid">
            <!-- Configuración de Flujo de Compras -->
            <WorkflowConfigCard :config="companyConfig" :saving="saving" @update="updateWorkflowConfig" />

            <!-- Vista Previa del Flujo -->
            <ConfigPreview :workflow="companyConfig.purchase_workflow" :preview="workflowPreview" :can-change="canChangeWorkflow" :blocking-issues="blockingIssues" :current-data="currentData" />

            <!-- Panel de Configuraciones Futuras -->
            <Card class="future-config-card">
                <template #header>
                    <div class="card-header">
                        <i class="pi pi-clock"></i>
                        <h3>Próximas Configuraciones</h3>
                    </div>
                </template>

                <template #content>
                    <div class="future-features">
                        <div class="feature-item">
                            <i class="pi pi-warehouse"></i>
                            <span>Políticas de Inventario</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-chart-bar"></i>
                            <span>Configuración de Reportes</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-percentage"></i>
                            <span>Políticas de Descuentos</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-file-pdf"></i>
                            <span>Configuración de Facturación</span>
                        </div>
                    </div>
                    <p class="future-note">Estas configuraciones estarán disponibles en futuras actualizaciones.</p>
                </template>
            </Card>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.company-config-container {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: 2rem;

    .header-content {
        text-align: center;

        .page-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
            font-weight: 600;
            color: var(--primary-color);

            i {
                font-size: 1.75rem;
            }
        }

        .page-subtitle {
            margin: 0;
            color: var(--text-color-secondary);
            font-size: 1.1rem;
        }
    }
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem;
    gap: 1rem;

    p {
        color: var(--text-color-secondary);
        margin: 0;
    }
}

.config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
}

.future-config-card {
    .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;

        i {
            color: var(--primary-color);
            font-size: 1.25rem;
        }

        h3 {
            margin: 0;
            color: var(--text-color);
        }
    }

    .future-features {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;

        .feature-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: var(--surface-ground);
            border-radius: var(--border-radius);
            opacity: 0.7;

            i {
                color: var(--primary-color);
                font-size: 1.1rem;
                width: 1.5rem;
                text-align: center;
            }

            span {
                color: var(--text-color);
                font-weight: 500;
            }
        }
    }

    .future-note {
        margin: 0;
        color: var(--text-color-secondary);
        font-style: italic;
        text-align: center;
    }
}
</style>
