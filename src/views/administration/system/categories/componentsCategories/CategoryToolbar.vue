<script setup>
import Button from 'primevue/button';

defineProps({
    totalCategories: {
        type: Number,
        default: 0
    },
    isLoading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['refresh', 'create']);
</script>

<template>
    <div class="toolbar-container">
        <div class="toolbar-header">
            <h1 class="toolbar-title">
                <i class="pi pi-tags toolbar-icon"></i>
                Gestión de Categorías
            </h1>
            <p class="toolbar-subtitle">Administra las categorías de tu sistema ({{ totalCategories }} en total)</p>
        </div>
        <div class="toolbar-actions">
            <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" outlined @click="$emit('refresh')" :loading="isLoading" />
            <Button icon="pi pi-plus" label="Nueva Categoría" severity="success" @click="$emit('create')" />
        </div>
    </div>
</template>

<style scoped>
.toolbar-container {
    @apply flex flex-col md:flex-row md:justify-between md:items-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.toolbar-header {
    @apply mb-4 md:mb-0;
}

.toolbar-title {
    @apply text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center mb-2;
}

.toolbar-icon {
    @apply text-purple-600 mr-3;
}

.toolbar-subtitle {
    @apply text-gray-600 dark:text-gray-400 text-lg;
}

.toolbar-actions {
    @apply flex space-x-3;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .toolbar-actions {
        @apply w-full justify-end;
    }
    .toolbar-actions button {
        @apply flex-grow;
    }
}
</style>
