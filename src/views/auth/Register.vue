<script setup>
import { useAuthStore } from '@/stores/authStore';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import MultiSelect from 'primevue/multiselect';
import Password from 'primevue/password';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const authStore = useAuthStore();

const categoriesCompany = ref([]);

const router = useRouter();
const toast = useToast();

const form = ref({
    name: '',
    dni: '',
    email: '',
    password: '',
    password_confirmation: '',
    categories_company: [],
    company_name: ''
});

const onSubmit = async () => {
    if (!form.value.name || !form.value.dni || !form.value.email || !form.value.password || !form.value.password_confirmation || !form.value.company_name) {
        toast.add({ severity: 'error', summary: 'Faltan campos', detail: 'Todos los campos son obligatorios.', life: 3000 });
        return;
    }

    if (form.value.categories_company.length === 0) {
        toast.add({ severity: 'error', summary: 'Categorías requeridas', detail: 'Debes seleccionar al menos una categoría de empresa.', life: 3000 });
        return;
    }

    if (form.value.password !== form.value.password_confirmation) {
        toast.add({ severity: 'warn', summary: 'Contraseñas', detail: 'Las contraseñas no coinciden.', life: 3000 });
        return;
    }

    await authStore.register(form.value);
    if (authStore.isAuthenticated) {
        toast.add({ severity: 'success', summary: 'Registro exitoso', detail: 'Cuenta creada correctamente.', life: 3000 });
        router.push('/dashboard');
    } else {
        if (authStore.validationErrors && authStore.validationErrors.length > 0) {
            authStore.validationErrors.forEach(err => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
        }
    }
};

onMounted(async () => {
    await authStore.fetchCategoriesCompany();
    categoriesCompany.value = authStore.getCategories;
    console.log('Categorías cargadas:', categoriesCompany.value);
});
</script>

<template>
    <Toast />
    <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6">
            <!-- Logo y Título -->
            <div class="flex flex-col items-center mb-2">
                <RouterLink to="/" class="mb-3">
                    <img src="/azlogo.png" alt="Logo" class="h-12 object-contain cursor-pointer hover:scale-105 transition-transform duration-200" />
                </RouterLink>
                <h2 class="text-2xl font-bold text-green-600">Crear una Cuenta</h2>
                <p class="text-gray-500 text-sm mt-1">Completa los datos para registrar tu empresa</p>
            </div>

            <!-- Formulario -->
            <form @submit.prevent="onSubmit">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Nombre completo -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <InputText id="name" v-model="form.name" class="w-full" placeholder="Ej. Jhon Doe" />
                    </div>

                    <!-- DNI -->
                    <div>
                        <label for="dni" class="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                        <InputText id="dni" v-model="form.dni" class="w-full" placeholder="Ej. 12345678" />
                    </div>

                    <!-- Correo -->
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                        <InputText id="email" v-model="form.email" type="email" class="w-full" placeholder="ejemplo@correo.com" />
                    </div>

                    <!-- Empresa -->
                    <div>
                        <label for="company_name" class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                        <InputText id="company_name" v-model="form.company_name" class="w-full" placeholder="Acme Corporation" />
                    </div>

                    <!-- Categorías de Empresa -->
                    <div class="md:col-span-2">
                        <label for="categories_company" class="block text-sm font-medium text-gray-700 mb-1">Categorías de Empresa *</label>
                        <MultiSelect
                            id="categories_company"
                            v-model="form.categories_company"
                            :options="categoriesCompany"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Selecciona las categorías de tu empresa"
                            :maxSelectedLabels="3"
                            class="w-full"
                            :filter="true"
                            filterPlaceholder="Buscar categorías..."
                        >
                            <template #chip="slotProps">
                                <div class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    {{ slotProps.value }}
                                </div>
                            </template>
                            <template #option="slotProps">
                                <div class="flex items-center">
                                    <span>{{ slotProps.option.name }}</span>
                                </div>
                            </template>
                        </MultiSelect>
                        <small class="text-gray-500 mt-1 block">Selecciona una o más categorías que describan tu empresa</small>
                    </div>

                    <!-- Contraseña -->
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <Password id="password" v-model="form.password" toggleMask :feedback="false" placeholder="Contraseña" fluid />
                    </div>

                    <!-- Confirmar contraseña -->
                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
                        <Password id="password_confirmation" v-model="form.password_confirmation" toggleMask :feedback="false" fluid placeholder="Repite tu contraseña" />
                    </div>
                </div>

                <!-- Botón -->
                <div class="mt-6">
                    <Button
                        label="Crear Cuenta"
                        icon="pi pi-user-plus"
                        class="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-none text-white font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01]"
                        type="submit"
                        :loading="authStore.loading"
                    />
                </div>

                <!-- Enlaces -->
                <div class="mt-5 text-center">
                    <div class="flex items-center justify-center mb-3">
                        <div class="border-t border-gray-200 flex-grow"></div>
                        <span class="px-3 text-gray-500 text-xs">¿Ya tienes cuenta?</span>
                        <div class="border-t border-gray-200 flex-grow"></div>
                    </div>
                    <RouterLink to="/login" class="inline-flex items-center text-green-600 hover:text-green-700 font-semibold text-sm transition-colors duration-200 hover:underline">
                        <i class="pi pi-sign-in mr-1 text-sm"></i>
                        Iniciar sesión
                    </RouterLink>
                </div>
            </form>
        </div>
    </div>
</template>
