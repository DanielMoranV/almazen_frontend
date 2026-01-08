<script setup>
import { usePromotionsStore } from '@/stores/promotionsStore';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    promotions: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'refresh']);

const toast = useToast();
const promotionsStore = usePromotionsStore();

/**
 * Format currency
 */
const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(value);
};

/**
 * Get channel label
 */
const getChannelLabel = (channel) => {
    if (!channel) return 'Todos';
    const map = {
        web: 'Web',
        pos: 'POS',
        instagram: 'Instagram'
    };
    return map[channel] || channel;
};

/**
 * Delete promotion
 */
const deletePromotion = async (promotion) => {
    if (!confirm(`¿Estás seguro de eliminar la promoción "${promotion.name}"?`)) {
        return;
    }

    try {
        await promotionsStore.deletePromotion(promotion.id);

        toast.add({
            severity: 'success',
            summary: 'Promoción eliminada',
            detail: `La promoción ${promotion.name} ha sido eliminada`,
            life: 3000
        });

        emit('refresh');
    } catch (error) {
        console.error('[PromotionsList] Error deleting promotion:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar la promoción',
            life: 4000
        });
    }
};
</script>

<template>
    <div class="promotions-list">
        <DataTable :value="promotions" :loading="loading" paginator :rows="20" :rowsPerPageOptions="[10, 20, 50]" dataKey="id" stripedRows responsiveLayout="scroll" class="promotions-table">
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-tags"></i>
                    <p>No se encontraron promociones</p>
                </div>
            </template>

            <!-- Name Column -->
            <Column header="Nombre" field="name" sortable style="min-width: 200px">
                <template #body="{ data }">
                    <div class="name-cell">
                        <strong class="name-text">{{ data.name }}</strong>
                        <small class="text-gray-500">{{ data.type }}</small>
                    </div>
                </template>
            </Column>

            <!-- Price Column -->
            <Column header="Precio Promo" field="price" sortable style="min-width: 120px">
                <template #body="{ data }">
                    <span class="price-value">{{ formatCurrency(data.price) }}</span>
                </template>
            </Column>

            <!-- Min Qty Column -->
            <Column header="Cant. Min" field="min_quantity" sortable style="min-width: 100px">
                <template #body="{ data }">
                    <div class="qty-cell">
                        <span class="font-bold">{{ data.min_quantity }}</span>
                        <small>unidades</small>
                    </div>
                </template>
            </Column>

            <!-- Channel Column -->
            <Column header="Canal" field="channel" sortable style="min-width: 120px">
                <template #body="{ data }">
                    <Tag :severity="data.channel ? 'info' : 'success'" :value="getChannelLabel(data.channel)" />
                </template>
            </Column>

             <!-- Priority Column -->
             <Column header="Prioridad" field="priority" sortable style="min-width: 100px">
                <template #body="{ data }">
                   <div class="text-center">{{ data.priority }}</div>
                </template>
            </Column>

            <!-- Stackable Column -->
            <Column header="Acumulable" field="is_stackable_with_coupons" style="min-width: 100px">
                <template #body="{ data }">
                    <i v-if="data.is_stackable_with_coupons" class="pi pi-check-circle text-green-500 text-xl"></i>
                    <i v-else class="pi pi-times-circle text-gray-400 text-xl"></i>
                </template>
            </Column>

            <!-- Actions Column -->
            <Column header="Acciones" style="width: 150px">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-pencil" severity="warning" size="small" @click="emit('edit', data)" v-tooltip.top="'Editar'" text rounded />
                        <Button icon="pi pi-trash" severity="danger" size="small" @click="deletePromotion(data)" v-tooltip.top="'Eliminar'" text rounded />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.promotions-list {
    width: 100%;
}

.promotions-table {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.empty-state {
    @apply flex flex-col items-center justify-center py-12 gap-4 text-gray-500 dark:text-gray-400;
}

.empty-state i {
    @apply text-4xl;
}

.name-cell {
    @apply flex flex-col gap-1;
}

.name-text {
    @apply font-semibold text-gray-900 dark:text-gray-100 m-0;
}

.price-value {
    @apply font-bold text-green-600 dark:text-green-400 text-lg;
}

.qty-cell {
    @apply flex items-center gap-1;
}

.action-buttons {
    @apply flex gap-1 justify-center;
}
</style>
