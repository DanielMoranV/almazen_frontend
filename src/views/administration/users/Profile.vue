<script setup>
import { useAuthStore } from '@/stores/authStore';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';

import { capitalizeName, validateDNI, validateEmail, validatePhone } from '@/utils/validationUtils';

// Stores
const authStore = useAuthStore();

// Referencias y datos
const user = ref({
    name: '',
    dni: '',
    email: '',
    phone: '',
    position: ''
});
const passwordInput = ref('');
const confirmPasswordInput = ref('');
const isLoading = ref(false);
const isLoadingPassword = ref(false);

// Estados de validación
const isDNIValid = ref(true);
const isEmailValid = ref(true);
const isPhoneValid = ref(true);

// Toast y Router
const toast = useToast();

// Validar campos
const validateFields = () => {
    validateDNIField();
    validateEmailField();
    validatePhoneField();
};

// Verificar si el formulario es válido
const isFormValid = () => {
    return user.value.name && user.value.name.trim() && user.value.email && isDNIValid.value && isEmailValid.value && isPhoneValid.value;
};

// Manejar entrada de nombre
const handleNameInput = () => {
    user.value.name = capitalizeName(user.value.name);
};

// Validar DNI
const validateDNIField = () => {
    isDNIValid.value = validateDNI(user.value.dni);
};

// Validar email
const validateEmailField = () => {
    isEmailValid.value = validateEmail(user.value.email);
};

// Validar teléfono
const validatePhoneField = () => {
    isPhoneValid.value = validatePhone(user.value.phone);
};

// Actualizar usuario
const updateUser = async () => {
    isLoading.value = true;
    validateFields();

    if (!isFormValid()) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, complete todos los campos requeridos', life: 3000 });
        isLoading.value = false;
        return;
    }

    const payload = {
        id: user.value.id,
        name: user.value.name,
        dni: user.value.dni,
        email: user.value.email,
        phone: user.value.phone
    };

    await authStore.updateUser(payload);

    if (authStore.success) {
        toast.add({ severity: 'success', summary: 'Perfil actualizado', detail: authStore.message, life: 3000 });
    } else {
        if (authStore.validationErrors && authStore.validationErrors.length > 0) {
            authStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
        }
    }
    isLoading.value = false;
};

