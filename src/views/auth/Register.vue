<script setup>
import { useAuthStore } from '@/stores/authStore';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';

const authStore = useAuthStore();

const router = useRouter();
const toast = useToast();

const form = ref({
    name: '',
    dni: '',
    email: '',
    password: '',
    password_confirmation: '',
    company_name: ''
});

const onSubmit = async () => {
    if (!form.value.name || !form.value.dni || !form.value.email || !form.value.password || !form.value.password_confirmation || !form.value.company_name) {
        toast.add({ severity: 'error', summary: 'Faltan campos', detail: 'Todos los campos son obligatorios.', life: 3000 });
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
        toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
    }
};
</script>

<template>
    <Toast />
    <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div class="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-10">
            <!-- Logo -->
            <div class="flex justify-center mb-6">
                <RouterLink to="/">
                    <img src="/az.logo.png" alt="Logo" class="h-14 object-contain cursor-pointer" />
                </RouterLink>
            </div>

            <!-- Título -->
            <h2 class="text-3xl font-bold text-center text-green-600 mb-8">Crear una Cuenta</h2>

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

                <!-- Botón y enlace -->
                <div class="mt-8">
                    <Button label="Registrarse" icon="pi pi-user-plus" class="w-full bg-green-600 border-none hover:bg-green-700" type="submit" />
                </div>

                <p class="text-center text-sm text-gray-600 mt-4">
                    ¿Ya tienes una cuenta?
                    <RouterLink to="/login" class="text-green-600 hover:underline font-medium">Inicia sesión aquí</RouterLink>
                </p>
            </form>
        </div>
    </div>
</template>
