<script setup>
import { computed } from 'vue';
import Card from 'primevue/card';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    value: {
        type: [Number, String],
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: 'blue',
        validator: (value) => ['blue', 'green', 'orange', 'red', 'purple', 'teal', 'indigo', 'pink'].includes(value)
    },
    trend: {
        type: Object,
        default: null
        // { direction: 'up' | 'down' | 'neutral', percentage: number, period: string }
    },
    format: {
        type: String,
        default: 'number',
        validator: (value) => ['number', 'currency', 'percentage'].includes(value)
    },
    size: {
        type: String,
        default: 'normal',
        validator: (value) => ['small', 'normal', 'large'].includes(value)
    },
    loading: {
        type: Boolean,
        default: false
    }
});

// Formateo del valor principal
const formattedValue = computed(() => {
    if (props.loading) return '---';

    const value = typeof props.value === 'string' ? parseFloat(props.value) || 0 : props.value;

    switch (props.format) {
        case 'currency':
            return new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(value);
        case 'percentage':
            return `${value.toFixed(1)}%`;
        case 'number':
        default:
            return value.toLocaleString('es-PE');
    }
});

// Configuración de colores
const colorClasses = computed(() => {
    const colorMap = {
        blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
        green: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
        orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white',
        red: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
        purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
        teal: 'bg-gradient-to-br from-teal-500 to-teal-600 text-white',
        indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white',
        pink: 'bg-gradient-to-br from-pink-500 to-pink-600 text-white'
    };
    return colorMap[props.color] || colorMap.blue;
});

// Configuración de tamaño
const sizeClasses = computed(() => {
    const sizeMap = {
        small: {
            card: 'min-h-[120px]',
            icon: 'text-2xl',
            value: 'text-xl',
            title: 'text-sm',
            subtitle: 'text-xs'
        },
        normal: {
            card: 'min-h-[140px]',
            icon: 'text-3xl',
            value: 'text-2xl',
            title: 'text-base',
            subtitle: 'text-sm'
        },
        large: {
            card: 'min-h-[160px]',
            icon: 'text-4xl',
            value: 'text-3xl',
            title: 'text-lg',
            subtitle: 'text-base'
        }
    };
    return sizeMap[props.size] || sizeMap.normal;
});

// Configuración de tendencia
const trendIcon = computed(() => {
    if (!props.trend) return '';

    const iconMap = {
        up: 'pi pi-arrow-up',
        down: 'pi pi-arrow-down',
        neutral: 'pi pi-minus'
    };
    return iconMap[props.trend.direction] || '';
});

const trendClass = computed(() => {
    if (!props.trend) return '';

    const classMap = {
        up: 'text-green-300',
        down: 'text-red-300',
        neutral: 'text-gray-300'
    };
    return classMap[props.trend.direction] || '';
});
</script>

<template>
    <Card class="metrics-widget transition-all duration-200 hover:shadow-lg border-0" :class="[colorClasses, sizeClasses.card]">
        <template #content>
            <div class="widget-content p-2 flex items-center gap-4">
                <!-- Icono -->
                <div class="widget-icon opacity-80" :class="sizeClasses.icon">
                    <i :class="icon"></i>
                </div>

                <!-- Información principal -->
                <div class="widget-info flex-1">
                    <!-- Valor principal -->
                    <div class="widget-value font-bold leading-tight mb-1" :class="sizeClasses.value">
                        <div v-if="loading" class="loading-skeleton">
                            <div class="animate-pulse bg-white/20 rounded h-6 w-20"></div>
                        </div>
                        <span v-else>{{ formattedValue }}</span>
                    </div>

                    <!-- Título -->
                    <div class="widget-title opacity-90 mb-0" :class="sizeClasses.title">
                        {{ title }}
                    </div>

                    <!-- Subtítulo -->
                    <div v-if="subtitle" class="widget-subtitle opacity-75 mb-0" :class="sizeClasses.subtitle">
                        {{ subtitle }}
                    </div>

                    <!-- Tendencia -->
                    <div v-if="trend" class="widget-trend mt-2 flex items-center gap-1" :class="sizeClasses.subtitle">
                        <i :class="[trendIcon, trendClass]"></i>
                        <span :class="trendClass"> {{ trend.percentage }}% {{ trend.period }} </span>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.metrics-widget {
    @apply cursor-default;
}

.widget-content {
    @apply h-full;
}

.widget-icon {
    @apply flex-shrink-0;
}

.widget-info {
    @apply min-w-0; /* Para evitar overflow de texto largo */
}

.widget-value {
    @apply break-words;
}

.widget-title {
    @apply break-words;
}

.widget-subtitle {
    @apply break-words;
}

.loading-skeleton {
    @apply flex items-center;
}

/* Efectos de hover */
.metrics-widget:hover {
    @apply transform scale-105;
}

/* Estilos para el contenido de la tarjeta */
:deep(.metrics-widget .p-card-content) {
    @apply p-4 h-full flex items-center;
}

/* Responsive */
@media (max-width: 640px) {
    .widget-content {
        @apply gap-3;
    }
}

/* Animaciones */
@keyframes pulse-glow {
    0%,
    100% {
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
    }
    50% {
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    }
}

.metrics-widget:hover {
    animation: pulse-glow 2s infinite;
}
</style>
