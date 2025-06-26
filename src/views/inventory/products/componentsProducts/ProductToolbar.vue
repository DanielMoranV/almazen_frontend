<template>
    <div class="product-toolbar">
        <!-- Header Principal con gradiente mejorado -->
        <div class="toolbar-header">
            <div class="header-pattern"></div>
            <div class="header-content">
                <div class="title-section">
                    <div class="icon-wrapper">
                        <i class="pi pi-box"></i>
                    </div>
                    <div class="title-text">
                        <h1 class="page-title">Gestión de Productos</h1>
                        <p class="page-subtitle" v-if="totalProducts > 0">
                            <i class="pi pi-database"></i>
                            {{ totalProducts }} producto{{ totalProducts !== 1 ? 's' : '' }}
                            {{ localSearchTerm ? 'encontrado' + (totalProducts !== 1 ? 's' : '') : 'en inventario' }}
                        </p>
                    </div>
                </div>

                <div class="actions-section">
                    <Button icon="pi pi-refresh" label="Actualizar" class="action-btn refresh-btn" :loading="isLoading" @click="$emit('refresh')" v-tooltip.bottom="'Actualizar lista'" severity="secondary" outlined />
                    <Button icon="pi pi-plus" label="Nuevo Producto" class="action-btn create-btn" @click="$emit('create')" severity="success" />
                </div>
            </div>
        </div>

        <!-- Sección de búsqueda mejorada -->
        <div class="search-section">
            <div class="search-container">
                <div class="search-wrapper">
                    <div class="search-input-group">
                        <div class="search-icon">
                            <i class="pi pi-search"></i>
                        </div>
                        <InputText v-model="localSearchTerm" placeholder="Buscar por nombre, código de barras, SKU o marca..." class="enhanced-search-input" @input="handleSearchInput" @keyup.enter="handleSearchSubmit" />
                        <Button v-if="localSearchTerm" icon="pi pi-times" class="clear-search-btn" @click="clearSearch" v-tooltip.top="'Limpiar búsqueda'" text rounded size="small" severity="secondary" />
                    </div>

                    <Button icon="pi pi-search" label="Buscar" class="search-submit-btn" :loading="isLoading" @click="handleSearchSubmit" severity="primary" />
                </div>

                <!-- Información de resultados mejorada -->
                <div class="search-results" v-if="localSearchTerm || totalProducts > 0">
                    <div class="results-content">
                        <div class="results-icon">
                            <i :class="localSearchTerm ? 'pi pi-filter' : 'pi pi-list'"></i>
                        </div>
                        <div class="results-text">
                            <span v-if="localSearchTerm" class="search-result">
                                <strong>{{ totalProducts }}</strong> resultado{{ totalProducts !== 1 ? 's' : '' }} para <span class="search-term">"{{ localSearchTerm }}"</span>
                            </span>
                            <span v-else class="total-result">
                                Mostrando <strong>{{ totalProducts }}</strong> producto{{ totalProducts !== 1 ? 's' : '' }} en total
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useProductsStore } from '@/stores/productsStore';
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
    totalProducts: {
        type: Number,
        default: 0
    },
    isLoading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['refresh', 'create', 'search']);

const productsStore = useProductsStore();

// Estados locales
const localSearchTerm = ref('');
let searchTimeout = null;

// Inicialización
onMounted(() => {
    localSearchTerm.value = productsStore.getCurrentSearchTerm;
});

// Watchers para sincronizar con el store
watch(
    () => productsStore.getCurrentSearchTerm,
    (newValue) => {
        if (newValue !== localSearchTerm.value) {
            localSearchTerm.value = newValue;
        }
    }
);

// Métodos
const handleSearchInput = () => {
    // Debounce para búsqueda automática (opcional)
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Comentar esta línea si solo quieres búsqueda con botón
    // searchTimeout = setTimeout(handleSearchSubmit, 500);
};

const handleSearchSubmit = async () => {
    await productsStore.searchProducts(localSearchTerm.value);
    emit('search', localSearchTerm.value);
};

const clearSearch = async () => {
    localSearchTerm.value = '';
    await productsStore.clearSearch();
    emit('search', '');
};
</script>

