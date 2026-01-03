<script setup>
import { usePublicStore } from '@/stores/publicStore';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const publicStore = usePublicStore();

// Estado reactivo
const product = ref(null);
const loading = ref(false);
const selectedImage = ref(null); // Imagen seleccionada para el visor

// Propiedad computada para obtener todas las imágenes (Principal + Galería)
const productImages = computed(() => {
    if (!product.value) return [];
    
    const mainImage = {
        id: 'main',
        image_url: publicStore.getProductImage(product.value),
        is_primary: true
    };
    
    const gallery = product.value.gallery || [];
    
    return [mainImage, ...gallery];
});

// Imagen actual a mostrar (seleccionada o default principal)
const currentImage = computed(() => {
    return selectedImage.value || productImages.value[0]?.image_url;
});

// Resetear selección al cambiar de producto
watch(product, () => {
    selectedImage.value = null;
});

// Estados computados - Detectar tipo de URL (slug vs legacy)
const isSlugRoute = computed(() => route.name === 'catalogProductDetail');
const isLegacyRoute = computed(() => route.name === 'publicProductDetail');

// Parámetros según el tipo de ruta
const slug = computed(() => route.params.slug);
const companyId = computed(() => route.params.companyId);
const warehouseId = computed(() => route.params.warehouseId);
const productId = computed(() => route.params.productId);
const accessToken = computed(() => route.query.token);

// Usar las utilidades del store
const formatPrice = (price) => publicStore.formatPrice(price);
const formatDate = (dateString) => publicStore.formatDate(dateString);

