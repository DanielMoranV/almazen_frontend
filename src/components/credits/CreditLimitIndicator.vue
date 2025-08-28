<script setup>
import { computed } from 'vue';
import ProgressBar from 'primevue/progressbar';

const props = defineProps({
    creditLimit: {
        type: Number,
        required: true,
        default: 0
    },
    totalDebt: {
        type: Number,
        required: true,
        default: 0
    },
    showLabels: {
        type: Boolean,
        default: true
    },
    showPercentage: {
        type: Boolean,
        default: true
    },
    size: {
        type: String,
        default: 'normal',
        validator: (value) => ['small', 'normal', 'large'].includes(value)
    }
});

// Cálculos
const usedPercentage = computed(() => {
    if (props.creditLimit === 0) return 0;
    return Math.min((props.totalDebt / props.creditLimit) * 100, 100);
});

const availableCredit = computed(() => {
    return Math.max(props.creditLimit - props.totalDebt, 0);
});

// Configuración de color según el porcentaje usado
const progressColor = computed(() => {
    const percentage = usedPercentage.value;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    if (percentage >= 50) return 'info';
    return 'success';
});

// Configuración de altura según el tamaño
const height = computed(() => {
    const heightMap = {
        small: '8px',
        normal: '12px',
        large: '16px'
    };
    return heightMap[props.size] || heightMap.normal;
});

// Formateo de moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0);
};
</script>

<template>
    <div class="credit-limit-indicator">
        <!-- Etiquetas superiores -->
        <div v-if="showLabels" class="labels-container">
            <div class="label-item">
                <span class="label-text">Límite:</span>
                <span class="label-value">{{ formatCurrency(creditLimit) }}</span>
            </div>
            <div class="label-item">
                <span class="label-text">Usado:</span>
                <span class="label-value used">{{ formatCurrency(totalDebt) }}</span>
            </div>
            <div class="label-item">
                <span class="label-text">Disponible:</span>
                <span class="label-value available">{{ formatCurrency(availableCredit) }}</span>
            </div>
        </div>

        <!-- Barra de progreso -->
        <div class="progress-container">
            <ProgressBar :value="usedPercentage" :show-value="showPercentage" :style="{ height: height }" :class="['credit-progress', `credit-progress-${progressColor}`, `credit-progress-${size}`]" />
        </div>

        <!-- Información adicional -->
        <div v-if="showPercentage" class="percentage-info">
            <span class="percentage-text" :class="progressColor + '-text'"> {{ usedPercentage.toFixed(1) }}% utilizado </span>
            <span v-if="usedPercentage >= 90" class="warning-text">
                <i class="pi pi-exclamation-triangle"></i>
                Límite casi agotado
            </span>
        </div>
    </div>
</template>

<style scoped>
.credit-limit-indicator {
    @apply space-y-2;
}

.labels-container {
    @apply flex justify-between items-center text-sm;
}

.label-item {
    @apply flex flex-col text-center;
}

.label-text {
    @apply text-gray-600 dark:text-gray-400 text-xs font-medium;
}

.label-value {
    @apply font-bold text-gray-900 dark:text-white;
}

.label-value.used {
    @apply text-orange-600 dark:text-orange-400;
}

.label-value.available {
    @apply text-green-600 dark:text-green-400;
}

.progress-container {
    @apply relative;
}

.percentage-info {
    @apply flex justify-between items-center text-xs;
}

.percentage-text {
    @apply font-semibold;
}

.percentage-text.success-text {
    @apply text-green-600 dark:text-green-400;
}

.percentage-text.info-text {
    @apply text-blue-600 dark:text-blue-400;
}

.percentage-text.warning-text {
    @apply text-orange-600 dark:text-orange-400;
}

.percentage-text.danger-text {
    @apply text-red-600 dark:text-red-400;
}

.warning-text {
    @apply text-red-600 dark:text-red-400 font-semibold flex items-center gap-1;
}

/* Estilos de barra de progreso */
:deep(.credit-progress.credit-progress-success .p-progressbar-value) {
    @apply bg-green-500;
}

:deep(.credit-progress.credit-progress-info .p-progressbar-value) {
    @apply bg-blue-500;
}

:deep(.credit-progress.credit-progress-warning .p-progressbar-value) {
    @apply bg-orange-500;
}

:deep(.credit-progress.credit-progress-danger .p-progressbar-value) {
    @apply bg-red-500;
}

:deep(.credit-progress .p-progressbar) {
    @apply bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

:deep(.credit-progress .p-progressbar-value) {
    @apply transition-all duration-300 rounded-full;
}

:deep(.credit-progress .p-progressbar-label) {
    @apply text-white font-semibold text-xs;
}

/* Tamaños */
:deep(.credit-progress-small .p-progressbar-label) {
    @apply text-xs;
}

:deep(.credit-progress-normal .p-progressbar-label) {
    @apply text-sm;
}

:deep(.credit-progress-large .p-progressbar-label) {
    @apply text-base;
}

/* Responsive */
@media (max-width: 640px) {
    .labels-container {
        @apply flex-col space-y-1;
    }

    .label-item {
        @apply flex-row justify-between;
    }
}
</style>
