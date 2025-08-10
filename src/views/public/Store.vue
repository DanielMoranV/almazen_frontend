<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePublicStore } from '@/stores/publicStore';

const route = useRoute();
const toast = useToast();
const publicStore = usePublicStore();

// Filtros locales no del store
const showFilters = ref(false);

// Estados computados
const warehouseId = computed(() => route.params.warehouseId);

// Computed properties que acceden al store
const products = computed(() => publicStore.filteredProducts);
const allProducts = computed(() => publicStore.products);
const categories = computed(() => publicStore.availableCategories);
const categoryStats = computed(() => publicStore.categoryStats);
const warehouse = computed(() => publicStore.warehouseInfo);
const company = computed(() => publicStore.companyInfo);
const loading = computed(() => publicStore.isLoadingProducts);
const totalProducts = computed(() => publicStore.totalProducts);
const hasProducts = computed(() => publicStore.hasProducts);
const showPagination = computed(() => publicStore.showPagination);
const searchQuery = computed({
    get: () => publicStore.searchQuery,
    set: (value) => publicStore.updateSearch(value)
});
const selectedCategory = computed({
    get: () => publicStore.selectedCategory,
    set: (value) => publicStore.updateCategory(value)
});
const currentPage = computed({
    get: () => publicStore.currentPage,
    set: (value) => publicStore.updatePage(value)
});
const perPage = computed(() => publicStore.perPage);

// Usar las utilidades del store
const formatPrice = (price) => publicStore.formatPrice(price);
const formatDate = (dateString) => publicStore.formatDate(dateString);

// Función para cargar productos usando el store
const loadProducts = async () => {
    try {
        await publicStore.loadPublicProducts(warehouseId.value);
    } catch (error) {
        let errorMessage = 'No se pudieron cargar los productos';
        if (error.message?.includes('404')) {
            errorMessage = 'Almacén no encontrado';
        } else if (error.message?.includes('500')) {
            errorMessage = 'Error del servidor. Por favor, inténtalo más tarde.';
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });
    }
};

// Búsqueda con debounce
const debouncedSearch = (() => {
    let timeoutId;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            loadProducts();
        }, 500);
    };
})();

