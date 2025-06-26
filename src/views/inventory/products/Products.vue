<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useProductsStore } from '@/stores/productsStore';
import ProductsFormDialog from '@/views/inventory/products/componentsProducts/ProductFormDialog.vue';
import ProductsTable from '@/views/inventory/products/componentsProducts/ProductsTable.vue';
import ProductToolbar from '@/views/inventory/products/componentsProducts/ProductToolbar.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const productsStore = useProductsStore();

// Estados locales
const selectedProduct = ref(null);
const showProductDialog = ref(false);
const showDeleteDialog = ref(false);
const isCreating = ref(false);

// Estados computados del store
const totalProducts = computed(() => productsStore.totalProducts);
const isLoading = computed(() => productsStore.isLoadingProducts);
const hasProducts = computed(() => productsStore.productsList.length > 0);

// Inicialización
onMounted(async () => {
    await loadProducts();
});

// Gestión de carga inicial
const loadProducts = async () => {
    await productsStore.fetchProducts();
    if (productsStore.success) {
        showSuccess('Productos cargados', 'Lista actualizada correctamente');
    }
};

// Gestión de productos
const openCreateDialog = () => {
    selectedProduct.value = null;
    isCreating.value = true;
    showProductDialog.value = true;
};

const openEditDialog = (product) => {
    selectedProduct.value = { ...product };
    isCreating.value = false;
    showProductDialog.value = true;
};

const openDeleteDialog = (product) => {
    selectedProduct.value = product;
    showDeleteDialog.value = true;
};

const handleProductSubmit = async (productData) => {
    const action = isCreating.value ? productsStore.createProduct : productsStore.updateProduct;
    await action(productData);

    if (productsStore.success) {
        const message = isCreating.value ? 'Producto creado exitosamente' : 'Producto actualizado exitosamente';
        showSuccess(message, productsStore.message);
        showProductDialog.value = false;
        // Recargar la página actual para mostrar el nuevo/editado producto
        await productsStore.fetchProducts(productsStore.getSearchParams);
    } else {
        handleApiErrors(productsStore);
    }
};

const handleProductDelete = async () => {
    await productsStore.deleteProduct(selectedProduct.value.id);

    if (productsStore.success) {
        showSuccess('Producto eliminado', productsStore.message);
        showDeleteDialog.value = false;
        // Recargar para reflejar la eliminación
        await productsStore.fetchProducts();
    } else {
        handleApiErrors(productsStore);
        showDeleteDialog.value = false;
    }
};

// Manejadores del toolbar
const handleRefresh = async () => {
    await productsStore.fetchProducts();
    showSuccess('Datos actualizados', 'Lista de productos actualizada');
};

const handleSearch = (searchTerm) => {
    // La búsqueda ya se maneja en el toolbar/store
    console.log('Búsqueda realizada:', searchTerm);
};

// Helpers para manejo de respuestas API
const handleApiResponse = (store, successMessage = '') => {
    if (store.success) {
        if (successMessage) {
            showSuccess('Éxito', successMessage);
        }
    } else {
        handleApiErrors(store);
    }
};

const handleApiErrors = (store) => {
    if (store.validationErrors && store.validationErrors.length > 0) {
        store.validationErrors.forEach((err) => {
            toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
        });
    } else {
        showError('Error', store.message || 'Ha ocurrido un error inesperado');
    }
};

const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (summary, detail) => {
    toast.add({ severity: 'error', summary, detail, life: 4000 });
};
</script>
<template>
    <div class="products-page-container">
        <!-- Toast y Confirmaciones -->
        <Toast position="top-right" group="tr" />
        <ConfirmDialog group="headless" class="sakai-confirm-dialog">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="custom-confirm-dialog">
                    <div class="confirm-header">
                        <i class="pi pi-exclamation-triangle text-yellow-500 text-2xl"></i>
                        <span class="confirm-title">Confirmar acción</span>
                    </div>
                    <div class="confirm-content">
                        <p>{{ message }}</p>
                    </div>
                    <div class="confirm-actions">
                        <Button 
                            label="Cancelar" 
                            @click="rejectCallback" 
                            class="p-button-text p-button-secondary" 
                        />
                        <Button 
                            label="Confirmar" 
                            @click="acceptCallback" 
                            class="p-button-danger" 
                        />
                    </div>
                </div>
            </template>
        </ConfirmDialog>

        <!-- Toolbar Principal -->
        <ProductToolbar :total-products="totalProducts" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" @search="handleSearch" />

        <!-- Área Principal de Contenido -->
        <Card class="content-section">
            <template #content>
                <!-- Estado Vacío -->
                <div v-if="!isLoading && !hasProducts" class="empty-state">
                    <div class="empty-icon">
                        <i class="pi pi-box"></i>
                    </div>
                    <h3 class="empty-title">
                        {{ productsStore.getCurrentSearchTerm ? 'No se encontraron productos' : 'No hay productos registrados' }}
                    </h3>
                    <p class="empty-description">
                        {{ productsStore.getCurrentSearchTerm ? 'Intenta con otros términos de búsqueda o verifica la ortografía.' : 'Comienza agregando tu primer producto al inventario.' }}
                    </p>
                    <Button v-if="!productsStore.getCurrentSearchTerm" icon="pi pi-plus" label="Agregar Primer Producto" class="p-button-success" @click="openCreateDialog" />
                    <Button v-else icon="pi pi-times" label="Limpiar Búsqueda" class="p-button-outlined" @click="productsStore.clearSearch()" />
                </div>

                <!-- Tabla de Productos -->
                <div v-else class="table-container">
                    <ProductsTable :products="productsStore.productsList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </template>
        </Card>

        <!-- Diálogos -->
        <ProductsFormDialog v-model:visible="showProductDialog" :product="selectedProduct" :loading="isLoading" @submit="handleProductSubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProduct?.name || ''" @confirm="handleProductDelete" />
    </div>
