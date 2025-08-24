<script setup>
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed, reactive, watch } from 'vue';
import { useCustomersStore } from '@/stores/customersStore';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    visible: { type: Boolean, default: false },
    customer: { type: Object, default: null },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:visible', 'submit']);

const customersStore = useCustomersStore();
const toast = useToast();

const localCustomer = reactive({
    id: null,
    name: '',
    commercial_name: '',
    email: '',
    phone: '',
    identity_document: '',
    identity_document_type: 'dni',
    address: '',
    is_active: true,
    credit_enabled: false,
    credit_limit: 0,
    credit_days: 30
});

watch(
    () => props.customer,
    (val) => {
        Object.assign(
            localCustomer,
            val ?? {
                id: null,
                name: '',
                commercial_name: '',
                email: '',
                phone: '',
                identity_document: '',
                identity_document_type: 'dni',
                address: '',
                is_active: true,
                credit_enabled: false,
                credit_limit: 0,
                credit_days: 30
            }
        );
    },
    { immediate: true }
);

const docTypes = [
    { label: 'DNI', value: 'dni' },
    { label: 'RUC', value: 'ruc' },
    { label: 'Carné de Extranjería', value: 'ce' },
    { label: 'Pasaporte', value: 'passport' },
    { label: 'PTP', value: 'ptp' },
    { label: 'Otro', value: 'other' }
];

const dialogTitle = computed(() => (localCustomer.id ? 'Editar Cliente' : 'Nuevo Cliente'));
const submitLabel = computed(() => (localCustomer.id ? 'Actualizar' : 'Guardar'));

// Determinar si es RUC para mostrar campos específicos
const isRuc = computed(() => localCustomer.identity_document_type === 'ruc');
const isDni = computed(() => localCustomer.identity_document_type === 'dni');

// Estados para búsqueda de documentos
const isLoadingDocumentData = computed(() => customersStore.isLoadingDocumentLookup);
const canLookupDocument = computed(() => {
    const doc = localCustomer.identity_document?.trim();
    const type = localCustomer.identity_document_type;
    
    if (!doc || !type) return false;
    
    if (type === 'dni') return /^\d{8}$/.test(doc);
    if (type === 'ruc') return /^\d{11}$/.test(doc);
    
    return false;
});

// Validaciones para documentos
const validateDocument = (document, type) => {
    if (!document) return true; // Documento opcional
    
    switch (type) {
        case 'dni':
            return /^\d{8}$/.test(document);
        case 'ruc':
            return /^\d{11}$/.test(document);
        case 'ce':
            return /^\d{9}$/.test(document);
        case 'passport':
            return /^[A-Za-z0-9]{6,12}$/.test(document);
        default:
            return document.length >= 6;
    }
};

// Validación básica del formulario
const validateForm = () => {
    const errors = [];
    
    if (!localCustomer.name?.trim()) {
        errors.push('El nombre es obligatorio');
    }
    
    if (localCustomer.identity_document?.trim() && !validateDocument(localCustomer.identity_document, localCustomer.identity_document_type)) {
        const docType = docTypes.find(dt => dt.value === localCustomer.identity_document_type)?.label || localCustomer.identity_document_type;
        errors.push(`El formato del ${docType} no es válido`);
    }
    
    if (localCustomer.credit_enabled) {
        if (!localCustomer.credit_limit || localCustomer.credit_limit <= 0) {
            errors.push('El límite de crédito debe ser mayor a 0');
        }
        if (!localCustomer.credit_days || localCustomer.credit_days <= 0) {
            errors.push('Los días de crédito deben ser mayor a 0');
        }
    }
    
    return errors;
};

// Búsqueda automática de datos por documento
const lookupDocumentData = async () => {
    if (!canLookupDocument.value) return;
    
    const payload = {
        document: localCustomer.identity_document.trim(),
        type: localCustomer.identity_document_type
    };
    
    await customersStore.lookupDocumentData(payload);
    
    if (customersStore.documentLookupSuccess) {
        mapDocumentDataToCustomer(customersStore.documentLookupData);
        toast.add({
            severity: 'success',
            summary: 'Datos encontrados',
            detail: customersStore.documentLookupMessage,
            life: 3000
        });
    } else {
        toast.add({
            severity: 'error',
            summary: 'Error en búsqueda',
            detail: customersStore.documentLookupMessage,
            life: 4000
        });
    }
};

