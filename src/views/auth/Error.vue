<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
    router.push('/');
};
</script>

<template>
    <FloatingConfigurator />

    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
        <!-- Logo AlmaZen -->
        <img src="/images/almazenlogo.png" alt="AlmaZen" class="w-50 h-24 mb-6" />

        <!-- Mensaje principal -->
        <h1 class="text-6xl font-bold text-primary mb-4">Error</h1>
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Ha ocurrido un error</h2>
        <p class="text-gray-600 max-w-md mb-6">El recurso solicitado no está disponible en este momento. Por favor, intenta nuevamente más tarde o contáctanos si el problema persiste.</p>

        <!-- Botón de regreso -->
        <button @click="goHome" class="px-6 py-3 bg-primary text-white rounded-2xl shadow hover:bg-primary/90 transition">Volver al inicio</button>
    </div>
</template>

<style scoped>
.text-primary {
    color: var(--primary-color);
}
.bg-primary {
    background-color: var(--primary-color);
}
</style>
