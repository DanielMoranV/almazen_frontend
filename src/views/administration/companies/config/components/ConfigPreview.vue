<script setup>
import { computed } from 'vue';

const props = defineProps({
    workflow: {
        type: String,
        required: true,
        default: 'standard'
    },
    preview: {
        type: Object,
        required: false,
        default: () => null
    },
    canChange: {
        type: Boolean,
        default: true
    },
    blockingIssues: {
        type: Number,
        default: 0
    },
    currentData: {
        type: Object,
        default: () => ({})
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
    return props.workflow === 'simplified' ? 'Proceso automático sin intervención manual' : 'Proceso con aprobación manual requerida';
});
const blockingIssues = computed(() => {
    return props.blockingIssues || props.preview?.impact_analysis?.blocking_issues || 0;
});

const warnings = computed(() => {
    return props.preview?.impact_analysis?.warnings || [];
});

const recommendedActions = computed(() => {
    return props.preview?.impact_analysis?.recommended_actions || [];
});

const benefits = computed(() => {
    return props.preview?.recommendations?.benefits || [];
});

const requirements = computed(() => {
    return props.preview?.recommendations?.requirements || [];
});

const estimatedImpact = computed(() => {
    return props.preview?.estimated_impact || {};
});

const currentWorkflow = computed(() => {
    return props.preview?.current_workflow || props.workflow;
});

const targetWorkflow = computed(() => {
    return props.preview?.target_workflow || props.workflow;
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
                    <div v-for="(step, index) in workflowSteps" :key="step.id" class="workflow-step">
                        <div class="step-connector" v-if="index > 0">
                            <div class="connector-line"></div>
                            <i class="pi pi-arrow-right connector-arrow"></i>
                        </div>

                        <div class="step-content">
                            <div class="step-icon" :class="`bg-${step.color}-100 text-${step.color}-600`">
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

            <!-- Estadísticas Actuales -->
            <div v-if="currentData && Object.keys(currentData).length > 0" class="current-stats">
                <h5>
                    <i class="pi pi-chart-bar"></i>
                    Estado Actual de Compras
                </h5>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total</span>
                        <span class="stat-value">{{ currentData.total_purchases || 0 }}</span>
                    </div>
                    <div class="stat-item pending">
                        <span class="stat-label">Pendientes</span>
                        <span class="stat-value">{{ currentData.pending_purchases || 0 }}</span>
                    </div>
                    <div class="stat-item approved">
                        <span class="stat-label">Aprobadas</span>
                        <span class="stat-value">{{ currentData.approved_purchases || 0 }}</span>
                    </div>
                    <div class="stat-item received">
                        <span class="stat-label">Recibidas</span>
                        <span class="stat-value">{{ currentData.received_purchases || 0 }}</span>
                    </div>
                </div>
            </div>

            <!-- Impacto del Cambio -->
            <div v-if="blockingIssues > 0 || warnings.length > 0 || recommendedActions.length > 0" class="preview-impact">
                <h5>
                    <i class="pi pi-exclamation-triangle"></i>
                    Impacto Detectado
                </h5>
                <div v-if="blockingIssues > 0" class="impact-item text-red-500">
                    <i class="pi pi-ban"></i>
                    <span>{{ blockingIssues }} compra{{ blockingIssues > 1 ? 's' : '' }} {{ blockingIssues > 1 ? 'bloquean' : 'bloquea' }} el cambio de flujo</span>
                </div>
                <div v-if="warnings.length > 0" class="impact-item text-yellow-500">
                    <i class="pi pi-exclamation-triangle"></i>
                    <div class="impact-content">
                        <strong>Advertencias:</strong>
                        <ul>
                            <li v-for="(warning, index) in warnings" :key="index">{{ warning }}</li>
                        </ul>
                    </div>
                </div>
                <div v-if="recommendedActions.length > 0" class="impact-item text-blue-500">
                    <i class="pi pi-lightbulb"></i>
                    <div class="impact-content">
                        <strong>Recomendaciones:</strong>
                        <ul>
                            <li v-for="(action, index) in recommendedActions" :key="index">
                                {{ action }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Beneficios y Requisitos -->
            <div v-if="benefits.length > 0 || requirements.length > 0" class="workflow-recommendations">
                <div class="recommendation-section" v-if="benefits.length > 0">
                    <h5>
                        <i class="pi pi-thumbs-up text-green-500"></i>
                        Beneficios del Cambio
                    </h5>
                    <ul class="benefit-list">
                        <li v-for="(benefit, index) in benefits" :key="index">
                            <i class="pi pi-check-circle text-green-500"></i>
                            {{ benefit }}
                        </li>
                    </ul>
                </div>

                <div class="recommendation-section" v-if="requirements.length > 0">
                    <h5>
                        <i class="pi pi-exclamation-triangle text-orange-500"></i>
                        Requisitos Importantes
                    </h5>
                    <ul class="requirement-list">
                        <li v-for="(requirement, index) in requirements" :key="index">
                            <i class="pi pi-info-circle text-orange-500"></i>
                            {{ requirement }}
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Impacto Estimado -->
            <div v-if="Object.keys(estimatedImpact).length > 0" class="estimated-impact">
                <h5>
                    <i class="pi pi-trending-up"></i>
                    Impacto Estimado
                </h5>
                <div class="impact-grid">
                    <div class="impact-item" v-if="estimatedImpact.process_time">
                        <span class="impact-label">Tiempo de Proceso:</span>
                        <span class="impact-value">{{ estimatedImpact.process_time }}</span>
                    </div>
                    <div class="impact-item" v-if="estimatedImpact.control_level">
                        <span class="impact-label">Nivel de Control:</span>
                        <span class="impact-value">{{ estimatedImpact.control_level }}</span>
                    </div>
                    <div class="impact-item" v-if="estimatedImpact.complexity">
                        <span class="impact-label">Complejidad:</span>
                        <span class="impact-value">{{ estimatedImpact.complexity }}</span>
                    </div>
                    <div class="impact-item" v-if="estimatedImpact.recommendation">
                        <span class="impact-label">Recomendación:</span>
                        <span class="impact-value">{{ estimatedImpact.recommendation }}</span>
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
.bg-blue-100 {
    background-color: #dbeafe;
}
.text-blue-600 {
    color: #2563eb;
}
.bg-orange-100 {
    background-color: #fed7aa;
}
.text-orange-600 {
    color: #ea580c;
}
.bg-purple-100 {
    background-color: #e9d5ff;
}
.text-purple-600 {
    color: #9333ea;
}
.bg-green-100 {
    background-color: #dcfce7;
}
.text-green-600 {
    color: #16a34a;
}

.text-blue-500 {
    color: #3b82f6;
}
.text-purple-500 {
    color: #8b5cf6;
}
.text-red-500 {
    color: #ef4444;
}
.text-gray-500 {
    color: #6b7280;
}
.text-yellow-500 {
    color: #eab308;
}
.text-green-500 {
    color: #10b981;
}
.text-orange-500 {
    color: #f97316;
}

.current-stats {
    background: var(--surface-ground);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-bottom: 1.5rem;

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

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;

        .stat-item {
            text-align: center;
            padding: 1rem;
            background: var(--surface-card);
            border-radius: var(--border-radius);
            border: 2px solid var(--surface-border);

            &.pending {
                border-color: #f59e0b;
                background: #fef3c7;
            }

            &.approved {
                border-color: #8b5cf6;
                background: #f3e8ff;
            }

            &.received {
                border-color: #10b981;
                background: #d1fae5;
            }

            .stat-label {
                display: block;
                font-size: 0.75rem;
                color: var(--text-color-secondary);
                margin-bottom: 0.25rem;
                text-transform: uppercase;
                font-weight: 600;
            }

            .stat-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-color);
            }
        }
    }
}

.workflow-recommendations {
    background: var(--surface-ground);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-bottom: 1.5rem;

    .recommendation-section {
        margin-bottom: 1.5rem;

        &:last-child {
            margin-bottom: 0;
        }

        h5 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 0 0.75rem 0;
            color: var(--text-color);
            font-size: 0.95rem;
        }

        ul {
            margin: 0;
            padding: 0;
            list-style: none;

            li {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                color: var(--text-color-secondary);
                font-size: 0.875rem;

                i {
                    font-size: 0.75rem;
                    margin-top: 0.125rem;
                    flex-shrink: 0;
                }

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }
}

.estimated-impact {
    background: var(--surface-ground);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-bottom: 1.5rem;

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

    .impact-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;

        .impact-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            background: var(--surface-card);
            border-radius: var(--border-radius);

            .impact-label {
                font-weight: 600;
                color: var(--text-color);
                font-size: 0.875rem;
            }

            .impact-value {
                color: var(--text-color-secondary);
                font-size: 0.875rem;
                text-align: right;
                max-width: 60%;
            }
        }
    }
}

.preview-impact {
    background: var(--surface-ground);
    border-radius: var(--border-radius);
    padding: 1rem;
    margin-bottom: 1.5rem;

    h5 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem 0;
        color: var(--text-color);
    }

    .impact-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: var(--surface-card);
        border-radius: var(--border-radius);
        border-left: 4px solid currentColor;

        i {
            font-size: 1.1rem;
            margin-top: 0.125rem;
            flex-shrink: 0;
        }

        .impact-content {
            flex: 1;

            strong {
                display: block;
                margin-bottom: 0.5rem;
                color: var(--text-color);
            }

            ul {
                margin: 0;
                padding-left: 1.25rem;

                li {
                    color: var(--text-color-secondary);
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;

                    &:last-child {
                        margin-bottom: 0;
                    }
                }
            }
        }

        span {
            color: var(--text-color-secondary);
            font-size: 0.875rem;
        }
    }
}
</style>
