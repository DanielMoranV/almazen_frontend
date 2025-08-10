<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { usePublicStore } from '@/stores/publicStore';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const publicStore = usePublicStore();

// Estado reactivo
const product = ref(null);
const loading = ref(false);

// Estados computados
const warehouseId = computed(() => route.params.warehouseId);
const productId = computed(() => route.params.productId);

// Usar las utilidades del store
const formatPrice = (price) => publicStore.formatPrice(price);
const formatDate = (dateString) => publicStore.formatDate(dateString);

// Cargar producto
const fetchProduct = async () => {
    loading.value = true;
    try {
        const foundProduct = await publicStore.findProductById(warehouseId.value, productId.value);

        if (foundProduct) {
            product.value = foundProduct;
            // Actualizar SEO después de cargar el producto
            updateSEO();
            updateStructuredData();
        } else {
            // Si no se encuentra el producto, redirigir al catálogo
            router.push({ name: 'publicStore', params: { warehouseId: warehouseId.value } });
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

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });

        // Redirigir al catálogo en caso de error
        router.push({ name: 'publicStore', params: { warehouseId: warehouseId.value } });
    } finally {
        loading.value = false;
    }
};

// Volver al catálogo
const goBack = () => {
    router.push({ name: 'publicStore', params: { warehouseId: warehouseId.value } });
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
    fetchProduct();
});
</script>

