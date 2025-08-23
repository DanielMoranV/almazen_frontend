<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProductsStore } from '@/stores/productsStore';
import { useWarehousesStore } from '@/stores/warehousesStore';
import { storeToRefs } from 'pinia';

// Props
const props = defineProps({
    showWarehouseFilter: {
        type: Boolean,
        default: true
    },
    autoSearch: {
        type: Boolean,
        default: true
    },
    debounceDelay: {
        type: Number,
        default: 300
    }
});

// Emits
const emit = defineEmits(['add-to-sale', 'view-details', 'search-results']);

// Stores
const productsStore = useProductsStore();
const warehousesStore = useWarehousesStore();

// Reactive data from stores
const { saleProductsList, isLoadingSaleProducts, getSaleSearchMessage, getSaleSearchTerm, getSelectedWarehouse, totalSaleProducts } = storeToRefs(productsStore);

// Local reactive data
const localSearchTerm = ref('');
const selectedWarehouse = ref(null);
const viewMode = ref('list'); // 'list' | 'cards'
const cardsPaginatorFirst = ref(0);
const cardsPaginatorRows = ref(12);

// Warehouses data
const warehouses = computed(() => warehousesStore.warehousesList || []);

// Computed for paginated products in cards view
const paginatedProducts = computed(() => {
    const start = cardsPaginatorFirst.value;
    const end = start + cardsPaginatorRows.value;
    return saleProductsList.value.slice(start, end);
});

// Methods
const onSearchInput = () => {
    if (props.autoSearch) {
        productsStore.searchProductsForSaleWithDebounce(localSearchTerm.value, selectedWarehouse.value, props.debounceDelay);
    }
};

const performSearch = () => {
    if (localSearchTerm.value.trim()) {
        productsStore.searchProductsForSale(localSearchTerm.value, selectedWarehouse.value);
    }
};

const clearSearch = () => {
    localSearchTerm.value = '';
    if (props.autoSearch) {
        productsStore.clearSaleSearch();
    }
};

const clearAll = () => {
    localSearchTerm.value = '';
    selectedWarehouse.value = null;
    productsStore.clearSaleSearch();
    cardsPaginatorFirst.value = 0;
};

const onWarehouseChange = () => {
    productsStore.setSelectedWarehouse(selectedWarehouse.value);
    if (localSearchTerm.value.trim()) {
        performSearch();
    }
};

const onCardsPageChange = (event) => {
    cardsPaginatorFirst.value = event.first;
};

// Helper methods
const getStockSeverity = (stock) => {
    if (stock <= 5) return 'danger';
    if (stock <= 20) return 'warning';
    return 'success';
};

