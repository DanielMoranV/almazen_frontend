<script setup>
import { useProductsStore } from '@/stores/productsStore';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import ProductGalleryDialog from './componentsCatalogs/ProductGalleryDialog.vue';

const toast = useToast();
const productsStore = useProductsStore();

const searchQuery = ref('');
const selectedProduct = ref(null);
const showGalleryDialog = ref(false);

const isLoading = computed(() => productsStore.isLoading);
const products = computed(() => productsStore.products);

// Filtered products based on search
const filteredProducts = computed(() => {
    if (!searchQuery.value) return products.value;

    const query = searchQuery.value.toLowerCase();
    return products.value.filter(
        (product) =>
            product.name?.toLowerCase().includes(query) ||
            product.sku?.toLowerCase().includes(query) ||
            product.barcode?.toLowerCase().includes(query) ||
            product.description?.toLowerCase().includes(query)
    );
});

onMounted(async () => {
    await loadProducts();
});

/**
 * Load products
 */
const loadProducts = async () => {
    try {
        await productsStore.fetchProducts();
        
        // Debug: Log products data to see what we're receiving
        console.log('=== CATALOGS DEBUG ===');
        console.log('Total products:', products.value.length);
        console.log('First product sample:', products.value[0]);
        console.log('Product fields:', products.value[0] ? Object.keys(products.value[0]) : 'No products');
        console.log('=====================');
    } catch (error) {
        console.error('[Catalogs] Error loading products:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar productos',
            life: 4000
        });
    }
};

/**
 * Open gallery dialog for product
 */
const openGallery = (product) => {
    selectedProduct.value = product;
    showGalleryDialog.value = true;
};

/**
 * Handle gallery updated
 */
const handleGalleryUpdated = () => {
    // Optionally reload products to get updated image counts
    // loadProducts();
};
</script>

<template>
    <div class="catalogs-page">
        <Toast />

        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-images"></i>
                        Catálogos de Productos
                    </h1>
                    <p class="page-subtitle">Gestiona las galerías de imágenes de tus productos</p>
                </div>
            </div>
        </div>

        <!-- Content Container -->
        <div class="content-container">
            <!-- Loading State -->
            <div v-if="isLoading" class="loading-state">
                <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                <p class="loading-text">Cargando productos...</p>
            </div>

            <!-- Products Table -->
            <div v-else class="products-section">
                <!-- Toolbar -->
                <div class="toolbar">
                    <div class="search-container">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <InputText v-model="searchQuery" placeholder="Buscar productos..." class="search-input" />
                        </span>
                    </div>
                    <div class="toolbar-actions">
                        <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" @click="loadProducts" :loading="isLoading" outlined />
                    </div>
                </div>

                <!-- Data Table -->
                <DataTable :value="filteredProducts" paginator :rows="20" :rowsPerPageOptions="[10, 20, 50, 100]" dataKey="id" :loading="isLoading" stripedRows responsiveLayout="scroll" class="products-table">
                    <template #empty>
                        <div class="empty-state">
                            <i class="pi pi-inbox"></i>
                            <p>No se encontraron productos</p>
                        </div>
                    </template>

                    <!-- Image Column -->
                    <Column header="Imagen" style="width: 100px">
                        <template #body="{ data }">
                            <div class="product-image-cell">
                                <img v-if="data.image_url" :src="data.image_url" :alt="data.name" class="product-thumbnail" />
                                <div v-else class="no-image">
                                    <i class="pi pi-image"></i>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <!-- Product Name Column -->
                    <Column header="Producto" sortable field="name" style="min-width: 200px">
                        <template #body="{ data }">
                            <div class="product-info-cell">
                                <p class="product-name">{{ data.name }}</p>
                            </div>
                        </template>
                    </Column>

                    <!-- Product Code Column -->
                    <Column header="SKU" sortable field="sku" style="min-width: 120px">
                        <template #body="{ data }">
                            <span class="product-code-badge">{{ data.sku || 'N/A' }}</span>
                        </template>
                    </Column>

                    <!-- Brand Column -->
                    <Column header="Marca" sortable field="brand" style="min-width: 120px">
                        <template #body="{ data }">
                            <span class="brand-text">{{ data.brand || 'Sin marca' }}</span>
                        </template>
                    </Column>

                    <!-- Description Column -->
                    <Column header="Descripción" field="description" style="min-width: 200px">
                        <template #body="{ data }">
                            <p class="description-text">{{ data.description || 'Sin descripción' }}</p>
                        </template>
                    </Column>

                    <!-- Actions Column -->
                    <Column header="Acciones" style="width: 150px">
                        <template #body="{ data }">
                            <div class="action-buttons">
                                <Button icon="pi pi-images" label="Galería" severity="info" size="small" @click="openGallery(data)" outlined />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Gallery Dialog -->
        <ProductGalleryDialog v-model:visible="showGalleryDialog" :product="selectedProduct" @gallery-updated="handleGalleryUpdated" />
    </div>
</template>

<style scoped>
.catalogs-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    min-height: 100vh;
}

/* Page Header */
.page-header {
    @apply relative overflow-hidden mb-6 rounded-xl;
    background: linear-gradient(135deg, #059669 0%, #10b981 50%, #3b82f6 100%);
    padding: 1.5rem;
    box-shadow:
        0 4px 12px -2px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.05);
}

.header-content {
    @apply relative z-10;
}

.title-section {
    @apply text-center;
}

.page-title {
    @apply flex items-center justify-center gap-2 text-2xl font-bold text-white mb-1;
}

.page-title i {
    @apply text-2xl;
}

.page-subtitle {
    @apply text-white/90 text-sm;
}

/* Content Container */
.content-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6;
}

/* Loading State */
.loading-state {
    @apply flex flex-col items-center justify-center py-12 gap-4;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400;
}

/* Products Section */
.products-section {
    @apply flex flex-col gap-6;
}

/* Toolbar */
.toolbar {
    @apply flex justify-between items-center gap-4 flex-wrap;
}

.search-container {
    @apply flex-1 min-w-64;
}

.search-input {
    @apply w-full;
}

.toolbar-actions {
    @apply flex gap-2;
}

/* Table Styles */
.products-table {
    @apply border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden;
}

.product-image-cell {
    @apply flex items-center justify-center;
}

.product-thumbnail {
    @apply w-16 h-16 object-cover rounded-lg;
}

.no-image {
    @apply w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg;
    color: var(--text-color-secondary);
}

.product-info-cell {
    @apply flex flex-col gap-1;
}

.product-name {
    @apply font-semibold text-gray-900 dark:text-gray-100 m-0;
}

.product-code-badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200;
}

.brand-text {
    @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.category-badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300;
}

.description-text {
    @apply text-sm text-gray-700 dark:text-gray-300 m-0 line-clamp-2;
}

.action-buttons {
    @apply flex gap-2;
}

/* Empty State */
.empty-state {
    @apply flex flex-col items-center justify-center py-12 gap-4 text-gray-500 dark:text-gray-400;
}

.empty-state i {
    @apply text-4xl;
}

/* Responsive */
@media (max-width: 768px) {
    .catalogs-page {
        @apply p-4;
    }

    .toolbar {
        @apply flex-col items-stretch;
    }

    .search-container {
        @apply w-full;
    }

    .toolbar-actions {
        @apply w-full;
    }

    .toolbar-actions .p-button {
        @apply flex-1;
    }
}
</style>
