<script setup>
import { computed } from 'vue';

const props = defineProps({
    workflow: {
        type: String,
        required: true,
        default: 'standard'
    }
});

const workflowSteps = computed(() => {
    if (props.workflow === 'simplified') {
        return [
            {
                id: 1,
                label: 'Crear Compra',
                description: 'Se registra la orden de compra',
                icon: 'pi pi-plus-circle',
                color: 'blue',
                status: 'active'
            },
            {
                id: 2,
                label: 'Proceso Automático',
                description: 'El sistema procesa automáticamente',
                icon: 'pi pi-cog',
                color: 'orange',
                status: 'active'
            },
            {
                id: 3,
                label: 'Recibida',
                description: 'Stock actualizado automáticamente',
                icon: 'pi pi-check-circle',
                color: 'green',
                status: 'active'
            }
        ];
    }
    
    // Flujo estándar
    return [
        {
            id: 1,
            label: 'Crear Compra',
            description: 'Se registra la orden de compra',
            icon: 'pi pi-plus-circle',
            color: 'blue',
            status: 'active'
        },
        {
            id: 2,
            label: 'Pendiente',
            description: 'Esperando aprobación',
            icon: 'pi pi-clock',
            color: 'orange',
            status: 'active'
        },
        {
            id: 3,
            label: 'Aprobada',
            description: 'Compra aprobada manualmente',
            icon: 'pi pi-thumbs-up',
            color: 'purple',
            status: 'active'
        },
        {
            id: 4,
            label: 'Recibida',
            description: 'Mercancía recibida, stock actualizado',
            icon: 'pi pi-check-circle',
            color: 'green',
            status: 'active'
        }
    ];
});

const workflowTitle = computed(() => {
    return props.workflow === 'simplified' ? 'Flujo Simplificado' : 'Flujo Estándar';
});

const workflowDescription = computed(() => {
    return props.workflow === 'simplified' 
        ? 'Proceso automático sin intervención manual'
        : 'Proceso con aprobación manual requerida';
});
</script>

<template>
    <Card class="config-preview-card">
        <template #header>
            <div class="card-header">
                <i class="pi pi-eye"></i>
                <h3>Vista Previa del Flujo</h3>
            </div>
        </template>
        
        <template #content>
            <div class="preview-header">
                <h4>{{ workflowTitle }}</h4>
                <p>{{ workflowDescription }}</p>
            </div>
            
            <div class="workflow-visualization">
                <div class="workflow-steps">
                    <div 
                        v-for="(step, index) in workflowSteps" 
                        :key="step.id"
                        class="workflow-step"
                    >
                        <div class="step-connector" v-if="index > 0">
                            <div class="connector-line"></div>
                            <i class="pi pi-arrow-right connector-arrow"></i>
                        </div>
                        
                        <div class="step-content">
                            <div 
                                class="step-icon"
                                :class="`bg-${step.color}-100 text-${step.color}-600`"
                            >
                                <i :class="step.icon"></i>
                            </div>
                            <div class="step-info">
                                <h5>{{ step.label }}</h5>
                                <p>{{ step.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="workflow-features">
                <h5>
                    <i class="pi pi-star"></i>
                    Características del Flujo
                </h5>
                <div class="features-grid">
                    <div v-if="workflow === 'standard'" class="feature-list">
                        <div class="feature-item">
                            <i class="pi pi-shield text-blue-500"></i>
                            <span>Control total del proceso</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-users text-purple-500"></i>
                            <span>Aprobación por responsables</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-times-circle text-red-500"></i>
                            <span>Posibilidad de cancelar</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-history text-gray-500"></i>
                            <span>Historial completo</span>
                        </div>
                    </div>
                    <div v-else class="feature-list">
                        <div class="feature-item">
                            <i class="pi pi-bolt text-yellow-500"></i>
                            <span>Proceso instantáneo</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-cog text-blue-500"></i>
                            <span>Totalmente automático</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-warehouse text-green-500"></i>
                            <span>Stock actualizado al instante</span>
                        </div>
                        <div class="feature-item">
                            <i class="pi pi-forward text-orange-500"></i>
                            <span>Sin esperas ni aprobaciones</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style lang="scss" scoped>
.config-preview-card {
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

.preview-header {
    text-align: center;
    margin-bottom: 2rem;
    
    h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-color);
    }
    
    p {
        margin: 0;
        color: var(--text-color-secondary);
    }
}

.workflow-visualization {
    margin-bottom: 2rem;
}

.workflow-steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.workflow-step {
    display: flex;
    align-items: center;
    
    .step-connector {
        display: flex;
        align-items: center;
        margin-right: 1rem;
        
        .connector-line {
            width: 2px;
            height: 30px;
            background: var(--surface-border);
            margin-right: 0.5rem;
        }
        
        .connector-arrow {
            color: var(--primary-color);
            font-size: 0.875rem;
        }
    }
    
    .step-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        
        .step-icon {
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            flex-shrink: 0;
        }
        
        .step-info {
            h5 {
                margin: 0 0 0.25rem 0;
                font-size: 1rem;
                font-weight: 600;
                color: var(--text-color);
            }
            
            p {
                margin: 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }
    }
}

.workflow-features {
    background: var(--surface-ground);
    border-radius: var(--border-radius);
    padding: 1rem;
    
    h5 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem 0;
        color: var(--text-color);
        
        i {
            color: var(--primary-color);
        }
    }
}

.features-grid {
    .feature-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        
        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            
            i {
                font-size: 1rem;
                width: 1.25rem;
                text-align: center;
            }
            
            span {
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }
    }
}

// Color utilities
.bg-blue-100 { background-color: #dbeafe; }
.text-blue-600 { color: #2563eb; }
.bg-orange-100 { background-color: #fed7aa; }
.text-orange-600 { color: #ea580c; }
.bg-purple-100 { background-color: #e9d5ff; }
.text-purple-600 { color: #9333ea; }
.bg-green-100 { background-color: #dcfce7; }
.text-green-600 { color: #16a34a; }

.text-blue-500 { color: #3b82f6; }
.text-purple-500 { color: #8b5cf6; }
.text-red-500 { color: #ef4444; }
.text-gray-500 { color: #6b7280; }
.text-yellow-500 { color: #eab308; }
.text-green-500 { color: #10b981; }
.text-orange-500 { color: #f97316; }
</style>