<template>
    <div class="product-detail-page">
        <Toast />

        <!-- Header con navegación -->
        <div class="detail-header">
            <div class="container">
                <Button icon="pi pi-arrow-left" label="Volver al catálogo" text @click="goBack" class="back-button" />
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
                    <div class="product-image-section">
                        <div class="main-image">
                            <img :src="publicStore.getProductImage(product)" :alt="product.name" @error="$event.target.src = publicStore.generateProductAvatar(product.name)" />
                            <div v-if="publicStore.getProductStock(product) <= 0" class="out-of-stock-overlay">
                                <div class="out-of-stock-text">
                                    <i class="pi pi-times-circle"></i>
                                    <span>Producto Agotado</span>
                                </div>
                            </div>
                            <div v-else-if="publicStore.getProductBatch(product) && publicStore.getProductBatch(product).days_to_expire <= 7" class="expiry-overlay">
                                <div class="expiry-text">
                                    <i class="pi pi-calendar"></i>
                                    <span>{{ formatDate(publicStore.getProductBatch(product).expiry_date) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Información del producto -->
                    <div class="product-info-section">
                        <!-- Categoría y marca -->
                        <div class="product-meta">
                            <span class="category-badge">
                                {{ publicStore.getProductCategory(product)?.name || 'Sin categoría' }}
                            </span>
                            <span v-if="product.brand" class="brand-badge">
                                <i class="pi pi-tag"></i>
                                {{ product.brand }}
                            </span>
                        </div>

                        <!-- Nombre del producto -->
                        <h1 class="product-title">{{ product.name }}</h1>

                        <!-- Descripción -->
                        <p v-if="product.description" class="product-description">
                            {{ product.description }}
                        </p>

                        <!-- SKU y código de barras -->
                        <div class="product-codes">
                            <div class="code-item">
                                <label>SKU:</label>
                                <span>{{ product.sku }}</span>
                            </div>
                            <div v-if="product.barcode" class="code-item">
                                <label>Código de barras:</label>
                                <span>{{ product.barcode }}</span>
                            </div>
                        </div>

                        <!-- Precio -->
                        <div class="price-section">
                            <div class="current-price">
                                {{ formatPrice(publicStore.getProductPrice(product)) }}
                                <span class="per-unit">/ {{ publicStore.getProductUnit(product).symbol }}</span>
                            </div>
                        </div>

                        <!-- Stock -->
                        <div class="stock-section">
                            <div
                                class="stock-badge"
                                :class="{
                                    'out-of-stock': publicStore.getProductStock(product) <= 0,
                                    'low-stock': publicStore.getProductStock(product) > 0 && publicStore.getProductStock(product) <= 5,
                                    'in-stock': publicStore.getProductStock(product) > 5
                                }"
                            >
                                <i class="pi pi-box"></i>
                                <span v-if="publicStore.getProductStock(product) <= 0">Producto Agotado</span>
                                <span v-else-if="publicStore.getProductStock(product) === 1">{{ publicStore.getProductStock(product) }} unidad disponible</span>
                                <span v-else>{{ publicStore.getProductStock(product) }} unidades disponibles</span>
                            </div>
                        </div>

                        <!-- Información del lote -->
                        <div v-if="publicStore.getProductBatch(product)" class="batch-section">
                            <h3>Información del Lote</h3>
                            <div class="batch-details">
                                <div class="batch-item">
                                    <label>Código de lote:</label>
                                    <span>{{ publicStore.getProductBatch(product).batch_code }}</span>
                                </div>
                                <div class="batch-item">
                                    <label>Fecha de vencimiento:</label>
                                    <span
                                        class="expiry-date"
                                        :class="{
                                            'expiry-warning': publicStore.getProductBatch(product).days_to_expire <= 7,
                                            'expiry-danger': publicStore.getProductBatch(product).days_to_expire <= 3
                                        }"
                                    >
                                        {{ formatDate(publicStore.getProductBatch(product).expiry_date) }}
                                    </span>
                                </div>
                                <div v-if="publicStore.getProductBatch(product).days_to_expire >= 0" class="batch-item">
                                    <label>Días para vencer:</label>
                                    <span>{{ publicStore.getProductBatch(product).days_to_expire }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Información adicional -->
                        <div class="additional-info">
                            <h3>Información Adicional</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Unidad de medida:</label>
                                    <span>{{ publicStore.getProductUnit(product).name }} ({{ publicStore.getProductUnit(product).symbol }})</span>
                                </div>
                                <div class="info-item" v-if="product.minimum_stock">
                                    <label>Stock mínimo:</label>
                                    <span>{{ product.minimum_stock }}</span>
                                </div>
                                <div class="info-item" v-if="product.created_at">
                                    <label>Producto registrado:</label>
                                    <span>{{ new Date(product.created_at).toLocaleDateString('es-ES') }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="product-footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-info">
                        <div v-if="publicStore.companyInfo" class="company-info">
                            <h4 class="company-name">{{ publicStore.companyInfo.name }}</h4>
                            <p class="company-details">{{ publicStore.companyInfo.category }}</p>
                            <div class="company-contact">
                                <p v-if="publicStore.companyInfo.address" class="company-address">
                                    <i class="pi pi-map-marker"></i>
                                    {{ publicStore.companyInfo.address }}
                                </p>
                                <div class="contact-links">
                                    <a v-if="publicStore.companyInfo.phone" :href="`tel:${publicStore.companyInfo.phone}`" class="contact-link">
                                        <i class="pi pi-phone"></i>
                                        {{ publicStore.companyInfo.phone }}
                                    </a>
                                    <a v-if="publicStore.companyInfo.email" :href="`mailto:${publicStore.companyInfo.email}`" class="contact-link">
                                        <i class="pi pi-envelope"></i>
                                        {{ publicStore.companyInfo.email }}
                                    </a>
                                    <a v-if="publicStore.companyInfo.website" :href="publicStore.companyInfo.website" target="_blank" class="contact-link">
                                        <i class="pi pi-globe"></i>
                                        Sitio web
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div v-else class="fallback-info">
                            <p>&copy; 2024 {{ publicStore.warehouseInfo?.name || 'Tienda' }}. Catálogo de productos en línea.</p>
                        </div>
                    </div>
                    <div class="footer-links">
                        <div class="warehouse-info" v-if="publicStore.warehouseInfo">
                            <h5 class="warehouse-name">{{ publicStore.warehouseInfo.name }}</h5>
                            <p v-if="publicStore.warehouseInfo.location" class="warehouse-location">{{ publicStore.warehouseInfo.location }}</p>
                        </div>
                        <span class="powered-by"> Powered by <strong>AlmaZen</strong> </span>
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
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* === HEADER === */
.detail-header {
    background: var(--surface-card);
    border-bottom: 1px solid var(--surface-border);
    padding: 1rem 0;
    margin-bottom: 2rem;
}

.back-button {
    color: var(--primary-color);
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
    padding: 0 0 3rem 0;
}

.product-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
}

/* === IMAGEN === */
.product-image-section {
    position: sticky;
    top: 2rem;
    height: fit-content;
}

.main-image {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 1rem;
    overflow: hidden;
    background: var(--surface-100);
    border: 1px solid var(--surface-border);
}

.main-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--surface-50);
}

