<script setup>
import { computed } from 'vue';
import Badge from 'primevue/badge';

const props = defineProps({
    status: {
        type: String,
        required: true,
        validator: (value) => ['PENDIENTE', 'PAGADO', 'VENCIDO', 'ANULADO'].includes(value)
    },
    size: {
        type: String,
        default: 'normal',
        validator: (value) => ['small', 'normal', 'large'].includes(value)
    }
});

// Configuración de severidad según el estado
const severity = computed(() => {
    const severityMap = {
        PENDIENTE: 'info',
        PAGADO: 'success',
        VENCIDO: 'danger',
        ANULADO: 'secondary'
    };
    return severityMap[props.status] || 'info';
});

// Configuración de texto según el estado
const displayText = computed(() => {
    const textMap = {
        PENDIENTE: 'Pendiente',
        PAGADO: 'Pagado',
        VENCIDO: 'Vencido',
        ANULADO: 'Anulado'
    };
    return textMap[props.status] || props.status;
});

// Configuración de iconos según el estado
const icon = computed(() => {
    const iconMap = {
        PENDIENTE: 'pi pi-clock',
        PAGADO: 'pi pi-check-circle',
        VENCIDO: 'pi pi-exclamation-triangle',
        ANULADO: 'pi pi-times-circle'
    };
    return iconMap[props.status] || 'pi pi-circle';
});

// Configuración de tamaño
const sizeClass = computed(() => {
    const sizeMap = {
        small: 'text-xs px-2 py-1',
        normal: 'text-sm px-3 py-1',
        large: 'text-base px-4 py-2'
    };
    return sizeMap[props.size] || sizeMap.normal;
});
</script>

<template>
    <Badge :value="displayText" :severity="severity" class="credit-status-badge" :class="sizeClass">
        <template #default>
            <div class="flex items-center gap-1">
                <i :class="icon"></i>
                <span>{{ displayText }}</span>
            </div>
        </template>
    </Badge>
</template>

<style scoped>
.credit-status-badge {
    @apply font-semibold rounded-full transition-all;
}

:deep(.p-badge) {
    @apply flex items-center gap-1;
}
</style>