// Cargar producto
const fetchProduct = async () => {
    loading.value = true;
    try {
        let foundProduct = null;

        if (isSlugRoute.value) {
            // Nueva forma: Usando slug amigable
            foundProduct = await publicStore.findProductBySlug(slug.value, productId.value, accessToken.value);
        } else if (isLegacyRoute.value) {
            // Forma legacy: Mantener retrocompatibilidad
            foundProduct = await publicStore.findProductById(warehouseId.value, productId.value, companyId.value);
        }

        if (foundProduct) {
            console.log('📦 [DEBUG] Product Data:', foundProduct);
            console.log('🖼️ [DEBUG] Main Image URL:', foundProduct.image_url);
            console.log('📸 [DEBUG] Gallery:', foundProduct.gallery);
            
            product.value = foundProduct;
            // Actualizar SEO después de cargar el producto
            updateSEO();
            updateStructuredData();
        } else {
            // Si no se encuentra el producto, redirigir al catálogo
            router.push(getCatalogRoute());
            toast.add({
                severity: 'warn',
                summary: 'Producto no encontrado',
                detail: 'El producto que buscas no está disponible',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error fetching product:', error);

        let errorMessage = 'No se pudo cargar el producto';

        if (error.message?.includes('403') && isSlugRoute.value) {
            errorMessage = 'Token de acceso requerido o inválido';
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });

        // Redirigir al catálogo en caso de error
        router.push(getCatalogRoute());
    } finally {
        loading.value = false;
    }
};

// 🆕 Nuevo: Generar ruta de catálogo según el tipo de URL
const getCatalogRoute = () => {
    if (isSlugRoute.value) {
        // Nueva forma: URL con slug
        return {
            name: 'catalogHome',
            params: { slug: slug.value },
            query: accessToken.value ? { token: accessToken.value } : {}
        };
    } else {
        // Forma legacy
        return {
            name: 'publicStore',
            params: { companyId: companyId.value, warehouseId: warehouseId.value }
        };
    }
};

// Volver al catálogo
const goBack = () => {
    router.push(getCatalogRoute());
};

// SEO dinámico
const seoTitle = computed(() => {
    if (!product.value) return 'Detalle del Producto';
    return `${product.value.name} - Detalle del Producto`;
});

const seoDescription = computed(() => {
    if (!product.value) return 'Ver detalles del producto';

    const description = product.value.description || product.value.name;
    const price = formatPrice(publicStore.getProductPrice(product.value));
    const stock = publicStore.getProductStock(product.value) > 0 ? 'En stock' : 'Agotado';

    return `${description}. Precio: ${price}. Estado: ${stock}. SKU: ${product.value.sku}`;
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
    updateMetaTag('meta[property="og:type"]', 'product');
    updateMetaTag('meta[property="og:image"]', publicStore.getProductImage(product.value));
    updateMetaTag('meta[name="robots"]', 'index, follow');
};

// Structured Data para SEO
const updateStructuredData = () => {
    // Remover structured data existente
    const existingScript = document.querySelector('script[type="application/ld+json"][data-product-seo]');
    if (existingScript) {
        existingScript.remove();
    }

    // Agregar structured data del producto
    if (product.value) {
        const productData = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.value.name,
            description: product.value.description || product.value.name,
            sku: product.value.sku,
            image: publicStore.getProductImage(product.value),
            brand: product.value.brand
                ? {
                      '@type': 'Brand',
                      name: product.value.brand
                  }
                : undefined,
            category: publicStore.getProductCategory(product.value)?.name,
            offers: {
                '@type': 'Offer',
                price: publicStore.getProductPrice(product.value),
                priceCurrency: 'PEN',
                availability: publicStore.getProductStock(product.value) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition'
            },
            additionalProperty: [
                {
                    '@type': 'PropertyValue',
                    name: 'Stock disponible',
                    value: publicStore.getProductStock(product.value)
                },
                publicStore.getProductBatch(product.value)
                    ? {
                          '@type': 'PropertyValue',
                          name: 'Código de lote',
                          value: publicStore.getProductBatch(product.value).batch_code
                      }
                    : null,
                publicStore.getProductBatch(product.value) && publicStore.getProductBatch(product.value).expiry_date
                    ? {
                          '@type': 'PropertyValue',
                          name: 'Fecha de vencimiento',
                          value: publicStore.getProductBatch(product.value).expiry_date
                      }
                    : null
            ].filter(Boolean)
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-product-seo', 'true');
        script.textContent = JSON.stringify(productData);
        document.head.appendChild(script);
    }
};

// Watchers para SEO
watch(
    product,
    () => {
        if (product.value) {
            updateSEO();
            updateStructuredData();
        }
    },
    { flush: 'post' }
);

// Inicialización
onMounted(() => {
    // Aplicar token de la URL si existe (para rutas con slug)
    if (accessToken.value && isSlugRoute.value) {
        publicStore.setAccessToken(accessToken.value);
    }

    // Cargar el producto específico
    fetchProduct();
});
</script>

<template>
    <div class="product-detail-page">
        <Toast />

        <!-- Header compacto -->
        <div class="detail-header">
            <div class="container">
                <Button icon="pi pi-arrow-left" text @click="goBack" class="back-button" size="small" />
                <span class="breadcrumb">Catálogo / Producto</span>
            </div>
        </div>

        <div v-if="loading" class="loading-section">
            <div class="container">
                <div class="product-skeleton">
                    <div class="skeleton-content">
                        <div class="skeleton-image">
                            <Skeleton width="100%" height="400px" />
                        </div>
                        <div class="skeleton-info">
                            <Skeleton width="70%" height="2rem" class="mb-3" />
                            <Skeleton width="40%" height="1.5rem" class="mb-2" />
                            <Skeleton width="90%" height="1rem" class="mb-2" />
                            <Skeleton width="85%" height="1rem" class="mb-2" />
                            <Skeleton width="50%" height="1.25rem" class="mb-3" />
                            <Skeleton width="30%" height="2.5rem" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="product" class="product-detail">
            <div class="container">
                <div class="product-content">
                    <!-- Imagen del producto -->
                    <!-- Imagen del producto y Galería -->
                    <div class="product-image-section">
                        <div class="main-image">
                            <!-- Image PrimeVue para vista previa (vistoso) -->
                            <Image :src="currentImage" :alt="product.name" preview imageClass="w-full h-full object-cover">
                                <template #error>
                                    <img :src="publicStore.generateProductAvatar(product.name)" :alt="product.name" class="w-full h-full object-cover" />
                                </template>
                            </Image>
                            
                            <div v-if="publicStore.getProductStock(product) <= 0" class="status-overlay out-of-stock">
                                <i class="pi pi-times-circle"></i>
                                <span>Agotado</span>
                            </div>
                            <div v-else-if="publicStore.getProductBatch(product) && publicStore.getProductBatch(product).days_to_expire <= 7" class="status-overlay expiry">
                                <i class="pi pi-calendar"></i>
                                <span>{{ publicStore.getProductBatch(product).days_to_expire }}d</span>
                            </div>
                        </div>

                        <!-- Miniaturas de Galería -->
                        <div class="gallery-thumbs" v-if="productImages.length > 1">
                            <div 
                                v-for="(img, index) in productImages" 
                                :key="img.id || index"
                                class="thumb-item"
                                :class="{ 'active': currentImage === img.image_url }"
                                @click="selectedImage = img.image_url"
                            >
                                <img :src="img.image_url" :alt="img.alt_text || product.name" />
                            </div>
                        </div>
                    </div>

                    <!-- Información del producto -->
                    <div class="product-info-section">
                        <!-- Header del producto -->
                        <div class="product-header">
                            <div class="product-meta">
                                <span class="category-badge">{{ publicStore.getProductCategory(product)?.name || 'Sin categoría' }}</span>
                                <span v-if="product.brand" class="brand-badge">{{ product.brand }}</span>
                            </div>
                            <h1 class="product-title">{{ product.name }}</h1>
                            <p v-if="product.description" class="product-description">{{ product.description }}</p>
                        </div>

                        <!-- Cards de información compacta -->
                        <div class="info-cards">
                            <!-- Card de precio y stock -->
                            <div class="info-card price-card">
                                <div class="card-header">
                                    <i class="pi pi-dollar"></i>
                                    <span>Precio</span>
                                </div>
                                <div class="price-value">{{ formatPrice(publicStore.getProductPrice(product)) }}</div>
                                <div class="price-unit">por {{ publicStore.getProductUnit(product).symbol }}</div>
                            </div>

                            <!-- Card de stock -->
                            <div
                                class="info-card stock-card"
                                :class="{
                                    'out-of-stock': publicStore.getProductStock(product) <= 0,
                                    'low-stock': publicStore.getProductStock(product) > 0 && publicStore.getProductStock(product) <= 5,
                                    'in-stock': publicStore.getProductStock(product) > 5
                                }"
                            >
                                <div class="card-header">
                                    <i class="pi pi-box"></i>
                                    <span>Stock</span>
                                </div>
                                <div class="stock-value">{{ publicStore.getProductStock(product) }}</div>
                                <div class="stock-unit">unidades</div>
                            </div>
                        </div>

                        <!-- Información técnica compacta -->
                        <div class="tech-info">
                            <div class="tech-grid">
                                <div class="tech-item">
                                    <label>SKU</label>
                                    <span>{{ product.sku }}</span>
                                </div>
                                <div v-if="product.barcode" class="tech-item">
                                    <label>Código</label>
                                    <span>{{ product.barcode }}</span>
                                </div>
                                <div class="tech-item">
                                    <label>Unidad</label>
                                    <span>{{ publicStore.getProductUnit(product).name }}</span>
                                </div>
                                <div v-if="product.minimum_stock" class="tech-item">
                                    <label>Stock mín.</label>
                                    <span>{{ product.minimum_stock }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Información del lote (si existe) -->
                        <div v-if="publicStore.getProductBatch(product)" class="batch-info">
                            <h4><i class="pi pi-calendar"></i> Lote: {{ publicStore.getProductBatch(product).batch_code }}</h4>
                            <div class="batch-details">
                                <div class="batch-item">
                                    <span>Vence: {{ formatDate(publicStore.getProductBatch(product).expiry_date) }}</span>
                                    <span
                                        class="days-left"
                                        :class="{
                                            warning: publicStore.getProductBatch(product).days_to_expire <= 7,
                                            danger: publicStore.getProductBatch(product).days_to_expire <= 3
                                        }"
                                        >{{ publicStore.getProductBatch(product).days_to_expire }} días</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer compacto -->
        <footer class="product-footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-main">
                        <span v-if="publicStore.warehouseInfo" class="warehouse-name">{{ publicStore.warehouseInfo.name }}</span>
                        <span v-else class="fallback-name">{{ publicStore.companyInfo?.name || 'Tienda' }}</span>
                        <span class="separator">•</span>
                        <span class="powered-by">Powered by <strong>AlmaZen</strong></span>
                    </div>
                    <div v-if="publicStore.companyInfo" class="footer-contacts">
                        <a v-if="publicStore.companyInfo.phone" :href="`tel:${publicStore.companyInfo.phone}`" class="contact-link">
                            <i class="pi pi-phone"></i>
                        </a>
                        <a v-if="publicStore.companyInfo.email" :href="`mailto:${publicStore.companyInfo.email}`" class="contact-link">
                            <i class="pi pi-envelope"></i>
                        </a>
                        <a v-if="publicStore.companyInfo.website" :href="publicStore.companyInfo.website" target="_blank" class="contact-link">
                            <i class="pi pi-globe"></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
/* === LAYOUT === */
.product-detail-page {
    min-height: 100vh;
    background: var(--surface-ground);
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

/* === HEADER COMPACTO === */
.detail-header {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    padding: 0.75rem 0;
    margin-bottom: 1.5rem;
}

.detail-header .container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.back-button {
    color: var(--primary-color);
}

.breadcrumb {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

/* === LOADING === */
.loading-section {
    padding: 2rem 0;
}

.product-skeleton {
    background: var(--surface-card);
    border-radius: 1rem;
    padding: 2rem;
}

.skeleton-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
}

.skeleton-image {
    width: 100%;
}

/* === PRODUCTO === */
.product-detail {
    padding: 0 0 2rem 0;
}

.product-content {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: 2.5rem;
    align-items: start;
}

/* === IMAGEN COMPACTA === */
.product-image-section {
    position: sticky;
    top: 1rem;
    height: fit-content;
}

.main-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 0.75rem;
    overflow: hidden;
    background: var(--surface-100);
    border: 1px solid var(--surface-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.main-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--surface-50);
}

.status-overlay {
    position: absolute;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    backdrop-filter: blur(10px);
}

.status-overlay.out-of-stock {
    background: rgba(239, 68, 68, 0.9);
}

.status-overlay.expiry {
    background: rgba(245, 158, 11, 0.9);
}


/* === MINIATURAS DE GALERÍA === */
.gallery-thumbs {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
}

.thumb-item {
    flex: 0 0 70px;
    height: 70px;
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    opacity: 0.7;
}

.thumb-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.thumb-item:hover {
    opacity: 0.9;
    transform: translateY(-2px);
}

.thumb-item.active {
    border-color: var(--primary-color);
    opacity: 1;
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
}

/* === INFORMACIÓN COMPACTA === */
.product-info-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.product-header {
    background: var(--surface-card);
    padding: 1.5rem;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
}

.product-meta {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.category-badge,
.brand-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.category-badge {
    background: var(--primary-500);
    color: white;
}

.brand-badge {
    background: var(--surface-200);
    color: var(--text-color);
}

.product-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0 0 0.75rem 0;
    line-height: 1.2;
}

.product-description {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--text-color-secondary);
    margin: 0;
}

/* === CARDS DE INFORMACIÓN === */
.info-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.info-card {
    background: var(--surface-card);
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
    text-align: center;
    transition: all 0.2s ease;
}

.info-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.card-header i {
    font-size: 1rem;
}

.price-card .price-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--primary-600);
    margin-bottom: 0.25rem;
}