.out-of-stock-overlay,
.expiry-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
}

.out-of-stock-text,
.expiry-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    text-align: center;
    font-weight: 600;
}

.out-of-stock-text i,
.expiry-text i {
    font-size: 3rem;
    margin-bottom: 0.5rem;
}

.expiry-overlay {
    background: rgba(255, 193, 7, 0.9);
}

/* === INFORMACIÓN === */
.product-info-section {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.product-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.category-badge,
.brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.category-badge {
    background: var(--primary-100);
    color: var(--primary-700);
}

.brand-badge {
    background: var(--surface-100);
    color: var(--text-color);
    border: 1px solid var(--surface-border);
}

.product-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--text-color);
    margin: 0;
    line-height: 1.2;
}

.product-description {
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--text-color-secondary);
    margin: 0;
}

.product-codes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.5rem;
    background: var(--surface-50);
    border-radius: 0.75rem;
    border: 1px solid var(--surface-border);
}

.code-item {
    display: flex;
    gap: 0.75rem;
    font-size: 0.875rem;
}

.code-item label {
    font-weight: 600;
    color: var(--text-color);
    min-width: 140px;
}

.code-item span {
    color: var(--text-color-secondary);
    font-family: 'Courier New', monospace;
}

/* === PRECIO === */
.price-section {
    padding: 2rem;
    background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
    border-radius: 1rem;
    border: 1px solid var(--primary-200);
}

.current-price {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--primary-600);
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.per-unit {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text-color-secondary);
}

.purchase-price {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin-top: 0.5rem;
}

/* === STOCK === */
.stock-section {
    display: flex;
    align-items: center;
}

.stock-badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
}

.stock-badge.in-stock {
    background: var(--green-100);
    color: var(--green-700);
    border: 1px solid var(--green-200);
}

.stock-badge.low-stock {
    background: var(--yellow-100);
    color: var(--yellow-700);
    border: 1px solid var(--yellow-200);
}

.stock-badge.out-of-stock {
    background: var(--red-100);
    color: var(--red-700);
    border: 1px solid var(--red-200);
}

/* === LOTE === */
.batch-section,
.additional-info {
    padding: 1.5rem;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: 0.75rem;
}

.batch-section h3,
.additional-info h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 1rem 0;
}

.batch-details,
.info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.batch-item,
.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--surface-border);
}

.batch-item:last-child,
.info-item:last-child {
    border-bottom: none;
}

.batch-item label,
.info-item label {
    font-weight: 500;
    color: var(--text-color);
}

.batch-item span,
.info-item span {
    color: var(--text-color-secondary);
}

.expiry-date.expiry-warning {
    color: var(--yellow-600);
    font-weight: 600;
}

.expiry-date.expiry-danger {
    color: var(--red-600);
    font-weight: 600;
}

/* === FOOTER === */
.product-footer {
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

/* === RESPONSIVE === */
@media (max-width: 1024px) {
    .product-content,
    .skeleton-content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }

    .product-image-section {
        position: static;
    }
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.75rem;
    }

    .product-title {
        font-size: 2rem;
    }

    .current-price {
        font-size: 2rem;
    }

    .product-codes,
    .batch-section,
    .additional-info {
        padding: 1rem;
    }

    .price-section {
        padding: 1.5rem;
    }

    .batch-item,
    .info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
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
    .product-meta {
        flex-direction: column;
        align-items: flex-start;
    }

    .category-badge,
    .brand-badge {
        width: fit-content;
    }

    .current-price {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
    }
}
</style>