<style scoped>
/* ===== VARIABLES CSS PARA TEMAS ===== */
:root {
    /* Modo claro - Verdes y amarillos */
    --primary-50: #f0fdf4;
    --primary-100: #dcfce7;
    --primary-200: #bbf7d0;
    --primary-300: #86efac;
    --primary-400: #4ade80;
    --primary-500: #22c55e;
    --primary-600: #16a34a;
    --primary-700: #15803d;
    --primary-800: #166534;
    --primary-900: #14532d;

    --accent-50: #fefce8;
    --accent-100: #fef9c3;
    --accent-200: #fef08a;
    --accent-300: #fde047;
    --accent-400: #facc15;
    --accent-500: #eab308;
    --accent-600: #ca8a04;
    --accent-700: #a16207;
    --accent-800: #854d0e;
    --accent-900: #713f12;

    /* Neutros para modo claro */
    --surface-0: #ffffff;
    --surface-50: #f9fafb;
    --surface-100: #f3f4f6;
    --surface-200: #e5e7eb;
    --surface-300: #d1d5db;
    --surface-border: #e5e7eb;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --text-muted: #9ca3af;

    /* Sombras */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
    :root {
        /* Ajustar verdes y amarillos para modo oscuro */
        --primary-50: #14532d;
        --primary-100: #166534;
        --primary-200: #15803d;
        --primary-300: #16a34a;
        --primary-400: #22c55e;
        --primary-500: #4ade80;
        --primary-600: #86efac;
        --primary-700: #bbf7d0;
        --primary-800: #dcfce7;
        --primary-900: #f0fdf4;

        --accent-50: #713f12;
        --accent-100: #854d0e;
        --accent-200: #a16207;
        --accent-300: #ca8a04;
        --accent-400: #eab308;
        --accent-500: #facc15;
        --accent-600: #fde047;
        --accent-700: #fef08a;
        --accent-800: #fef9c3;
        --accent-900: #fefce8;

        /* Neutros para modo oscuro */
        --surface-0: #0f172a;
        --surface-50: #1e293b;
        --surface-100: #334155;
        --surface-200: #475569;
        --surface-300: #64748b;
        --surface-border: #334155;
        --text-primary: #f8fafc;
        --text-secondary: #cbd5e1;
        --text-muted: #94a3b8;

        /* Sombras para modo oscuro */
        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3);
        --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3);
    }
}

/* ===== CONTAINER PRINCIPAL ===== */
.product-toolbar {
    background: var(--surface-0);
    border-radius: 1rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--surface-border);
    margin-bottom: 2rem;
    overflow: hidden;
    transition: all 0.3s ease;
}

.product-toolbar:hover {
    box-shadow: var(--shadow-xl);
}

/* ===== HEADER SECTION ===== */
.toolbar-header {
    position: relative;
    background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 30%, var(--accent-500) 70%, var(--accent-400) 100%);
    overflow: hidden;
}

.header-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.1;
    background-image: radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px), radial-gradient(circle at 40% 80%, white 1px, transparent 1px);
    background-size:
        60px 60px,
        80px 80px,
        40px 40px;
    background-position:
        0 0,
        30px 30px,
        0 0;
}

.header-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    transition: all 0.3s ease;
}

@media (min-width: 1024px) {
    .header-content {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}

.title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
}

.icon-wrapper {
    width: 3.5rem;
    height: 3.5rem;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
        0 8px 32px 0 rgba(34, 197, 94, 0.2),
        0 4px 16px rgba(255, 255, 255, 0.1) inset;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
}

.icon-wrapper:hover {
    transform: scale(1.05);
    background: rgba(255, 255, 255, 0.3);
}

.icon-wrapper i {
    font-size: 1.5rem;
    color: white;
}

.title-text {
    flex: 1;
}

.page-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: white;
    margin-bottom: 0.25rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.025em;
}

@media (min-width: 1024px) {
    .page-title {
        font-size: 2.25rem;
    }
}

.page-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
}

@media (min-width: 1024px) {
    .page-subtitle {
        font-size: 1rem;
    }
}

.page-subtitle i {
    color: rgba(255, 255, 255, 0.8);
}

.actions-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex-shrink: 0;
}

@media (min-width: 640px) {
    .actions-section {
        flex-direction: row;
    }
}

.action-btn {
    font-weight: 600;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
    min-width: 9rem;
    border-radius: 0.75rem;
    padding: 0.75rem 1.5rem;
}

.action-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
}

.refresh-btn {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
}

.refresh-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.create-btn {
    background: white;
    color: var(--primary-700);
    border: 1px solid white;
    font-weight: 700;
}

.create-btn:hover {
    background: var(--primary-50);
    color: var(--primary-800);
}

/* ===== SEARCH SECTION ===== */
.search-section {
    padding: 2rem;
    background: var(--surface-0);
    border-top: 1px solid var(--surface-border);
}

.search-container {
    max-width: 64rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.search-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
}

@media (min-width: 1024px) {
    .search-wrapper {
        flex-direction: row;
        align-items: center;
    }
}

.search-input-group {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--surface-0);
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--surface-border);
    overflow: hidden;
    transition: all 0.3s ease;
    flex: 1;
}

.search-input-group:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-300);
}

