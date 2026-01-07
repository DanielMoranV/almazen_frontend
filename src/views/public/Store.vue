<script setup>
import { usePublicStore } from '@/stores/publicStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const toast = useToast();
const publicStore = usePublicStore();

// Filtros locales no del store
const showFilters = ref(false);
// Control de errores de carga de logo
const logoError = ref(false);

// Estados computados - Detectar tipo de URL (slug vs legacy)
const isSlugRoute = computed(() => route.name === 'catalogHome');
const isLegacyRoute = computed(() => route.name === 'publicStore');

// Parámetros según el tipo de ruta
const slug = computed(() => route.params.slug);
const companyId = computed(() => route.params.companyId);
const warehouseId = computed(() => route.params.warehouseId);
const accessToken = computed(() => route.query.token);

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

const showPrices = computed(() => {
    if (publicStore.catalogConfig) {
        return publicStore.catalogConfig.show_prices;
    }
    return true; // Default for legacy/fallback
});

const showStock = computed(() => {
    if (publicStore.catalogConfig) {
        return publicStore.catalogConfig.show_stock_quantity;
    }
    return true; // Default for legacy/fallback
});

// Usar las utilidades del store
const formatPrice = (price) => publicStore.formatPrice(price);
const formatDate = (dateString) => publicStore.formatDate(dateString);

