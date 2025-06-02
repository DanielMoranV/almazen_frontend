<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const stockItems = ref([]);
const searchQuery = ref('');
const warehouseFilter = ref(null);
const categoryFilter = ref(null);
const stockStatusFilter = ref(null);

// Opciones de filtro
const stockStatusOptions = [
    { label: 'Todos', value: null },
    { label: 'En stock', value: 'in_stock' },
    { label: 'Stock bajo', value: 'low_stock' },
    { label: 'Agotado', value: 'out_of_stock' }
];

const warehouseOptions = [
    { label: 'Todos', value: null },
    { label: 'Almacén Principal', value: 1 },
    { label: 'Almacén Secundario', value: 2 },
    { label: 'Tienda', value: 3 }
];

const categoryOptions = [
    { label: 'Todas', value: null },
    { label: 'Electrónicos', value: 1 },
    { label: 'Muebles', value: 2 },
    { label: 'Ropa', value: 3 },
    { label: 'Alimentos', value: 4 }
];

// Datos de ejemplo para el inventario
const mockStockItems = [
    {
        id: 1,
        productCode: 'PROD-001',
        productName: 'Laptop HP 15"',
        category: 'Electrónicos',
        categoryId: 1,
        warehouse: 'Almacén Principal',
        warehouseId: 1,
        quantity: 25,
        minStock: 10,
        maxStock: 50,
        unitPrice: 1200,
        totalValue: 30000,
        lastUpdated: '2025-06-01',
        status: 'in_stock'
    },
    {
        id: 2,
        productCode: 'PROD-002',
        productName: 'Monitor Dell 24"',
        category: 'Electrónicos',
        categoryId: 1,
        warehouse: 'Almacén Principal',
        warehouseId: 1,
        quantity: 8,
        minStock: 10,
        maxStock: 30,
        unitPrice: 250,
        totalValue: 2000,
        lastUpdated: '2025-06-01',
        status: 'low_stock'
    },
    {
        id: 3,
        productCode: 'PROD-003',
        productName: 'Silla Ergonómica',
        category: 'Muebles',
        categoryId: 2,
        warehouse: 'Almacén Secundario',
        warehouseId: 2,
        quantity: 15,
        minStock: 5,
        maxStock: 20,
        unitPrice: 180,
        totalValue: 2700,
        lastUpdated: '2025-05-28',
        status: 'in_stock'
    },
    {
        id: 4,
        productCode: 'PROD-004',
        productName: 'Teclado Mecánico',
        category: 'Electrónicos',
        categoryId: 1,
        warehouse: 'Tienda',
        warehouseId: 3,
        quantity: 0,
        minStock: 5,
        maxStock: 15,
        unitPrice: 80,
        totalValue: 0,
        lastUpdated: '2025-05-25',
        status: 'out_of_stock'
    },
    {
        id: 5,
        productCode: 'PROD-005',
        productName: 'Camiseta Algodón',
        category: 'Ropa',
        categoryId: 3,
        warehouse: 'Tienda',
        warehouseId: 3,
        quantity: 50,
        minStock: 20,
        maxStock: 100,
        unitPrice: 25,
        totalValue: 1250,
        lastUpdated: '2025-06-02',
        status: 'in_stock'
    }
];

onMounted(() => {
    loadStockItems();
});

const loadStockItems = () => {
    loading.value = true;
    // Simulación de carga de datos
    setTimeout(() => {
        stockItems.value = mockStockItems;
        loading.value = false;
    }, 500);
};

const exportToExcel = () => {
    loading.value = true;
    
    // Simulación de exportación a Excel
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Reporte de inventario exportado a Excel',
            life: 3000
        });
        loading.value = false;
    }, 1000);
};

const printInventory = () => {
    loading.value = true;
    
    // Simulación de impresión
    setTimeout(() => {
        toast.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Reporte de inventario enviado a impresión',
            life: 3000
        });
        loading.value = false;
    }, 1000);
};