// Watchers
watch(searchQuery, debouncedSearch);
// Solo filtrar localmente por categoría, sin hacer petición al servidor
watch(selectedCategory, (newCategory) => {
    publicStore.filterByCategory(newCategory);
});
watch(currentPage, () => {
    loadProducts();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Cambio de página
const changePage = (page) => {
    currentPage.value = page;
};

// Limpiar filtros
const clearFilters = () => {
    publicStore.clearFilters();
    loadProducts();
};

// Alternar filtro de categoría
const toggleCategoryFilter = (categoryId) => {
    publicStore.toggleCategoryFilter(categoryId);
};

// SEO dinámico
const seoTitle = computed(() => {
    if (!warehouse.value?.name) return 'Catálogo de Productos';
    return `${warehouse.value.name} - Catálogo de Productos`;
});

const seoDescription = computed(() => {
    const productCount = totalProducts.value;
    const warehouseName = warehouse.value?.name || 'nuestra tienda';
    return `Descubre ${productCount} productos disponibles en ${warehouseName}. Catálogo actualizado con precios, stock y disponibilidad en tiempo real.`;
});

// Manejo manual de SEO
const updateSEO = () => {
    // Actualizar título
    document.title = seoTitle.value;

    // Función helper para actualizar/crear meta tags
    const updateMetaTag = (selector, content) => {
        let meta = document.querySelector(selector);
        if (!meta) {
            meta = document.createElement('meta');
            document.head.appendChild(meta);
            // Agregar atributos según el selector
            if (selector.includes('property')) {
                meta.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
            } else {
                meta.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
            }
        }
        meta.setAttribute('content', content);
    };

    // Actualizar meta tags
    updateMetaTag('meta[name="description"]', seoDescription.value);
    updateMetaTag('meta[property="og:title"]', seoTitle.value);
    updateMetaTag('meta[property="og:description"]', seoDescription.value);
    updateMetaTag('meta[property="og:type"]', 'website');
    updateMetaTag('meta[property="og:image"]', '/og-store-image.jpg');
    updateMetaTag('meta[name="twitter:card"]', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', seoTitle.value);
    updateMetaTag('meta[name="twitter:description"]', seoDescription.value);
    updateMetaTag('meta[name="robots"]', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('meta[name="keywords"]', 'productos, catálogo, tienda online, inventario, precios');
};

// Structured Data para SEO
const updateStructuredData = () => {
    // Remover structured data existente
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-store-seo]');
    existingScripts.forEach((script) => script.remove());

    // Agregar structured data de la tienda
    if (warehouse.value) {
        const storeData = {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: warehouse.value.name,
            description: seoDescription.value,
            address: warehouse.value.address
                ? {
                      '@type': 'PostalAddress',
                      streetAddress: warehouse.value.address
                  }
                : undefined,
            hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'Catálogo de Productos',
                numberOfItems: totalProducts.value
            },
            url: `${window.location.origin}/store/${warehouseId.value}`,
            potentialAction: {
                '@type': 'SearchAction',
                target: `${window.location.origin}/store/${warehouseId.value}?search={search_term_string}`,
                'query-input': 'required name=search_term_string'
            }
        };

        const storeScript = document.createElement('script');
        storeScript.type = 'application/ld+json';
        storeScript.setAttribute('data-store-seo', 'store');
        storeScript.textContent = JSON.stringify(storeData);
        document.head.appendChild(storeScript);
    }

    // Agregar structured data de productos
    if (hasProducts.value) {
        const productsData = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            numberOfItems: totalProducts.value,
            itemListElement: products.value.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'Product',
                    name: product.name,
                    description: product.description,
                    sku: product.sku,
                    brand: product.brand
                        ? {
                              '@type': 'Brand',
                              name: product.brand
                          }
                        : undefined,
                    category: publicStore.getProductCategory(product)?.name,
                    offers: {
                        '@type': 'Offer',
                        price: publicStore.getProductPrice(product),
                        priceCurrency: 'PEN',
                        availability: publicStore.getProductStock(product) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                        seller: {
                            '@type': 'Store',
                            name: warehouse.value?.name
                        }
                    }
                }
            }))
        };

        const productsScript = document.createElement('script');
        productsScript.type = 'application/ld+json';
        productsScript.setAttribute('data-store-seo', 'products');
        productsScript.textContent = JSON.stringify(productsData);
        document.head.appendChild(productsScript);
    }
};

// Watchers para SEO
watch(
    [warehouse, products, totalProducts],
    () => {
        updateSEO();
        updateStructuredData();
    },
    { flush: 'post' }
);

// Inicialización
onMounted(async () => {
    // Inicializar store y cargar productos
    await publicStore.initializeStore(warehouseId.value);

    // Actualizar SEO después de cargar los datos
    updateSEO();
    updateStructuredData();
});
</script>