.price-card .price-unit {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.stock-card .stock-value {
    font-size: 1.75rem;
    font-weight: 800;
    margin-bottom: 0.25rem;
}

.stock-card .stock-unit {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.stock-card.in-stock {
    border-color: var(--green-200);
    background: linear-gradient(135deg, var(--green-50) 0%, var(--surface-card) 100%);
}

.stock-card.in-stock .stock-value {
    color: var(--green-600);
}

.stock-card.low-stock {
    border-color: var(--yellow-200);
    background: linear-gradient(135deg, var(--yellow-50) 0%, var(--surface-card) 100%);
}

.stock-card.low-stock .stock-value {
    color: var(--yellow-600);
}

.stock-card.out-of-stock {
    border-color: var(--red-200);
    background: linear-gradient(135deg, var(--red-50) 0%, var(--surface-card) 100%);
}

.stock-card.out-of-stock .stock-value {
    color: var(--red-600);
}

/* === INFORMACIÓN TÉCNICA === */
.tech-info {
    background: var(--surface-card);
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
}

.tech-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.tech-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.tech-item label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.tech-item span {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
    font-family: 'JetBrains Mono', 'Courier New', monospace;
}

/* === INFORMACIÓN DEL LOTE === */
.batch-info {
    background: var(--surface-card);
    padding: 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
}

.batch-info h4 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.batch-info h4 i {
    color: var(--primary-color);
}

.batch-details {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.batch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--surface-50);
    border-radius: 0.5rem;
    border: 1px solid var(--surface-border);
}

.batch-item span:first-child {
    font-size: 0.875rem;
    color: var(--text-color);
}

.days-left {
    font-size: 0.875rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    color: var(--green-600);
    background: var(--green-100);
}

.days-left.warning {
    color: var(--yellow-700);
    background: var(--yellow-100);
}

.days-left.danger {
    color: var(--red-700);
    background: var(--red-100);
}

/* === FOOTER COMPACTO === */
.product-footer {
    margin-top: 2rem;
    background: var(--surface-section);
    border-top: 1px solid var(--surface-border);
    padding: 1rem 0;
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.footer-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.warehouse-name,
.fallback-name {
    font-weight: 600;
    color: var(--text-color);
}

.separator {
    color: var(--text-color-secondary);
}

.powered-by {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.footer-contacts {
    display: flex;
    gap: 0.75rem;
}

.contact-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    color: var(--text-color-secondary);
    text-decoration: none;
    transition: all 0.2s ease;
}

.contact-link:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-1px);
}

/* === RESPONSIVE === */
@media (max-width: 1024px) {
    .product-content,
    .skeleton-content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .product-image-section {
        position: static;
        max-width: 500px;
        margin: 0 auto;
    }

    .info-cards {
        grid-template-columns: 1fr;
    }

    .tech-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .container {
        padding: 0 1rem;
    }

    .product-header {
        padding: 1rem;
    }

    .product-title {
        font-size: 1.75rem;
    }

    .info-card {
        padding: 1rem;
    }

    .price-card .price-value,
    .stock-card .stock-value {
        font-size: 1.5rem;
    }

    .tech-info,
    .batch-info {
        padding: 1rem;
    }

    .footer-content {
        flex-direction: column;
        text-align: center;
        align-items: center;
        gap: 1rem;
    }

    .footer-main {
        flex-wrap: wrap;
        justify-content: center;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 0.75rem;
    }

    .detail-header .container {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .product-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .product-title {
        font-size: 1.5rem;
    }

    .card-header {
        font-size: 0.75rem;
    }

    .price-card .price-value,
    .stock-card .stock-value {
        font-size: 1.25rem;
    }
}
</style>