// Mapear datos de la API a los campos del cliente
const mapDocumentDataToCustomer = (data) => {
    if (!data) return;
    
    customersStore.clearDocumentData();
    
    if (localCustomer.identity_document_type === 'dni') {
        // Mapeo para DNI (RENIEC)
        localCustomer.name = data.nombre_completo || '';
        localCustomer.address = data.direccion || '';
    } else if (localCustomer.identity_document_type === 'ruc') {
        // Mapeo para RUC (SUNAT) - usando los campos reales de la respuesta
        localCustomer.name = data.razon_social || '';
        localCustomer.commercial_name = data.nombre_comercial || '';
        localCustomer.address = data.direccion_completa || data.direccion || '';
    }
};

const close = () => {
    customersStore.clearDocumentData();
    emit('update:visible', false);
};

const submit = () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
        // En una aplicación real, mostrarías estos errores al usuario
        console.warn('Errores de validación:', errors);
        return;
    }
    
    // Limpiar campos opcionales vacíos
    const customerData = { ...localCustomer };
    Object.keys(customerData).forEach(key => {
        if (customerData[key] === '' || customerData[key] === null) {
            delete customerData[key];
        }
    });
    
    emit('submit', customerData);
};
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="$emit('update:visible', $event)"
        :style="{ width: '650px', maxWidth: '95vw' }"
        :header="localCustomer.id ? '✏️ Editar Cliente' : '👤➕ Nuevo Cliente'"
        :modal="true"
        class="p-fluid customer-dialog"
        :closable="true"
        :dismissableMask="false"
    >
        <div class="form-content">
            <!-- Información de contacto y documentación -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-id-card"></i>
                        Información de Documentación
                    </h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Tipo Documento -->
                    <div class="field">
                        <label for="identity_document_type" class="field-label">Tipo Documento</label>
                        <Select id="identity_document_type" v-model="localCustomer.identity_document_type" :options="docTypes" optionLabel="label" optionValue="value" placeholder="Seleccione tipo" class="form-select" autofocus />
                    </div>
                    <!-- Documento -->
                    <div class="field">
                        <label for="identity_document" class="field-label">Nro. Documento</label>
                        <div class="flex gap-2">
                            <InputText 
                                id="identity_document" 
                                v-model.trim="localCustomer.identity_document" 
                                :placeholder="isRuc ? '20123456789' : '12345678'" 
                                class="form-input flex-1" 
                            />
                            <Button 
                                :loading="isLoadingDocumentData"
                                :disabled="!canLookupDocument"
                                icon="pi pi-search" 
                                class="p-button-info lookup-btn"
                                @click="lookupDocumentData"
                                v-tooltip.top="'Buscar datos automáticamente'"
                                type="button"
                            />
                        </div>
                        <small v-if="canLookupDocument && !isLoadingDocumentData" class="lookup-hint">
                            💡 Haz clic en buscar para obtener datos automáticamente
                        </small>
                    </div>
                    <!-- Dirección -->
                    <div class="field col-span-2">
                        <label for="address" class="field-label">Dirección</label>
                        <Textarea id="address" v-model.trim="localCustomer.address" rows="3" placeholder="Dirección completa" class="form-input" />
                    </div>
                </div>
            </div>

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
                        <label for="name" class="field-label">
                            {{ isRuc ? 'Razón Social *' : 'Nombre completo *' }}
                        </label>
                        <InputText 
                            id="name" 
                            v-model.trim="localCustomer.name" 
                            :placeholder="isRuc ? 'Ingrese la razón social' : 'Ingrese el nombre completo'" 
                            class="form-input"
                        />
                    </div>
                    <!-- Nombre comercial (oculto para DNI) -->
                    <div v-if="!isDni" class="field col-span-2">
                        <label for="commercial_name" class="field-label">Nombre Comercial</label>
                        <InputText 
                            id="commercial_name" 
                            v-model.trim="localCustomer.commercial_name" 
                            placeholder="Nombre comercial o como se le conoce" 
                            class="form-input" 
                        />
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

            <!-- Configuración de crédito -->
            <div class="form-section">
                <div class="section-header">
                    <h3 class="section-title">
                        <i class="pi pi-credit-card"></i>
                        Gestión de Créditos
                    </h3>
                </div>
                
                <!-- Toggle para habilitar crédito -->
                <div class="field-checkbox">
                    <ToggleSwitch id="credit_enabled" v-model="localCustomer.credit_enabled" />
                    <label for="credit_enabled" class="checkbox-label">
                        <span class="label-text">Habilitar Crédito</span>
                        <span class="label-description">Permite que este cliente realice compras al crédito</span>
                    </label>
                </div>

                <!-- Campos de crédito (solo si está habilitado) -->
                <div v-if="localCustomer.credit_enabled" class="credit-fields mt-4 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Límite de crédito -->
                        <div class="field">
                            <label for="credit_limit" class="field-label">Límite de Crédito (S/) *</label>
                            <InputNumber 
                                id="credit_limit" 
                                v-model="localCustomer.credit_limit" 
                                mode="currency" 
                                currency="PEN" 
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                :min="0" 
                                :max="999999.99"
                                placeholder="0.00" 
                                class="form-input" 
                            />
                        </div>
                        
                        <!-- Días de crédito -->
                        <div class="field">
                            <label for="credit_days" class="field-label">Días de Crédito *</label>
                            <InputNumber 
                                id="credit_days" 
                                v-model="localCustomer.credit_days" 
                                :min="0" 
                                :max="365"
                                placeholder="30" 
                                class="form-input"
                                suffix=" días"
                            />
                        </div>
                    </div>
                    
                    <!-- Advertencia si hay deudas pendientes al desactivar -->
                    <div v-if="localCustomer.id && localCustomer.total_debt > 0" class="credit-warning">
                        <div class="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <i class="pi pi-exclamation-triangle text-yellow-600"></i>
                            <div>
                                <p class="text-sm font-medium text-yellow-800">
                                    Advertencia: Este cliente tiene deudas pendientes
                                </p>
                                <p class="text-xs text-yellow-700">
                                    Deuda actual: S/ {{ localCustomer.total_debt?.toFixed(2) || '0.00' }}
                                </p>
                            </div>
                        </div>
                    </div>
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
:deep(.p-textarea),
:deep(.p-inputnumber-input) {
    @apply border-2 rounded-xl font-medium transition-all border-gray-300 dark:border-gray-600;
}

