<script setup>
import { computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
    statusTimeline: {
        type: Array,
        default: () => []
    },
    statusTracking: {
        type: Object,
        default: () => ({})
    },
    currentStatus: {
        type: String,
        required: true
    }
});

const timelineSteps = computed(() => {
    const baseSteps = [
        {
            status: 'PENDIENTE',
            label: 'Solicitado',
            icon: 'pi pi-plus-circle',
            color: 'blue'
        },
        {
            status: 'APROBADO',
            label: 'Aprobado',
            icon: 'pi pi-check-circle',
            color: 'green'
        },
        {
            status: 'RECIBIDO',
            label: 'Recibido',
            icon: 'pi pi-box',
            color: 'purple'
        }
    ];

    // Añadir cancelado si es el estado actual
    if (props.currentStatus === 'ANULADO') {
        baseSteps.push({
            status: 'ANULADO',
            label: 'Cancelado',
            icon: 'pi pi-times-circle',
            color: 'red'
        });
    }

    return baseSteps.map(step => {
        const timelineData = props.statusTimeline?.find(t => t.status === step.status);
        const trackingData = getTrackingForStatus(step.status);
        
        // Verificar si el usuario y timestamp tienen datos válidos
        const hasValidUser = trackingData?.user && trackingData.user.name && trackingData.user.name !== 'N/A';
        const hasValidTimestamp = trackingData?.timestamp && trackingData.timestamp !== 'N/A';
        
        return {
            ...step,
            completed: timelineData?.completed || false,
            user: hasValidUser ? trackingData.user : null,
            timestamp: hasValidTimestamp ? trackingData.timestamp : null,
            isActive: props.currentStatus === step.status,
            isFuture: !timelineData?.completed && props.currentStatus !== step.status,
            hasValidData: hasValidUser && hasValidTimestamp
        };
    }).filter(step => {
        // Filtrar el estado APROBADO si no tiene datos válidos
        if (step.status === 'APROBADO' && !step.hasValidData) {
            return false;
        }
        return true;
    });
});

const getTrackingForStatus = (status) => {
    const tracking = props.statusTracking;
    
    switch (status) {
        case 'PENDIENTE':
            return {
                user: tracking.requested_by,
                timestamp: tracking.requested_at
            };
        case 'APROBADO':
            return {
                user: tracking.approved_by,
                timestamp: tracking.approved_at
            };
        case 'RECIBIDO':
            return {
                user: tracking.received_by,
                timestamp: tracking.received_at
            };
        case 'ANULADO':
            return {
                user: tracking.cancelled_by,
                timestamp: tracking.cancelled_at
            };
        default:
            return null;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        return formatDistanceToNow(new Date(dateString), { 
            addSuffix: true, 
            locale: es 
        });
    } catch (error) {
        return new Date(dateString).toLocaleDateString('es-PE');
    }
};

const formatFullDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
</script>

