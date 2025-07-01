<script setup>
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import { ref, watch, computed } from 'vue';
import { exportToExcel } from '@/utils/excelUtils';
import { useAuthStore } from '@/stores/authStore';

const { users, loading } = defineProps({
    users: { type: Array, required: true },
    loading: { type: Boolean, default: false }
});

defineEmits(['edit', 'delete']);

const authStore = useAuthStore();
const showCompanyColumn = computed(() => authStore.currentUser?.position === 'Developer');

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    dni: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    email: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    phone: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    position: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

watch(
    () => users,
    (newUsers) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);
const exportUsers = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'DNI', key: 'dni', width: 15 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Cargo', key: 'position', width: 15 },
        { header: 'Activo', key: 'is_active', width: 15 },
        { header: 'Empresa', key: 'company_name', width: 30 }
    ];

    await exportToExcel(columns, users, 'Usuarios', 'Usuarios');
};
</script>

<template>
    <DataTable
        stripedRows
        :value="users"
        :loading="loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['name', 'dni', 'email', 'phone', 'position']"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
        class="users-table purple-theme p-datatable-gridlines"
    >
        <template #header>
            <div class="table-header">
                <div class="header-backdrop"></div>
                <div class="header-content">
                    <div class="search-section">
                        <div class="search-container">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search text-white" />
                                </InputIcon>
                                <InputText v-model="localFilters.global.value" placeholder="Buscar por nombre, email, DNI, teléfono..." class="search-input" fluid />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button type="button" icon="pi pi-file-excel" label="Exportar" class="export-btn" @click="exportUsers()" v-tooltip.top="'Exportar usuarios a Excel'" :disabled="!users.length" />
                    </div>
                </div>
            </div>
        </template>
        <!-- Mostrar mensaje cuando no hay registros -->
        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-search"></i>
                </div>
                <h3 class="empty-title">No se encontraron usuarios</h3>
                <p class="empty-description">Intenta ajustar los filtros o términos de búsqueda</p>
                <Button icon="pi pi-filter-slash" label="Limpiar filtros" class="p-button-outlined" @click="localFilters = initFilters()" />
            </div>
        </template>
        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando usuarios...</p>
            </div>
        </template>
        <Column field="name" header="Nombre" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="user-name">
                    <div class="name-avatar">
                        {{ data.name?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                    <span class="name-text">{{ data.name || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="dni" header="DNI" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="dni-badge">
                    {{ data.dni || '-' }}
                </div>
            </template>
        </Column>
        <Column field="email" header="Email" sortable style="min-width: 12rem; max-width: 18rem">
            <template #body="{ data }">
                <div class="email-container">
                    <i class="pi pi-envelope"></i>
                    <span class="email-text">{{ data.email || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="phone" header="Teléfono" sortable style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="phone-container">
                    <i class="pi pi-phone"></i>
                    <span>{{ data.phone || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="position" header="Cargo" sortable style="min-width: 8rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="position-tag">
                    <i class="pi pi-briefcase"></i>
                    <span>{{ data.position || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="is_active" header="Estado" sortable style="min-width: 4rem; max-width: 6rem">
            <template #body="{ data }">
                <div class="flex justify-center">
                    <div v-if="data.is_active" class="status-badge active">
                        <i class="pi pi-check"></i>
                        <span>Activo</span>
                    </div>
                    <div v-else class="status-badge inactive">
                        <i class="pi pi-times"></i>
                        <span>Inactivo</span>
                    </div>
                </div>
            </template>
        </Column>

        <Column v-if="showCompanyColumn" field="company_name" header="Compañía" sortable style="min-width: 12rem; max-width: 15rem">
            <template #body="{ data }">
                <div class="company-tag">
                    <i class="pi pi-building"></i>
                    <span>{{ data.company_name || '-' }}</span>
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
/* Encabezado de la tabla mejorado */
.table-header {
    @apply relative overflow-hidden mb-0 rounded-t-2xl;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%);
    padding: 1.5rem 2rem;
}

/* Fondo decorativo */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size:
        40px 40px,
        25px 25px;
    animation: pattern-drift 25s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

/* Sección de búsqueda mejorada */
.search-section {
    @apply flex-1 max-w-md;
}

.search-container {
    @apply relative;
}

.search-input {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/70 rounded-xl px-4 py-3 font-medium transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
    @apply bg-white/30 border-white/50 ring-2 ring-white/20;
    transform: translateY(-1px);
}

.search-input::placeholder {
    @apply text-white/70;
}

/* Icono de búsqueda */
:deep(.search-container .p-icon-field .p-input-icon) {
    @apply text-white;
}

/* Sección de acciones */
.actions-section {
    @apply flex gap-3;
}

/* Botón de exportar mejorado */
.export-btn {
    @apply bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white font-semibold px-4 py-3 rounded-xl transition-all duration-300;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.export-btn:hover:not(:disabled) {
    @apply bg-white/30 border-white/40;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.export-btn:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Estados de tabla vacía y carga mejorados */
.empty-table-state {
    @apply text-center py-16 px-8;
}

.empty-icon {
    @apply mx-auto mb-4 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center;
}

.empty-icon i {
    @apply text-3xl text-gray-400 dark:text-gray-500;
}

.empty-title {
    @apply text-xl font-bold text-gray-700 dark:text-gray-300 mb-2;
}

.empty-description {
    @apply text-gray-500 dark:text-gray-400 mb-6;
}

.loading-table-state {
    @apply text-center py-16 px-8;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

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

.dni-badge {
    @apply font-mono text-sm px-3 py-1 rounded-xl font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 text-center;
}

.email-container,
.phone-container {
    @apply flex items-center gap-2;
}

.email-container i {
    @apply text-purple-600 dark:text-purple-400;
}

.phone-container i {
    @apply text-green-600 dark:text-green-400;
}

.email-text {
    @apply text-sm text-gray-700 dark:text-gray-300;
}

.position-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700;
}

.position-tag i {
    @apply text-yellow-600 dark:text-yellow-400;
}

.status-badge {
    @apply flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold;
}

.status-badge.active {
    @apply bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700;
}

.status-badge.inactive {
    @apply bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700;
}

.company-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700;
}

.company-tag i {
    @apply text-indigo-600 dark:text-indigo-400;
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

/* Animación del patrón */
@keyframes pattern-drift {
    0% {
        background-position:
            0% 0%,
            0% 0%;
    }
    100% {
        background-position:
            100% 100%,
            -100% -100%;
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    .table-header {
        @apply p-4;
    }

    .header-content {
        @apply flex-col gap-4;
    }

    .search-section {
        @apply max-w-none w-full;
    }

    .search-input {
        @apply w-full;
    }

    .actions-section {
        @apply w-full;
    }

    .export-btn {
        @apply w-full justify-center;
    }

    :deep(.purple-theme .p-datatable-thead > tr > th),
    :deep(.purple-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
    }

    .user-name {
        @apply gap-2;
    }

    .name-avatar {
        @apply w-6 h-6 text-xs;
    }
}

@media (max-width: 480px) {
    .table-header {
        @apply p-3;
    }

    .search-input {
        @apply py-2.5 text-sm;
    }

    .export-btn {
        @apply py-2.5 text-sm;
    }
}
</style>