/* Estado de foco para componentes de entrada */
:deep(.p-inputtext:focus),
:deep(.p-select:not(.p-disabled).p-focus),
:deep(.p-textarea:focus),
:deep(.p-inputnumber:not(.p-disabled).p-inputnumber-focused .p-inputnumber-input) {
    @apply border-purple-500 ring-2 ring-purple-500/20;
}

/* Estilos para campos de crédito */
.credit-fields {
    @apply p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700;
}

.credit-warning {
    @apply mt-4;
}

/* Toggle switch personalizado */
:deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider) {
    @apply bg-green-500;
}

:deep(.p-toggleswitch:not(.p-disabled):hover .p-toggleswitch-slider) {
    @apply border-purple-400;
}

/* InputNumber styling */
:deep(.p-inputnumber) {
    @apply w-full;
}

/* Lookup button styling */
.lookup-btn {
    @apply px-3 py-2 rounded-xl font-bold transition-all duration-300 min-w-fit;
}

.lookup-btn:not(:disabled) {
    @apply bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700;
}

.lookup-btn:disabled {
    @apply opacity-50 cursor-not-allowed bg-gray-400 border-gray-400;
}

/* Lookup hint styling */
.lookup-hint {
    @apply text-blue-600 dark:text-blue-400 font-medium mt-1 text-xs;
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
