<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { Button } from 'primevue/button';
</script>

<template>
    <FloatingConfigurator />

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-full overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="p-1 rounded-[56px]" style="background: linear-gradient(180deg, rgba(247, 149, 48, 0.4) 10%, rgba(247, 149, 48, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center rounded-[53px]">
                    <div class="flex flex-col items-center gap-4">
                        <div class="flex justify-center items-center border-2 border-orange-500 rounded-full w-14 h-14">
                            <i class="text-orange-500 pi pi-lock text-2xl" aria-hidden="true"></i>
                        </div>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-4xl lg:text-5xl mb-2">Acceso denegado</h1>
                        <span class="text-muted-color text-center mb-8">
                            No tienes los permisos necesarios para acceder a esta sección.<br />
                            Por favor, contacta con el administrador.
                        </span>
                        <img src="/demo/images/access/asset-access.svg" alt="Acceso denegado" class="mb-8 max-w-[80%]" />
                        <div class="mt-8 text-center">
                            <Button label="Ir al inicio" to="/" severity="warn" icon="pi pi-home" class="px-5 py-2 text-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
