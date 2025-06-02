<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProductsStore } from '@/stores/productsStore';
import ProductsTable from '@/components/products/ProductsTable.vue';
import ProductsFormDialog from '@/components/products/ProductFormDialog.vue';
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
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Productos</h2>
            <Button
                icon="pi pi-plus"
                class="p-button-success"
                @click="
                    () => {
                        selectedProduct = null;
                        showProductDialog = true;
                    }
                "
            />
        </div>

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

        <ProductsFormDialog v-model:visible="showProductDialog" :product="selectedProduct" @submit="handleProductSubmit" :loading="productsStore.isLoadingProducts" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProduct?.name || ''" @confirm="handleProductDelete" />
    </div>
</template>