<template>
    <div class="store-page">
        <Toast />

        <!-- Header de la tienda -->
        <header class="store-header">
            <div class="container">
                <div class="header-content">
                    <div class="store-info">
                        <h1 class="store-title">
                            {{ warehouse?.name || 'Catálogo de Productos' }}
                        </h1>
                        <p class="store-description" v-if="warehouse?.address">📍 {{ warehouse.address }}</p>
                        <div class="product-count">
                            <i class="pi pi-box"></i>
                            <span>{{ totalProducts }} productos disponibles</span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <Button icon="pi pi-filter" label="Filtros" text @click="showFilters = !showFilters" class="filter-toggle" />
                    </div>
                </div>
            </div>
        </header>

        <div class="container">
            <div class="store-content">
                <!-- Barra de búsqueda y filtros -->
                <div class="search-section">
                    <div class="search-bar">
                        <InputText v-model="searchQuery" placeholder="Buscar productos por nombre, SKU o código..." class="search-input" />
                        <i class="pi pi-search search-icon"></i>
                    </div>

                    <!-- Panel de filtros colapsable -->
                    <transition name="slide-down">
                        <div v-if="showFilters" class="filters-panel">
                            <div class="filter-group">
                                <label class="filter-label">Categoría:</label>
                                <Dropdown 
                                    v-model="selectedCategory" 
                                    :options="categoryStats" 
                                    optionLabel="name" 
                                    optionValue="id"
                                    placeholder="Todas las categorías"
                                    showClear
                                    class="filter-dropdown"
                                >
                                    <template #option="slotProps">
                                        <div class="category-option">
                                            <span class="category-name">{{ slotProps.option.name }}</span>
                                            <span class="category-count">({{ slotProps.option.productCount }})</span>
                                        </div>
                                    </template>
                                </Dropdown>
                            </div>

                            <!-- Chips de categorías populares -->
                            <div class="category-chips" v-if="categoryStats.length > 0">
                                <label class="filter-label">Categorías populares:</label>
                                <div class="chips-container">
                                    <Chip 
                                        v-for="category in categoryStats.slice(0, 6)" 
                                        :key="category.id"
                                        :label="`${category.name} (${category.productCount})`"
                                        :class="{ 'selected': selectedCategory === category.id }"
                                        @click="toggleCategoryFilter(category.id)"
                                        class="category-chip"
                                    />
                                </div>
                            </div>

                            <div class="filter-actions">
                                <Button 
                                    label="Limpiar filtros" 
                                    text 
                                    size="small" 
                                    @click="clearFilters"
                                />
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Grid de productos -->
                <div v-if="loading" class="loading-section">
                    <div class="loading-grid">
                        <div v-for="i in 8" :key="i" class="product-skeleton">
                            <Skeleton width="100%" height="200px" class="mb-2" />
                            <Skeleton width="80%" height="1.5rem" class="mb-2" />
                            <Skeleton width="60%" height="1rem" class="mb-2" />
                            <Skeleton width="40%" height="1.25rem" />
                        </div>
                    </div>
                </div>

                <div v-else-if="!hasProducts" class="empty-section">
                    <div class="empty-content">
                        <i class="pi pi-inbox empty-icon"></i>
                        <h3>No se encontraron productos</h3>
                        <p v-if="searchQuery || selectedCategory">Intenta ajustar tus filtros de búsqueda</p>
                        <p v-else>No hay productos disponibles en este momento</p>
                        <Button v-if="searchQuery || selectedCategory" label="Limpiar filtros" @click="clearFilters" class="mt-3" />
                    </div>
                </div>

                <div v-else class="products-grid">
                    <router-link v-for="product in products" :key="product.id" :to="{ name: 'publicProductDetail', params: { warehouseId: warehouseId, productId: product.id } }" class="product-card">
                        <!-- Imagen del producto -->
                        <div class="product-image">
                            <img :src="publicStore.getProductImage(product)" :alt="product.name" @error="$event.target.src = publicStore.generateProductAvatar(product.name)" />
                            <div v-if="publicStore.getProductStock(product) <= 0" class="out-of-stock-badge">Agotado</div>
                            <div v-else-if="publicStore.getProductBatch(product) && publicStore.getProductBatch(product).days_to_expire <= 7" class="expiry-badge">
                                {{ formatDate(publicStore.getProductBatch(product).expiry_date) }}
                            </div>
                        </div>

                        <!-- Contenido del producto -->
                        <div class="product-content">
                            <div class="product-category">
                                {{ publicStore.getProductCategory(product)?.name || 'Sin categoría' }}
                            </div>

                            <h3 class="product-name">{{ product.name }}</h3>

                            <div class="product-details">
                                <div class="product-brand" v-if="product.brand">
                                    <i class="pi pi-tag"></i>
                                    {{ product.brand }}
                                </div>

                                <div class="product-sku">
                                    <i class="pi pi-barcode"></i>
                                    {{ product.sku }}
                                </div>
                            </div>

                            <div class="product-description" v-if="product.description">
                                {{ product.description }}
                            </div>

                            <div class="product-footer">
                                <div class="price-section">
                                    <span class="current-price">
                                        {{ formatPrice(publicStore.getProductPrice(product)) }}
                                    </span>
                                    <span class="per-unit">/ {{ publicStore.getProductUnit(product).symbol }}</span>
                                </div>

                                <div class="stock-info">
                                    <div
                                        class="stock-badge"
                                        :class="{
                                            'out-of-stock': publicStore.getProductStock(product) <= 0,
                                            'low-stock': publicStore.getProductStock(product) > 0 && publicStore.getProductStock(product) <= 5,
                                            'in-stock': publicStore.getProductStock(product) > 5
                                        }"
                                    >
                                        <i class="pi pi-box"></i>
                                        <span v-if="publicStore.getProductStock(product) <= 0">Agotado</span>
                                        <span v-else>{{ publicStore.getProductStock(product) }} disponibles</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Información de lote si existe -->
                            <div v-if="publicStore.getProductBatch(product)" class="batch-info">
                                <div class="batch-details">
                                    <span class="batch-code">Lote: {{ publicStore.getProductBatch(product).batch_code }}</span>
                                    <span
                                        class="expiry-date"
                                        :class="{
                                            'expiry-warning': publicStore.getProductBatch(product).days_to_expire <= 7,
                                            'expiry-danger': publicStore.getProductBatch(product).days_to_expire <= 3
                                        }"
                                    >
                                        Vence: {{ formatDate(publicStore.getProductBatch(product).expiry_date) }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </router-link>
                </div>

                <!-- Paginación -->
                <div v-if="showPagination" class="pagination-section">
                    <Paginator
                        :rows="perPage"
                        :totalRecords="totalProducts"
                        :first="(currentPage - 1) * perPage"
                        @page="changePage($event.page + 1)"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                        class="custom-paginator"
                    />
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="store-footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-info">
                        <div v-if="company" class="company-info">
                            <h4 class="company-name">{{ company.name }}</h4>
                            <p class="company-details">{{ company.category }}</p>
                            <div class="company-contact">
                                <p v-if="company.address" class="company-address">
                                    <i class="pi pi-map-marker"></i>
                                    {{ company.address }}
                                </p>
                                <div class="contact-links">
                                    <a v-if="company.phone" :href="`tel:${company.phone}`" class="contact-link">
                                        <i class="pi pi-phone"></i>
                                        {{ company.phone }}
                                    </a>
                                    <a v-if="company.email" :href="`mailto:${company.email}`" class="contact-link">
                                        <i class="pi pi-envelope"></i>
                                        {{ company.email }}
                                    </a>
                                    <a v-if="company.website" :href="company.website" target="_blank" class="contact-link">
                                        <i class="pi pi-globe"></i>
                                        Sitio web
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div v-else class="fallback-info">
                            <p>&copy; 2024 {{ warehouse?.name || 'Tienda' }}. Catálogo de productos en línea.</p>
                        </div>
                    </div>
                    <div class="footer-links">
                        <div class="warehouse-info" v-if="warehouse">
                            <h5 class="warehouse-name">{{ warehouse.name }}</h5>
                            <p v-if="warehouse.location" class="warehouse-location">{{ warehouse.location }}</p>
                        </div>
                        <span class="powered-by"> Powered by <strong>AlmaZen</strong> </span>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* === LAYOUT PRINCIPAL === */
.store-page {
    min-height: 100vh;
    background: var(--surface-ground);
    display: flex;
    flex-direction: column;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* === HEADER === */
.store-header {
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
    color: white;
    padding: 2rem 0;
    margin-bottom: 2rem;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}

.store-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    line-height: 1.2;
}

.store-description {
    font-size: 1.125rem;
    opacity: 0.9;
    margin: 0 0 1rem 0;
}

.product-count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    opacity: 0.8;
}

