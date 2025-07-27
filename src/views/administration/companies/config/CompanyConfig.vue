<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useCompaniesStore } from '@/stores/companiesStore';
import ToggleSwitch from 'primevue/toggleswitch';
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
const activeTab = ref('workflow'); // Nuevo estado para tabs

const companyConfig = ref({
    company_id: null,
    purchase_workflow: 'standard',
    requires_cash_session: true,
    send_sunat: true,
    voucher_series_ticket: '',
    voucher_series_boleta: '',
    voucher_series_factura: '',
    current_correlative_ticket: 0,
    current_correlative_boleta: 0,
    current_correlative_factura: 0
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

// Computed para validación de formularios
const isGeneralConfigValid = computed(() => {
    return companyConfig.value.voucher_series_ticket.trim() !== '' && companyConfig.value.voucher_series_boleta.trim() !== '' && companyConfig.value.voucher_series_factura.trim() !== '';
});

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
        console.log('companyConfigState', companiesStore.companyConfigState);

        if (!companiesStore.success) {
            throw new Error(companiesStore.message || 'Error al obtener la configuración');
        }

        const cfg = companiesStore.companyConfigState?.config;
        if (!cfg) {
            throw new Error('Configuración no encontrada');
        }

        companyConfig.value = {
            ...companyConfig.value, // defaults
            ...cfg,
            company_id: cfg.company_id || currentCompany.value?.id
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

// ---- Guardar configuración general ----
const savingGeneral = ref(false);

const saveGeneralConfig = async () => {
    if (!isGeneralConfigValid.value) {
        toast.add({
            severity: 'warn',
            summary: 'Validación',
            detail: 'Por favor complete todas las series de comprobantes',
            life: 4000
        });
        return;
    }

    savingGeneral.value = true;
    try {
        await companiesStore.updateCompanyConfigAction(companyConfig.value);

        if (!companiesStore.success) {
            throw new Error(companiesStore.message || 'Error al guardar la configuración');
        }

        toast.add({
            severity: 'success',
            summary: 'Configuración Actualizada',
            detail: companiesStore.message || 'Configuración de empresa guardada',
            life: 4000
        });
    } catch (error) {
        console.error('saveGeneralConfig error', error);
        toast.add({
            severity: 'error',
            summary: 'Error al Guardar',
            detail: error.message || 'No se pudo guardar la configuración',
            life: 5000
        });
    } finally {
        savingGeneral.value = false;
    }
};

// Función para cambiar tabs
const setActiveTab = (tab) => {
    activeTab.value = tab;
};
</script>

<template>
    <ConfirmDialog />
    <div class="company-config-container">
        <!-- Header mejorado -->
        <div class="page-header">
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-cog"></i>
                    </div>
                    <div class="text-content">
                        <h1 class="page-title">Configuración de Empresa</h1>
                        <p class="page-subtitle">Configure las preferencias y flujos de trabajo para su empresa</p>
                    </div>
                </div>

                <!-- Indicador de estado -->
                <div class="status-indicator" v-if="!loading">
                    <div class="status-item">
                        <i class="pi pi-check-circle text-green-500"></i>
                        <span>Configuración cargada</span>
                    </div>
                    <div class="status-item">
                        <i class="pi pi-building text-blue-500"></i>
                        <span>{{ currentCompany?.name || 'Empresa' }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Loading state mejorado -->
        <div v-if="loading" class="loading-container">
            <div class="loading-content">
                <ProgressSpinner strokeWidth="3" />
                <h3>Cargando configuración...</h3>
                <p>Obteniendo la configuración actual de su empresa</p>
            </div>
        </div>

        <!-- Content con tabs -->
        <div v-else class="main-content">
            <!-- Navigation tabs -->
            <div class="tabs-navigation">
                <button @click="setActiveTab('workflow')" :class="['tab-button', { active: activeTab === 'workflow' }]">
                    <i class="pi pi-sitemap"></i>
                    <span>Flujo de Compras</span>
                </button>
                <button @click="setActiveTab('general')" :class="['tab-button', { active: activeTab === 'general' }]">
                    <i class="pi pi-sliders-h"></i>
                    <span>Configuración General</span>
                </button>
                <button @click="setActiveTab('future')" :class="['tab-button', { active: activeTab === 'future' }]">
                    <i class="pi pi-clock"></i>
                    <span>Próximas Funciones</span>
                </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Workflow Tab -->
                <div v-show="activeTab === 'workflow'" class="workflow-section">
                    <div class="workflow-grid">
                        <WorkflowConfigCard :config="companyConfig" :saving="saving" @update="updateWorkflowConfig" />
                        <ConfigPreview :workflow="companyConfig.purchase_workflow" :preview="workflowPreview" :can-change="canChangeWorkflow" :blocking-issues="blockingIssues" :current-data="currentData" />
                    </div>
                </div>

                <!-- General Config Tab -->
                <div v-show="activeTab === 'general'" class="general-section">
                    <Card class="general-config-card">
                        <template #header>
                            <div class="card-header">
                                <i class="pi pi-sliders-h" />
                                <div>
                                    <h3>Configuración General</h3>
                                    <p>Configure los parámetros básicos de operación</p>
                                </div>
                            </div>
                        </template>

                        <template #content>
                            <div class="config-sections">
                                <!-- Sección de Controles -->
                                <div class="config-section">
                                    <h4 class="section-title">
                                        <i class="pi pi-shield"></i>
                                        Controles de Operación
                                    </h4>
                                    <div class="controls-grid">
                                        <div class="control-item">
                                            <div class="control-info">
                                                <label>Control estricto de caja</label>
                                                <small>Requiere apertura y cierre de caja para operar</small>
                                            </div>
                                            <ToggleSwitch v-model="companyConfig.requires_cash_session" />
                                        </div>
                                        <div class="control-item">
                                            <div class="control-info">
                                                <label>Emisión electrónica SUNAT</label>
                                                <small>Envío automático de comprobantes a SUNAT</small>
                                            </div>
                                            <ToggleSwitch v-model="companyConfig.send_sunat" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Sección de Series y Correlativos -->
                                <div class="config-section">
                                    <h4 class="section-title">
                                        <i class="pi pi-file"></i>
                                        Series y Correlativos
                                    </h4>
                                    <div class="series-grid">
                                        <!-- Ticket -->
                                        <div class="series-group">
                                            <h5>Ticket de Venta</h5>
                                            <div class="series-inputs">
                                                <div class="input-group">
                                                    <label>Serie</label>
                                                    <InputText
                                                        v-model="companyConfig.voucher_series_ticket"
                                                        maxlength="10"
                                                        placeholder="T001"
                                                        :class="{
                                                            'p-invalid': !companyConfig.voucher_series_ticket.trim()
                                                        }"
                                                        fluid
                                                    />
                                                </div>
                                                <div class="input-group">
                                                    <label>Correlativo Actual</label>
                                                    <InputNumber v-model="companyConfig.current_correlative_ticket" :min="0" :useGrouping="false" fluid />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Boleta -->
                                        <div class="series-group">
                                            <h5>Boleta de Venta</h5>
                                            <div class="series-inputs">
                                                <div class="input-group">
                                                    <label>Serie</label>
                                                    <InputText
                                                        v-model="companyConfig.voucher_series_boleta"
                                                        maxlength="10"
                                                        placeholder="B001"
                                                        :class="{
                                                            'p-invalid': !companyConfig.voucher_series_boleta.trim()
                                                        }"
                                                        fluid
                                                    />
                                                </div>
                                                <div class="input-group">
                                                    <label>Correlativo Actual</label>
                                                    <InputNumber v-model="companyConfig.current_correlative_boleta" :min="0" :useGrouping="false" fluid />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Factura -->
                                        <div class="series-group">
                                            <h5>Factura</h5>
                                            <div class="series-inputs">
                                                <div class="input-group">
                                                    <label>Serie</label>
                                                    <InputText
                                                        v-model="companyConfig.voucher_series_factura"
                                                        maxlength="10"
                                                        placeholder="F001"
                                                        :class="{
                                                            'p-invalid': !companyConfig.voucher_series_factura.trim()
                                                        }"
                                                        fluid
                                                    />
                                                </div>
                                                <div class="input-group">
                                                    <label>Correlativo Actual</label>
                                                    <InputNumber v-model="companyConfig.current_correlative_factura" :min="0" :useGrouping="false" fluid />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template #footer>
                            <div class="card-footer">
                                <div class="validation-info" v-if="!isGeneralConfigValid">
                                    <i class="pi pi-exclamation-triangle text-orange-500"></i>
                                    <span>Complete todas las series para guardar</span>
                                </div>
                                <Button label="Guardar Configuración" icon="pi pi-save" @click="saveGeneralConfig" :loading="savingGeneral" :disabled="!isGeneralConfigValid" class="save-button" />
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- Future Features Tab -->
                <div v-show="activeTab === 'future'" class="future-section">
                    <Card class="future-config-card">
                        <template #header>
                            <div class="card-header">
                                <i class="pi pi-clock"></i>
                                <div>
                                    <h3>Próximas Configuraciones</h3>
                                    <p>Funcionalidades que estarán disponibles en futuras versiones</p>
                                </div>
                            </div>
                        </template>

                        <template #content>
                            <div class="future-features-grid">
                                <div class="feature-category">
                                    <h4>Inventario y Productos</h4>
                                    <div class="feature-item">
                                        <div class="feature-icon">
                                            <i class="pi pi-warehouse"></i>
                                        </div>
                                        <div class="feature-content">
                                            <h5>Políticas de Inventario</h5>
                                            <p>Configure alertas de stock mínimo, máximo y políticas de reposición</p>
                                        </div>
                                    </div>
                                    <div class="feature-item">
                                        <div class="feature-icon">
                                            <i class="pi pi-percentage"></i>
                                        </div>
                                        <div class="feature-content">
                                            <h5>Políticas de Descuentos</h5>
                                            <p>Establezca reglas automáticas para descuentos por volumen y promociones</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="feature-category">
                                    <h4>Reportes y Análisis</h4>
                                    <div class="feature-item">
                                        <div class="feature-icon">
                                            <i class="pi pi-chart-bar"></i>
                                        </div>
                                        <div class="feature-content">
                                            <h5>Configuración de Reportes</h5>
                                            <p>Personalice reportes automáticos y dashboards empresariales</p>
                                        </div>
                                    </div>
                                    <div class="feature-item">
                                        <div class="feature-icon">
                                            <i class="pi pi-file-pdf"></i>
                                        </div>
                                        <div class="feature-content">
                                            <h5>Plantillas de Documentos</h5>
                                            <p>Personalice el diseño de facturas, boletas y otros documentos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="future-note">
                                <i class="pi pi-info-circle"></i>
                                <p>Estas configuraciones estarán disponibles en las próximas actualizaciones del sistema. Se notificará cuando estén listas para usar.</p>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.company-config-container {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    min-height: calc(100vh - 3rem);
}

// Header mejorado
.page-header {
    margin-bottom: 2rem;

    .header-content {
        .title-section {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 1rem;

            .icon-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 4rem;
                height: 4rem;
                background: linear-gradient(135deg, var(--primary-color), var(--primary-color-text));
                border-radius: 1rem;
                box-shadow: 0 4px 20px rgba(var(--primary-color-rgb), 0.3);

                i {
                    font-size: 2rem;
                    color: white;
                }
            }

            .text-content {
                .page-title {
                    margin: 0 0 0.5rem 0;
                    font-size: 2.5rem;
                    font-weight: 700;
                    color: var(--text-color);
                    line-height: 1.2;
                }

                .page-subtitle {
                    margin: 0;
                    color: var(--text-color-secondary);
                    font-size: 1.125rem;
                    line-height: 1.4;
                }
            }
        }

        .status-indicator {
            display: flex;
            gap: 2rem;
            padding: 1rem;
            background: var(--surface-card);
            border-radius: 0.75rem;
            border: 1px solid var(--surface-border);

            .status-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    font-size: 1.25rem;
                }

                span {
                    font-weight: 500;
                    color: var(--text-color);
                }
            }
        }
    }
}