// Actualizar contraseña
const updatePassword = async () => {
    isLoadingPassword.value = true;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (!password || !confirmPassword) {
        toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Por favor, complete todos los campos requeridos', life: 3000 });
        isLoadingPassword.value = false;
        return;
    }
    if (password === confirmPassword) {
        await authStore.updateUser({ password: password, id: user.value.id });
        if (authStore.success) {
            toast.add({ severity: 'success', summary: 'Contraseña actualizada', detail: authStore.message, life: 3000 });
            passwordInput.value = '';
            confirmPasswordInput.value = '';
        } else {
            if (authStore.validationErrors && authStore.validationErrors.length > 0) {
                authStore.validationErrors.forEach((err) => {
                    toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
                });
            } else {
                toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
            }
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Contraseña de confirmación no coincide', life: 3000 });
    }
    isLoadingPassword.value = false;
};

// Cargar datos del usuario
onMounted(() => {
    user.value = authStore.currentUser;
});

// Watchers
watch(() => user.value.dni, validateDNIField);
watch(() => user.value.email, validateEmailField);
watch(() => user.value.phone, validatePhoneField);

const getAvatarUrl = (name) => {
    if (!name) return '/images/profile.png';
    const encoded = encodeURIComponent(name.trim());
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encoded}&backgroundColor=ffffff&textColor=000000`;
};
</script>

<template>
    <div class="profile-container">
        <!-- Header moderno con gradiente -->
        <div class="profile-header">
            <div class="header-gradient"></div>
            <div class="profile-info">
                <div class="avatar-wrapper">
                    <Avatar :image="getAvatarUrl(user.name)" size="xlarge" shape="circle" class="user-avatar" />
                </div>
                <div class="user-details">
                    <h2><i class="pi pi-user"></i> {{ user.name || 'Usuario' }}</h2>
                    <div class="user-meta">
                        <span class="user-position">
                            <i class="pi pi-briefcase"></i>
                            {{ user.position || 'Empleado' }}
                        </span>
                        <span class="user-status">
                            <i class="pi pi-check-circle"></i>
                            Usuario Activo
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenido en pestañas modernas -->
        <TabView class="profile-tabs">
            <TabPanel>
                <template #header>
                    <div class="tab-header">
                        <i class="pi pi-user-edit"></i>
                        <span>Información Personal</span>
                    </div>
                </template>
                <div class="tab-content">
                    <div class="section-title">
                        <i class="pi pi-info-circle"></i>
                        <span>Datos Personales</span>
                    </div>
                    <div class="form-row">
                        <div class="field">
                            <label><i class="pi pi-user"></i> Nombre Completo</label>
                            <div class="input-wrapper">
                                <InputText v-model="user.name" @input="handleNameInput" placeholder="Ingresa tu nombre completo" fluid />
                                <i class="input-icon pi pi-pencil"></i>
                            </div>
                        </div>
                        <div class="field">
                            <label><i class="pi pi-id-card"></i> DNI</label>
                            <div class="input-wrapper">
                                <InputText v-model="user.dni" disabled placeholder="Documento de identidad" fluid />
                                <i class="input-icon pi pi-lock" style="color: var(--text-color-secondary)"></i>
                            </div>
                            <small class="field-help"><i class="pi pi-info-circle"></i> El DNI no puede ser modificado</small>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="field">
                            <label><i class="pi pi-envelope"></i> Correo Electrónico</label>
                            <div class="input-wrapper">
                                <InputText v-model="user.email" @blur="validateEmailField" :class="{ 'p-invalid': !isEmailValid }" placeholder="correo@ejemplo.com" fluid />
                                <i class="input-icon pi pi-at"></i>
                            </div>
                            <small v-if="!isEmailValid" class="p-error">
                                <i class="pi pi-exclamation-triangle"></i>
                                Ingresa un correo válido
                            </small>
                        </div>
                        <div class="field">
                            <label><i class="pi pi-phone"></i> Teléfono</label>
                            <div class="input-wrapper">
                                <InputText v-model="user.phone" @blur="validatePhoneField" :class="{ 'p-invalid': !isPhoneValid }" placeholder="987654321" maxlength="9" fluid />
                                <i class="input-icon pi pi-mobile"></i>
                            </div>
                            <small v-if="!isPhoneValid" class="p-error">
                                <i class="pi pi-exclamation-triangle"></i>
                                Ingresa un teléfono válido
                            </small>
                        </div>
                    </div>
                    <div class="action-bar">
                        <Button label="Actualizar Información" icon="pi pi-save" @click="updateUser" :loading="isLoading" class="save-btn primary" />
                    </div>
                </div>
            </TabPanel>

            <TabPanel>
                <template #header>
                    <div class="tab-header">
                        <i class="pi pi-shield"></i>
                        <span>Seguridad</span>
                    </div>
                </template>
                <div class="tab-content">
                    <div class="section-title">
                        <i class="pi pi-lock"></i>
                        <span>Cambiar Contraseña</span>
                    </div>
                    <div class="security-info">
                        <div class="info-card">
                            <i class="pi pi-info-circle"></i>
                            <div>
                                <h4>Consejos de Seguridad</h4>
                                <ul>
                                    <li><i class="pi pi-check"></i> Mínimo 8 caracteres</li>
                                    <li><i class="pi pi-check"></i> Incluye números y símbolos</li>
                                    <li><i class="pi pi-check"></i> Combina mayúsculas y minúsculas</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="field">
                            <label><i class="pi pi-key"></i> Nueva Contraseña</label>
                            <div class="password-wrapper">
                                <Password v-model="passwordInput" placeholder="Ingresa tu nueva contraseña" :toggleMask="true" :feedback="true" fluid />
                            </div>
                        </div>
                        <div class="field">
                            <label><i class="pi pi-verified"></i> Confirmar Contraseña</label>
                            <div class="password-wrapper">
                                <Password v-model="confirmPasswordInput" placeholder="Confirma tu nueva contraseña" :toggleMask="true" :feedback="false" fluid />
                            </div>
                        </div>
                    </div>
                    <div class="action-bar">
                        <Button label="Actualizar Contraseña" icon="pi pi-shield" @click="updatePassword" :loading="isLoadingPassword" severity="success" class="save-btn secondary" />
                    </div>
                </div>
            </TabPanel>
        </TabView>
    </div>
</template>

<style scoped>
.profile-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
    min-height: 100vh;
}

/* Header moderno con gradiente */
.profile-header {
    position: relative;
    background: var(--surface-card);
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.header-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--purple-500), var(--pink-500));
}

.profile-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
}

.avatar-wrapper {
    position: relative;
}

.user-avatar {
    border: 4px solid var(--primary-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease;
}

.user-avatar:hover {
    transform: scale(1.05);
}

.avatar-status {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--green-500);
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--surface-card);
    font-size: 0.8rem;
}

.user-details h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.user-meta {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.user-position,
.user-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.9rem;
    font-weight: 500;
}

.user-status {
    color: var(--green-600);
}

.user-status i {
    color: var(--green-500);
}

.user-position {
    text-transform: capitalize;
}

/* Tabs modernos */
.profile-tabs {
    background: var(--surface-card);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    overflow: hidden;
}

.tab-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.tab-content {
    padding: 2rem;
}

.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--surface-border);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.field {
    display: flex;
    flex-direction: column;
}

.field label {
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-color);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.input-wrapper,
.password-wrapper {
    position: relative;
}

.input-wrapper .input-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
    font-size: 0.9rem;
    pointer-events: none;
}

.field-help {
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-style: italic;
}

.p-error {
    color: var(--red-500);
    font-size: 0.75rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 500;
}

/* Security info card */
.security-info {
    margin-bottom: 1.5rem;
}

.info-card {
    background: linear-gradient(135deg, var(--blue-50), var(--indigo-50));
    border: 1px solid var(--blue-200);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.info-card > i {
    color: var(--blue-500);
    font-size: 1.5rem;
    margin-top: 0.25rem;
}

.info-card h4 {
    margin: 0 0 0.75rem 0;
    color: var(--text-color);
    font-size: 1rem;
    font-weight: 600;
}

.info-card ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

.info-card li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.85rem;
}

.info-card li i {
    color: var(--green-500);
    font-size: 0.75rem;
}

/* Action bar */
.action-bar {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--surface-border);
}

.save-btn {
    min-width: 200px;
    padding: 0.75rem 2rem;
    font-weight: 600;
    border-radius: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.save-btn.primary {
    background: linear-gradient(135deg, #4caf50, #45a049);
}

.save-btn.secondary {
    border: none;
}

.save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

/* Custom input styles */
:deep(.p-inputtext) {
    border-radius: 10px;
    border: 2px solid var(--surface-border);
    padding: 0.75rem 2.5rem 0.75rem 0.75rem;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

:deep(.p-inputtext:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem rgba(var(--primary-color-rgb), 0.2);
}

:deep(.p-inputtext:disabled) {
    background: var(--surface-100);
    color: var(--text-color-secondary);
}

/* Password input styles */
:deep(.p-password .p-inputtext) {
    padding-right: 3rem;
}

/* TabView customization */
:deep(.p-tabview .p-tabview-nav) {
    background: var(--surface-50);
    border-bottom: 2px solid var(--surface-border);
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
    background: transparent;
    border: none;
    color: var(--text-color-secondary);
    font-weight: 600;
    padding: 1rem 1.5rem;
    transition: all 0.3s ease;
}

:deep(.p-tabview .p-tabview-nav li:not(.p-highlight) .p-tabview-nav-link:hover) {
    background: var(--surface-100);
    color: var(--primary-color);
}

:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
    background: var(--primary-color);
    color: white;
    border-radius: 8px 8px 0 0;
}

/* Responsive design */
@media (max-width: 768px) {
    .profile-container {
        padding: 0.5rem;
    }

    .profile-header {
        padding: 1.5rem;
    }

    .profile-info {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .user-details h2 {
        justify-content: center;
    }

    .user-meta {
        align-items: center;
    }

    .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .tab-content {
        padding: 1.5rem;
    }

    .save-btn {
        width: 100%;
        min-width: auto;
    }

    .info-card {
        flex-direction: column;
        text-align: center;
    }
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
    .info-card {
        background: linear-gradient(135deg, var(--surface-800), var(--surface-700));
        border-color: var(--surface-600);
    }
}
</style>
