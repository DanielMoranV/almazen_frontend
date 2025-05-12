<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { Button } from 'primevue/button';
</script>

<template>
    <FloatingConfigurator />

    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-full overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="p-1 rounded-[56px]" style="background: linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 flex flex-col items-center rounded-[53px]">
                    <div class="flex flex-col items-center gap-4">
                        <div class="flex justify-center items-center border-2 border-pink-500 rounded-full w-14 h-14">
                            <i class="pi pi-exclamation-circle text-pink-500 text-2xl" aria-hidden="true"></i>
                        </div>
                        <h1 class="text-surface-900 dark:text-surface-0 font-bold text-5xl mb-2">Ha ocurrido un error</h1>
                        <span class="text-muted-color text-center mb-8"> El recurso solicitado no está disponible en este momento. </span>
                        <img src="/demo/images/error/asset-error.svg" alt="Error" class="mb-8 max-w-[80%]" />
                        <div class="mt-8 text-center">
                            <Button label="Ir al inicio" to="/" severity="danger" icon="pi pi-home" class="px-5 py-2 text-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
