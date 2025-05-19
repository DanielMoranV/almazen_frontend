<script setup>
import { useAuthStore } from '@/stores/authStore';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();

const dni = ref('');
const password = ref('');
const router = useRouter();
const toast = useToast();

const imgLogin = '/images/login.png';

const handleLogin = async () => {
    // Validar DNI
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni.value)) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'El DNI ingresado no es válido.', life: 3000 });
        return;
    }
    // Validar contraseña
    if (password.value.length < 8) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'La contraseña debe tener al menos 8 caracteres.', life: 3000 });
        return;
    }
    await authStore.login({ dni: dni.value, password: password.value });
    if (authStore.isAuthenticated) {
        toast.add({ severity: 'success', summary: 'Bienvenido', detail: authStore.message, life: 3000 });
        setTimeout(() => {
            router.push('/profile');
        }, 3000);
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: authStore.message, life: 3000 });
    }
};
</script>

<template>
    <Toast />
    <div class="min-h-screen flex items-center justify-center bg-gray-100 m-2">
        <div class="grid grid-cols-1 md:grid-cols-2 bg-white shadow-lg rounded-2xl overflow-hidden max-w-5xl w-full">
            <!-- Imagen -->
            <div class="hidden md:flex items-center justify-center">
                <img :src="imgLogin" alt="login" class="w-full h-auto object-contain max-h-[500px] p-4" />
            </div>

            <!-- Formulario -->
            <div class="p-10 flex flex-col justify-center">
                <!-- Logo -->
                <div class="flex justify-center mb-1">
                    <RouterLink to="/">
                        <img src="/azlogo.png" alt="Logo" class="h-12 object-contain cursor-pointer" />
                    </RouterLink>
                </div>
                <!-- Titulo -->
                <div class="flex justify-center">
                    <h2 class="text-3xl font-bold text-green-600 mb-2">AlmaZEN</h2>
                </div>

                <div class="space-y-4">
                    <label class="block text-sm font-medium text-gray-700">DNI</label>
                    <InputText v-model="dni" class="w-full" placeholder="Ingrese su DNI" maxlength="8" />

                    <label class="block text-sm font-medium text-gray-700">Contraseña</label>
                    <Password v-model="password" :toggleMask="true" class="mb-4" fluid :feedback="false" toggleMask placeholder="Ingrese su contraseña" />

                    <Button label="Iniciar sesión" icon="pi pi-sign-in" class="w-full mt-4 bg-green-600 border-green-600 hover:bg-green-700" :loading="authStore.loading" @click="handleLogin" />

                    <p class="text-center text-sm text-gray-600 mt-6">
                        ¿No tienes una cuenta?
                        <RouterLink to="/register" class="text-green-600 font-medium hover:underline">Regístrate</RouterLink>
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Asegura bordes suaves y consistencia */
.p-password input {
    border-radius: 0.5rem;
}
</style>
