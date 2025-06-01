<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useCategoriesStore } from '@/stores/categoriesStore';
import CategoriesTable from '@/components/categories/CategoriesTable.vue';
import CategoryFormDialog from '@/components/categories/CategoryFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const categoriesStore = useCategoriesStore();

// Estados
const categories = ref([]);
const selectedCategory = ref(null);
const showCategoryDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadCategories();
});

// Métodos
const loadCategories = async () => {
    await categoriesStore.fetchCategories();

    if (categoriesStore.success) {
        categories.value = categoriesStore.categoriesList;
        showSuccess('Categorías cargadas', categoriesStore.message);
    } else {
        if (categoriesStore.validationErrors && categoriesStore.validationErrors.length > 0) {
            categoriesStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(categoriesStore.message);
        }
    }
};

const handleCategorySubmit = async (categoryData) => {
    const action = categoryData.id ? categoriesStore.updateCategory : categoriesStore.createCategory;
    await action(categoryData);

    if (categoriesStore.success) {
        categories.value = categoriesStore.categoriesList;
        showSuccess(categoryData.id ? 'Categoría actualizada' : 'Categoría creada', categoriesStore.message);
        showCategoryDialog.value = false;
    } else {
        if (categoriesStore.validationErrors && categoriesStore.validationErrors.length > 0) {
            categoriesStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(categoriesStore.message);
        }
    }
};

const handleCategoryDelete = async () => {
    await categoriesStore.deleteCategory(selectedCategory.value.id); // Corrected from removeUnit
    if (categoriesStore.success) {
        categories.value = categoriesStore.categoriesList;
        showSuccess('Categoría eliminada', categoriesStore.message);
        showDeleteDialog.value = false;
    } else {
        if (categoriesStore.validationErrors && categoriesStore.validationErrors.length > 0) {
            categoriesStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(categoriesStore.message);
        }
    }
};

const showSuccess = (title, message) => {
    toast.add({
        severity: 'success',
        summary: title,
        detail: message,
        life: 3000
    });
};

const showError = (message) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 3000
    });
};
</script>
<template>
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Categorías</h2>
            <Button
                icon="pi pi-plus"
                class="p-button-success"
                @click="
                    () => {
                        selectedCategory = null;
                        showCategoryDialog = true;
                    }
                "
            />
        </div>
        <CategoriesTable
            :categories="categories"
            :loading="categoriesStore.isLoadingCategories"
            @edit="
                (category) => {
                    selectedCategory = category;
                    showCategoryDialog = true;
                }
            "
            @delete="
                (category) => {
                    selectedCategory = category;
                    showDeleteDialog = true;
                }
            "
        />

        <CategoryFormDialog v-model:visible="showCategoryDialog" :category="selectedCategory" @submit="handleCategorySubmit" :loading="categoriesStore.isLoadingCategories" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedCategory?.name || ''" @confirm="handleCategoryDelete" />
    </div>
</template>
