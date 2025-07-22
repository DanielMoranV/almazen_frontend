<template>
    <div class="sales-toolbar">
        <!-- Header mejorado con gradiente y efectos visuales -->
        <div class="toolbar-header">
            <div class="header-backdrop"></div>
            <div class="header-content">
                <div class="title-section">
                    <div class="title-wrapper">
                        <div class="icon-container">
                            <i class="pi pi-shopping-cart"></i>
                        </div>
                        <div class="title-text">
                            <h1 class="page-title">Gestión de Ventas</h1>
                            <p v-if="totalSales > 0" class="subtitle">{{ totalSales }} {{ totalSales === 1 ? 'venta' : 'ventas' }} registradas</p>
                            <p v-else class="subtitle">Comienza registrando tu primera venta</p>
                        </div>
                    </div>
                </div>

                <div class="actions-section">
                    <div class="action-buttons">
                        <Button 
                            icon="pi pi-refresh" 
                            class="action-btn refresh-btn" 
                            :loading="isLoading" 
                            @click="$emit('refresh')" 
                            v-tooltip.bottom="'Actualizar lista'"
                            :disabled="isLoading"
                        />
                        <Button 
                            icon="pi pi-plus" 
                            label="Nueva Venta" 
                            class="action-btn create-btn" 
                            @click="$emit('create')" 
                            v-tooltip.bottom="'Registrar nueva venta'"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    totalSales: {
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
/* Contenedor principal del toolbar con efecto de elevación */
.sales-toolbar {
    @apply bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Encabezado del toolbar con gradiente mejorado y efecto de profundidad */
.toolbar-header {
    @apply relative overflow-hidden;
    background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%);
    padding: 2rem;
    position: relative;
}

/* Fondo decorativo con patrón */
.header-backdrop {
    @apply absolute inset-0 opacity-10;
    background-image: 
        radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 2px, transparent 2px),
        radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 1px, transparent 1px);
    background-size: 50px 50px, 30px 30px;
    animation: pattern-move 20s linear infinite;
}

.header-content {
    @apply relative z-10 flex justify-between items-center gap-6;
}

/* Sección del título mejorada */
.title-section {
    @apply flex-1;
}

.title-wrapper {
    @apply flex items-center gap-4;
}

/* Contenedor del ícono con efecto de brillo */
.icon-container {
    @apply w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.icon-container i {
    @apply text-3xl text-white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Texto del título */
.title-text {
    @apply flex flex-col gap-1;
}

.page-title {
    @apply text-2xl font-bold text-white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    letter-spacing: -0.025em;
}

.subtitle {
    @apply text-white/80 font-medium text-sm;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Sección de acciones mejorada */
.actions-section {
    @apply flex items-center;
}

.action-buttons {
    @apply flex gap-3;
}

/* Estilo base para botones de acción mejorado */
.action-btn {
    @apply font-semibold rounded-xl px-4 py-3 transition-all duration-300 backdrop-blur-sm;
    transform: translateY(0);
}

.action-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
    transform: translateY(0) !important;
}

/* Botón de refrescar con estilo glassmorphism */
.refresh-btn {
    @apply bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/40;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    min-width: 48px;
    min-height: 48px;
}

.refresh-btn:disabled {
    @apply opacity-60 cursor-not-allowed;
    transform: none !important;
}

/* Botón de crear con gradiente llamativo */
.create-btn {
    @apply bg-gradient-to-r from-emerald-400 to-teal-500 border-2 border-emerald-400 text-white hover:from-emerald-500 hover:to-teal-600 hover:border-emerald-500;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    font-weight: 600;
}

/* Animación del patrón de fondo */
@keyframes pattern-move {
    0% {
        background-position: 0% 0%, 0% 0%;
    }
    100% {
        background-position: 100% 100%, -100% -100%;
    }
}

/* Ajustes responsivos para pantallas pequeñas */
@media (max-width: 768px) {
    .toolbar-header {
        @apply p-6;
    }

    .header-content {
        @apply flex-col items-start gap-4;
    }

    .title-wrapper {
        @apply gap-3;
    }

    .icon-container {
        @apply w-12 h-12;
    }

    .icon-container i {
        @apply text-2xl;
    }

    .page-title {
        @apply text-xl;
    }

    .actions-section {
        @apply w-full;
    }

    .action-buttons {
        @apply w-full gap-3;
    }

    .action-btn {
        @apply flex-1 justify-center px-3 py-2.5;
    }

    .refresh-btn {
        @apply min-w-0 flex-initial;
        max-width: 60px;
    }
}

@media (max-width: 480px) {
    .toolbar-header {
        @apply p-4;
    }

    .page-title {
        @apply text-lg;
    }

    .subtitle {
        @apply text-xs;
    }

    .create-btn {
        font-size: 0.875rem;
    }
}

/* Mejoras para modo oscuro */
@media (prefers-color-scheme: dark) {
    .sales-toolbar {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
    }
}
</style>