// Loading mejorado
.loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;

    .loading-content {
        text-align: center;

        h3 {
            margin: 1rem 0 0.5rem 0;
            color: var(--text-color);
        }

        p {
            margin: 0;
            color: var(--text-color-secondary);
        }
    }
}

// Tabs Navigation
.main-content {
    .tabs-navigation {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        padding: 0.5rem;
        background: var(--surface-ground);
        border-radius: 1rem;
        border: 1px solid var(--surface-border);

        .tab-button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.5rem;
            background: transparent;
            border: none;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--text-color-secondary);
            font-weight: 500;

            i {
                font-size: 1.25rem;
            }

            &:hover {
                background: var(--surface-hover);
                color: var(--text-color);
            }

            &.active {
                background: var(--primary-color);
                color: white;
                box-shadow: 0 2px 12px rgba(var(--primary-color-rgb), 0.3);
            }
        }

        @media (max-width: 768px) {
            .tab-button {
                flex: 1;
                justify-content: center;
                padding: 1rem 0.75rem;

                span {
                    display: none;
                }
            }
        }
    }

    .tab-content {
        animation: fadeIn 0.3s ease;
    }
}

// Workflow section
.workflow-section {
    .workflow-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;

        @media (max-width: 1024px) {
            grid-template-columns: 1fr;
        }
    }
}

