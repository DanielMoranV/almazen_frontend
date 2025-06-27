<script setup>
import { useCategoriesStore } from '@/stores/categoriesStore';
import { exportToExcel } from '@/utils/excelUtils';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import JsBarcode from 'jsbarcode';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import { computed, ref, watch } from 'vue';

const categoriesStore = useCategoriesStore();
const categories = computed(() => categoriesStore.categoriesList);
const props = defineProps({
    products: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['edit', 'delete']);

const initFilters = () => ({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    barcode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    type_barcode: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    sku: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    unit_name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    brand: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    is_active: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] }
});

const localFilters = ref(initFilters());

watch(
    () => props.products,
    (newProducts) => {
        localFilters.value = { ...initFilters() };
    },
    { deep: true }
);

const exportProducts = async () => {
    const columns = [
        { header: 'Nombre', key: 'name', width: 30 },
        { header: 'Código de barras', key: 'barcode', width: 15 },
        { header: 'Tipo de Código', key: 'type_barcode', width: 15 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Descripción', key: 'description', width: 30 },
        { header: 'Unidad', key: 'unit_name', width: 15 },
        { header: 'Presentación', key: 'presentation', width: 15 },
        { header: 'Categorias', key: 'categories', width: 15 },
        { header: 'Marca', key: 'brand', width: 30 },
        { header: 'Activo', key: 'is_active', width: 15 }
    ];

    const formattedProducts = props.products.map((product) => {
        return {
            ...product,
            categories: product.categories
                .map((category) => categories.value.find((c) => c.id === category))
                .map((c) => c.name)
                .join(', ')
        };
    });

    await exportToExcel(columns, formattedProducts, 'Productos', 'Productos');
};

// SOLUCIÓN: Componente personalizado para código de barras
const generateBarcode = (element, value, options) => {
    try {
        JsBarcode(element, value, options);
    } catch (error) {
        console.error('Error generating barcode:', error);
        // Mostrar texto como fallback
        element.innerHTML = `<div class="barcode-fallback">${value}</div>`;
    }
};

// Función mejorada para obtener las opciones del código de barras
const getBarcodeOptions = (type) => {
    const supportedFormats = ['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC', 'ITF14'];
    let format = 'CODE128';

    if (type) {
        const upperType = type.toUpperCase();
        if (supportedFormats.includes(upperType)) {
            format = upperType;
        }
    }

    return {
        format: format,
        width: 1,
        height: 30,
        fontSize: 10,
        textMargin: 2,
        displayValue: true,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 5
    };
};
</script>

<template>
    <DataTable
        stripedRows
        :value="props.products"
        :loading="props.loading"
        responsiveLayout="scroll"
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        v-model:filters="localFilters"
        :globalFilterFields="['name', 'barcode', 'sku', 'description', 'unit_name', 'brand']"
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
        class="products-table green-theme p-datatable-gridlines"
    >
        <template #header>
            <div class="table-header">
                <div class="header-backdrop"></div>
                <div class="header-content">
                    <div class="search-section">
                        <div class="search-container">
                            <IconField>
                                <InputIcon class="pi pi-search" />
                                <InputText 
                                    v-model="localFilters['global'].value" 
                                    placeholder="Buscar por nombre, SKU, código de barras..."
                                    class="search-input"
                                />
                            </IconField>
                        </div>
                    </div>
                    <div class="actions-section">
                        <Button 
                            type="button" 
                            icon="pi pi-file-excel" 
                            label="Exportar" 
                            class="export-btn" 
                            @click="exportProducts()" 
                            v-tooltip.top="'Exportar productos a Excel'"
                            :disabled="!props.products.length"
                        />
                    </div>
                </div>
            </div>
        </template>

        <template #empty>
            <div class="empty-table-state">
                <div class="empty-icon">
                    <i class="pi pi-search"></i>
                </div>
                <h3 class="empty-title">No se encontraron productos</h3>
                <p class="empty-description">Intenta ajustar los filtros o términos de búsqueda</p>
                <Button 
                    icon="pi pi-filter-slash" 
                    label="Limpiar filtros" 
                    class="p-button-outlined" 
                    @click="localFilters = initFilters()"
                />
            </div>
        </template>
        <template #loading>
            <div class="loading-table-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" />
                <p class="loading-text">Cargando productos...</p>
            </div>
        </template>

        <Column field="name" header="Nombre" sortable style="min-width: 12rem; max-width: 15rem" />
        <Column field="sku" header="SKU" sortable style="min-width: 6rem; max-width: 8rem">
            <template #body="{ data }">
                <div class="sku-badge text-center">
                    {{ data.sku || '-' }}
                </div>
            </template>
        </Column>
        <Column field="barcode" header="Cód. Barras" sortable style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
                <div v-if="data.barcode" class="barcode-container flex flex-col items-center gap-1">
                    <canvas
                        :ref="
                            (el) => {
                                if (el) {
                                    generateBarcode(el, data.barcode, getBarcodeOptions(data.type_barcode));
                                }
                            }
                        "
                        class="barcode-canvas"
                    ></canvas>
                </div>
                <span v-else class="text-gray-400">Sin código</span>
            </template>
        </Column>
        <Column field="type_barcode" header="Tipo" sortable style="min-width: 3rem; max-width: 6rem">
            <template #body="{ data }">
                <div class="text-center">
                    <span class="barcode-type-badge">
                        {{ data.type_barcode?.toUpperCase() || '-' }}
                    </span>
                </div>
            </template>
        </Column>
        <Column field="description" header="Descripción" sortable style="min-width: 12rem; max-width: 18rem">
            <template #body="{ data }">
                <div class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2" :title="data.description">
                    {{ data.description || '-' }}
                </div>
            </template>
        </Column>
        <Column header="Detalles" style="min-width: 8rem; max-width: 10rem">
            <template #body="{ data }">
                <div class="text-center">
                    <div class="font-medium text-sm">{{ data.unit_name || '-' }}</div>
                    <div class="text-xs text-gray-500">{{ data.presentation || '-' }}</div>
                </div>
            </template>
        </Column>
        <Column field="brand" header="Marca" sortable style="min-width: 8rem; max-width: 12rem">
            <template #body="{ data }">
                <div class="brand-tag">
                    <i class="pi pi-tag"></i>
                    <span>{{ data.brand || '-' }}</span>
                </div>
            </template>
        </Column>
        <Column field="image_url" header="Imagen" style="min-width: 4rem; max-width: 5rem">
            <template #body="{ data }">
                <div class="flex justify-center">
                    <img v-if="data.image_url" :src="data.image_url" alt="Imagen del producto" class="w-12 h-12 object-cover rounded border" @error="$event.target.style.display = 'none'" />
                    <div v-else class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <i class="pi pi-image text-gray-400"></i>
                    </div>
                </div>
            </template>
        </Column>
        <Column field="is_active" header="Act." sortable style="min-width: 4rem; max-width: 5rem">
            <template #body="{ data }">
                <div class="flex justify-center">
                    <i class="pi pi-check-circle text-green-500 text-2xl" v-if="data.is_active" />
                    <i class="pi pi-times-circle text-red-500 text-2xl" v-else />
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
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    padding: 1.5rem 2rem;
}