.search-input-group:focus-within {
    box-shadow:
        0 0 0 3px rgba(34, 197, 94, 0.1),
        var(--shadow-lg);
    border-color: var(--primary-500);
}

.search-icon {
    position: absolute;
    left: 1rem;
    z-index: 10;
    color: var(--text-muted);
    transition: color 0.3s ease;
}

.search-input-group:focus-within .search-icon {
    color: var(--primary-500);
}

.enhanced-search-input {
    width: 100%;
    padding: 1rem 3rem;
    font-size: 1rem;
    border: none;
    background: transparent;
    color: var(--text-primary);
    outline: none;
    font-family: inherit;
}

.enhanced-search-input::placeholder {
    color: var(--text-muted);
}

.clear-search-btn {
    position: absolute;
    right: 0.5rem;
    color: var(--text-muted);
    transition: all 0.2s ease;
}

.clear-search-btn:hover {
    color: var(--text-secondary);
    transform: scale(1.1);
}

.search-submit-btn {
    font-weight: 700;
    box-shadow: var(--shadow-lg);
    transition: all 0.3s ease;
    min-width: 8rem;
    padding: 1rem 2rem;
    background: var(--primary-600);
    border: 1px solid var(--primary-600);
    color: white;
    border-radius: 0.75rem;
}

.search-submit-btn:hover {
    background: var(--primary-700);
    border-color: var(--primary-700);
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
}

/* ===== RESULTS SECTION ===== */
.search-results {
    margin-top: 1.5rem;
    padding: 1rem;
    background: var(--surface-50);
    backdrop-filter: blur(10px);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    box-shadow: var(--shadow-sm);
    animation: fadeInUp 0.3s ease-out;
}

.results-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.results-icon {
    width: 2rem;
    height: 2rem;
    background: var(--primary-100);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid var(--primary-200);
    transition: all 0.3s ease;
}

.results-icon:hover {
    background: var(--primary-200);
    transform: scale(1.1);
}

.results-icon i {
    color: var(--primary-700);
    font-size: 0.875rem;
    font-weight: 600;
}

.results-text {
    color: var(--text-primary);
    font-size: 0.875rem;
    font-weight: 500;
}

@media (min-width: 1024px) {
    .results-text {
        font-size: 1rem;
    }
}

.search-result strong,
.total-result strong {
    color: var(--primary-800);
    font-weight: 700;
}

.search-term {
    color: var(--accent-800);
    font-weight: 600;
    background: var(--accent-100);
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--accent-200);
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1024px) {
    .header-content {
        padding: 1.5rem;
    }

    .search-section {
        padding: 1.5rem;
    }

    .page-title {
        font-size: 1.5rem;
    }
}

@media (max-width: 640px) {
    .header-content {
        padding: 1rem;
        gap: 1rem;
    }

    .search-section {
        padding: 1rem;
    }

    .title-section {
        gap: 0.75rem;
    }

    .icon-wrapper {
        width: 3rem;
        height: 3rem;
    }

    .icon-wrapper i {
        font-size: 1.25rem;
    }

    .page-title {
        font-size: 1.25rem;
    }

    .page-subtitle {
        font-size: 0.75rem;
    }

    .actions-section {
        width: 100%;
    }

    .action-btn {
        width: 100%;
        justify-content: center;
        min-width: auto;
    }

    .search-wrapper {
        gap: 0.75rem;
    }

    .enhanced-search-input {
        padding: 0.75rem 2.5rem;
        font-size: 0.875rem;
    }

    .search-submit-btn {
        width: 100%;
        padding: 0.75rem 1.5rem;
        min-width: auto;
    }
}

/* ===== LOADING STATES ===== */
.action-btn:disabled,
.search-submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: var(--shadow-md);
}

/* ===== ANIMATIONS ===== */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(1rem);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* ===== MODO OSCURO ESPECÍFICO ===== */
@media (prefers-color-scheme: dark) {
    .toolbar-header {
        background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 30%, var(--accent-500) 70%, var(--accent-400) 100%);
    }

    .search-results {
        background: var(--surface-100);
    }

    .search-term {
        background: var(--accent-200);
        color: var(--accent-900);
        border-color: var(--accent-300);
    }
}

/* ===== ACCESIBILIDAD ===== */
@media (prefers-reduced-motion: reduce) {
    .product-toolbar,
    .action-btn,
    .search-input-group,
    .results-icon,
    .icon-wrapper {
        transition: none;
    }

    .search-results {
        animation: none;
    }
}

/* ===== FOCUS STYLES ===== */
.action-btn:focus-visible,
.search-submit-btn:focus-visible,
.clear-search-btn:focus-visible {
    outline: 2px solid var(--primary-500);
    outline-offset: 2px;
}

.enhanced-search-input:focus {
    outline: none;
}
</style>
