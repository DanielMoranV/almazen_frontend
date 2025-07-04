<script setup>
import { ref, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';

const props = defineProps({
    config: {
        type: Object,
        required: true
    },
    saving: {
        type: Boolean,
        default: false
    },
    availableWorkflows: {
        type: Object,
        default: () => ({})
    },
    currentWorkflowDescription: {
        type: Object,
        default: () => ({})
    }
});

const emit = defineEmits(['update', 'preview']);

const confirm = useConfirm();

const localConfig = ref({ ...props.config });

watch(() => props.config, (newConfig) => {
    localConfig.value = { ...newConfig };
}, { deep: true });

const workflowOptions = [
    {
        value: 'standard',
        label: 'Flujo Estándar',
        description: 'Compra → Pendiente → Aprobada → Recibida',
        details: 'Requiere aprobación manual para cada compra',
        icon: 'pi pi-check-circle',
        color: 'blue'
    },
    {
        value: 'simplified',
        label: 'Flujo Simplificado',
        description: 'Compra → Recibida (automático)',
        details: 'Actualización automática de stock, sin aprobaciones',
        icon: 'pi pi-bolt',
        color: 'green'
    }
];

const saveConfig = () => {
    console.log('saveConfig called');
    console.log('Current config:', props.config);
    console.log('Local config:', localConfig.value);
    
    const currentWorkflow = props.config.purchase_workflow;
    const newWorkflow = localConfig.value.purchase_workflow;
    
    console.log('Current workflow:', currentWorkflow);
    console.log('New workflow:', newWorkflow);
    
    if (currentWorkflow !== newWorkflow) {
        console.log('Workflows are different, showing confirmation');
        confirm.require({
            message: `¿Está seguro de cambiar el flujo de compras de "${getWorkflowLabel(currentWorkflow)}" a "${getWorkflowLabel(newWorkflow)}"?`,
            header: 'Confirmar Cambio de Flujo',
            icon: 'pi pi-exclamation-triangle',
            rejectClass: 'p-button-secondary p-button-outlined',
            rejectLabel: 'Cancelar',
            acceptLabel: 'Confirmar',
            accept: () => {
                console.log('User confirmed, emitting update');
                emit('update', localConfig.value);
            },
            reject: () => {
                console.log('User rejected, reverting change');
                // Revertir cambio
                localConfig.value.purchase_workflow = currentWorkflow;
            }
        });
    } else {
        console.log('No workflow change, emitting update directly');
        emit('update', localConfig.value);
    }
};

const getWorkflowLabel = (workflow) => {
    const option = workflowOptions.find(opt => opt.value === workflow);
    return option ? option.label : workflow;
};

const isWorkflowSelected = (workflow) => {
    return localConfig.value.purchase_workflow === workflow;
};
</script>

<template>
    <Card class="workflow-config-card">
        <template #header>
            <div class="card-header">
                <i class="pi pi-sitemap"></i>
                <h3>Configuración de Flujo de Compras</h3>
            </div>
        </template>
        
        <template #content>
            <div class="workflow-options">
                <div 
                    v-for="option in workflowOptions" 
                    :key="option.value"
                    class="workflow-option"
                    :class="{ 'selected': isWorkflowSelected(option.value) }"
                    @click="localConfig.purchase_workflow = option.value"
                >
                    <div class="option-header">
                        <div class="option-selector">
                            <RadioButton 
                                v-model="localConfig.purchase_workflow" 
                                :value="option.value" 
                                :inputId="option.value"
                            />
                        </div>
                        <div class="option-icon" :class="`text-${option.color}-500`">
                            <i :class="option.icon"></i>
                        </div>
                        <div class="option-info">
                            <h4>{{ option.label }}</h4>
                            <p class="workflow-description">{{ option.description }}</p>
                        </div>
                    </div>
                    <div class="option-details">
                        <small>{{ option.details }}</small>
                    </div>
                </div>
            </div>
            
            <div class="workflow-impact" v-if="localConfig.purchase_workflow">
                <h5>
                    <i class="pi pi-info-circle"></i>
                    Impacto del Flujo Seleccionado
                </h5>
                <ul v-if="localConfig.purchase_workflow === 'standard'">
                    <li>Las compras requieren aprobación manual</li>
                    <li>Stock se actualiza solo al recibir la mercancía</li>
                    <li>Permite cancelar órdenes pendientes</li>
                    <li>Mayor control sobre el proceso de compras</li>
                </ul>
                <ul v-else>
                    <li>Las compras se procesan automáticamente</li>
                    <li>Stock se actualiza inmediatamente</li>
                    <li>Genera lotes de manera automática</li>
                    <li>Proceso más rápido para operaciones simples</li>
                </ul>
            </div>
        </template>
        
        <template #footer>
            <div class="card-actions">
                <Button 
                    label="Guardar Configuración" 
                    @click="saveConfig"
                    :loading="saving"
                    icon="pi pi-save"
                    class="p-button-primary"
                />
            </div>
        </template>
    </Card>
</template>

<style lang="scss" scoped>
.workflow-config-card {
    height: fit-content;
    
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
}

.workflow-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.workflow-option {
    border: 2px solid var(--surface-border);
    border-radius: var(--border-radius);
    padding: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        border-color: var(--primary-color-text);
        background: var(--surface-hover);
    }
    
    &.selected {
        border-color: var(--primary-color);
        background: var(--primary-50);
    }
    
    .option-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 0.75rem;
        
        .option-selector {
            flex-shrink: 0;
        }
        
        .option-icon {
            flex-shrink: 0;
            font-size: 1.5rem;
            margin-top: 0.125rem;
        }
        
        .option-info {
            flex: 1;
            
            h4 {
                margin: 0 0 0.25rem 0;
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-color);
            }
            
            .workflow-description {
                margin: 0;
                color: var(--text-color-secondary);
                font-size: 0.9rem;
                font-family: 'Courier New', monospace;
                background: var(--surface-ground);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }
        }
    }
    
    .option-details {
        margin-left: 3.5rem;
        
        small {
            color: var(--text-color-secondary);
            font-style: italic;
        }
    }
}

.workflow-impact {
    background: var(--surface-ground);
    border-radius: var(--border-radius);
    padding: 1rem;
    
    h5 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.75rem 0;
        color: var(--text-color);
        
        i {
            color: var(--primary-color);
        }
    }
    
    ul {
        margin: 0;
        padding-left: 1.25rem;
        
        li {
            margin-bottom: 0.5rem;
            color: var(--text-color-secondary);
            
            &:last-child {
                margin-bottom: 0;
            }
        }
    }
}

.card-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 1rem;
}

.text-blue-500 {
    color: #3b82f6;
}

.text-green-500 {
    color: #10b981;
}
</style>