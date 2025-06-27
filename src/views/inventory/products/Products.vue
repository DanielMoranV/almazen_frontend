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
    console.log(productsStore.productsList);
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

// Helpers para manejo de respuestas API
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
    <div>
        <!-- Toast y Confirmaciones -->
        <Toast />
        <ConfirmDialog />

        <!-- Toolbar Principal -->
        <ProductToolbar :total-products="totalProducts" :is-loading="isLoading" @refresh="handleRefresh" @create="openCreateDialog" />

        <!-- Área Principal de Contenido -->
        <div class="content-wrapper">
            <!-- Estado Vacío -->
            <div v-if="!isLoading && !hasProducts" class="empty-state">
                <div class="empty-icon">
                    <i class="pi pi-box"></i>
                </div>
                <h3 class="empty-title">
                    {{ productsStore.getCurrentSearchTerm ? 'No se encontraron productos' : 'Aún no tienes productos' }}
                </h3>
                <p class="empty-description">
                    {{ productsStore.getCurrentSearchTerm ? 'Intenta con otros términos de búsqueda o limpia los filtros.' : 'Crea tu primer producto para empezar a gestionar tu inventario.' }}
                </p>
                <Button v-if="!productsStore.getCurrentSearchTerm" icon="pi pi-plus" label="Agregar Producto" class="p-button-success" @click="openCreateDialog" />
                <Button v-else icon="pi pi-times" label="Limpiar Búsqueda" class="p-button-outlined" @click="productsStore.clearSearch()" />
            </div>

            <!-- Tabla de Productos -->
            <div v-else class="table-container">
                <ProductsTable :products="productsStore.productsList" :loading="isLoading" @edit="openEditDialog" @delete="openDeleteDialog" />
            </div>
        </div>

        <!-- Diálogos -->
        <ProductsFormDialog v-model:visible="showProductDialog" :product="selectedProduct" :loading="isLoading" @submit="handleProductSubmit" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProduct?.name || ''" @confirm="handleProductDelete" />
    </div>
</template>

<style scoped>
.content-wrapper {
    @apply mt-6;
}

.table-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden;
}

/* Estilos para el estado vacío cuando no hay productos */
.empty-state {
    @apply text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-dashed border-gray-300 dark:border-gray-700;
}

/* Contenedor del ícono en el estado vacío */
.empty-icon {
    @apply mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30;
}

/* Estilo del ícono (pi-box) */
.empty-icon i {
    @apply text-3xl text-green-600 dark:text-green-400;
}

/* Título del estado vacío */
.empty-title {
    @apply text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2;
}

/* Descripción del estado vacío */
.empty-description {
    @apply text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .empty-state {
        @apply py-12 px-4;
    }
    .empty-title {
        @apply text-xl;
    }
}
</style>
