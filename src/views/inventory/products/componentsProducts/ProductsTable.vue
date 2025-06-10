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
const { products, loading } = defineProps({
    products: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['edit', 'delete']);

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
    () => products,
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

    const formattedProducts = products.map((product) => {
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
        :value="products"
        :loading="loading"
        responsiveLayout="scroll"
        paginator
        scrollable
        scrollHeight="500px"
        removableSort
        dataKey="id"
        :filters="localFilters"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} Productos"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        class="products-table p-datatable-gridlines"
    >
        <template #header>
            <div class="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-2">
                <span class="text-xl text-900 font-bold">Lista de Productos</span>
                <div class="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                    <Button type="button" icon="pi pi-file-excel" label="Exportar" outlined @click="exportProducts()" class="w-full sm:w-auto px-0 sm:px-3 py-3 sm:py-2 text-base sm:text-sm" />
                    <IconField class="w-full sm:w-auto">
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="localFilters.global.value" placeholder="Buscar..." class="w-full sm:w-64 px-3 py-2 text-base sm:text-sm" />
                    </IconField>
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
                <div class="font-mono text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-center">
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
                <span class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
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
                <div class="font-medium text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <i class="pi pi-tag text-blue-400"></i>
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
:deep(.products-table) {
    /* Sticky header */
    .p-datatable-thead > tr > th {
        position: sticky;
        top: 0;
        z-index: 2;
        background-color: #f1f5f9;
        color: #1e293b;
        font-weight: 700;
        font-size: 15px;
        padding: 14px 10px;
        border-bottom: 2px solid #e2e8f0;
        text-align: center;
        letter-spacing: 0.02em;
    }
    /* Mejor separación y fondo alterno */
    .p-datatable-tbody > tr > td {
        padding: 14px 10px;
        vertical-align: middle;
        border-bottom: 1px solid #e5e7eb;
        background: #fff;
        font-size: 15px;
        color: #334155;
    }
    .p-datatable-tbody > tr:nth-child(even) > td {
        background: #f9fafb;
    }
    /* Hover con sombra */
    .p-datatable-tbody > tr:hover > td {
        background: #e0f2fe;
        box-shadow: 0 2px 8px 0 rgba(0, 150, 136, 0.07);
        transition:
            box-shadow 0.2s,
            background 0.2s;
    }
    /* Acciones más visibles */
    .p-button-info {
        background: #2563eb;
        border: none;
        color: #fff;
        transition: background 0.2s;
    }
    .p-button-info:hover {
        background: #1d4ed8;
    }
    .p-button-danger {
        background: #dc2626;
        border: none;
        color: #fff;
        transition: background 0.2s;
    }
    .p-button-danger:hover {
        background: #b91c1c;
    }
    /* Imagen más limpia */
    .product-img {
        width: 48px;
        height: 48px;
        object-fit: cover;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        background: #f3f4f6;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
    }
    /* Badge de estado */
    .badge-activo {
        background: #22c55e;
        color: #fff;
        font-size: 13px;
        border-radius: 0.375rem;
        padding: 3px 10px;
        font-weight: 600;
        letter-spacing: 0.01em;
        display: inline-block;
    }
    .badge-inactivo {
        background: #ef4444;
        color: #fff;
        font-size: 13px;
        border-radius: 0.375rem;
        padding: 3px 10px;
        font-weight: 600;
        letter-spacing: 0.01em;
        display: inline-block;
    }
    /* Responsividad */
    @media (max-width: 640px) {
        .p-datatable-thead > tr > th,
        .p-datatable-tbody > tr > td {
            font-size: 12px;
            padding: 8px 4px;
        }
        .product-img {
            width: 36px;
            height: 36px;
        }
    }
}

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
    padding: 5px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 3px;
}
</style>
