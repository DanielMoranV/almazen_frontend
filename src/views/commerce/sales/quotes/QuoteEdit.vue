<script setup>
import { useQuotesStore } from '@/stores/quotesStore';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QuoteFormDialog from './componentsQuotes/QuoteFormDialog.vue';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const quotesStore = useQuotesStore();

const showDialog = ref(true);
const loading = ref(false);
const loadingQuote = ref(true);
const quote = ref(null);

const quoteId = route.params.id;

onMounted(async () => {
    await loadQuote();
});

const loadQuote = async () => {
    loadingQuote.value = true;
    try {
        const result = await quotesStore.getQuote(quoteId);
        if (result.success) {
            quote.value = result.data;

            // Verificar si se puede editar
            if (!quotesStore.canEditQuote(quote.value)) {
                toast.add({
                    severity: 'error',
                    summary: 'No Editable',
                    detail: 'Esta cotización no se puede editar',
                    life: 5000
                });
                router.push({ name: 'quotes' });
                return;
            }
        } else {
            throw new Error(result.message || 'Cotización no encontrada');
        }
    } catch (error) {
        console.error('Error loading quote:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar la cotización',
            life: 5000
        });
        router.push({ name: 'quotes' });
    } finally {
        loadingQuote.value = false;
    }
};

const handleSubmit = async (quoteData) => {
    loading.value = true;
    try {
        const result = await quotesStore.updateQuote(quoteData);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: result.message || 'Cotización actualizada exitosamente',
                life: 3000
            });
            router.push({ name: 'quote-detail', params: { id: quoteId } });
        }
    } catch (error) {
        console.error('Error updating quote:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: quotesStore.message || 'Error al actualizar la cotización',
            life: 5000
        });
    } finally {
        loading.value = false;
    }
};

const handleClose = () => {
    router.push({ name: 'quote-detail', params: { id: quoteId } });
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex align-items-center mb-4">
                    <Button icon="pi pi-arrow-left" label="Volver a Detalle" class="p-button-text" @click="handleClose" />
                </div>

                <div v-if="loadingQuote" class="text-center p-8">
                    <ProgressSpinner strokeWidth="4" />
                    <p class="mt-3">Cargando cotización...</p>
                </div>

                <div v-else class="text-center p-8">
                    <i class="pi pi-pencil text-6xl text-blue-500 mb-4 block"></i>
                    <h2 class="text-2xl font-bold mb-2">Editar Cotización</h2>
                    <p class="text-gray-600 mb-4">{{ quote?.quote_number || 'Cotización' }}</p>

                    <QuoteFormDialog :visible="showDialog" :loading="loading" :quote="quote" @update:visible="handleClose" @submit="handleSubmit" />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Estilos adicionales si es necesario */
</style>
