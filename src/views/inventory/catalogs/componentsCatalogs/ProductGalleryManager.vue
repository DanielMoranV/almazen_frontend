<script setup>
import { useProductGalleryStore } from '@/stores/productGalleryStore';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';
import VueDraggable from 'vuedraggable';

const props = defineProps({
    productId: {
        type: [Number, String],
        required: true
    },
    productName: {
        type: String,
        default: ''
    }
});

const toast = useToast();
const galleryStore = useProductGalleryStore();

const editDialog = ref(false);
const editingImage = ref({
    id: null,
    alt_text: '',
    description: ''
});

const loading = computed(() => galleryStore.loading);

// Sorted images with drag & drop support
const sortedImages = computed({
    get: () => galleryStore.sortedGallery,
    set: (value) => {
        // Update gallery order locally
        galleryStore.gallery = value;
    }
});

/**
 * Handle drag end - save new order
 */
const handleDragEnd = async () => {
    try {
        const newOrder = sortedImages.value.map((img, index) => ({
            id: img.id,
            order: index + 1
        }));

        await galleryStore.reorderImages(props.productId, newOrder);

        toast.add({
            severity: 'success',
            summary: 'Orden actualizado',
            detail: 'El orden de las imágenes se actualizó correctamente',
            life: 3000
        });
    } catch (error) {
        console.error('[ProductGalleryManager] Error reordering:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al reordenar imágenes',
            life: 4000
        });
    }
};

/**
 * Set image as primary
 */
const setPrimary = async (imageId) => {
    try {
        await galleryStore.setPrimary(props.productId, imageId);

        toast.add({
            severity: 'success',
            summary: 'Imagen principal',
            detail: 'Imagen establecida como principal',
            life: 3000
        });
    } catch (error) {
        console.error('[ProductGalleryManager] Error setting primary:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al establecer imagen principal',
            life: 4000
        });
    }
};

/**
 * Open edit dialog
 */
const editImage = (image) => {
    editingImage.value = {
        id: image.id,
        alt_text: image.alt_text || '',
        description: image.description || ''
    };
    editDialog.value = true;
};

/**
 * Save image edits
 */
const saveEdit = async () => {
    try {
        await galleryStore.updateImage(props.productId, editingImage.value.id, {
            alt_text: editingImage.value.alt_text,
            description: editingImage.value.description
        });

        toast.add({
            severity: 'success',
            summary: 'Imagen actualizada',
            detail: 'Los metadatos de la imagen se actualizaron correctamente',
            life: 3000
        });

        editDialog.value = false;
    } catch (error) {
        console.error('[ProductGalleryManager] Error updating image:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar imagen',
            life: 4000
        });
    }
};

/**
 * Delete image
 */
const deleteImage = async (imageId, imageName) => {
    if (!confirm(`¿Eliminar esta imagen?\n${imageName || 'Sin nombre'}`)) return;

    try {
        await galleryStore.deleteImage(props.productId, imageId);

        toast.add({
            severity: 'success',
            summary: 'Imagen eliminada',
            detail: 'La imagen se eliminó correctamente',
            life: 3000
        });
    } catch (error) {
        console.error('[ProductGalleryManager] Error deleting image:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar imagen',
            life: 4000
        });
    }
};
</script>