.filter-toggle {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
}

.filter-toggle:hover {
    background: rgba(255, 255, 255, 0.25);
}

/* === BÚSQUEDA Y FILTROS === */
.search-section {
    margin-bottom: 2rem;
}

.search-bar {
    position: relative;
    margin-bottom: 1rem;
}

.search-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    font-size: 1rem;
    border-radius: 0.5rem;
    border: 2px solid var(--surface-border);
    transition: border-color 0.2s ease;
}

.search-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb), 0.1);
}

.search-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
    pointer-events: none;
}

.filters-panel {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.filter-label {
    font-weight: 500;
    color: var(--text-color);
    white-space: nowrap;
}

.filter-dropdown {
    min-width: 200px;
}

.filter-actions {
    margin-left: auto;
}

/* === CHIPS DE CATEGORÍAS === */
.category-chips {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
}

.chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.category-chip {
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface-100);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
}

.category-chip:hover {
    background: var(--surface-200);
    transform: translateY(-1px);
}

.category-chip.selected {
    background: var(--primary-100);
    color: var(--primary-600);
    border-color: var(--primary-300);
}

/* === DROPDOWN DE CATEGORÍAS === */
.category-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.category-name {
    flex: 1;
}

.category-count {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-left: 0.5rem;
}

/* === LOADING === */
.loading-section {
    margin-bottom: 2rem;
}

.loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.product-skeleton {
    background: var(--surface-card);
    border-radius: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--surface-border);
}