const getBatchExpirationClass = (batch) => {
    if (batch.is_expired) return 'batch-expired';
    if (batch.days_to_expire <= 7) return 'batch-critical';
    if (batch.days_to_expire <= 30) return 'batch-warning';
    return 'batch-ok';
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const hasExpiringBatches = (productId) => {
    return productsStore.hasExpiringBatches(productId, 30);
};

// Watchers
watch([saleProductsList], () => {
    emit('search-results', {
        products: saleProductsList.value,
        total: totalSaleProducts.value,
        searchTerm: localSearchTerm.value,
        warehouse: selectedWarehouse.value
    });
});

// Lifecycle
onMounted(async () => {
    // Cargar almacenes si no están cargados
    if (warehouses.value.length === 0) {
        await warehousesStore.fetchWarehouses();
    }

    // Sincronizar estado inicial
    localSearchTerm.value = getSaleSearchTerm.value || '';
    selectedWarehouse.value = getSelectedWarehouse.value;
});
</script>

<template>
    <div class="product-sale-search">
        <!-- Header del componente -->
        <div class="search-header">
            <div class="header-content">
                <div class="title-section">
                    <i class="pi pi-search text-2xl text-blue-600"></i>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800 dark:text-white">Búsqueda de Productos para Venta</h2>
                        <p class="text-sm text-gray-600 dark:text-gray-300">Busque por código de barras, SKU o nombre del producto</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Formulario de búsqueda -->
        <div class="search-form">
            <div class="search-inputs">
                <!-- Campo de búsqueda principal -->
                <div class="search-field">
                    <label for="search-input" class="search-label"> Término de búsqueda </label>
                    <div class="input-wrapper">
                        <i class="pi pi-search input-icon"></i>
                        <InputText id="search-input" v-model="localSearchTerm" placeholder="Código de barras, SKU o nombre..." class="search-input" @input="onSearchInput" @keyup.enter="performSearch" :disabled="isLoadingSaleProducts" />
                        <Button v-if="localSearchTerm" icon="pi pi-times" class="clear-btn" @click="clearSearch" :disabled="isLoadingSaleProducts" />
                    </div>
                </div>

                <!-- Selector de almacén -->
                <div class="warehouse-field" v-if="showWarehouseFilter">
                    <label for="warehouse-select" class="search-label"> Filtrar por almacén </label>
                    <Select
                        id="warehouse-select"
                        v-model="selectedWarehouse"
                        :options="warehouses"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Todos los almacenes"
                        class="warehouse-dropdown"
                        @change="onWarehouseChange"
                        :disabled="isLoadingSaleProducts"
                        showClear
                    />
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="search-actions">
                <Button label="Buscar" icon="pi pi-search" class="search-btn" @click="performSearch" :loading="isLoadingSaleProducts" :disabled="!localSearchTerm.trim()" />
                <Button label="Limpiar" icon="pi pi-refresh" class="clear-all-btn" @click="clearAll" :disabled="isLoadingSaleProducts" outlined />
            </div>
        </div>

        <!-- Mensaje de estado -->
        <div v-if="getSaleSearchMessage" class="search-message">
            <Message :severity="saleProductsList.length > 0 ? 'success' : 'info'" :closable="false">
                {{ getSaleSearchMessage }}
            </Message>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoadingSaleProducts" class="loading-container">
            <ProgressSpinner size="50" strokeWidth="4" />
            <p class="loading-text">Buscando productos disponibles...</p>
        </div>

        <!-- Resultados de búsqueda -->
        <div v-if="!isLoadingSaleProducts && saleProductsList.length > 0" class="search-results">
            <div class="results-header">
                <h3 class="results-title">Productos Encontrados ({{ totalSaleProducts }})</h3>
                <div class="results-actions">
                    <Button icon="pi pi-list" label="Vista Lista" :class="{ 'p-button-outlined': viewMode !== 'list' }" @click="viewMode = 'list'" size="small" />
                    <Button icon="pi pi-th-large" label="Vista Tarjetas" :class="{ 'p-button-outlined': viewMode !== 'cards' }" @click="viewMode = 'cards'" size="small" />
                </div>
            </div>

            <!-- Vista de Lista -->
            <DataTable v-if="viewMode === 'list'" :value="saleProductsList" :paginator="true" :rows="10" :loading="isLoadingSaleProducts" class="products-table" dataKey="id" :rowHover="true" :showGridlines="true">
                <Column field="name" header="Producto" :sortable="true">
                    <template #body="{ data }">
                        <div class="product-info">
                            <div class="product-main">
                                <strong>{{ data.name }}</strong>
                                <div class="product-codes">
                                    <span v-if="data.sku" class="code-badge sku">SKU: {{ data.sku }}</span>
                                    <span v-if="data.barcode" class="code-badge barcode">{{ data.barcode }}</span>
                                </div>
                            </div>
                            <Badge v-if="hasExpiringBatches(data.id)" value="Próximo a vencer" severity="warning" class="mt-1" />
                        </div>
                    </template>
                </Column>

                <Column header="Stock Disponible" :sortable="false">
                    <template #body="{ data }">
                        <div class="stock-info">
                            <div v-for="warehouse in data.available_stock" :key="warehouse.warehouse_id" class="warehouse-stock">
                                <div class="warehouse-header">
                                    <strong>{{ warehouse.warehouse_name }}</strong>
                                    <Badge :value="warehouse.total_stock + ' unidades'" :severity="getStockSeverity(warehouse.total_stock)" />
                                </div>

                                <!-- Mostrar lotes si el producto los requiere -->
                                <div v-if="data.requires_batches && warehouse.batches" class="batches-info">
                                    <div v-for="batch in warehouse.batches.slice(0, 3)" :key="batch.batch_id" class="batch-item">
                                        <span class="batch-code">{{ batch.batch_code }}</span>
                                        <span class="batch-qty">{{ batch.available_quantity }}u</span>
                                        <span v-if="batch.expiration_date" :class="getBatchExpirationClass(batch)">
                                            {{ formatDate(batch.expiration_date) }}
                                        </span>
                                        <span class="batch-price">${{ batch.sale_price }}</span>
                                    </div>
                                    <small v-if="warehouse.batches.length > 3" class="more-batches"> +{{ warehouse.batches.length - 3 }} lotes más </small>
                                </div>

                                <!-- Mostrar precio si no requiere lotes -->
                                <div v-else class="simple-stock">
                                    <span class="stock-price">${{ warehouse.sale_price }}</span>
                                    <span class="stock-cost">Costo: ${{ warehouse.unit_cost }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column header="Acciones" :exportable="false">
                    <template #body="{ data }">
                        <div class="action-buttons">
                            <Button icon="pi pi-plus" v-tooltip.top="'Agregar a venta'" @click="$emit('add-to-sale', data)" size="small" class="add-btn" />
                            <Button icon="pi pi-eye" v-tooltip.top="'Ver detalles'" @click="$emit('view-details', data)" outlined size="small" />
                        </div>
                    </template>
                </Column>
            </DataTable>

            <!-- Vista de Tarjetas -->
            <div v-else class="products-cards">
                <div v-for="product in paginatedProducts" :key="product.id" class="product-card">
                    <div class="card-header">
                        <h4 class="product-name">{{ product.name }}</h4>
                        <Badge v-if="hasExpiringBatches(product.id)" value="Próximo a vencer" severity="warning" />
                    </div>

                    <div class="card-codes">
                        <span v-if="product.sku" class="code-badge sku">SKU: {{ product.sku }}</span>
                        <span v-if="product.barcode" class="code-badge barcode">{{ product.barcode }}</span>
                    </div>

                    <div class="card-stock">
                        <div v-for="warehouse in product.available_stock" :key="warehouse.warehouse_id" class="warehouse-card-stock">
                            <div class="warehouse-info">
                                <span class="warehouse-name">{{ warehouse.warehouse_name }}</span>
                                <Badge :value="warehouse.total_stock + ' unidades'" :severity="getStockSeverity(warehouse.total_stock)" />
                            </div>

                            <div v-if="product.requires_batches && warehouse.batches" class="batch-summary">
                                <div class="batch-info">
                                    <span>{{ warehouse.batches.length }} lote(s)</span>
                                    <span class="price-range">
                                        ${{ Math.min(...warehouse.batches.map((b) => b.sale_price)) }}
                                        <span v-if="warehouse.batches.length > 1"> - ${{ Math.max(...warehouse.batches.map((b) => b.sale_price)) }} </span>
                                    </span>
                                </div>
                            </div>
                            <div v-else class="simple-price">
                                <span class="sale-price">${{ warehouse.sale_price }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="card-actions">
                        <Button label="Agregar a venta" icon="pi pi-plus" @click="$emit('add-to-sale', product)" class="add-to-sale-btn" size="small" />
                        <Button icon="pi pi-eye" @click="$emit('view-details', product)" outlined size="small" />
                    </div>
                </div>
            </div>

            <!-- Paginación para vista de tarjetas -->
            <Paginator v-if="viewMode === 'cards'" :first="cardsPaginatorFirst" :rows="cardsPaginatorRows" :totalRecords="totalSaleProducts" @page="onCardsPageChange" class="cards-paginator" />
        </div>

        <!-- Estado vacío -->
        <div v-if="!isLoadingSaleProducts && !getSaleSearchMessage && saleProductsList.length === 0 && localSearchTerm" class="empty-state">
            <i class="pi pi-search empty-icon"></i>
            <h3>No se encontraron productos</h3>
            <p>Pruebe con diferentes términos de búsqueda</p>
            <Button label="Limpiar búsqueda" icon="pi pi-refresh" @click="clearAll" outlined />
        </div>
    </div>
</template>

<style scoped>
/* Contenedor principal */
.product-sale-search {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}

/* Header del componente */
.search-header {
    @apply bg-gradient-to-r from-blue-500 to-blue-600 p-6;
}

.header-content {
    @apply flex items-center justify-between;
}

.title-section {
    @apply flex items-center gap-4;
}

.title-section i {
    @apply w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-sm;
}

.title-section h2 {
    @apply text-white;
}

.title-section p {
    @apply text-white/80;
}

/* Formulario de búsqueda */
.search-form {
    @apply p-6 border-b border-gray-200 dark:border-gray-700;
}

.search-inputs {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6 mb-6;
}

.search-field,
.warehouse-field {
    @apply space-y-2;
}

.search-label {
    @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.input-wrapper {
    @apply relative;
}

.input-icon {
    @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400;
}

.search-input {
    @apply pl-10 pr-12 w-full;
}

.clear-btn {
    @apply absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 bg-transparent border-0 text-gray-400 hover:text-gray-600;
}

.warehouse-dropdown {
    @apply w-full;
}

.search-actions {
    @apply flex gap-3;
}

.search-btn {
    @apply bg-blue-600 hover:bg-blue-700;
}

.clear-all-btn {
    @apply border-gray-300 text-gray-700 hover:bg-gray-50;
}

/* Mensaje de estado */
.search-message {
    @apply px-6;
}

/* Loading */
.loading-container {
    @apply flex flex-col items-center justify-center py-12 px-6;
}

.loading-text {
    @apply mt-4 text-gray-600 dark:text-gray-300;
}

/* Resultados */
.search-results {
    @apply p-6;
}

.results-header {
    @apply flex items-center justify-between mb-6;
}

.results-title {
    @apply text-lg font-semibold text-gray-800 dark:text-white;
}

.results-actions {
    @apply flex gap-2;
}

/* Vista de tabla */
.products-table {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.product-info {
    @apply space-y-2;
}

.product-main {
    @apply space-y-1;
}

.product-codes {
    @apply flex gap-2;
}

.code-badge {
    @apply px-2 py-1 text-xs font-mono rounded;
}

.code-badge.sku {
    @apply bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100;
}

.code-badge.barcode {
    @apply bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100;
}

/* Stock info */
.stock-info {
    @apply space-y-3;
}

.warehouse-stock {
    @apply border border-gray-200 dark:border-gray-600 rounded-lg p-3;
}

.warehouse-header {
    @apply flex items-center justify-between mb-2;
}

.batches-info {
    @apply space-y-1;
}

.batch-item {
    @apply flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded;
}

.batch-code {
    @apply font-mono text-xs;
}

.batch-qty {
    @apply font-semibold;
}

.batch-expired {
    @apply text-red-600;
}

.batch-critical {
    @apply text-red-500;
}

.batch-warning {
    @apply text-yellow-600;
}

.batch-ok {
    @apply text-green-600;
}

.batch-price {
    @apply font-semibold text-green-600;
}

.more-batches {
    @apply text-gray-500 italic;
}

.simple-stock {
    @apply flex items-center justify-between;
}

.stock-price {
    @apply font-semibold text-green-600;
}

.stock-cost {
    @apply text-sm text-gray-500;
}

/* Action buttons */
.action-buttons {
    @apply flex gap-2;
}

.add-btn {
    @apply bg-green-600 hover:bg-green-700 border-green-600;
}

/* Vista de tarjetas */
.products-cards {
    @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.product-card {
    @apply border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-lg transition-shadow;
}

.card-header {
    @apply flex items-start justify-between mb-3;
}

.product-name {
    @apply font-semibold text-gray-800 dark:text-white text-sm;
}

.card-codes {
    @apply flex flex-wrap gap-2 mb-3;
}

.card-stock {
    @apply space-y-2 mb-4;
}

.warehouse-card-stock {
    @apply border border-gray-200 dark:border-gray-600 rounded p-2;
}

.warehouse-info {
    @apply flex items-center justify-between mb-2;
}

.warehouse-name {
    @apply text-sm font-medium;
}

.batch-summary,
.simple-price {
    @apply flex items-center justify-between text-sm;
}

.price-range {
    @apply font-semibold text-green-600;
}

.sale-price {
    @apply font-semibold text-green-600;
}

.card-actions {
    @apply flex gap-2;
}

.add-to-sale-btn {
    @apply flex-1 bg-green-600 hover:bg-green-700 text-white;
}

/* Paginación de tarjetas */
.cards-paginator {
    @apply mt-6;
}

/* Estado vacío */
.empty-state {
    @apply flex flex-col items-center justify-center py-16 px-6 text-center;
}

.empty-icon {
    @apply text-6xl text-gray-300 mb-4;
}

.empty-state h3 {
    @apply text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2;
}

.empty-state p {
    @apply text-gray-500 dark:text-gray-400 mb-6;
}

/* Responsive */
@media (max-width: 768px) {
    .search-inputs {
        @apply grid-cols-1;
    }

    .search-actions {
        @apply flex-col;
    }

    .results-header {
        @apply flex-col items-start gap-4;
    }

    .results-actions {
        @apply w-full justify-center;
    }

    .products-cards {
        @apply grid-cols-1;
    }
}
</style>
