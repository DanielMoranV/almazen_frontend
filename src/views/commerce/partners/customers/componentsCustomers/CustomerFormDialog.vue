<script setup>
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { computed, reactive, watch } from 'vue';

const props = defineProps({
    visible: { type: Boolean, default: false },
    customer: { type: Object, default: null },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:visible', 'submit']);

const localCustomer = reactive({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    identity_document: '',
    identity_document_type: 'dni',
    is_active: true
});

watch(
    () => props.customer,
    (val) => {
        Object.assign(
            localCustomer,
            val ?? {
                id: null,
                name: '',
                email: '',
                phone: '',
                address: '',
                identity_document: '',
                identity_document_type: 'dni',
                is_active: true
            }
        );
    },
    { immediate: true }
);

const docTypes = [
    { label: 'DNI', value: 'dni' },
    { label: 'RUC', value: 'ruc' },
    { label: 'Pasaporte', value: 'passport' },
    { label: 'Otro', value: 'other' }
];

const dialogTitle = computed(() => (localCustomer.id ? 'Editar Cliente' : 'Nuevo Cliente'));
const submitLabel = computed(() => (localCustomer.id ? 'Actualizar' : 'Guardar'));

const close = () => emit('update:visible', false);

const submit = () => emit('submit', { ...localCustomer });
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="$emit('update:visible', $event)"
        :style="{ width: '550px', maxWidth: '95vw' }"
        :header="localCustomer.id ? '✏️ Editar Cliente' : '👤➕ Nuevo Cliente'"
        :modal="true"
        class="p-fluid customer-dialog"
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
                        <InputText id="name" v-model.trim="localCustomer.name" placeholder="Ingrese el nombre completo" class="form-input" autofocus />
                    </div>
                    <!-- Email -->
                    <div class="field">
                        <label for="email" class="field-label">Email</label>
                        <InputText id="email" v-model.trim="localCustomer.email" placeholder="cliente@empresa.com" class="form-input" type="email" />
                    </div>
                    <!-- Teléfono -->
                    <div class="field">
                        <label for="phone" class="field-label">Teléfono</label>
                        <InputText id="phone" v-model.trim="localCustomer.phone" placeholder="987654321" class="form-input" />
                    </div>
                </div>
            </div>

            <!-- Información de contacto y documentación -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-id-card"></i>
                        Información de Documentación
                    </h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Dirección -->
                    <div class="field col-span-2">
                        <label for="address" class="field-label">Dirección</label>
                        <Textarea id="address" v-model.trim="localCustomer.address" rows="3" placeholder="Ingrese la dirección completa" class="form-input" />
                    </div>
                    <!-- Documento -->
                    <div class="field">
                        <label for="identity_document" class="field-label">Nro. Documento</label>
                        <InputText id="identity_document" v-model.trim="localCustomer.identity_document" placeholder="12345678" class="form-input" />
                    </div>
                    <!-- Tipo Documento -->
                    <div class="field">
                        <label for="identity_document_type" class="field-label">Tipo Documento</label>
                        <Select id="identity_document_type" v-model="localCustomer.identity_document_type" :options="docTypes" optionLabel="label" optionValue="value" placeholder="Seleccione tipo" class="form-select" />
                    </div>
                </div>
            </div>

            <!-- Estado del cliente -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-cog"></i>
                        Configuración
                    </h3>
                </div>
                <div class="field-checkbox">
                    <Checkbox id="is_active" v-model="localCustomer.is_active" :binary="true" />
                    <label for="is_active" class="checkbox-label">
                        <span class="label-text">Cliente activo</span>
                        <span class="label-description">Determina si el cliente está habilitado para realizar operaciones</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <template #footer>
            <div class="flex justify-between w-full">
                <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="close" />
                <Button :label="submitLabel" icon="pi pi-check" class="p-button-primary" @click="submit" :loading="loading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Encabezado del diálogo mejorado */
:deep(.customer-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-t-xl p-6 relative overflow-hidden;
}

/* Efecto de patrón de puntos en el encabezado */
:deep(.customer-dialog .p-dialog-header::before) {
    content: '';
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.5) 2px, transparent 2px);
    background-size: 40px 40px;
}

/* Título del diálogo */
:deep(.customer-dialog .p-dialog-title) {
    @apply text-xl font-bold relative z-10;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Icono de cierre del diálogo */
:deep(.customer-dialog .p-dialog-header .p-dialog-header-icon) {
    @apply text-white opacity-90 relative z-10 transition-all rounded-xl w-10 h-10 hover:bg-white/20;
}

/* Contenido del diálogo */
:deep(.customer-dialog .p-dialog-content) {
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
:deep(.p-select),
:deep(.p-textarea) {
    @apply border-2 rounded-xl font-medium transition-all border-gray-300 dark:border-gray-600;
}

/* Estado de foco para componentes de entrada */
:deep(.p-inputtext:focus),
:deep(.p-select:not(.p-disabled).p-focus),
:deep(.p-textarea:focus) {
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

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    :deep(.customer-dialog .p-dialog-header) {
        @apply p-6;
    }

    .form-section {
        @apply p-4;
    }
}

@media (max-width: 480px) {
    :deep(.customer-dialog .p-dialog-header) {
        @apply p-4;
    }

    .form-section {
        @apply p-3;
    }

    .section-title {
        @apply text-base;
    }
}
</style>