/* === EMPTY STATE === */
.empty-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    margin: 2rem 0;
}

.empty-content {
    text-align: center;
    max-width: 400px;
}

.empty-icon {
    font-size: 4rem;
    color: var(--text-color-secondary);
    margin-bottom: 1rem;
}

.empty-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.5rem;
}

.empty-content p {
    color: var(--text-color-secondary);
    line-height: 1.5;
    margin-bottom: 1rem;
}

/* === GRID DE PRODUCTOS === */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
}

.product-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 0.75rem;
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
}

.product-card:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.product-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: var(--surface-100);
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    background: var(--surface-50);
}

.product-card:hover .product-image img {
    transform: scale(1.05);
}

.out-of-stock-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: var(--red-500);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.expiry-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: var(--yellow-500);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
}

.product-content {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.product-category {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-bottom: 0.5rem;
}

.product-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 1rem 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.product-brand,
.product-sku {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.product-description {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    line-height: 1.4;
    margin-bottom: 1rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-footer {
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
}

.price-section {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
}

.current-price {
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--primary-color);
}

.per-unit {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

.stock-badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
}

.stock-badge.in-stock {
    background: var(--green-100);
    color: var(--green-700);
}

.stock-badge.low-stock {
    background: var(--yellow-100);
    color: var(--yellow-700);
}

.stock-badge.out-of-stock {
    background: var(--red-100);
    color: var(--red-700);
}

.batch-info {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--surface-border);
}

.batch-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
}

.batch-code {
    color: var(--text-color-secondary);
    font-weight: 500;
}

.expiry-date {
    font-weight: 500;
}

.expiry-date.expiry-warning {
    color: var(--yellow-700);
}

.expiry-date.expiry-danger {
    color: var(--red-700);
}

/* === PAGINACIÓN === */
.pagination-section {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
}

.custom-paginator {
    border: none;
    background: none;
}

/* === FOOTER === */
.store-footer {
    margin-top: auto;
    background: var(--surface-section);
    border-top: 1px solid var(--surface-border);
    padding: 2rem 0;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
}

.footer-info {
    flex: 1;
}

.footer-info p {
    margin: 0;
    color: var(--text-color-secondary);
}

/* === COMPANY INFO === */
.company-info {
    margin-bottom: 1.5rem;
}

.company-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
    line-height: 1.3;
}

.company-details {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0 0 1rem 0;
    font-weight: 500;
}

.company-contact {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.company-address {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.75rem 0;
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.company-address i {
    color: var(--primary-color);
    font-size: 0.875rem;
}

.contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.contact-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--primary-color);
    text-decoration: none;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    padding: 0.25rem 0;
}

.contact-link:hover {
    color: var(--primary-600);
    text-decoration: underline;
}

.contact-link i {
    font-size: 0.875rem;
    color: currentColor;
}

/* === WAREHOUSE INFO === */
.footer-links {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1rem;
}

.warehouse-info {
    text-align: right;
}

.warehouse-name {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.25rem 0;
}

.warehouse-location {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
}

.fallback-info {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.powered-by {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    text-align: right;
}

/* === TRANSICIONES === */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
    .store-title {
        font-size: 2rem;
    }

    .header-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }

    .filters-panel {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-group {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .filter-dropdown {
        min-width: auto;
        width: 100%;
    }

    .filter-actions {
        margin-left: 0;
        text-align: center;
    }
    
    .category-chips {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
    }
    
    .chips-container {
        justify-content: center;
    }

    .product-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }

    .footer-content {
        flex-direction: column;
        text-align: center;
        align-items: center;
        gap: 1.5rem;
    }
    
    .footer-info {
        text-align: center;
    }
    
    .company-contact {
        align-items: center;
    }
    
    .contact-links {
        justify-content: center;
        gap: 0.75rem;
    }
    
    .footer-links {
        align-items: center;
    }
    
    .warehouse-info {
        text-align: center;
    }
    
    .powered-by {
        text-align: center;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 0.75rem;
    }

    .store-header {
        padding: 1.5rem 0;
    }

    .store-title {
        font-size: 1.75rem;
    }

    .products-grid {
        grid-template-columns: 1fr;
    }

    .product-content {
        padding: 1rem;
    }
}

/* === DARK MODE === */
@media (prefers-color-scheme: dark) {
    .product-card:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
}
</style>
