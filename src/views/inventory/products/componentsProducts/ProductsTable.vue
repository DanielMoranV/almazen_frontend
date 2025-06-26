<script setup>
import { ref, watch, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { exportToExcel } from '@/utils/excelUtils';
import JsBarcode from 'jsbarcode';
import { useCategoriesStore } from '@/stores/categoriesStore';

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
        :paginator="true"
        :rows="15"
        :rowsPerPageOptions="[10, 15, 25, 50, 100]"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} productos"
        class="products-table green-theme p-datatable-gridlines"
    >
        <template #header>
            <div class="table-header">
                <div class="header-content">
                    <div class="header-title">
                        <i class="pi pi-list"></i>
                        <span>Lista de Productos</span>
                    </div>
                    <Button 
                        type="button" 
                        icon="pi pi-file-excel" 
                        label="Exportar Excel" 
                        class="export-btn"
                        @click="exportProducts()" 
                        v-tooltip.top="'Exportar productos a Excel'"
                        severity="success"
                        outlined
                    />
                </div>
            </div>
        </template>

        <template #empty>
            <div class="text-center p-5">
                <i class="pi pi-box text-4xl text-400 mb-3"></i>
                <p class="text-600">No se encontraron productos</p>
            </div>
        </template>
        <template #loading>
            <div class="text-center p-5">
                <ProgressSpinner />
                <p class="text-600 mt-3">Cargando productos...</p>
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
        <Column field="type_barcode" header="Tipo" sortable style="min-width: 4rem; max-width: 5rem">
            <template #body="{ data }">
                <span class="barcode-type-badge">
                    {{ data.type_barcode?.toUpperCase() || '-' }}
                </span>
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
/* ===== TABLE HEADER ===== */
.table-header {
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--yellow-400) 100%);
    @apply rounded-t-lg p-4 mb-0;
    box-shadow: 0 4px 12px rgba(var(--primary), 0.15);
}

.header-content {
    @apply flex justify-between items-center;
}

.header-title {
    @apply flex items-center gap-3 text-white font-bold text-lg;
}

.header-title i {
    @apply text-xl;
}

.export-btn {
    @apply bg-white/25 border-white/40 text-white hover:bg-white/35 font-semibold;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(4px);
}

/* ===== TABLE STYLES ===== */
:deep(.green-theme) {
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.1);
}

:deep(.green-theme .p-datatable-header) {
    background: transparent;
    border: none;
    padding: 0;
}

/* ===== STICKY HEADER ===== */
:deep(.green-theme .p-datatable-thead > tr > th) {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--primary-500);
    color: var(--primary-color-text);
    font-weight: 700;
    font-size: 14px;
    padding: 16px 12px;
    border: none;
    text-align: center;
    letter-spacing: 0.025em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.green-theme .p-datatable-thead > tr > th:first-child) {
    border-top-left-radius: 0;
}

:deep(.green-theme .p-datatable-thead > tr > th:last-child) {
    border-top-right-radius: 0;
}

/* ===== TABLE BODY ===== */
:deep(.green-theme .p-datatable-tbody > tr > td) {
    padding: 16px 12px;
    vertical-align: middle;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-0);
    font-size: 14px;
    color: var(--text-color);
    transition: all 0.2s ease;
    font-weight: 500;
}

:deep(.green-theme .p-datatable-tbody > tr:nth-child(even) > td) {
    background: var(--surface-50);
}

/* ===== HOVER EFFECTS ===== */
:deep(.green-theme .p-datatable-tbody > tr:hover > td) {
    background: var(--primary-50);
    box-shadow: 0 4px 8px -2px rgba(var(--primary), 0.15), 0 2px 4px -1px rgba(var(--primary), 0.1);
    transform: translateY(-1px);
}

