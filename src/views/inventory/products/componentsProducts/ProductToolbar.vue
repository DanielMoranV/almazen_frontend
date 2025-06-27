<template>
    <div class="product-toolbar">
        <!-- Header compacto -->
        <div class="toolbar-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-box"></i>
                        Productos
                        <span v-if="totalProducts > 0" class="product-count">({{ totalProducts }})</span>
                    </h1>
                </div>

                <div class="actions-section">
                    <Button icon="pi pi-refresh" class="action-btn refresh-btn" :loading="isLoading" @click="$emit('refresh')" v-tooltip.bottom="'Actualizar'" />
                    <Button icon="pi pi-plus" label="Nuevo" class="action-btn create-btn" @click="$emit('create')" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    totalProducts: {
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

<style scoped>
/* Contenedor principal del toolbar */
.product-toolbar {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden;
}

/* Encabezado del toolbar con gradiente */
.toolbar-header {
    @apply bg-gradient-to-r from-green-600 to-green-500 p-4;
}

.header-content {
    @apply flex justify-between items-center gap-4;
}

/* Título de la página */
.page-title {
    @apply text-xl font-bold text-white flex items-center gap-2;
}

.page-title i {
    @apply text-lg;
}

/* Contador de productos */
.product-count {
    @apply text-green-100 font-normal;
}

/* Sección de acciones (botones) */
.actions-section {
    @apply flex gap-2;
}

/* Estilo base para botones de acción */
.action-btn {
    @apply font-semibold rounded-xl px-3 py-2 transition-colors;
}

/* Deshabilitar transformación en hover para evitar movimientos no deseados */
.action-btn:hover {
    transform: none !important;
}

/* Botón de refrescar */
.refresh-btn {
    @apply bg-white border-2 border-white text-green-700 hover:bg-green-50 hover:border-green-100;
}

/* Botón de crear */
.create-btn {
    @apply bg-yellow-500 border-2 border-yellow-500 text-white hover:bg-yellow-600 hover:border-yellow-600;
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 640px) {
    .toolbar-header {
        @apply p-3;
    }

    .header-content {
        @apply flex-col items-start gap-3;
    }

    .actions-section {
        @apply w-full gap-3;
    }

    .action-btn {
        @apply flex-1 text-center justify-center;
    }

    .page-title {
        @apply text-lg;
    }
}
</style>
