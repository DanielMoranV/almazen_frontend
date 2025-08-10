<script setup>
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';
import { useProductsStore } from '@/stores/productsStore';
import ProductsFormDialog from '@/views/inventory/products/componentsProducts/ProductFormDialog.vue';
import ProductsTable from '@/views/inventory/products/componentsProducts/ProductsTable.vue';
import ProductToolbar from '@/views/inventory/products/componentsProducts/ProductToolbar.vue';
import ProductImportDialog from '@/views/inventory/products/componentsProducts/ProductImportDialog.vue';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const toast = useToast();
const productsStore = useProductsStore();

// Estados locales
const selectedProduct = ref(null);
const showProductDialog = ref(false);
const showDeleteDialog = ref(false);
const showImportDialog = ref(false);
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

const openImportDialog = () => {
    showImportDialog.value = true;
};

const handleProductsImported = async (result) => {
    // Recargar productos después de la importación exitosa
    await productsStore.fetchProducts();
    showSuccess('Importación completada', 'Los productos han sido actualizados');
};

const handleViewProducts = () => {
    // Opcional: implementar filtro o navegación específica
    // Por ahora simplemente actualizar la lista
    handleRefresh();
};

// Helpers para manejo de respuestas API
const handleApiErrors = (store) => {
    if (store.validationErrors && store.validationErrors.length > 0) {
        store.validationErrors.forEach((err) => {
            toast.add({
                severity: 'error',
                summary: 'Error de validación',
                detail: err,
                life: 4000
            });
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
    <div class="products-page">
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal Mejorado -->
        <ProductToolbar :total-products="totalProducts" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" @open-import="openImportDialog" />

        <!-- Área Principal de Contenido con Animaciones -->
        <div class="content-wrapper">
            <!-- Estado Vacío Mejorado -->
            <transition name="fade" appear>
                <div v-if="!isLoading && !hasProducts" class="empty-state">
                    <div class="empty-content">
                        <div class="empty-icon">
                            <i class="pi pi-box"></i>
                        </div>
                        <h3 class="empty-title">
                            {{ productsStore.getCurrentSearchTerm ? 'No se encontraron productos' : 'Aún no tienes productos' }}
                        </h3>
                        <p class="empty-description">
                            {{ productsStore.getCurrentSearchTerm ? 'Intenta con otros términos de búsqueda o limpia los filtros.' : 'Crea tu primer producto para empezar a gestionar tu inventario.' }}
                        </p>
                        <div class="empty-actions">
                            <Button v-if="!productsStore.getCurrentSearchTerm" icon="pi pi-plus" label="Agregar Producto" class="primary-action-btn" @click="openCreateDialog" />
                            <Button v-else icon="pi pi-times" label="Limpiar Búsqueda" class="secondary-action-btn" @click="productsStore.clearSearch()" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Tabla de Productos con Animaciones -->
            <transition name="slide-up" appear>
                <div v-if="!isLoading && hasProducts" class="table-container">
                    <ProductsTable :products="productsStore.productsList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
                </div>
            </transition>

            <!-- Estado de Carga Mejorado -->
            <transition name="fade" appear>
                <div v-if="isLoading" class="loading-state">
                    <div class="loading-content">
                        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="3" fill="transparent" animationDuration="1s" />
                        <p class="loading-text">Cargando productos...</p>
                    </div>
                </div>
            </transition>
        </div>

        <!-- Diálogos -->
        <ProductsFormDialog v-model:visible="showProductDialog" :product="selectedProduct" :loading="isLoading" @submit="handleProductSubmit" />

        <ProductImportDialog v-model:visible="showImportDialog" @products-imported="handleProductsImported" @view-products="handleViewProducts" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProduct?.name || ''" @confirm="handleProductDelete" />
    </div>
</template>

<style scoped>
/* Contenedor principal de la página de productos */
.products-page {
    @apply min-h-screen;
}

/* Contenedor de contenido con espaciado y diseño mejorado */
.content-wrapper {
    @apply mt-6 space-y-6;
}

/* Contenedor de tabla con efecto de elevación */
.table-container {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Estado vacío mejorado con diseño centrado */
.empty-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-green-200 dark:border-gray-600;
}

.empty-content {
    @apply text-center px-8 py-12 max-w-md;
}

/* Contenedor del ícono mejorado */
.empty-icon {
    @apply mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-500 shadow-lg;
}

/* Estilo del ícono con animación */
.empty-icon i {
    @apply text-4xl text-white;
    animation: bounce 2s infinite;
}

/* Título del estado vacío mejorado */
.empty-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4;
    background: linear-gradient(135deg, #059669, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Descripción del estado vacío */
.empty-description {
    @apply text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed;
}

/* Contenedor de acciones en estado vacío */
.empty-actions {
    @apply flex justify-center gap-4;
}

/* Botón de acción principal */
.primary-action-btn {
    @apply bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border-none text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105;
}

/* Botón de acción secundaria */
.secondary-action-btn {
    @apply bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-300;
}

/* Estado de carga mejorado */
.loading-state {
    @apply flex items-center justify-center min-h-96 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl;
}

.loading-content {
    @apply text-center px-8 py-12;
}

.loading-text {
    @apply text-gray-600 dark:text-gray-400 mt-4 text-lg font-medium;
}

/* Animaciones de transición */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-up-enter-active {
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-enter-from {
    transform: translateY(20px);
    opacity: 0;
}

/* Animaciones de CSS */
@keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .empty-content {
        @apply px-4 py-8;
    }

    .empty-title {
        @apply text-2xl;
    }

    .empty-description {
        @apply text-base;
    }

    .empty-actions {
        @apply flex-col gap-3;
    }

    .primary-action-btn,
    .secondary-action-btn {
        @apply w-full;
    }
}

/* Mejoras adicionales para modo oscuro */
@media (prefers-color-scheme: dark) {
    .table-container {
        box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.3),
            0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>
