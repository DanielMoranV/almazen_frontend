<script setup>
import { useProductGalleryStore } from '@/stores/productGalleryStore';
import Dialog from 'primevue/dialog';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import { computed, ref, watch } from 'vue';
import ProductGalleryManager from './ProductGalleryManager.vue';
import ProductGalleryUpload from './ProductGalleryUpload.vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    product: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'gallery-updated']);

const galleryStore = useProductGalleryStore();
const activeTab = ref(0);

// Computed for dialog visibility
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// Watch for product changes
watch(
    () => props.product,
    async (newProduct) => {
        if (newProduct?.id) {
            await loadGallery();
        }
    },
    { immediate: true }
);

// Watch for dialog visibility
watch(
    () => props.visible,
    (newVisible) => {
        if (newVisible && props.product?.id) {
            loadGallery();
            activeTab.value = 1; // Start on manager tab
        }
    }
);

/**
 * Load gallery for current product
 */
const loadGallery = async () => {
    if (!props.product?.id) return;

    try {
        await galleryStore.fetchGallery(props.product.id);
    } catch (error) {
        console.error('[ProductGalleryDialog] Error loading gallery:', error);
    }
};

/**
 * Handle images uploaded
 */
const handleUploaded = () => {
    // Switch to manager tab to see uploaded images
    activeTab.value = 1;
    emit('gallery-updated');
};

/**
 * Close dialog
 */
const closeDialog = () => {
    dialogVisible.value = false;
    galleryStore.clearGallery();
};
</script>

<template>
    <Dialog v-model:visible="dialogVisible" :header="`Galería de Imágenes - ${product?.name || 'Producto'}`" modal :style="{ width: '90vw', maxWidth: '1200px' }" @hide="closeDialog">
        <div class="dialog-content">
            <!-- Product Info -->
            <div v-if="product" class="product-info">
                <div class="product-image">
                    <img v-if="product.image_url" :src="product.image_url" :alt="product.name" />
                    <div v-else class="no-image">
                        <i class="pi pi-image"></i>
                    </div>
                </div>
                <div class="product-details">
                    <h3 class="product-name">{{ product.name }}</h3>
                    <p class="product-code">SKU: {{ product.sku }}</p>
                </div>
            </div>

            <!-- Tabs -->
            <TabView v-model:activeIndex="activeTab" class="gallery-tabs">
                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-cloud-upload"></i>
                            <span>Subir Imágenes</span>
                        </div>
                    </template>
                    <ProductGalleryUpload v-if="product" :product-id="product.id" :product-name="product.name" @uploaded="handleUploaded" />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-images"></i>
                            <span>Gestionar Galería</span>
                        </div>
                    </template>
                    <ProductGalleryManager v-if="product" :product-id="product.id" :product-name="product.name" />
                </TabPanel>
            </TabView>
        </div>
    </Dialog>
</template>

<style scoped>
.dialog-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Product Info */
.product-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
}

.product-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface-100);
    flex-shrink: 0;
}

.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.no-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-secondary);
    font-size: 1.5rem;
}

.product-details {
    flex: 1;
    min-width: 0;
}

.product-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.25rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.product-code {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
}

/* Tabs */
.gallery-tabs {
    min-height: 400px;
}

.tab-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
    .product-info {
        flex-direction: column;
        text-align: center;
    }

    .product-name {
        white-space: normal;
    }
}
</style>
