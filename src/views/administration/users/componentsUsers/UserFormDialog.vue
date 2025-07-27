<script setup>
import { ref, computed, watch } from 'vue';
import { Positions } from '@/constants/positions';

const submitted = ref(false);

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    user: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    dni: '',
    email: '',
    phone: '',
    position: '',
    is_active: true
});

const positions = Object.values(Positions).map((value) => ({
    label: value,
    value
}));

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        dni: '',
        email: '',
        phone: '',
        position: '',
        is_active: true
    };
};

// Reset form when user changes
watch(
    () => props.user,
    (user) => {
        if (user) {
            form.value = { ...user };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

// Validations
const isValidDNI = computed(() => /^\d{8}$/.test(form.value.dni));
const isValidPhone = computed(() => /^\d{9}$/.test(form.value.phone));
const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email));
const isFormValid = computed(() => form.value.name && isValidDNI.value && isValidPhone.value && isValidEmail.value && form.value.position);

const handleSubmit = () => {
    submitted.value = true;
    if (isFormValid.value) {
        emit('submit', form.value);
        resetForm();
    }
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="(val) => emit('update:visible', val)"
        :style="{ width: '550px', maxWidth: '95vw' }"
        :header="form.id ? '✏️ Editar Usuario' : '👤➕ Nuevo Usuario'"
        :modal="true"
        class="p-fluid user-dialog"
        :closable="true"
        :dismissableMask="false"
    >
        <div class="form-content">
            <!-- Información personal -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-user"></i>
                        Información Personal
                    </h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Nombre -->
                    <div class="field col-span-2">
                        <label for="name" class="field-label">Nombre completo *</label>
                        <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre completo" :class="{ 'p-invalid': submitted && !form.name }" class="form-input" autofocus />
                        <small class="p-error" v-if="submitted && !form.name">El nombre es requerido.</small>
                    </div>
                    <!-- DNI -->
                    <div class="field">
                        <label for="dni" class="field-label">DNI *</label>
                        <InputText id="dni" v-model="form.dni" placeholder="12345678" :class="{ 'p-invalid': submitted && form.dni && !isValidDNI }" class="form-input" v-keyfilter.int maxlength="8" />
                        <small class="p-error" v-if="submitted && form.dni && !isValidDNI">DNI debe tener 8 dígitos numéricos.</small>
                    </div>
                    <!-- Teléfono -->
                    <div class="field">
                        <label for="phone" class="field-label">Teléfono *</label>
                        <InputText id="phone" v-model="form.phone" placeholder="987654321" :class="{ 'p-invalid': submitted && form.phone && !isValidPhone }" class="form-input" v-keyfilter.int maxlength="9" />
                        <small class="p-error" v-if="submitted && form.phone && !isValidPhone">Teléfono debe tener 9 dígitos numéricos.</small>
                    </div>
                </div>
            </div>

            <!-- Información de contacto y trabajo -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-briefcase"></i>
                        Información Laboral
                    </h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Email -->
                    <div class="field col-span-2">
                        <label for="email" class="field-label">Email *</label>
                        <InputText id="email" v-model="form.email" placeholder="usuario@empresa.com" :class="{ 'p-invalid': submitted && form.email && !isValidEmail }" class="form-input" type="email" />
                        <small class="p-error" v-if="submitted && form.email && !isValidEmail">Ingrese un email válido.</small>
                    </div>
                    <!-- Cargo -->
                    <div class="field col-span-2">
                        <label for="position" class="field-label">Cargo *</label>
                        <Select id="position" v-model="form.position" :options="positions" optionLabel="label" optionValue="value" placeholder="Seleccione un cargo" :class="{ 'p-invalid': submitted && !form.position }" class="form-select" />
                        <small class="p-error" v-if="submitted && !form.position">El cargo es requerido.</small>
                    </div>
                </div>
            </div>

            <!-- Estado del usuario -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-cog"></i>
                        Configuración
                    </h3>
                </div>
                <div class="field-checkbox">
                    <Checkbox id="is_active" v-model="form.is_active" :binary="true" />
                    <label for="is_active" class="checkbox-label">
                        <span class="label-text">Usuario activo</span>
                        <span class="label-description">Determina si el usuario puede acceder al sistema</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="handleCancel" />
                <Button label="Guardar" icon="pi pi-check" class="p-button-primary" @click="handleSubmit" :loading="loading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Encabezado del diálogo mejorado */
:deep(.user-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-t-xl p-6 relative overflow-hidden;
}

/* Efecto de patrón de puntos en el encabezado */
:deep(.user-dialog .p-dialog-header::before) {
    content: '';
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 2px, transparent 2px);
    background-size: 40px 40px;
}

/* Título del diálogo */
:deep(.user-dialog .p-dialog-title) {
    @apply text-xl font-bold relative z-10;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Icono de cierre del diálogo */
:deep(.user-dialog .p-dialog-header .p-dialog-header-icon) {
    @apply text-white opacity-90 relative z-10 transition-all rounded-xl w-10 h-10 hover:bg-white/20;
}

/* Contenido del diálogo */
:deep(.user-dialog .p-dialog-content) {
    @apply p-6 bg-white dark:bg-gray-800 rounded-b-2xl border border-gray-200 dark:border-gray-700 border-t-0;
}

.form-content {
    @apply space-y-6;
}

/* Secciones del formulario */
.form-section {
    @apply bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200 dark:border-gray-600;
}

.section-header {
    @apply mb-4 pb-3 border-b border-gray-200 dark:border-gray-600;
}

.section-title {
    @apply text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 m-0;
}

.section-title i {
    @apply text-purple-600 dark:text-purple-400;
}

/* Campos de formulario mejorados */
.field {
    @apply flex flex-col gap-2;
}

.field-label {
    @apply font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1;
}

.form-input,
.form-select {
    @apply transition-all duration-200;
}

/* Estilo para checkboxes mejorado */
.field-checkbox {
    @apply flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700 transition-all;
}

.field-checkbox:hover {
    @apply bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600;
}

.checkbox-label {
    @apply flex flex-col gap-1;
}

.label-text {
    @apply font-semibold text-gray-800 dark:text-gray-200;
}

.label-description {
    @apply text-sm text-gray-600 dark:text-gray-400;
}

/* Estilos base para componentes de entrada de PrimeVue */
:deep(.p-inputtext),
:deep(.p-dropdown) {
    @apply border-2 rounded-xl font-medium transition-all border-gray-300 dark:border-gray-600;
}

/* Estado de foco para componentes de entrada */
:deep(.p-inputtext:focus),
:deep(.p-dropdown:not(.p-disabled).p-focus) {
    @apply border-purple-500 ring-2 ring-purple-500/20;
}

/* Pie de página del diálogo y botones */
:deep(.p-dialog-footer) {
    @apply p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700;
}

:deep(.p-dialog-footer .p-button-primary) {
    @apply bg-purple-600 hover:bg-purple-700 border-none py-3 px-6 rounded-xl font-bold text-base transition-all;
}

:deep(.p-dialog-footer .p-button-text) {
    @apply text-gray-600 dark:text-gray-400 font-semibold py-3 px-6 rounded-xl text-base transition-all hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-200;
}

/* Estados de validación mejorados */
:deep(.p-invalid) {
    @apply border-red-400 bg-red-50 dark:bg-red-900/20 shadow-sm;
}

:deep(.p-invalid:focus) {
    @apply border-red-500 ring-2 ring-red-500/20 bg-red-50 dark:bg-red-900/20;
}

.p-error {
    @apply text-red-700 dark:text-red-300 text-sm mt-2 font-medium p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-2;
}

.p-error::before {
    content: '⚠';
    @apply text-red-500 font-bold;
}

/* Animación del patrón */
@keyframes header-pattern {
    0% {
        background-position:
            0% 0%,
            0% 0%;
    }
    100% {
        background-position:
            100% 100%,
            -100% -100%;
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    :deep(.user-dialog .p-dialog-header) {
        @apply p-6;
    }

    .dialog-header-content {
        @apply gap-3;
    }

    .header-icon {
        @apply w-12 h-12;
    }

    .header-icon i {
        @apply text-xl;
    }

    .header-title {
        @apply text-xl;
    }

    .form-section {
        @apply p-4;
    }

    .footer-actions {
        @apply flex-col gap-3;
    }

    .cancel-btn,
    .save-btn {
        @apply w-full;
    }
}

@media (max-width: 480px) {
    :deep(.user-dialog .p-dialog-header) {
        @apply p-4;
    }

    .header-title {
        @apply text-lg;
    }

    .header-subtitle {
        @apply text-xs;
    }

    .form-section {
        @apply p-3;
    }

    .section-title {
        @apply text-base;
    }
}
</style>
