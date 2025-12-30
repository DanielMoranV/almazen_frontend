<script setup>
import { useDiscountCodesStore } from '@/stores/discountCodesStore';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    codes: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'view-stats', 'refresh']);

const toast = useToast();
const discountCodesStore = useDiscountCodesStore();

/**
 * Format discount value for display
 */
const formatDiscountValue = (code) => {
    if (code.discount_type === 'percentage') {
        return `${code.discount_value}%`;
    }
    return `S/ ${code.discount_value.toFixed(2)}`;
};

/**
 * Get validity status
 */
const getValidityStatus = (code) => {
    const now = new Date();
    const validFrom = code.valid_from ? new Date(code.valid_from) : null;
    const validUntil = code.valid_until ? new Date(code.valid_until) : null;

    if (validFrom && now < validFrom) {
        return { label: 'Pendiente', severity: 'info' };
    }

    if (validUntil && now > validUntil) {
        return { label: 'Expirado', severity: 'danger' };
    }

    return { label: 'Vigente', severity: 'success' };
};

/**
 * Get usage info
 */
const getUsageInfo = (code) => {
    if (code.max_uses) {
        return `${code.current_uses} / ${code.max_uses}`;
    }
    return `${code.current_uses} / ∞`;
};

/**
 * Check if code has remaining uses
 */
const hasRemainingUses = (code) => {
    if (!code.max_uses) return true;
    return code.current_uses < code.max_uses;
};

/**
 * Toggle active status
 */
const toggleActive = async (code) => {
    try {
        await discountCodesStore.toggleActive(code.id);

        toast.add({
            severity: 'success',
            summary: code.is_active ? 'Código desactivado' : 'Código activado',
            detail: `El código ${code.code} ha sido ${code.is_active ? 'desactivado' : 'activado'}`,
            life: 3000
        });

        emit('refresh');
    } catch (error) {
        console.error('[DiscountCodesList] Error toggling active:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cambiar el estado del código',
            life: 4000
        });
    }
};

/**
 * Delete code
 */
const deleteCode = async (code) => {
    if (!confirm(`¿Estás seguro de eliminar el código "${code.code}"?`)) {
        return;
    }

    try {
        await discountCodesStore.deleteDiscountCode(code.id);

        toast.add({
            severity: 'success',
            summary: 'Código eliminado',
            detail: `El código ${code.code} ha sido eliminado`,
            life: 3000
        });

        emit('refresh');
    } catch (error) {
        console.error('[DiscountCodesList] Error deleting code:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar el código',
            life: 4000
        });
    }
};
</script>

<template>
    <div class="discount-codes-list">
        <DataTable :value="codes" :loading="loading" paginator :rows="20" :rowsPerPageOptions="[10, 20, 50]" dataKey="id" stripedRows responsiveLayout="scroll" class="codes-table">
            <template #empty>
                <div class="empty-state">
                    <i class="pi pi-inbox"></i>
                    <p>No se encontraron códigos de descuento</p>
                </div>
            </template>

            <!-- Code Column -->
            <Column header="Código" field="code" sortable style="min-width: 120px">
                <template #body="{ data }">
                    <div class="code-cell">
                        <strong class="code-value">{{ data.code }}</strong>
                        <Tag v-if="!data.is_active" severity="secondary" value="Inactivo" class="ml-2" />
                    </div>
                </template>
            </Column>

            <!-- Name Column -->
            <Column header="Nombre" field="name" sortable style="min-width: 200px">
                <template #body="{ data }">
                    <div class="name-cell">
                        <p class="name-text">{{ data.name }}</p>
                        <p v-if="data.description" class="description-text">{{ data.description }}</p>
                    </div>
                </template>
            </Column>

            <!-- Type & Value Column -->
            <Column header="Descuento" style="min-width: 120px">
                <template #body="{ data }">
                    <div class="discount-cell">
                        <span class="discount-value">{{ formatDiscountValue(data) }}</span>
                        <small class="discount-type">{{ data.discount_type === 'percentage' ? 'Porcentaje' : 'Fijo' }}</small>
                    </div>
                </template>
            </Column>

            <!-- Applies To Column -->
            <Column header="Aplica a" field="applies_to" style="min-width: 120px">
                <template #body="{ data }">
                    <Tag v-if="data.applies_to === 'all'" severity="info" value="Todo" />
                    <Tag v-else-if="data.applies_to === 'sales'" severity="success" value="Ventas" />
                    <Tag v-else-if="data.applies_to === 'purchases'" severity="warning" value="Compras" />
                    <Tag v-else severity="secondary" value="Cotizaciones" />
                </template>
            </Column>

            <!-- Usage Column -->
            <Column header="Usos" style="min-width: 100px">
                <template #body="{ data }">
                    <div class="usage-cell">
                        <span :class="{ 'text-danger': !hasRemainingUses(data) }">{{ getUsageInfo(data) }}</span>
                    </div>
                </template>
            </Column>

            <!-- Validity Column -->
            <Column header="Vigencia" style="min-width: 120px">
                <template #body="{ data }">
                    <Tag :severity="getValidityStatus(data).severity" :value="getValidityStatus(data).label" />
                </template>
            </Column>

            <!-- Actions Column -->
            <Column header="Acciones" style="width: 250px">
                <template #body="{ data }">
                    <div class="action-buttons">
                        <Button icon="pi pi-chart-bar" severity="info" size="small" @click="emit('view-stats', data.id)" v-tooltip.top="'Estadísticas'" text rounded />
                        <Button icon="pi pi-pencil" severity="warning" size="small" @click="emit('edit', data)" v-tooltip.top="'Editar'" text rounded />
                        <Button :icon="data.is_active ? 'pi pi-eye-slash' : 'pi pi-eye'" :severity="data.is_active ? 'secondary' : 'success'" size="small" @click="toggleActive(data)" v-tooltip.top="data.is_active ? 'Desactivar' : 'Activar'" text rounded />
                        <Button icon="pi pi-trash" severity="danger" size="small" @click="deleteCode(data)" v-tooltip.top="'Eliminar'" text rounded />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>
</template>

<style scoped>
.discount-codes-list {
    width: 100%;
}

.codes-table {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.empty-state {
    @apply flex flex-col items-center justify-center py-12 gap-4 text-gray-500 dark:text-gray-400;
}

.empty-state i {
    @apply text-4xl;
}

.code-cell {
    @apply flex items-center gap-2;
}

.code-value {
    @apply font-mono font-bold text-primary-600 dark:text-primary-400;
}

.name-cell {
    @apply flex flex-col gap-1;
}

.name-text {
    @apply font-semibold text-gray-900 dark:text-gray-100 m-0;
}

.description-text {
    @apply text-sm text-gray-600 dark:text-gray-400 m-0 line-clamp-2;
}

.discount-cell {
    @apply flex flex-col gap-1;
}

.discount-value {
    @apply font-bold text-green-600 dark:text-green-400;
}

.discount-type {
    @apply text-xs text-gray-500 dark:text-gray-400;
}

.usage-cell {
    @apply font-medium;
}

.action-buttons {
    @apply flex gap-1;
}
</style>