// General section mejorada
.general-section {
    .general-config-card {
        .card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;

            i {
                color: var(--primary-color);
                font-size: 1.5rem;
            }

            h3 {
                margin: 0 0 0.25rem 0;
                color: var(--text-color);
                font-size: 1.5rem;
            }

            p {
                margin: 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        .config-sections {
            display: flex;
            flex-direction: column;
            gap: 2rem;

            .config-section {
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin: 0 0 1.5rem 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-color);

                    i {
                        color: var(--primary-color);
                    }
                }

                .controls-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;

                    .control-item {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 1.5rem;
                        background: var(--surface-ground);
                        border-radius: 0.75rem;
                        border: 1px solid var(--surface-border);

                        .control-info {
                            label {
                                display: block;
                                font-weight: 600;
                                color: var(--text-color);
                                margin-bottom: 0.25rem;
                            }

                            small {
                                color: var(--text-color-secondary);
                                font-size: 0.875rem;
                            }
                        }
                    }
                }

                .series-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 1.5rem;

                    .series-group {
                        padding: 1.5rem;
                        background: var(--surface-ground);
                        border-radius: 0.75rem;
                        border: 1px solid var(--surface-border);

                        h5 {
                            margin: 0 0 1rem 0;
                            font-size: 1.125rem;
                            font-weight: 600;
                            color: var(--text-color);
                        }

                        .series-inputs {
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 1rem;

                            .input-group {
                                label {
                                    display: block;
                                    margin-bottom: 0.5rem;
                                    font-weight: 500;
                                    color: var(--text-color);
                                    font-size: 0.875rem;
                                }
                            }
                        }
                    }
                }
            }
        }

        .card-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;

            .validation-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--orange-500);
                font-weight: 500;

                i {
                    font-size: 1.125rem;
                }
            }

            .save-button {
                padding: 0.75rem 2rem;
                font-weight: 600;
            }

            @media (max-width: 768px) {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;

                .save-button {
                    width: 100%;
                }
            }
        }
    }
}

