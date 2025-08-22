<script setup>
import { useQuotesStore } from '@/stores/quotesStore';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import QuoteFormDialog from './componentsQuotes/QuoteFormDialog.vue';

const router = useRouter();
const toast = useToast();
const quotesStore = useQuotesStore();

const showDialog = ref(true);
const loading = ref(false);

const handleSubmit = async (quoteData) => {
    loading.value = true;
    try {
        const result = await quotesStore.createQuote(quoteData);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message || 'Cotización creada exitosamente',
                life: 3000
            });
            router.push({ name: 'quotes' });
        }
    } catch (error) {
        console.error('Error creating quote:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: quotesStore.message || 'Error al crear la cotización',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const handleClose = () => {
    router.push({ name: 'quotes' });
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex align-items-center mb-4">
                    <Button icon="pi pi-arrow-left" label="Volver a Cotizaciones" class="p-button-text" @click="router.push({ name: 'quotes' })" />
                </div>

                <div class="text-center p-8">
                    <i class="pi pi-file-edit text-6xl text-blue-500 mb-4 block"></i>
                    <h2 class="text-2xl font-bold mb-2">Nueva Cotización</h2>
                    <p class="text-gray-600 mb-4">Complete la información para crear una nueva cotización</p>

                    <QuoteFormDialog :visible="showDialog" :loading="loading" :quote="null" @update:visible="handleClose" @submit="handleSubmit" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
