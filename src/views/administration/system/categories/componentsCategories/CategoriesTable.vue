<script setup>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

const { categories, loading } = defineProps({
    categories: {
        type: Object,
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['edit', 'delete']);
</script>

<template>
    <DataTable
        stripedRows
        :value="categories"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} categorías"
        class="users-table purple-theme p-datatable-gridlines"
    >
        <Column field="name" header="Nombre" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="user-name">
                    <div class="name-avatar">
                        {{ data.name?.charAt(0)?.toUpperCase() || 'C' }}
                    </div>
                    <span class="name-text">{{ data.name || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column :exportable="false" header="Acciones" style="min-width: 6rem; max-width: 8rem">
            <template #body="slotProps">
                <div class="flex justify-center gap-1">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-info" size="small" rounded text v-tooltip.top="'Editar'" @click="$emit('edit', slotProps.data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" size="small" rounded text v-tooltip.top="'Eliminar'" @click="$emit('delete', slotProps.data)" />
                </div>
            </template>
        </Column>
    </DataTable>
</template>

<style scoped>
/* Tema principal de la tabla mejorado */
:deep(.purple-theme) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.purple-theme .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

/* Encabezado de las columnas de la tabla */
:deep(.purple-theme .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-purple-600 text-white font-bold text-sm py-4 px-3 border-none text-center;
}

/* Cuerpo de la tabla */
:deep(.purple-theme .p-datatable-tbody > tr > td) {
    @apply py-4 px-3 align-middle border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

/* Estilo para filas pares */
:deep(.purple-theme .p-datatable-tbody > tr:nth-child(even) > td) {
    @apply bg-gray-50 dark:bg-gray-700/50;
}

/* Efecto hover en las filas */
:deep(.purple-theme .p-datatable-tbody > tr:hover > td) {
    @apply bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800;
}

/* Elementos de usuario mejorados */
.user-name {
    @apply flex items-center gap-3;
}

.name-avatar {
    @apply w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm;
}

.name-text {
    @apply font-semibold text-gray-800 dark:text-gray-200;
}

/* Botones de acción */
:deep(.purple-theme .p-button.p-button-info) {
    @apply bg-purple-600 hover:bg-purple-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.purple-theme .p-button.p-button-danger) {
    @apply bg-red-600 hover:bg-red-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

/* Paginador */
:deep(.purple-theme .p-paginator) {
    @apply bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl;
}

:deep(.purple-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    @apply text-purple-600 border border-purple-600 font-semibold rounded-xl mx-1 w-10 h-10 transition-colors;
}

:deep(.purple-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    @apply bg-purple-600 text-white;
}

:deep(.purple-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    @apply bg-purple-50 dark:bg-purple-900/30 border-purple-700;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    :deep(.purple-theme .p-datatable-thead > tr > th),
    :deep(.purple-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .user-name {
        @apply gap-2;
    }

    .name-avatar {
        @apply w-6 h-6 text-xs;
    }
}
</style>