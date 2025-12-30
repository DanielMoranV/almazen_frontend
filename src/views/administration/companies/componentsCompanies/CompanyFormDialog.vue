<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    company: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const companyForm = ref({
    id: null,
    company_name: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    description: '',
    is_active: true,
    social_media: {
        facebook: '',
        instagram: '',
        tiktok: '',
        twitter: '',
        linkedin: '',
        youtube: '',
        whatsapp: ''
    }
});

const dialogVisible = ref(props.visible);

const resetForm = () => {
    if (props.company) {
        companyForm.value = {
            ...props.company,
            social_media: props.company.social_media || {
                facebook: '',
                instagram: '',
                tiktok: '',
                twitter: '',
                linkedin: '',
                youtube: '',
                whatsapp: ''
            }
        };
    } else {
        companyForm.value = {
            id: null,
            company_name: '',
            ruc: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            logo: '',
            description: '',
            is_active: true,
            social_media: {
                facebook: '',
                instagram: '',
                tiktok: '',
                twitter: '',
                linkedin: '',
                youtube: '',
                whatsapp: ''
            }
        };
    }
};

watch(
    () => props.visible,
    (newValue) => {
        dialogVisible.value = newValue;
        if (newValue) {
            resetForm();
        }
    }
);

watch(
    () => props.company,
    (newCompany) => {
        if (newCompany) {
            companyForm.value = { ...newCompany };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

const hideDialog = () => {
    dialogVisible.value = false;
    emit('update:visible', false);
};

const submitForm = () => {
    console.log('[CompanyFormDialog] Submitting company data:', {
        ...companyForm.value,
        social_media: companyForm.value.social_media
    });
    console.log('[CompanyFormDialog] Social media data:', JSON.stringify(companyForm.value.social_media, null, 2));
    emit('submit', { ...companyForm.value });
};

const isFormValid = () => {
    return companyForm.value.company_name && companyForm.value.email && companyForm.value.address && companyForm.value.phone;
};
</script>

<template>
    <Dialog v-model:visible="dialogVisible" :style="{ width: '500px' }" :header="company ? 'Editar Empresa' : 'Nueva Empresa'" modal class="p-fluid company-dialog" @hide="hideDialog">
        <template #header>
            <div class="dialog-header">
                <div class="header-icon">
                    <i class="pi pi-building text-2xl text-green-600"></i>
                </div>
                <div class="header-title">
                    <h3 class="text-xl font-bold text-gray-800 dark:text-white">
                        {{ company ? 'Editar Empresa' : 'Nueva Empresa' }}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        {{ company ? 'Modifica los datos de la empresa' : 'Completa la información de la empresa' }}
                    </p>
                </div>
            </div>
        </template>

        <div class="form-container">
            <div class="form-grid">
                <div class="field">
                    <label for="company_name" class="field-label required">
                        <i class="pi pi-building mr-2"></i>
                        Nombre de la Empresa
                    </label>
                    <InputText id="company_name" v-model="companyForm.company_name" autofocus required fluid class="form-input" placeholder="Ingresa el nombre de la empresa" />
                </div>

                <div class="field">
                    <label for="ruc" class="field-label">
                        <i class="pi pi-id-card mr-2"></i>
                        RUC
                    </label>
                    <InputText id="ruc" v-model="companyForm.ruc" fluid class="form-input" placeholder="12345678901" maxlength="11" />
                </div>

                <div class="field">
                    <label for="address" class="field-label required">
                        <i class="pi pi-map-marker mr-2"></i>
                        Dirección
                    </label>
                    <InputText id="address" v-model="companyForm.address" required fluid class="form-input" placeholder="Dirección completa" />
                </div>

                <div class="form-row">
                    <div class="field">
                        <label for="phone" class="field-label required">
                            <i class="pi pi-phone mr-2"></i>
                            Teléfono
                        </label>
                        <InputText id="phone" v-model="companyForm.phone" required fluid class="form-input" placeholder="+1 234 567 8900" />
                    </div>

                    <div class="field">
                        <label for="email" class="field-label required">
                            <i class="pi pi-envelope mr-2"></i>
                            Email
                        </label>
                        <InputText id="email" v-model="companyForm.email" type="email" required fluid class="form-input" placeholder="empresa@correo.com" />
                    </div>
                </div>

                <div class="field">
                    <label for="website" class="field-label">
                        <i class="pi pi-globe mr-2"></i>
                        Sitio Web
                    </label>
                    <InputText id="website" v-model="companyForm.website" fluid class="form-input" placeholder="https://www.empresa.com" />
                </div>

                <div class="field">
                    <label for="description" class="field-label">
                        <i class="pi pi-file-edit mr-2"></i>
                        Descripción
                    </label>
                    <Textarea id="description" v-model="companyForm.description" rows="3" fluid class="form-textarea" placeholder="Descripción de la empresa..." />
                </div>

                <!-- Social Media Section -->
                <div class="social-media-section">
                    <h4 class="section-header">
                        <i class="pi pi-share-alt mr-2"></i>
                        Redes Sociales
                    </h4>

                    <div class="form-row">
                        <div class="field">
                            <label for="facebook" class="field-label">
                                <i class="pi pi-facebook mr-2"></i>
                                Facebook
                            </label>
                            <InputText id="facebook" v-model="companyForm.social_media.facebook" fluid class="form-input" placeholder="usuario o URL" />
                        </div>

                        <div class="field">
                            <label for="instagram" class="field-label">
                                <i class="pi pi-instagram mr-2"></i>
                                Instagram
                            </label>
                            <InputText id="instagram" v-model="companyForm.social_media.instagram" fluid class="form-input" placeholder="@usuario o URL" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="field">
                            <label for="tiktok" class="field-label">
                                <i class="pi pi-video mr-2"></i>
                                TikTok
                            </label>
                            <InputText id="tiktok" v-model="companyForm.social_media.tiktok" fluid class="form-input" placeholder="@usuario o URL" />
                        </div>

                        <div class="field">
                            <label for="twitter" class="field-label">
                                <i class="pi pi-twitter mr-2"></i>
                                Twitter/X
                            </label>
                            <InputText id="twitter" v-model="companyForm.social_media.twitter" fluid class="form-input" placeholder="@usuario o URL" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="field">
                            <label for="linkedin" class="field-label">
                                <i class="pi pi-linkedin mr-2"></i>
                                LinkedIn
                            </label>
                            <InputText id="linkedin" v-model="companyForm.social_media.linkedin" fluid class="form-input" placeholder="empresa o URL" />
                        </div>

                        <div class="field">
                            <label for="youtube" class="field-label">
                                <i class="pi pi-youtube mr-2"></i>
                                YouTube
                            </label>
                            <InputText id="youtube" v-model="companyForm.social_media.youtube" fluid class="form-input" placeholder="canal o URL" />
                        </div>
                    </div>

                    <div class="field">
                        <label for="whatsapp" class="field-label">
                            <i class="pi pi-whatsapp mr-2"></i>
                            WhatsApp
                        </label>
                        <InputText id="whatsapp" v-model="companyForm.social_media.whatsapp" fluid class="form-input" placeholder="+51987654321" />
                    </div>
                </div>

                <div class="field">
                    <label for="logo" class="field-label">
                        <i class="pi pi-image mr-2"></i>
                        URL del Logo
                    </label>
                    <InputText id="logo" v-model="companyForm.logo" fluid class="form-input" placeholder="https://ejemplo.com/logo.png" />
                </div>

                <div class="field">
                    <label for="description" class="field-label">
                        <i class="pi pi-file-edit mr-2"></i>
                        Descripción
                    </label>
                    <Textarea id="description" v-model="companyForm.description" rows="3" fluid class="form-textarea" placeholder="Descripción de la empresa..." />
                </div>

                <div class="field">
                    <div class="status-toggle">
                        <label for="is_active" class="field-label">
                            <i class="pi pi-check-circle mr-2"></i>
                            Estado
                        </label>
                        <div class="toggle-container">
                            <ToggleSwitch id="is_active" v-model="companyForm.is_active" class="status-switch" />
                            <span class="toggle-text" :class="companyForm.is_active ? 'text-green-600' : 'text-red-600'">
                                {{ companyForm.is_active ? 'Activa' : 'Inactiva' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cancelar" icon="pi pi-times" class="cancel-btn" @click="hideDialog" />
                <Button :label="company ? 'Actualizar' : 'Crear'" :icon="company ? 'pi pi-check' : 'pi pi-plus'" class="submit-btn" :disabled="!isFormValid()" :loading="loading" @click="submitForm" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* Dialog personalizado */
:deep(.company-dialog .p-dialog-header) {
    @apply bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700 p-0;
}

.dialog-header {
    @apply flex items-center gap-4 p-6 w-full;
}

.header-icon {
    @apply w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center;
}

.header-title h3 {
    @apply m-0;
}

.header-title p {
    @apply m-0 mt-1;
}

/* Contenedor del formulario */
.form-container {
    @apply p-6;
}

.form-grid {
    @apply space-y-6;
}

.form-row {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

/* Campos del formulário */
.field {
    @apply space-y-2;
}

.field-label {
    @apply flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.field-label.required::after {
    content: ' *';
    @apply text-red-500 ml-1;
}

.form-input {
    @apply border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100;
}

.form-input:focus {
    @apply border-green-500 ring-2 ring-green-200 dark:ring-green-800;
}

.form-textarea {
    @apply border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium transition-all duration-300 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none;
}

.form-textarea:focus {
    @apply border-green-500 ring-2 ring-green-200 dark:ring-green-800;
}

/* Social Media Section */
.social-media-section {
    @apply mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700 space-y-4;
}

.section-header {
    @apply flex items-center text-base font-bold text-gray-800 dark:text-gray-200 mb-4;
}

.section-header i {
    @apply text-green-600 dark:text-green-400;
}

/* Toggle de estado */
.status-toggle {
    @apply space-y-2;
}

.toggle-container {
    @apply flex items-center gap-3;
}

.status-switch {
    @apply scale-110;
}

.toggle-text {
    @apply font-semibold text-sm;
}

/* Footer del diálogo */
.dialog-footer {
    @apply flex justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700;
}

.cancel-btn {
    @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 font-semibold px-6 py-3 rounded-xl transition-all duration-300;
}

.submit-btn {
    @apply bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white border-none font-semibold px-6 py-3 rounded-xl transition-all duration-300;
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.submit-btn:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
    .form-row {
        @apply grid-cols-1;
    }

    .dialog-header {
        @apply flex-col items-start gap-3 p-4;
    }

    .header-icon {
        @apply w-10 h-10;
    }

    .form-container {
        @apply p-4;
    }

    .dialog-footer {
        @apply p-4;
    }
}

/* Mejoras en componentes PrimeVue */
:deep(.p-inputtext) {
    @apply text-sm;
}

:deep(.p-textarea) {
    @apply text-sm;
}

:deep(.p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider) {
    @apply bg-green-500;
}

:deep(.p-dialog-content) {
    @apply p-0;
}

:deep(.p-dialog-footer) {
    @apply p-0;
}
</style>
