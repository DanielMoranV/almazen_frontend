<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProductsStore } from '@/stores/productsStore';
import ProductsTable from '@/views/inventory/products/componentsProducts/ProductsTable.vue';
import ProductsFormDialog from '@/views/inventory/products/componentsProducts/ProductFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const productsStore = useProductsStore();

// Estados
const products = ref([]);
const selectedProduct = ref(null);
const showProductDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadProducts();
});

// Métodos
const loadProducts = async () => {
    await productsStore.fetchProducts();

    if (productsStore.success) {
        products.value = productsStore.productsList;
        showSuccess('Productos cargados', productsStore.message);
    } else {
        if (productsStore.validationErrors && productsStore.validationErrors.length > 0) {
            productsStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(productsStore.message);
        }
    }
};

const handleProductSubmit = async (productData) => {
    const action = productData.id ? productsStore.updateProduct : productsStore.createProduct;
    await action(productData);

    if (productsStore.success) {
        products.value = productsStore.productsList;
        showSuccess(productData.id ? 'Producto actualizado' : 'Producto creado', productsStore.message);
        showProductDialog.value = false;
    } else {
        if (productsStore.validationErrors && productsStore.validationErrors.length > 0) {
            productsStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(productsStore.message);
        }
    }
};

const handleProductDelete = async () => {
    await productsStore.deleteProduct(selectedProduct.value.id);
    if (productsStore.success) {
        products.value = productsStore.productsList;
        showSuccess('Producto eliminado', productsStore.message);
    } else {
        if (productsStore.validationErrors && productsStore.validationErrors.length > 0) {
            productsStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(productsStore.message);
        }
    }
    showDeleteDialog.value = false;
};

// Helpers
const showSuccess = (summary, detail) => {
    toast.add({ severity: 'success', summary, detail, life: 3000 });
};

const showError = (detail) => {
    toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
};
</script>
<template>
    <div class="p-4 sm:p-6 lg:px-16 card bg-white dark:bg-gray-900 rounded-xl shadow-md w-full max-w-none">
        <Toast />
        <ConfirmDialog />

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <Button
                icon="pi pi-plus"
                class="p-button-success w-full sm:w-auto block sm:inline-flex mb-2 sm:mb-0"
                label="Agregar Producto"
                @click="
                    () => {
                        selectedProduct = null;
                        showProductDialog = true;
                    }
                "
            />
        </div>

        <!-- Tabla con scroll horizontal en móviles -->
        <div class="overflow-x-auto rounded-lg shadow-sm bg-white dark:bg-gray-800">
            <ProductsTable
                :products="products"
                :loading="productsStore.isLoadingProducts"
                @edit="
                    (product) => {
                        selectedProduct = product;
                        showProductDialog = true;
                    }
                "
                @delete="
                    (product) => {
                        selectedProduct = product;
                        showDeleteDialog = true;
                    }
                "
            />
        </div>
        <!-- Diálogos -->
        <ProductsFormDialog v-model:visible="showProductDialog" :product="selectedProduct" @submit="handleProductSubmit" :loading="productsStore.isLoadingProducts" dialog-class="max-w-full w-[95vw] sm:w-[500px]" />
        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProduct?.name || ''" @confirm="handleProductDelete" dialog-class="max-w-full w-[90vw] sm:w-[400px]" />
    </div>
</template>
