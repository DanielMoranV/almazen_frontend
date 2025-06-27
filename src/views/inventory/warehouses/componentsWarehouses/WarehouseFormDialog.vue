<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    warehouse: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    location: '',
    phone: ''
});

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        location: '',
        phone: ''
    };
};

const isFormValid = computed(() => {
    return form.value.name && form.value.location; // Phone is optional
});

const handleSubmit = () => {
    emit('submit', form.value);
    resetForm();
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};

watch(
    () => props.warehouse,
    (newWarehouse) => {
        if (newWarehouse) {
            form.value = { ...newWarehouse };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '550px', maxWidth: '95vw' }" :header="form.id ? '✏️ Editar Almacén' : '🏢➕ Nuevo Almacén'" :modal="true" class="p-fluid warehouse-dialog">
        <div class="flex flex-col gap-4">
            <!-- Información básica del almacén -->
            <div class="grid grid-cols-1 gap-4">
                <!-- Nombre -->
                <div class="field">
                    <label for="name" class="font-medium mb-2 block">Nombre del almacén</label>
                    <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre del almacén" :class="{ 'p-invalid': !form.name }" />
                    <small class="p-error" v-if="!form.name">El nombre es requerido.</small>
                </div>

                <!-- Dirección -->
                <div class="field">
                    <label for="location" class="font-medium mb-2 block">Ubicación</label>
                    <Textarea id="location" v-model="form.location" autoResize rows="2" placeholder="Ingrese la ubicación del almacén" :class="{ 'p-invalid': !form.location }" />
                    <small class="p-error" v-if="!form.location">La ubicación es requerida.</small>
                </div>

                <!-- Teléfono -->
                <div class="field">
                    <label for="phone" class="font-medium mb-2 block">Teléfono</label>
                    <InputText id="phone" v-model="form.phone" placeholder="Ingrese el número de teléfono" />
                    <small class="text-gray-500">Campo opcional</small>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="handleCancel" />
                <Button label="Guardar" icon="pi pi-check" class="p-button-primary" :disabled="!isFormValid" @click="handleSubmit" :loading="loading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/**
 * Estilos para el diálogo de formulario de almacén.
 * Se utiliza :deep para aplicar estilos a componentes anidados de PrimeVue.
 */

/* Estilo del encabezado del diálogo */
:deep(.warehouse-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white rounded-t-xl p-6 relative overflow-hidden;
}

/* Efecto de patrón de puntos en el encabezado */
:deep(.warehouse-dialog .p-dialog-header::before) {
    content: '';
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 2px, transparent 2px);
    background-size: 40px 40px;
}

/* Título del diálogo */
:deep(.warehouse-dialog .p-dialog-title) {
    @apply text-xl font-bold relative z-10;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Icono de cierre del diálogo */
:deep(.warehouse-dialog .p-dialog-header .p-dialog-header-icon) {
    @apply text-white opacity-90 relative z-10 transition-all rounded-xl w-10 h-10 hover:bg-white/20;
}

/* Contenido del diálogo */
:deep(.warehouse-dialog .p-dialog-content) {
    @apply p-6 bg-white dark:bg-gray-800 rounded-b-2xl border border-gray-200 dark:border-gray-700 border-t-0 max-h-96 overflow-y-auto;
}

/* Estilos generales para campos de formulario */
.field {
    @apply flex flex-col gap-2 mb-4;
}

.field label {
    @apply font-semibold text-sm text-gray-700 dark:text-gray-300;
}

/* Estilos base para componentes de entrada de PrimeVue */
:deep(.p-inputtext),
:deep(.p-textarea) {
    @apply border-2 rounded-xl font-medium transition-all border-gray-300 dark:border-gray-600;
}

/* Estado de foco para componentes de entrada */
:deep(.p-inputtext:focus),
:deep(.p-textarea:focus) {
    @apply border-red-500 ring-2 ring-red-500/20;
}

/* Pie de página del diálogo y botones */
:deep(.p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700;
}

:deep(.p-dialog-footer .p-button-primary) {
    @apply bg-red-600 hover:bg-red-700 border-none py-3 px-6 rounded-xl font-bold text-base transition-all;
}

:deep(.p-dialog-footer .p-button-text) {
    @apply text-gray-600 dark:text-gray-400 font-semibold py-3 px-6 rounded-xl text-base transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200;
}

/* Estilos para campos con errores de validación */
:deep(.p-invalid) {
    @apply border-red-500 bg-red-50 dark:bg-red-900/20;
}

:deep(.p-invalid:focus) {
    @apply border-red-500 ring-2 ring-red-500/20;
}

.p-error {
    @apply text-red-600 dark:text-red-400 text-sm mt-1 font-medium p-2 bg-red-50 dark:bg-red-900/20 rounded-xl border-l-4 border-red-500;
}

/* Texto de ayuda */
.text-gray-500 {
    @apply text-sm italic;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    :deep(.warehouse-dialog .p-dialog-content) {
        @apply p-4;
    }

    .field {
        @apply mb-3;
    }

    :deep(.p-dialog-footer) {
        @apply p-4;
    }

    :deep(.p-dialog-footer .p-button-primary),
    :deep(.p-dialog-footer .p-button-text) {
        @apply py-2.5 px-4 text-sm;
    }
}
</style>