const viewProductDetails = (item) => {
    // Navegar a la página de detalles del producto
    router.push(`/products/${item.productCode}`);
};

const adjustStock = (item, event) => {
    event.stopPropagation();
    
    // Aquí se podría abrir un diálogo para ajustar el stock
    // Por ahora solo mostramos un mensaje
    toast.add({
        severity: 'info',
        summary: 'Ajuste de Stock',
        detail: `Ajustando stock para ${item.productName}`,
        life: 3000
    });
};

const filteredStockItems = computed(() => {
    let result = stockItems.value;
    
    // Filtrar por búsqueda
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(item => 
            item.productName.toLowerCase().includes(query) || 
            item.productCode.toLowerCase().includes(query)
        );
    }
    
    // Filtrar por almacén
    if (warehouseFilter.value) {
        result = result.filter(item => item.warehouseId === warehouseFilter.value);
    }
    
    // Filtrar por categoría
    if (categoryFilter.value) {
        result = result.filter(item => item.categoryId === categoryFilter.value);
    }
    
    // Filtrar por estado de stock
    if (stockStatusFilter.value) {
        result = result.filter(item => item.status === stockStatusFilter.value);
    }
    
    return result;
});

const getStatusClass = (status) => {
    switch (status) {
        case 'in_stock':
            return 'bg-green-100 text-green-700';
        case 'low_stock':
            return 'bg-yellow-100 text-yellow-700';
        case 'out_of_stock':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'in_stock':
            return 'En stock';
        case 'low_stock':
            return 'Stock bajo';
        case 'out_of_stock':
            return 'Agotado';
        default:
            return status;
    }
};

const formatCurrency = (value) => {
    return value ? `$${value.toLocaleString()}` : '-';
};

const clearFilters = () => {
    searchQuery.value = '';
    warehouseFilter.value = null;
    categoryFilter.value = null;
    stockStatusFilter.value = null;
};

// Cálculos para el resumen
const totalItems = computed(() => {
    return filteredStockItems.value.length;
});