// Función para cargar productos usando el store
const loadProducts = async () => {
    try {
        if (isSlugRoute.value) {
            // Nueva forma: Usando slug amigable
            await publicStore.loadCatalogProducts(slug.value, {
                token: accessToken.value,
                usePagination: true
            });
        } else if (isLegacyRoute.value) {
            // Forma legacy: Mantener retrocompatibilidad
            await publicStore.loadPublicProducts(warehouseId.value, {
                companyId: companyId.value,
                usePagination: true
            });
        }

        console.log('📦 [Store View] Data recibida del backend:', {
            products: publicStore.products,
            warehouse: publicStore.warehouseInfo,
            company: publicStore.companyInfo,
            pagination: {
                total: publicStore.totalProducts,
                perPage: publicStore.perPage,
                currentPage: publicStore.currentPage
            }
        });

    } catch (error) {
        let errorMessage = 'No se pudieron cargar los productos';

        if (error.message?.includes('404')) {
            errorMessage = isSlugRoute.value ? 'Catálogo no encontrado' : 'Tienda no encontrada';
        } else if (error.message?.includes('403')) {
            errorMessage = 'Token de acceso requerido o inválido';
            // Si necesita token, mostrar diálogo
            showTokenDialog();
            return;
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

// 🆕 Nuevo: Generar ruta de producto según el tipo de URL
const getProductRoute = (productId) => {
    if (isSlugRoute.value) {
        // Nueva forma: URL con slug
        return {
            name: 'catalogProductDetail',
            params: { slug: slug.value, productId },
            query: accessToken.value ? { token: accessToken.value } : {}
        };
    } else {
        // Forma legacy
        return {
            name: 'publicProductDetail',
            params: { companyId: companyId.value, warehouseId: warehouseId.value, productId }
        };
    }
};

// SEO dinámico
const seoTitle = computed(() => {
    if (!company.value?.name) return 'Catálogo de Productos';
    return `${company.value.name} - Catálogo de Productos`;
});

const seoDescription = computed(() => {
    const productCount = totalProducts.value;
    const companyName = company.value?.name || 'nuestra tienda';
    return `Descubre ${productCount} productos disponibles en ${companyName}. Catálogo actualizado con precios, stock y disponibilidad en tiempo real.`;
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
    updateMetaTag('meta[property="og:image"]', company.value?.logo || '/og-store-image.jpg');
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
    if (company.value && warehouse.value) {
        const storeData = {
            '@context': 'https://schema.org',
            '@type': 'Store',
            name: company.value.name,
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
            url: isSlugRoute.value ? `${window.location.origin}/tienda/${slug.value}` : `${window.location.origin}/store/${companyId.value}/${warehouseId.value}`,
            potentialAction: {
                '@type': 'SearchAction',
                target: isSlugRoute.value ? `${window.location.origin}/tienda/${slug.value}?search={search_term_string}` : `${window.location.origin}/store/${companyId.value}/${warehouseId.value}?search={search_term_string}`,
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
                            name: company.value?.name
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
    [company, warehouse, products, totalProducts],
    () => {
        updateSEO();
        updateStructuredData();
    },
    { flush: 'post' }
);

// Resetear error de logo cuando cambie la empresa
watch(company, () => {
    logoError.value = false;
});

// 🆕 Redes Sociales
const socialMediaLinks = computed(() => {
    if (!company.value?.social_media) return [];

    const networks = [
        { key: 'facebook', icon: 'pi pi-facebook', label: 'Facebook', color: '#1877F2' },
        { key: 'instagram', icon: 'pi pi-instagram', label: 'Instagram', color: '#E4405F' },
        { key: 'twitter', icon: 'pi pi-twitter', label: 'Twitter', color: '#1DA1F2' },
        { key: 'linkedin', icon: 'pi pi-linkedin', label: 'LinkedIn', color: '#0A66C2' },
        { key: 'tiktok', icon: 'pi pi-video', label: 'TikTok', color: '#000000' }, // PrimeVue icon fallback
        { key: 'youtube', icon: 'pi pi-youtube', label: 'YouTube', color: '#FF0000' },
        { key: 'whatsapp', icon: 'pi pi-whatsapp', label: 'WhatsApp', color: '#25D366' }
    ];

    return networks.map(net => {
        let url = company.value.social_media[net.key];
        
        if (!url) return null;

        // Formatear WhatsApp si es solo número
        if (net.key === 'whatsapp') {
            const cleanNumber = url.replace(/\D/g, ''); // Eliminar no numéricos
            if (!url.startsWith('http')) {
                // Asumir código de país si no lo tiene (ej. Perú 51) o usar link universal
                url = `https://wa.me/${cleanNumber.length <= 9 ? '51' + cleanNumber : cleanNumber}`; 
            }
        }

        return { ...net, url };
    }).filter(item => item !== null);
});

// Función para verificar si una URL es válida y accesible
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    // Verificar si es una URL de placeholder que sabemos que puede fallar
    if (url.includes('via.placeholder.com') || url.includes('placeholder')) {
        return false;
    }

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// 🆕 Nuevo: Diálogo de token de acceso
const showTokenInput = ref(false);
const tokenInput = ref('');
const isTokenRequired = computed(() => publicStore.isTokenRequired);

const showTokenDialog = () => {
    showTokenInput.value = true;
};

const submitToken = async () => {
    if (!tokenInput.value.trim()) return;

    // Actualizar token en el store
    publicStore.setAccessToken(tokenInput.value.trim());

    try {
        // Intentar cargar productos con el token
        await loadProducts();
        showTokenInput.value = false;
        tokenInput.value = '';

        toast.add({
            severity: 'success',
            summary: 'Acceso concedido',
            detail: 'Token válido, cargando catálogo...',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Token inválido',
            detail: 'El token proporcionado no es válido',
            life: 3000
        });
    }
};

// Función para detectar token en URL y aplicarlo
const applyUrlToken = () => {
    if (accessToken.value) {
        publicStore.setAccessToken(accessToken.value);
    }
};

// Inicialización
onMounted(async () => {
    // Aplicar token de la URL si existe
    applyUrlToken();

    try {
        if (isSlugRoute.value) {
            // Nueva forma: Inicializar por slug
            await publicStore.initializeCatalog(slug.value, accessToken.value);
        } else if (isLegacyRoute.value) {
            // Forma legacy: Mantener retrocompatibilidad
            await publicStore.initializeStore(warehouseId.value, companyId.value);
        }



        // Actualizar SEO después de cargar los datos
        updateSEO();
        updateStructuredData();
    } catch (error) {
        if (error.message?.includes('403')) {
            // Si requiere token, mostrar el diálogo
            showTokenDialog();
        }
    }
});
// 🛒 Lógica de Carrito para WhatsApp
const cart = ref([]);
const isCartVisible = ref(false);

// Verificar si un producto está en el carrito
const isInCart = (productId) => {
    return cart.value.some(item => item.product.id === productId);
};

// Obtener cantidad en carrito
const getCartQuantity = (productId) => {
    const item = cart.value.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
};

// Agregar al carrito
const addToCart = (product) => {
    const existingItem = cart.value.find(item => item.product.id === product.id);
    
    if (existingItem) {
        existingItem.quantity++;
        toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Cantidad actualizada en la lista', life: 1500 });
    } else {
        cart.value.push({ product, quantity: 1 });
        toast.add({ severity: 'success', summary: 'Agregado', detail: 'Producto agregado a la lista', life: 1500 });
    }
};

// Remover del carrito
const removeFromCart = (productId) => {
    const index = cart.value.findIndex(item => item.product.id === productId);
    if (index !== -1) {
        cart.value.splice(index, 1);
        toast.add({ severity: 'info', summary: 'Removido', detail: 'Producto quitado de la lista', life: 1500 });
    }
};

// Actualizar cantidad
const updateQuantity = (productId, delta) => {
    const item = cart.value.find(item => item.product.id === productId);
    if (item) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            // Confirmar eliminación si llega a 0? Por ahora solo lo dejamos en 1 o removemos
             removeFromCart(productId);
        }
    }
};

// Calcular total del carrito
const cartTotal = computed(() => {
    return cart.value.reduce((total, item) => {
        return total + (publicStore.getProductPrice(item.product) * item.quantity);
    }, 0);
});

// Total de items
const cartItemsCount = computed(() => {
    return cart.value.reduce((total, item) => total + item.quantity, 0);
});

// Abrir modal del carrito
const openCartModal = () => {
    isCartVisible.value = true;
};

// Generar mensaje y enviar a WhatsApp
const sendCartToWhatsApp = () => {
    if (cart.value.length === 0) return;

    // Obtener número de WhatsApp de la empresa
    const whatsappLink = socialMediaLinks.value.find(link => link.key === 'whatsapp');
    if (!whatsappLink) {
        toast.add({ severity: 'warn', summary: 'No disponible', detail: 'La empresa no tiene WhatsApp configurado', life: 3000 });
        return;
    }

    // Construir mensaje
    let message = `Hola *${company.value?.name || 'Tienda'}*, me gustaría realizar el siguiente pedido:\n\n`;
    
    cart.value.forEach(item => {
        const price = publicStore.getProductPrice(item.product);
        const subtotal = price * item.quantity;
        message += `▪️ ${item.quantity} x ${item.product.name}\n`;
        // Solo mostrar precio si está habilitado en la config
        if (showPrices.value) {
           message += `   (Unid: ${publicStore.formatPrice(price)} - Sub: ${publicStore.formatPrice(subtotal)})\n`;
        }
    });

    if (showPrices.value) {
        message += `\n*Total Aprox:* ${publicStore.formatPrice(cartTotal.value)}`;
    }
    
    message += `\n\nQuedo atento a su confirmación y métodos de pago.`;

    // Extraer número limpio
    const phoneNumber = whatsappLink.url.split('wa.me/')[1];
    
    // Abrir WhatsApp con el mensaje
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

</script>

<template>
    <div class="store-page">
        <Toast />

        <!-- Header de la tienda -->
        <header class="store-header">
            <div class="container">
                <div class="header-content">
                    <div class="logo-section">
                        <img v-if="company?.logo && isValidImageUrl(company.logo) && !logoError" :src="company.logo" alt="Logo de la empresa" class="company-logo" @error="logoError = true" @load="logoError = false" />
                        <div v-else class="default-logo">
                            <i class="pi pi-shopping-bag"></i>
                        </div>
                    </div>
                    <div class="store-info">
                        <h1 class="store-title">
                            {{ company?.name || 'Catálogo de Productos' }}
                        </h1>
                        <p class="store-description" v-if="warehouse?.address">
                            <i class="pi pi-map-marker"></i>
                            {{ warehouse.address }}
                        </p>
                        <div class="product-count">
                            <i class="pi pi-box"></i>
                            <span v-if="searchQuery || selectedCategory"> {{ products.length }} productos encontrados </span>
                            <span v-else> {{ totalProducts }} productos disponibles </span>
                        </div>
                    </div>
                    <div class="header-actions">
                        <!-- Socials en Header -->
                        <div class="header-socials" v-if="socialMediaLinks.length > 0">
                            <a 
                                v-for="social in socialMediaLinks" 
                                :key="social.key"
                                :href="social.url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="header-social-link"
                                :title="social.label"
                                :style="{ 
                                    backgroundColor: social.color,
                                    borderColor: social.color
                                }"
                                v-tooltip.bottom="social.label"
                            >
                                <i :class="social.icon"></i>
                            </a>
                        </div>
                        
                        <Button icon="pi pi-filter" label="Filtros" @click="showFilters = !showFilters" class="filter-toggle" />
                        
                        <!-- Botón Ver Carrito -->
                        <Button 
                            v-if="cartItemsCount > 0"
                            icon="pi pi-shopping-cart" 
                            :label="`Ver Pedido (${cartItemsCount})`" 
                            class="whatsapp-cart-btn"
                            @click="openCartModal"
                            severity="success"
                        />
                    </div>
                </div>
            </div>
        </header>

        <main class="container">
            <div class="store-content">
                <!-- Barra de búsqueda y filtros -->
                <div class="search-section">
                    <div class="search-bar">
                        <i class="pi pi-search search-icon"></i>
                        <InputText v-model="searchQuery" placeholder="Buscar productos por nombre, SKU o código..." class="search-input" />
                    </div>

                    <!-- Panel de filtros colapsable -->
                    <transition name="slide-down">
                        <div v-if="showFilters" class="filters-panel">
                            <div class="filter-group">
                                <label class="filter-label">Categoría:</label>
                                <Select v-model="selectedCategory" :options="categoryStats" optionLabel="name" optionValue="id" placeholder="Todas las categorías" showClear class="filter-dropdown">
                                    <template #option="slotProps">
                                        <div class="category-option">
                                            <span class="category-name">{{ slotProps.option.name }}</span>
                                            <span class="category-count">({{ slotProps.option.productCount }})</span>
                                        </div>
                                    </template>
                                </Select>
                            </div>

                            <!-- Chips de categorías populares -->
                            <div class="category-chips" v-if="categoryStats.length > 1">
                                <label class="filter-label">Categorías populares:</label>
                                <div class="chips-container">
                                    <Chip
                                        v-for="category in categoryStats.slice(0, 6)"
                                        :key="category.id"
                                        :label="`${category.name} (${category.productCount})`"
                                        :class="{ selected: selectedCategory === category.id }"
                                        @click="toggleCategoryFilter(category.id)"
                                        class="category-chip"
                                    />
                                </div>
                            </div>

                            <div class="filter-actions">
                                <Button label="Limpiar filtros" text size="small" @click="clearFilters" icon="pi pi-times" />
                            </div>
                        </div>
                    </transition>
                </div>

                <!-- Grid de productos -->
                <div v-if="loading" class="loading-section">
                    <div class="loading-grid">
                        <div v-for="i in 9" :key="i" class="product-skeleton">
                            <Skeleton width="100%" height="180px" class="mb-2" />
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
                        <p v-if="searchQuery || selectedCategory">Intenta ajustar tus filtros de búsqueda.</p>
                        <p v-else>Aún no hay productos disponibles en este catálogo.</p>
                        <Button v-if="searchQuery || selectedCategory" label="Limpiar filtros" @click="clearFilters" class="mt-3" icon="pi pi-times" />
                    </div>
                </div>

                <div v-else class="products-grid">
                    <router-link v-for="product in products" :key="product.id" :to="getProductRoute(product.id)" class="product-card">
                        <!-- Imagen del producto -->
                        <!-- Imagen del producto -->
                        <div class="product-image">
                            <img :src="publicStore.getProductImage(product)" :alt="product.name" @error="$event.target.src = publicStore.generateProductAvatar(product.name)" />
                            <div v-if="publicStore.getProductStock(product) <= 0" class="out-of-stock-badge">Agotado</div>
                            <div v-else-if="publicStore.getProductBatch(product) && publicStore.getProductBatch(product).days_to_expire <= 7" class="expiry-badge">Vence pronto</div>
                            
                            <!-- Botón Agregar a Lista -->
                            <!-- Botón Agregar a Lista -->
                            <Button 
                                class="add-to-cart-btn p-button-rounded"
                                :class="isInCart(product.id) ? 'p-button-success' : 'p-button-secondary'"
                                @click.prevent="addToCart(product)"
                                v-tooltip.top="isInCart(product.id) ? 'Agregar otro' : 'Agregar a la lista'"
                            >
                                <i :class="isInCart(product.id) ? 'pi pi-plus' : 'pi pi-cart-plus'" style="font-size: 1.25rem;"></i>
                                <Badge v-if="isInCart(product.id)" :value="getCartQuantity(product.id)" severity="danger" class="absolute -top-2 -right-2"></Badge>
                            </Button>
                        </div>

                        <!-- Contenido del producto -->
                        <div class="product-content">
                            <div class="product-category">
                                {{ publicStore.getProductCategory(product)?.name || 'Sin categoría' }}
                            </div>

                            <h3 class="product-name">{{ product.name }}</h3>

                            <div class="product-description" v-if="product.description">
                                {{ product.description }}
                            </div>

                            <div class="product-footer">
                                <div class="price-section" v-if="showPrices">
                                    <span class="current-price">
                                        {{ formatPrice(publicStore.getProductPrice(product)) }}
                                    </span>
                                    <span class="per-unit">/ {{ publicStore.getProductUnit(product).symbol }}</span>
                                </div>

                                <div class="stock-info" v-if="showStock">
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
                                        <span v-else>{{ publicStore.getProductStock(product) }}</span>
                                    </div>
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
        </main>

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
                            <p>&copy; 2024 {{ company?.name || 'Tienda' }}. Catálogo de productos en línea.</p>
                        </div>
                    </div>
                    <div class="footer-brand">
                        <span class="powered-by"> Powered by <strong>AlmaZen</strong> </span>
                    </div>
                </div>
            </div>
        </footer>

        <!-- 🆕 Dialog: Token de Acceso -->
        <Dialog v-model:visible="showTokenInput" modal header="Token de Acceso Requerido" :style="{ width: '90vw', maxWidth: '500px' }" :closable="false">
            <template #default>
                <div class="space-y-4">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-700">
                        <div class="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                            <i class="pi pi-lock"></i>
                            <span class="font-medium">Catálogo Protegido</span>
                        </div>
                        <p class="text-sm text-blue-700 dark:text-blue-300">Este catálogo requiere un token de acceso para visualizar los productos. Por favor, ingresa el token proporcionado.</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Token de Acceso </label>
                        <InputText v-model="tokenInput" placeholder="Ingresa tu token de acceso" class="w-full" @keyup.enter="submitToken" />
                        <small class="text-gray-500 dark:text-gray-400 mt-1 block"> El token es proporcionado por el propietario del catálogo </small>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Acceder" @click="submitToken" :disabled="!tokenInput.trim()" icon="pi pi-key" />
                </div>
            </template>
        </Dialog>

        <!-- 🛒 Modal de Carrito -->
        <Dialog v-model:visible="isCartVisible" modal header="Tu Pedido" :style="{ width: '90vw', maxWidth: '600px' }" :breakpoints="{ '960px': '75vw', '641px': '100vw' }">
            <div class="cart-container">
                <div v-if="cart.length === 0" class="empty-cart-message">
                    <i class="pi pi-shopping-cart text-4xl text-gray-400 mb-2"></i>
                    <p>Tu lista está vacía</p>
                    <Button label="Ver productos" text @click="isCartVisible = false" />
                </div>
                
                <div v-else class="cart-items">
                    <div v-for="item in cart" :key="item.product.id" class="cart-item">
                        <div class="cart-item-image">
                            <img :src="publicStore.getProductImage(item.product)" :alt="item.product.name" />
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-name">{{ item.product.name }}</h4>
                            <div class="cart-item-price" v-if="showPrices">
                                {{ formatPrice(publicStore.getProductPrice(item.product)) }}
                            </div>
                        </div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <Button icon="pi pi-minus" class="p-button-rounded p-button-text p-button-sm" @click="updateQuantity(item.product.id, -1)" />
                                <span class="quantity-value">{{ item.quantity }}</span>
                                <Button icon="pi pi-plus" class="p-button-rounded p-button-text p-button-sm" @click="updateQuantity(item.product.id, 1)" />
                            </div>
                            <div class="item-subtotal" v-if="showPrices">
                                {{ formatPrice(publicStore.getProductPrice(item.product) * item.quantity) }}
                            </div>
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger p-button-sm ml-2" @click="removeFromCart(item.product.id)" />
                        </div>
                    </div>
                </div>

                <div class="cart-summary" v-if="cart.length > 0">
                    <div class="summary-total" v-if="showPrices">
                        <span>Total Estimado:</span>
                        <span class="total-amount">{{ formatPrice(cartTotal) }}</span>
                    </div>
                    <div class="summary-actions">
                         <Button label="Seguir comprando" icon="pi pi-arrow-left" text @click="isCartVisible = false" class="p-button-secondary" />
                        <Button 
                            label="Enviar Pedido por WhatsApp" 
                            icon="pi pi-whatsapp" 
                            class="p-button-success w-full sm:w-auto" 
                            @click="sendCartToWhatsApp" 
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
/* === LAYOUT PRINCIPAL === */
.store-page {
    min-height: 100vh;
    background: var(--surface-50);
    display: flex;
    flex-direction: column;
    color: var(--text-color);
}

.dark .store-page {
    background: var(--surface-900);
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* === HEADER === */
.store-header {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    padding: 2rem 0;
    margin-bottom: 2rem;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.dark .store-header {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
}

.logo-section {
    display: flex;
    align-items: center;
    margin-right: 1.5rem;
}

.company-logo {
    height: 50px;
    width: auto;
    object-fit: contain;
    border-radius: 0.25rem;
}

.default-logo {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--primary-500, #10b981), var(--primary-600, #059669));
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb, 16, 185, 129), 0.3);
    transition: transform 0.2s ease;
}

.default-logo:hover {
    transform: scale(1.05);
}

.dark .default-logo {
    background: linear-gradient(135deg, var(--primary-400), var(--primary-500));
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.4);
}

.store-info {
    flex: 1;
}

.store-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    line-height: 1.2;
    color: var(--text-color);
}

.store-description {
    font-size: 1rem;
    color: var(--text-color-secondary);
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.product-count {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.filter-toggle {
    background: var(--primary-color);
    color: white !important;
    border: none;
    font-weight: 600;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
}

.filter-toggle:hover {
    background: var(--primary-600);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.3);
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
    padding: 1rem 1rem 1rem 3.5rem;
    font-size: 1.125rem;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    transition: all 0.2s ease;
    background: var(--surface-card);
}

.search-input:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-100);
}

.dark .search-input:focus {
    box-shadow: 0 0 0 3px var(--primary-900);
}

.search-icon {
    position: absolute;
    left: 1.25rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-color-secondary);
    pointer-events: none;
    font-size: 1.25rem;
}

.filters-panel {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.filter-label {
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
}

.filter-dropdown {
    min-width: 250px;
}

.filter-actions {
    margin-left: auto;
}

/* === CHIPS DE CATEGORÍAS === */
.category-chips {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
}

.chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.category-chip {
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--surface-100);
    color: var(--text-color-secondary);
    border: 1px solid var(--surface-border);
    font-weight: 500;
}

.category-chip:hover {
    background: var(--surface-200);
    transform: translateY(-2px);
    color: var(--text-color);
}

.category-chip.selected {
    background: var(--primary-color);
    color: var(--primary-color-text);
    border-color: var(--primary-color);
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
    font-weight: 500;
}

.category-count {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-left: 0.5rem;
}

/* === LOADING === */
.loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.product-skeleton {
    background: var(--surface-card);
    border-radius: 1rem;
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
    max-width: 450px;
    background: var(--surface-card);
    padding: 3rem;
    border-radius: 1rem;
    border: 1px solid var(--surface-border);
}

.empty-icon {
    font-size: 4rem;
    color: var(--primary-color);
    margin-bottom: 1.5rem;
}

.empty-content h3 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.75rem;
}

