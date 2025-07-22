<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useCustomersStore } from '@/stores/customersStore';
import { useUsersStore } from '@/stores/usersStore';

const customersStore = useCustomersStore();
const usersStore = useUsersStore();

const props = defineProps({
    filters: {
        type: Object,
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:filters', 'clear', 'search']);

const localFilters = ref({ ...props.filters });

const statusOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagado', value: 'PAGADO' },
    { label: 'Anulado', value: 'ANULADO' }
];

// Opciones de clientes con "Todos" al inicio
const customerOptions = computed(() => [
    { name: 'Todos los clientes', id: null },
    ...customersStore.customersList
]);

// Opciones de usuarios con "Todos" al inicio
const userOptions = computed(() => [
    { name: 'Todos los usuarios', id: null },
    ...usersStore.usersList
]);

// Cargar datos iniciales
onMounted(async () => {
    await Promise.all([
        customersStore.fetchCustomers(),
        usersStore.fetchUsers()
    ]);
});

// Sync con props
watch(() => props.filters, (newFilters) => {
    localFilters.value = { ...newFilters };
}, { deep: true });

// Aplicar filtros
const applyFilters = () => {
    emit('update:filters', { ...localFilters.value });
    emit('search');
};

// Limpiar filtros
const clearFilters = () => {
    localFilters.value = {
        status: '',
        customer_id: null,
        document_number: '',
        date_from: '',
        date_to: '',
        user_id: null
    };
    emit('clear');
};

// Verificar si hay filtros activos
const hasActiveFilters = computed(() => {
    return localFilters.value.status ||
           localFilters.value.customer_id ||
           localFilters.value.document_number ||
           localFilters.value.date_from ||
           localFilters.value.date_to ||
           localFilters.value.user_id;
});
</script>

<template>
    <div class="sales-filters">
        <div class="filters-header">
            <div class="header-backdrop"></div>
            <div class="header-content">
                <div class="title-section">
                    <h3 class="filters-title">
                        <i class="pi pi-filter"></i>
                        Filtros de Búsqueda
                    </h3>
                    <p class="filters-subtitle">Personaliza tu búsqueda de ventas</p>
                </div>
                <div class="actions-section">
                    <Button 
                        icon="pi pi-search" 
                        label="Buscar" 
                        class="search-btn" 
                        @click="applyFilters"
                        :loading="loading"
                    />
                    <Button 
                        icon="pi pi-filter-slash" 
                        label="Limpiar" 
                        class="clear-btn" 
                        @click="clearFilters"
                        :disabled="!hasActiveFilters"
                        outlined
                    />
                </div>
            </div>
        </div>

        <div class="filters-content">
            <!-- Fila 1: Estado y Cliente -->
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">Estado</label>
                    <Select 
                        v-model="localFilters.status" 
                        :options="statusOptions" 
                        optionLabel="label" 
                        optionValue="value" 
                        placeholder="Seleccionar estado"
                        class="filter-select"
                    />
                </div>
                
                <div class="filter-group">
                    <label class="filter-label">Cliente</label>
                    <Select 
                        v-model="localFilters.customer_id" 
                        :options="customerOptions" 
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Seleccionar cliente"
                        class="filter-select"
                        filter
                        showClear
                    />
                </div>

                <div class="filter-group">
                    <label class="filter-label">Usuario</label>
                    <Select 
                        v-model="localFilters.user_id" 
                        :options="userOptions" 
                        optionLabel="name" 
                        optionValue="id" 
                        placeholder="Seleccionar usuario"
                        class="filter-select"
                        filter
                        showClear
                    />
                </div>
            </div>

            <!-- Fila 2: Número de documento y fechas -->
            <div class="filters-row">
                <div class="filter-group">
                    <label class="filter-label">Número de Documento</label>
                    <InputText 
                        v-model="localFilters.document_number" 
                        placeholder="Buscar por número..."
                        class="filter-input"
                    />
                </div>

                <div class="filter-group">
                    <label class="filter-label">Fecha Desde</label>
                    <Calendar 
                        v-model="localFilters.date_from" 
                        dateFormat="yy-mm-dd"
                        placeholder="Fecha inicio"
                        class="filter-input"
                        showIcon
                        showButtonBar
                    />
                </div>

                <div class="filter-group">
                    <label class="filter-label">Fecha Hasta</label>
                    <Calendar 
                        v-model="localFilters.date_to" 
                        dateFormat="yy-mm-dd"
                        placeholder="Fecha fin"
                        class="filter-input"
                        showIcon
                        showButtonBar
                    />
                </div>
            </div>

            <!-- Indicador de filtros activos -->
            <div v-if="hasActiveFilters" class="active-filters-indicator">
                <div class="indicator-content">
                    <i class="pi pi-check-circle"></i>
                    <span>Filtros activos aplicados</span>
                    <Button 
                        icon="pi pi-times" 
                        class="remove-filters-btn" 
                        rounded 
                        text 
                        size="small"
                        @click="clearFilters"
                        v-tooltip="'Remover todos los filtros'"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Contenedor principal */
.sales-filters {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Encabezado de filtros */
.filters-header {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
    padding: 1.5rem 2rem;
}

.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: 
        radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
        radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size: 40px 40px, 25px 25px;
    animation: pattern-drift 25s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

.title-section {
    @apply flex-1;
}

.filters-title {
    @apply text-xl font-bold text-white flex items-center gap-3 mb-1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.filters-title i {
    @apply text-white/90;
}

.filters-subtitle {
    @apply text-white/80 text-sm font-medium;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.actions-section {
    @apply flex gap-3;
}

/* Botones de acción */
.search-btn {
    @apply bg-white/20 hover:bg-white/30 border-2 border-white/30 hover:border-white/40 text-white font-semibold px-4 py-2 rounded-xl backdrop-blur-sm transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.clear-btn {
    @apply bg-transparent hover:bg-white/10 border-2 border-white/30 hover:border-white/40 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300;
}

.clear-btn:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Contenido de filtros */
.filters-content {
    @apply p-6 space-y-6;
}

.filters-row {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.filter-group {
    @apply space-y-2;
}

.filter-label {
    @apply block text-sm font-semibold text-gray-700 dark:text-gray-300;
}

.filter-select,
.filter-input {
    @apply w-full transition-all duration-200;
}

/* Estilos para componentes PrimeVue */
:deep(.filter-select .p-dropdown),
:deep(.filter-input) {
    @apply border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium transition-all;
}

:deep(.filter-select .p-dropdown:not(.p-disabled).p-focus),
:deep(.filter-input:focus) {
    @apply border-indigo-500 ring-2 ring-indigo-500/20;
}

/* Indicador de filtros activos */
.active-filters-indicator {
    @apply bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4;
}

.indicator-content {
    @apply flex items-center gap-3 text-indigo-700 dark:text-indigo-300;
}

.indicator-content i {
    @apply text-indigo-600 dark:text-indigo-400;
}

.remove-filters-btn {
    @apply ml-auto text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800/30;
}

/* Animación del patrón */
@keyframes pattern-drift {
    0% {
        background-position: 0% 0%, 0% 0%;
    }
    100% {
        background-position: 100% 100%, -100% -100%;
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .filters-header {
        @apply p-4;
    }

    .header-content {
        @apply flex-col items-start gap-4;
    }

    .actions-section {
        @apply w-full gap-3;
    }

    .search-btn,
    .clear-btn {
        @apply flex-1 justify-center;
    }

    .filters-content {
        @apply p-4;
    }

    .filters-row {
        @apply grid-cols-1 gap-4;
    }
}

@media (max-width: 480px) {
    .filters-header {
        @apply p-3;
    }

    .filters-title {
        @apply text-lg;
    }

    .filters-subtitle {
        @apply text-xs;
    }

    .filters-content {
        @apply p-3;
    }
}
</style>