/* ===== ACTION BUTTONS ===== */
:deep(.green-theme .p-button.p-button-info) {
    background: var(--primary-500);
    border-color: var(--primary-500);
    color: var(--primary-color-text);
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(var(--primary), 0.2);
    font-weight: 600;
}

:deep(.green-theme .p-button.p-button-info:hover) {
    background: var(--primary-600);
    border-color: var(--primary-600);
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(var(--primary), 0.3);
}

:deep(.green-theme .p-button.p-button-danger) {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
    font-weight: 600;
}

:deep(.green-theme .p-button.p-button-danger:hover) {
    background: #dc2626;
    border-color: #dc2626;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
}

/* ===== STATUS INDICATORS ===== */
:deep(.green-theme .pi-check-circle) {
    color: var(--green-500);
    filter: drop-shadow(0 2px 4px rgba(var(--green), 0.25));
    font-weight: 600;
}

:deep(.green-theme .pi-times-circle) {
    color: #ef4444;
    filter: drop-shadow(0 2px 4px rgba(239, 68, 68, 0.25));
    font-weight: 600;
}

/* ===== PAGINATION ===== */
:deep(.green-theme .p-paginator) {
    background: var(--surface-0);
    border-top: 2px solid var(--primary-500);
    padding: 1rem;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page) {
    color: #22c55e;
    border: 1px solid #22c55e;
    font-weight: 600;
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page.p-highlight) {
    background: #22c55e;
    color: white;
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.2);
}

:deep(.green-theme .p-paginator .p-paginator-pages .p-paginator-page:hover) {
    background: #dcfce7;
    border-color: #16a34a;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.15);
}

:deep(.green-theme .p-paginator .p-dropdown) {
    border-color: #22c55e;
    font-weight: 500;
}

:deep(.green-theme .p-paginator .p-dropdown:focus) {
    border-color: #16a34a;
    box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.15);
}

/* ===== BRAND STYLING ===== */
.brand-tag {
    @apply flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold;
    background: var(--primary-50);
    color: var(--primary-900);
    border: 1px solid var(--primary-200);
    box-shadow: 0 1px 3px rgba(var(--primary), 0.1);
}

.brand-tag i {
    color: var(--primary-700);
}

/* ===== SKU STYLING ===== */
.sku-badge {
    @apply font-mono text-sm px-3 py-1 rounded-lg font-semibold;
    background: var(--yellow-50);
    color: var(--yellow-900);
    border: 1px solid var(--yellow-200);
    box-shadow: 0 1px 3px rgba(var(--yellow), 0.1);
}

/* ===== BARCODE TYPE BADGE ===== */
.barcode-type-badge {
    @apply px-2 py-1 text-xs rounded-full font-bold uppercase tracking-wide;
    background: var(--primary-50);
    color: var(--primary-900);
    border: 1px solid var(--primary-200);
    box-shadow: 0 1px 2px rgba(var(--primary), 0.1);
}

/* ===== EMPTY STATE ===== */
:deep(.green-theme .p-datatable-emptymessage) {
    background: #f9fafb;
    color: #1f2937;
    padding: 3rem;
    font-weight: 500;
}

:deep(.green-theme .p-datatable-emptymessage .pi-box) {
    color: #22c55e;
}

/* ===== UTILITY CLASSES ===== */
.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.barcode-container {
    max-width: 100%;
    overflow: hidden;
}

.barcode-canvas {
    max-width: 100%;
    height: auto;
}

.barcode-fallback {
    font-family: monospace;
    font-size: 12px;
    text-align: center;
    padding: 8px;
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    color: #6b7280;
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
    .header-title {
        @apply text-base;
    }
    
    .export-btn {
        @apply text-sm px-3 py-2;
    }
    
    :deep(.green-theme .p-datatable-thead > tr > th),
    :deep(.green-theme .p-datatable-tbody > tr > td) {
        font-size: 12px;
        padding: 12px 8px;
    }
}

/* PrimeVue automaticamente maneja el modo oscuro */
</style>