/* Fondo decorativo */
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
    @apply text-white/80;
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

/* Animación del patrón */
@keyframes pattern-drift {
    0% {
        background-position: 0% 0%, 0% 0%;
    }
    100% {
        background-position: 100% 100%, -100% -100%;
    }
}

/* Tema principal de la tabla mejorado */
:deep(.green-theme) {
    @apply rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

:deep(.green-theme .p-datatable-header) {
    @apply bg-transparent border-none p-0;
}

/* Encabezado de las columnas de la tabla */
:deep(.green-theme .p-datatable-thead > tr > th) {
    @apply sticky top-0 z-20 bg-green-600 text-white font-bold text-sm py-4 px-3 border-none text-center;
}

/* Cuerpo de la tabla */
:deep(.green-theme .p-datatable-tbody > tr > td) {
    @apply py-4 px-3 align-middle border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 font-medium;
}

/* Estilo para filas pares */
:deep(.green-theme .p-datatable-tbody > tr:nth-child(even) > td) {
    @apply bg-gray-50 dark:bg-gray-700/50;
}

/* Efecto hover en las filas */
:deep(.green-theme .p-datatable-tbody > tr:hover > td) {
    @apply bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800;
}

/* Botones de acción (Editar y Eliminar) */
:deep(.green-theme .p-button.p-button-info) {
    @apply bg-green-600 hover:bg-green-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

:deep(.green-theme .p-button.p-button-danger) {
    @apply bg-red-600 hover:bg-red-700 border-none text-white font-bold rounded-xl w-10 h-10 transition-colors;
}

/* Indicadores de estado (activo/inactivo) */
:deep(.green-theme .pi-check-circle) {
    @apply text-green-600 dark:text-green-400 text-xl;
}

:deep(.green-theme .pi-times-circle) {
    @apply text-red-600 dark:text-red-400 text-xl;
}

/* Paginador */
:deep(.green-theme .p-paginator) {
    @apply bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-4 rounded-b-xl;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    @apply text-green-600 border border-green-600 font-semibold rounded-xl mx-1 w-10 h-10 transition-colors;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    @apply bg-green-600 text-white;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    @apply bg-green-50 dark:bg-green-900/30 border-green-700;
}

:deep(.green-theme .p-paginator .p-dropdown) {
    @apply border-green-600 font-medium rounded-xl;
}

/* Etiqueta de marca */
.brand-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700;
}

.brand-tag i {
    @apply text-green-600 dark:text-green-400;
}

/* Insignia de SKU */
.sku-badge {
    @apply font-mono text-sm px-3 py-1 rounded-xl font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 text-center;
}

/* Insignia de tipo de código de barras */
.barcode-type-badge {
    @apply inline-block px-3 py-1 text-xs rounded-xl font-bold uppercase tracking-wide bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700;
    font-family: 'Courier New', monospace;
    min-width: 4rem;
    text-align: center;
}

/* Mensaje de tabla vacía */
:deep(.green-theme .p-datatable-emptymessage) {
    @apply bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-12 font-medium rounded-xl m-6 border-2 border-dashed border-gray-300 dark:border-gray-600;
}

:deep(.green-theme .p-datatable-emptymessage .pi-box) {
    @apply text-green-600 dark:text-green-400 text-4xl mb-4;
}

/* Clases de utilidad para truncar texto */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Contenedor del código de barras */
.barcode-container {
    @apply max-w-full overflow-hidden;
}

.barcode-canvas {
    @apply max-w-full h-auto;
}

/* Fallback para el código de barras si no se puede generar */
.barcode-fallback {
    @apply font-mono text-xs text-center p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400;
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

    :deep(.green-theme .p-datatable-thead > tr > th),
    :deep(.green-theme .p-datatable-tbody > tr > td) {
        @apply text-xs py-3 px-2;
    }

    .empty-table-state,
    .loading-table-state {
        @apply py-12 px-4;
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