// Future section mejorada
.future-section {
    .future-config-card {
        .card-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;

            i {
                color: var(--primary-color);
                font-size: 1.5rem;
            }

            h3 {
                margin: 0 0 0.25rem 0;
                color: var(--text-color);
                font-size: 1.5rem;
            }

            p {
                margin: 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        .future-features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;

            .feature-category {
                h4 {
                    margin: 0 0 1.5rem 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-color);
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid var(--surface-border);
                }

                .feature-item {
                    display: flex;
                    gap: 1rem;
                    padding: 1.5rem;
                    background: var(--surface-ground);
                    border-radius: 0.75rem;
                    border: 1px solid var(--surface-border);
                    margin-bottom: 1rem;
                    transition: all 0.2s ease;

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                    }

                    .feature-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 3rem;
                        height: 3rem;
                        background: linear-gradient(135deg, var(--primary-color), var(--primary-color-text));
                        border-radius: 0.75rem;
                        flex-shrink: 0;

                        i {
                            font-size: 1.5rem;
                            color: white;
                        }
                    }

                    .feature-content {
                        h5 {
                            margin: 0 0 0.5rem 0;
                            font-size: 1.125rem;
                            font-weight: 600;
                            color: var(--text-color);
                        }

                        p {
                            margin: 0;
                            color: var(--text-color-secondary);
                            font-size: 0.875rem;
                            line-height: 1.5;
                        }
                    }
                }
            }
        }

        .future-note {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            padding: 1.5rem;
            background: var(--blue-50);
            border: 1px solid var(--blue-200);
            border-radius: 0.75rem;

            i {
                color: var(--blue-500);
                font-size: 1.25rem;
                margin-top: 0.125rem;
                flex-shrink: 0;
            }

            p {
                margin: 0;
                color: var(--blue-700);
                font-size: 0.875rem;
                line-height: 1.6;
            }
        }
    }
}

// Responsive improvements
@media (max-width: 768px) {
    .company-config-container {
        padding: 1rem;
    }

    .page-header .header-content .title-section {
        flex-direction: column;
        text-align: center;
        gap: 1rem;

        .text-content .page-title {
            font-size: 2rem;
        }
    }

    .page-header .header-content .status-indicator {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    .general-section .general-config-card .config-sections .config-section .series-grid {
        grid-template-columns: 1fr;
    }

    .general-section .general-config-card .config-sections .config-section .series-grid .series-group .series-inputs {
        grid-template-columns: 1fr;
    }

    .future-section .future-config-card .future-features-grid {
        grid-template-columns: 1fr;
    }
}

// Animations
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// Utilities
.p-invalid {
    border-color: var(--red-500) !important;
    box-shadow: 0 0 0 0.2rem rgba(var(--red-500-rgb), 0.2) !important;
}

// Dark mode improvements
@media (prefers-color-scheme: dark) {
    .future-section .future-config-card .future-note {
        background: rgba(var(--blue-500-rgb), 0.1);
        border-color: rgba(var(--blue-500-rgb), 0.3);

        p {
            color: var(--blue-300);
        }
    }
}
</style>