const totalQuantity = computed(() => {
    return filteredStockItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

const totalValue = computed(() => {
    return filteredStockItems.value.reduce((sum, item) => sum + item.totalValue, 0);
});

const lowStockItems = computed(() => {
    return filteredStockItems.value.filter(item => item.status === 'low_stock').length;
});

const outOfStockItems = computed(() => {
    return filteredStockItems.value.filter(item => item.status === 'out_of_stock').length;
});
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <h5 class="m-0">Inventario</h5>
                    <div class="mt-3 md:mt-0 flex">
                        <button class="p-button p-component p-button-outlined mr-2" @click="exportToExcel">
                            <i class="pi pi-file-excel mr-2"></i>
                            <span class="p-button-label">Exportar</span>
                        </button>
                        <button class="p-button p-component p-button-outlined" @click="printInventory">
                            <i class="pi pi-print mr-2"></i>
                            <span class="p-button-label">Imprimir</span>
                        </button>
                    </div>
                </div>
                
                <!-- Tarjetas de resumen -->
                <div class="grid mt-3">
                    <div class="col-12 md:col-2">
                        <div class="surface-card shadow-2 p-3 border-round">
                            <div class="text-500 font-medium mb-2">Total Productos</div>
                            <div class="font-bold text-xl">{{ totalItems }}</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-2">
                        <div class="surface-card shadow-2 p-3 border-round">
                            <div class="text-500 font-medium mb-2">Cantidad Total</div>
                            <div class="font-bold text-xl">{{ totalQuantity }}</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="surface-card shadow-2 p-3 border-round">
                            <div class="text-500 font-medium mb-2">Valor Total</div>
                            <div class="font-bold text-xl">{{ formatCurrency(totalValue) }}</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-2">
                        <div class="surface-card shadow-2 p-3 border-round">
                            <div class="text-500 font-medium mb-2">Stock Bajo</div>
                            <div class="font-bold text-xl text-yellow-500">{{ lowStockItems }}</div>
                        </div>
                    </div>
                    <div class="col-12 md:col-3">
                        <div class="surface-card shadow-2 p-3 border-round">
                            <div class="text-500 font-medium mb-2">Agotados</div>
                            <div class="font-bold text-xl text-red-500">{{ outOfStockItems }}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Filtros -->
                <div class="grid mt-4">
                    <div class="col-12 md:col-3 mb-3">
                        <div class="p-input-icon-left w-full">
                            <i class="pi pi-search"></i>
                            <input type="text" v-model="searchQuery" class="p-inputtext p-component w-full" placeholder="Buscar producto..." />
                        </div>
                    </div>
                    
                    <div class="col-12 md:col-2 mb-3">
                        <label for="warehouse-filter" class="block mb-2">Almacén</label>
                        <select id="warehouse-filter" v-model="warehouseFilter" class="p-inputtext p-component w-full">
                            <option v-for="option in warehouseOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="col-12 md:col-2 mb-3">
                        <label for="category-filter" class="block mb-2">Categoría</label>
                        <select id="category-filter" v-model="categoryFilter" class="p-inputtext p-component w-full">
                            <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="col-12 md:col-2 mb-3">
                        <label for="status-filter" class="block mb-2">Estado</label>
                        <select id="status-filter" v-model="stockStatusFilter" class="p-inputtext p-component w-full">
                            <option v-for="option in stockStatusOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="col-12 md:col-1 mb-3 flex align-items-end">
                        <button class="p-button p-component p-button-outlined w-full" @click="clearFilters">
                            <i class="pi pi-filter-slash"></i>
                        </button>
                    </div>
                </div>
                
                <div v-if="loading" class="flex justify-content-center mt-4">
                    <i class="pi pi-spin pi-spinner text-2xl"></i>
                </div>
                
                <div v-else-if="filteredStockItems.length === 0" class="text-center p-5">
                    <i class="pi pi-inbox text-4xl text-500 mb-3"></i>
                    <p>No hay productos que coincidan con los filtros</p>
                </div>
                
                <div v-else class="overflow-x-auto mt-4">
                    <table class="w-full">
                        <thead>
                            <tr>
                                <th class="text-left p-3 border-bottom-1 surface-border">Código</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Producto</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Categoría</th>
                                <th class="text-left p-3 border-bottom-1 surface-border">Almacén</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Cantidad</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Mínimo</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Precio Unit.</th>
                                <th class="text-right p-3 border-bottom-1 surface-border">Valor Total</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Estado</th>
                                <th class="text-center p-3 border-bottom-1 surface-border">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in filteredStockItems" :key="item.id" class="cursor-pointer hover:surface-200" @click="viewProductDetails(item)">
                                <td class="p-3 border-bottom-1 surface-border">{{ item.productCode }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ item.productName }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ item.category }}</td>
                                <td class="p-3 border-bottom-1 surface-border">{{ item.warehouse }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ item.quantity }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ item.minStock }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(item.unitPrice) }}</td>
                                <td class="text-right p-3 border-bottom-1 surface-border">{{ formatCurrency(item.totalValue) }}</td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <span class="px-2 py-1 text-xs border-round" :class="getStatusClass(item.status)">
                                        {{ getStatusLabel(item.status) }}
                                    </span>
                                </td>
                                <td class="text-center p-3 border-bottom-1 surface-border">
                                    <div class="flex justify-content-center">
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text mr-2" @click.stop="viewProductDetails(item)">
                                            <i class="pi pi-eye"></i>
                                        </button>
                                        <button class="p-button p-component p-button-icon-only p-button-rounded p-button-text" @click.stop="adjustStock(item, $event)">
                                            <i class="pi pi-pencil"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.cursor-pointer {
    cursor: pointer;
}

.overflow-x-auto {
    overflow-x: auto;
}
</style>