<template>
    <div class="gallery-manager">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
            <i class="pi pi-spin pi-spinner loading-icon"></i>
            <p>Cargando galería...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!sortedImages.length" class="empty-state">
            <i class="pi pi-images empty-icon"></i>
            <h4>No hay imágenes en la galería</h4>
            <p>Sube imágenes usando la pestaña "Subir Imágenes"</p>
        </div>

        <!-- Gallery Grid -->
        <div v-else class="gallery-content">
            <div class="gallery-header">
                <h4 class="gallery-title">
                    <i class="pi pi-images"></i>
                    Galería ({{ sortedImages.length }} imagen{{ sortedImages.length !== 1 ? 'es' : '' }})
                </h4>
                <p class="gallery-hint">
                    <i class="pi pi-info-circle"></i>
                    Arrastra las imágenes para reordenarlas
                </p>
            </div>

            <VueDraggable v-model="sortedImages" @end="handleDragEnd" class="gallery-grid" item-key="id" :animation="200" handle=".drag-handle">
                <template #item="{ element: image }">
                    <div class="gallery-item" :class="{ primary: image.is_primary }">
                        <!-- Drag Handle -->
                        <div class="drag-handle" title="Arrastra para reordenar">
                            <i class="pi pi-bars"></i>
                        </div>

                        <!-- Primary Badge -->
                        <div v-if="image.is_primary" class="primary-badge">
                            <i class="pi pi-star-fill"></i>
                            Principal
                        </div>

                        <!-- Image -->
                        <div class="image-container">
                            <img :src="image.image_url" :alt="image.alt_text || 'Imagen de producto'" class="gallery-image" loading="lazy" />
                        </div>

                        <!-- Image Info -->
                        <div class="image-info">
                            <p class="image-alt">{{ image.alt_text || 'Sin descripción' }}</p>
                            <p class="image-order">Orden: {{ image.order }}</p>
                        </div>

                        <!-- Actions -->
                        <div class="image-actions">
                            <Button v-if="!image.is_primary" icon="pi pi-star" severity="warning" size="small" @click="setPrimary(image.id)" v-tooltip.top="'Establecer como principal'" text rounded />
                            <Button icon="pi pi-pencil" severity="info" size="small" @click="editImage(image)" v-tooltip.top="'Editar'" text rounded />
                            <Button icon="pi pi-trash" severity="danger" size="small" @click="deleteImage(image.id, image.alt_text)" v-tooltip.top="'Eliminar'" text rounded />
                        </div>
                    </div>
                </template>
            </VueDraggable>
        </div>

        <!-- Edit Dialog -->
        <Dialog v-model:visible="editDialog" header="Editar Imagen" modal :style="{ width: '500px' }">
            <div class="edit-form">
                <div class="field">
                    <label for="alt_text">Texto Alternativo:</label>
                    <InputText id="alt_text" v-model="editingImage.alt_text" placeholder="Descripción breve de la imagen" class="w-full" />
                </div>

                <div class="field">
                    <label for="description">Descripción:</label>
                    <Textarea id="description" v-model="editingImage.description" placeholder="Descripción detallada (opcional)" rows="4" class="w-full" />
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="editDialog = false" text />
                <Button label="Guardar" icon="pi pi-check" severity="success" @click="saveEdit" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.gallery-manager {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Loading State */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    color: var(--text-color-secondary);
}

.loading-icon {
    font-size: 2rem;
    color: var(--primary-color);
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    text-align: center;
    background: var(--surface-50);
    border: 2px dashed var(--surface-border);
    border-radius: 12px;
}

.empty-icon {
    font-size: 3rem;
    color: var(--text-color-secondary);
}

.empty-state h4 {
    margin: 0;
    color: var(--text-color);
}

.empty-state p {
    margin: 0;
    color: var(--text-color-secondary);
}

/* Gallery Content */
.gallery-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.gallery-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.gallery-hint {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
}

/* Gallery Grid */
.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.gallery-item {
    position: relative;
    border: 2px solid var(--surface-border);
    border-radius: 12px;
    padding: 0.75rem;
    background: var(--surface-card);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    transition: all 0.3s ease;
}

.gallery-item:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.gallery-item.primary {
    border-color: #ffd700;
    background: linear-gradient(to bottom, #fffacd 0%, var(--surface-card) 20%);
}

/* Drag Handle */
.drag-handle {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border-radius: 6px;
    cursor: move;
    z-index: 10;
}

/* Primary Badge */
.primary-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background: #ffd700;
    color: #000;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 6px;
    z-index: 10;
}

/* Image Container */
.image-container {
    width: 100%;
    height: 200px;
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface-100);
}

.gallery-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Image Info */
.image-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.image-alt {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-color);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.image-order {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin: 0;
}

/* Image Actions */
.image-actions {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--surface-border);
}

/* Edit Form */
.edit-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 0;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
}

/* Responsive */
@media (max-width: 768px) {
    .gallery-grid {
        grid-template-columns: 1fr;
    }

    .gallery-header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