.empty-content p {
    color: var(--text-color-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

/* === GRID DE PRODUCTOS === */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.product-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.dark .product-card {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.product-card:hover {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transform: translateY(-5px);
    border-color: var(--primary-200);
}

.dark .product-card:hover {
    border-color: var(--primary-700);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.product-image {
    position: relative;
    width: 100%;
    height: 180px;
    overflow: hidden;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    background-color: var(--surface-50);
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dark .product-image img {
    background-color: var(--surface-800);
}

.product-card:hover .product-image img {
    transform: scale(1.1);
}

.out-of-stock-badge,
.expiry-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    backdrop-filter: blur(5px);
}

.out-of-stock-badge {
    background: rgba(239, 68, 68, 0.8); /* red-500 */
}

.expiry-badge {
    background: rgba(245, 158, 11, 0.8); /* amber-500 */
}

.product-content {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.product-category {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--primary-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
}

.product-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
    min-height: 2.8em; /* for 2 lines */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.product-description {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    line-height: 1.5;
    margin-bottom: 1rem;
    flex-grow: 1;
    min-height: 3em; /* for 2 lines */
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
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-color);
}

.per-unit {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.stock-badge {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.85rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
}

.stock-badge.in-stock {
    background: var(--green-100);
    color: var(--green-800);
}
.dark .stock-badge.in-stock {
    background: var(--green-900);
    color: var(--green-100);
}

.stock-badge.low-stock {
    background: var(--yellow-100);
    color: var(--yellow-800);
}
.dark .stock-badge.low-stock {
    background: var(--yellow-900);
    color: var(--yellow-100);
}

.stock-badge.out-of-stock {
    background: var(--red-100);
    color: var(--red-800);
}
.dark .stock-badge.out-of-stock {
    background: var(--red-900);
    color: var(--red-100);
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
    background: var(--surface-card);
    border-top: 1px solid var(--surface-border);
    padding: 2.5rem 0;
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

.company-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
}

.company-details {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0 0 1.5rem 0;
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
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.contact-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
}

.contact-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-color-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s ease;
}

.contact-link:hover {
    color: var(--primary-color);
}

.fallback-info {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
}

.footer-brand {
    text-align: right;
}

.powered-by {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

/* === TRANSICIONES === */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-15px);
}


/* === HEADER ACTIONS & SOCIALS === */
.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap; /* Permitir wrap en móviles */
}

.header-socials {
    display: flex;
    gap: 0.5rem;
    margin-right: 0.5rem;
    align-items: center;
}

.header-social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    color: white;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    font-size: 1.25rem;
    text-decoration: none;
    border: 2px solid transparent;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.header-social-link:hover {
    transform: translateY(-5px) scale(1.1);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    filter: brightness(1.1);
}

.dark .header-social-link {
    background: var(--surface-800);
    border-color: var(--surface-700);
}

/* === WHATSAPP CART BUTTON === */
.whatsapp-cart-btn {
    background: #25D366 !important; /* WhatsApp Green */
    border: 1px solid #25D366 !important;
    color: white !important;
    font-weight: 700 !important;
    border-radius: 2rem !important; /* Pill shape */
    padding: 0.6rem 1.25rem !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3) !important;
}

.whatsapp-cart-btn:hover {
    background: #1ebc57 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4) !important;
}

/* === PRODUCT ADD BUTTON === */
.add-to-cart-btn {
    position: absolute !important;
    bottom: 1rem;
    right: 1rem;
    width: 3rem !important;
    height: 3rem !important;
    padding: 0 !important;
    z-index: 10; /* Asegurar que esté sobre el link */
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    opacity: 0.9;
    transition: all 0.2s ease !important;
}

.add-to-cart-btn:hover {
    opacity: 1;
    transform: scale(1.1);
}

.product-image {
    position: relative; /* Para posicionar el botón absoluto */
    overflow: hidden; /* Mantener bordes redondeados */
}

/* === REDES SOCIALES (Footer Legacy - Opcional mantener o eliminar css viejo) === */
.social-media-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.social-title {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.social-icons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.social-icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--surface-hover);
    color: var(--text-color-secondary);
    transition: all 0.3s ease;
    font-size: 1.25rem;
    text-decoration: none;
}