</template>

<style scoped>
/* ===== MAIN CONTAINER ===== */
.products-page-container {
    @apply p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto;
    background: var(--surface-ground);
    min-height: 100vh;
    transition: all 0.3s ease;
}

/* ===== CONTENT SECTION ===== */
.content-section {
    @apply min-h-[500px] shadow-xl;
    border-radius: 1rem;
    background: var(--surface-0);
    border: 1px solid var(--surface-border);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;
}

.content-section:hover {
    transform: translateY(-2px);
    box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.15), 0 15px 15px -5px rgba(0, 0, 0, 0.06);
}

.table-container {
    @apply -m-6;
    border-radius: 1rem;
    overflow: hidden;
}

/* ===== EMPTY STATE ===== */
.empty-state {
    @apply text-center py-16 px-6;
    background: var(--surface-100);
    border-radius: 1rem;
    margin: 1.5rem;
}

.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full;
    background: var(--primary-50);
    border: 3px solid var(--primary-200);
    box-shadow: 0 8px 32px rgba(var(--primary), 0.15);
    animation: pulse 2s infinite;
}

.empty-icon i {
    @apply text-4xl;
    color: var(--primary-500);
    text-shadow: 0 2px 4px rgba(var(--primary), 0.2);
}

.empty-title {
    @apply text-2xl font-bold mb-3;
    color: var(--text-color);
}

.empty-description {
    @apply mb-8 max-w-lg mx-auto text-lg leading-relaxed;
    color: var(--text-color-secondary);
    font-weight: 500;
}

/* ===== ANIMATIONS ===== */
@keyframes pulse {
    0%, 100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.05);
        opacity: 0.8;
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.content-section {
    animation: fadeInUp 0.6s ease-out;
}

/* ===== BUTTON ENHANCEMENTS ===== */
:deep(.p-button-success) {
    background: var(--green-500);
    border-color: var(--green-500);
    box-shadow: 0 8px 25px rgba(var(--green), 0.3);
    font-weight: 600;
    letter-spacing: 0.025em;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.p-button-success:hover) {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(var(--green), 0.4);
    background: var(--green-600);
    border-color: var(--green-600);
}

:deep(.p-button-outlined) {
    border: 2px solid var(--primary-500);
    color: var(--primary-500);
    background: rgba(var(--primary), 0.05);
    font-weight: 600;
    transition: all 0.3s ease;
}

:deep(.p-button-outlined:hover) {
    background: var(--primary-500);
    color: var(--primary-color-text);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(var(--primary), 0.25);
}

/* ===== CARD ENHANCEMENTS ===== */
:deep(.p-card) {
    border: none;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

:deep(.p-card-content) {
    padding: 2rem;
}

/* PrimeVue automaticamente maneja el modo oscuro con CSS variables */

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 640px) {
    .products-page-container {
        @apply p-3;
    }
    
    .empty-state {
        @apply py-12 px-4;
    }
    
    .empty-icon {
        @apply w-16 h-16 mb-4;
    }
    
    .empty-icon i {
        @apply text-3xl;
    }
    
    .empty-title {
        @apply text-xl;
    }
    
    .empty-description {
        @apply text-base;
    }
    
    :deep(.p-card-content) {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .products-page-container {
        @apply p-2;
    }
    
    .content-section {
        @apply min-h-[400px];
    }
}

/* ===== CUSTOM CONFIRM DIALOG ===== */
:deep(.custom-confirm-dialog) {
    @apply bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden;
    max-width: 400px;
    animation: fadeInScale 0.3s ease-out;
}

.confirm-header {
    @apply flex items-center gap-3 p-6 bg-gradient-to-r from-yellow-50 to-red-50 border-b border-gray-200;
}

.confirm-title {
    @apply text-lg font-bold text-gray-900;
}

.confirm-content {
    @apply p-6 text-gray-700;
}

.confirm-actions {
    @apply flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200;
}

@keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@media (prefers-color-scheme: dark) {
    :deep(.custom-confirm-dialog) {
        @apply bg-gray-800 border-gray-600;
    }
    
    .confirm-header {
        @apply bg-gradient-to-r from-yellow-900/20 to-red-900/20 border-gray-600;
    }
    
    .confirm-title {
        @apply text-gray-100;
    }
    
    .confirm-content {
        @apply text-gray-300;
    }
    
    .confirm-actions {
        @apply bg-gray-700/50 border-gray-600;
    }
}
</style>
