<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

import ConfigPreview from './components/ConfigPreview.vue';
import WorkflowConfigCard from './components/WorkflowConfigCard.vue';

const companiesStore = useCompaniesStore();
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);

const companyConfig = ref({
    company_id: null,
    purchase_workflow: 'standard'
});

const currentCompany = computed(() => authStore.currentUser?.company_config);

onMounted(async () => {
    if (currentCompany.value) {
        await loadCompanyConfig();
    }
});

const loadCompanyConfig = async () => {
    loading.value = true;
    try {
        const processed = await companiesStore.fetchCompanyConfig();
        if (!processed.success) throw new Error(processed.message);
        const cfg = processed.data;

        companyConfig.value = {
            company_id: cfg.company_id,
            purchase_workflow: cfg.purchase_workflow || 'standard'
        };
        // Mantén la configuración también en el authStore para uso global
        authStore.setCompanyConfig(companyConfig.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al cargar la configuración de la empresa',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
};

const updateWorkflowConfig = async (newConfig) => {
    saving.value = true;
    try {
        // 1. Vista previa del impacto del cambio de flujo
        const preview = await companiesStore.previewWorkflowChangeAction(newConfig.purchase_workflow);
        const blocking = preview?.data?.blocking_purchases ?? preview?.blocking_purchases ?? 0;

        if (blocking > 0) {
            toast.add({
                severity: 'warn',
                summary: 'Cambio bloqueado',
                detail: `Existen ${blocking} compras pendientes o aprobadas que impiden el cambio de flujo.`,
                life: 5000
            });
            saving.value = false;
            return;
        }

        // 2. Persistir la configuración
        const processedSave = await companiesStore.updateCompanyConfigAction(newConfig);
        if (!processedSave.success) throw new Error(processedSave.message);
        const updatedCfg = processedSave.data ?? newConfig;
        companyConfig.value = { ...companyConfig.value, ...updatedCfg };
        authStore.setCompanyConfig(companyConfig.value);

        toast.add({
            severity: 'success',
            summary: 'Configuración Guardada',
            detail: processedSave.message || 'La configuración de flujo de compras ha sido actualizada',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al guardar la configuración',
            life: 3000
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
            <ConfigPreview :workflow="companyConfig.purchase_workflow" />

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