<template>
    <div class="timeline-container">
        <div class="timeline-header">
            <h3 class="timeline-title">
                <i class="pi pi-history"></i>
                Seguimiento de Estado
            </h3>
        </div>

        <div class="timeline-steps">
            <div 
                v-for="(step, index) in timelineSteps" 
                :key="step.status"
                class="timeline-step"
                :class="{
                    'completed': step.completed,
                    'active': step.isActive,
                    'future': step.isFuture,
                    'cancelled': step.status === 'ANULADO'
                }"
            >
                <!-- Línea conectora -->
                <div 
                    v-if="index < timelineSteps.length - 1" 
                    class="timeline-connector"
                    :class="{
                        'completed': step.completed,
                        'cancelled': currentStatus === 'ANULADO' && step.status !== 'ANULADO'
                    }"
                ></div>

                <!-- Icono del estado -->
                <div class="timeline-icon" :class="`timeline-icon-${step.color}`">
                    <i :class="step.icon"></i>
                </div>

                <!-- Contenido del estado -->
                <div class="timeline-content">
                    <div class="timeline-label">
                        <h4>{{ step.label }}</h4>
                        <span 
                            v-if="step.isActive" 
                            class="current-badge"
                        >
                            Actual
                        </span>
                    </div>

                    <!-- Información del usuario y fecha -->
                    <div v-if="step.user && step.timestamp" class="timeline-details">
                        <div class="user-info">
                            <i class="pi pi-user"></i>
                            <span>{{ step.user.name }}</span>
                        </div>
                        <div class="time-info">
                            <i class="pi pi-clock"></i>
                            <span>{{ formatDate(step.timestamp) }}</span>
                        </div>
                        <div class="full-date" v-tooltip.top="formatFullDate(step.timestamp)">
                            {{ formatFullDate(step.timestamp) }}
                        </div>
                    </div>

                    <!-- Placeholder para estados futuros -->
                    <div v-else-if="step.isFuture" class="timeline-placeholder">
                        <span>Pendiente</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resumen de tracking -->
        <div v-if="statusTracking" class="tracking-summary">
            <h4 class="summary-title">Resumen de Gestión</h4>
            <div class="summary-grid">
                <div v-if="statusTracking.requested_by" class="summary-item">
                    <i class="pi pi-plus-circle text-blue-500"></i>
                    <div>
                        <span class="summary-label">Solicitado por:</span>
                        <span class="summary-value">{{ statusTracking.requested_by.name }}</span>
                    </div>
                </div>
                
                <div v-if="statusTracking.approved_by && statusTracking.approved_by.name && statusTracking.approved_by.name !== 'N/A'" class="summary-item">
                    <i class="pi pi-check-circle text-green-500"></i>
                    <div>
                        <span class="summary-label">Aprobado por:</span>
                        <span class="summary-value">{{ statusTracking.approved_by.name }}</span>
                    </div>
                </div>
                
                <div v-if="statusTracking.received_by" class="summary-item">
                    <i class="pi pi-box text-purple-500"></i>
                    <div>
                        <span class="summary-label">Recibido por:</span>
                        <span class="summary-value">{{ statusTracking.received_by.name }}</span>
                    </div>
                </div>
                
                <div v-if="statusTracking.cancelled_by" class="summary-item">
                    <i class="pi pi-times-circle text-red-500"></i>
                    <div>
                        <span class="summary-label">Cancelado por:</span>
                        <span class="summary-value">{{ statusTracking.cancelled_by.name }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.timeline-container {
    @apply p-6 bg-white dark:bg-gray-800 rounded-lg;
}

.timeline-header {
    @apply mb-6 pb-4 border-b border-gray-200 dark:border-gray-600;
}

.timeline-title {
    @apply text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2;
}

.timeline-steps {
    @apply relative space-y-8 mb-8;
}

.timeline-step {
    @apply relative flex items-start gap-4;
}

.timeline-connector {
    @apply absolute left-6 top-12 w-0.5 h-8 bg-gray-300 dark:bg-gray-600 -translate-x-1/2;
}

.timeline-connector.completed {
    @apply bg-green-500;
}

.timeline-connector.cancelled {
    @apply bg-red-300;
}

.timeline-icon {
    @apply w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold relative z-10 flex-shrink-0;
}

.timeline-icon-blue {
    @apply bg-blue-500;
}

.timeline-icon-green {
    @apply bg-green-500;
}

.timeline-icon-purple {
    @apply bg-purple-500;
}

.timeline-icon-red {
    @apply bg-red-500;
}

.timeline-step.future .timeline-icon {
    @apply bg-gray-300 dark:bg-gray-600 text-gray-500;
}

.timeline-step.active .timeline-icon {
    @apply ring-4 ring-opacity-30;
}

.timeline-step.active .timeline-icon-blue {
    @apply ring-blue-300;
}

.timeline-step.active .timeline-icon-green {
    @apply ring-green-300;
}

.timeline-step.active .timeline-icon-purple {
    @apply ring-purple-300;
}

.timeline-step.active .timeline-icon-red {
    @apply ring-red-300;
}

.timeline-content {
    @apply flex-1 min-w-0;
}

.timeline-label {
    @apply flex items-center gap-3 mb-2;
}

.timeline-label h4 {
    @apply text-base font-medium text-gray-800 dark:text-gray-200;
}

.current-badge {
    @apply px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium rounded-full;
}

.timeline-details {
    @apply space-y-1;
}

.user-info,
.time-info {
    @apply flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400;
}

.user-info i,
.time-info i {
    @apply text-xs;
}

.full-date {
    @apply text-xs text-gray-500 dark:text-gray-500 font-mono;
}

.timeline-placeholder {
    @apply text-sm text-gray-400 dark:text-gray-500 italic;
}

/* Resumen de tracking */
.tracking-summary {
    @apply pt-6 border-t border-gray-200 dark:border-gray-600;
}

.summary-title {
    @apply text-base font-medium text-gray-800 dark:text-gray-200 mb-4;
}

.summary-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.summary-item {
    @apply flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.summary-item div {
    @apply flex flex-col min-w-0;
}

.summary-label {
    @apply text-xs text-gray-500 dark:text-gray-400 font-medium;
}

.summary-value {
    @apply text-sm text-gray-700 dark:text-gray-300 font-medium truncate;
}

/* Estados especiales */
.timeline-step.cancelled {
    @apply opacity-75;
}

.timeline-step.cancelled .timeline-content {
    @apply text-red-600 dark:text-red-400;
}

/* Responsive */
@media (max-width: 640px) {
    .timeline-container {
        @apply p-4;
    }
    
    .timeline-step {
        @apply gap-3;
    }
    
    .timeline-icon {
        @apply w-10 h-10;
    }
    
    .timeline-label {
        @apply flex-col items-start gap-1;
    }
    
    .summary-grid {
        @apply grid-cols-1;
    }
}
</style>