.social-icon-link:hover {
    background: var(--hover-color, var(--primary-color));
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dark .social-icon-link {
    background: var(--surface-overlay);
}

/* === RESPONSIVE === */
@media (max-width: 992px) {
    .container {
        padding: 0 1.5rem;
    }
    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
}

@media (max-width: 768px) {
    .store-title {
        font-size: 1.75rem;
    }

    .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .logo-section {
        margin-right: 0;
        margin-bottom: 0.5rem;
    }

    .header-actions {
        align-self: flex-end;
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

    .footer-content {
        flex-direction: column;
        text-align: center;
        align-items: center;
        gap: 2rem;
    }

    .footer-info,
    .company-contact,
    .contact-links,
    .footer-brand {
        align-items: center;
        justify-content: center;
        text-align: center;
    }
}

@media (max-width: 576px) {
    .container {
        padding: 0 1rem;
    }

    .store-header {
        padding: 1.5rem 0;
    }

    .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
    }

    .product-card {
        border-radius: 0.75rem;
    }

    .product-content {
        padding: 1rem;
    }

    .search-input {
        font-size: 1rem;
        padding-left: 3rem;
    }

    .search-icon {
        font-size: 1rem;
        left: 1rem;
    }
}
/* === CART MODAL === */
.cart-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.empty-cart-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: var(--text-color-secondary);
    gap: 1rem;
}

.cart-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.cart-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-50);
    border-radius: 0.75rem;
    align-items: center;
    border: 1px solid var(--surface-border);
}

.dark .cart-item {
    background: var(--surface-800);
}

.cart-item-image {
    width: 60px;
    height: 60px;
    border-radius: 0.5rem;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid var(--surface-border);
}

.cart-item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.cart-item-details {
    flex: 1;
}

.cart-item-name {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
}

.cart-item-price {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.cart-item-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    background: var(--surface-0);
    border-radius: 2rem;
    padding: 0.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border: 1px solid var(--surface-border);
}

.dark .quantity-controls {
    background: var(--surface-900);
}

.quantity-value {
    min-width: 2rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.9rem;
}

.item-subtotal {
    font-weight: 600;
    min-width: 5rem;
    text-align: right;
    display: none; /* Ocultar en móviles muy pequeños */
}

@media (min-width: 640px) {
    .item-subtotal {
        display: block;
    }
}

.cart-summary {
    border-top: 1px solid var(--surface-border);
    padding-top: 1.5rem;
    margin-top: 0.5rem;
}

.summary-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
}

.summary-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
}

@media (min-width: 640px) {
    .summary-actions {
        flex-direction: row;
        justify-content: space-between;
    }
}
</style>
