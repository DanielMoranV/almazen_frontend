<script setup>
import { uploadProductImage } from '@/api';
import { useProductsStore } from '@/stores/productsStore';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const productsStore = useProductsStore();
const toast = useToast();

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

const emit = defineEmits(['update:visible', 'image-updated']);

// Estado reactivo
const isUploading = ref(false);
const uploadProgress = ref(0);
const selectedFile = ref(null);
const previewUrl = ref('');

// Computed para el diálogo
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

// Computed para el título del modal
const modalTitle = computed(() => {
    if (!props.product) return 'Subir Imagen';
    return props.product.image_url ? 'Cambiar Imagen' : 'Subir Imagen';
});

// Computed para el nombre del producto
const productName = computed(() => props.product?.name || 'Producto');

// Computed para la imagen actual
const currentImageUrl = computed(() => {
    return props.product?.image_url || null;
});

// Validaciones de archivo
const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Solo se permiten archivos: JPEG, PNG, JPG, GIF, WEBP',
            life: 5000
        });
        return false;
    }

    if (file.size > maxSize) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'La imagen debe ser menor a 2MB',
            life: 5000
        });
        return false;
    }

    return true;
};

// Manejar selección de archivo
const onFileSelect = (event) => {
    const file = event.files[0];
    if (!file) return;

    if (validateFile(file)) {
        selectedFile.value = file;

        // Crear preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// Manejar error de selección de archivo
const onFileError = () => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al seleccionar el archivo',
        life: 3000
    });
};

// Limpiar selección
const clearSelection = () => {
    selectedFile.value = null;
    previewUrl.value = '';
    uploadProgress.value = 0;
};

// Subir imagen
const uploadImage = async () => {
    if (!selectedFile.value || !props.product) return;

    isUploading.value = true;
    uploadProgress.value = 0;

    try {
        // Simular progreso de subida
        const progressInterval = setInterval(() => {
            if (uploadProgress.value < 90) {
                uploadProgress.value += 10;
            }
        }, 200);

        let result;

        // Intentar usar el store primero, si no funciona usar la API directamente
        if (productsStore.uploadProductImage && typeof productsStore.uploadProductImage === 'function') {
            result = await productsStore.uploadProductImage(props.product.id, selectedFile.value);
        } else {
            // Fallback: usar la API directamente
            console.warn('Using direct API call as store function is not available');
            const apiResponse = await uploadProductImage(props.product.id, selectedFile.value);

            // El interceptor de axios ya desenvuelve response.data, así que apiResponse ya es el objeto data
            if (apiResponse.success) {
                // Actualizar manualmente la lista de productos en el store
                const updatedProduct = apiResponse.data?.product || apiResponse.product;
                productsStore.products = productsStore.products.map((product) => (product.id === props.product.id ? updatedProduct : product));
                result = apiResponse.data || apiResponse;
            } else {
                throw new Error(apiResponse.message || 'Error al subir imagen');
            }
        }

        clearInterval(progressInterval);
        uploadProgress.value = 100;

        toast.add({
            severity: 'success',
            summary: 'Imagen subida',
            detail: 'La imagen del producto se ha actualizado correctamente',
            life: 3000
        });

        // Emitir evento de actualización
        emit('image-updated', {
            productId: props.product.id,
            imageUrl: result.image_url,
            product: result.product
        });

        // Cerrar modal después de un breve delay
        setTimeout(() => {
            closeModal();
        }, 1000);
    } catch (error) {
        console.error('[ProductImageModal] Error al subir imagen:', error);

        let errorMessage = 'Error al subir la imagen';

        // El error ya viene procesado por el interceptor de axios
        if (error.validationErrors?.image) {
            errorMessage = error.validationErrors.image.join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 5000
        });

        uploadProgress.value = 0;
    } finally {
        isUploading.value = false;
    }
};

// Cerrar modal
const closeModal = () => {
    if (!isUploading.value) {
        clearSelection();
        dialogVisible.value = false;
    }
};

// Limpiar estado cuando se cierre el modal
watch(
    () => props.visible,
    (newVisible) => {
        if (!newVisible) {
            setTimeout(() => {
                clearSelection();
            }, 300);
        }
    }
);

// Manejar error de imagen
const handleImageError = (event) => {
    event.target.src = '/placeholder-product.png';
};
</script>

<template>
    <Dialog v-model:visible="dialogVisible" :header="modalTitle" modal class="product-image-modal" :style="{ width: '500px' }" :closable="!isUploading" :closeOnEscape="!isUploading" @hide="closeModal">
        <div class="modal-content">
            <!-- Información del producto -->
            <div class="product-info">
                <h3 class="product-title">{{ productName }}</h3>
                <div v-if="currentImageUrl" class="current-image-section">
                    <label class="section-label">Imagen actual:</label>
                    <div class="current-image-container">
                        <img :src="currentImageUrl" :alt="productName" class="current-image" @error="handleImageError" />
                    </div>
                </div>
            </div>

            <!-- Vista previa de la nueva imagen -->
            <div v-if="previewUrl" class="preview-section">
                <label class="section-label">Nueva imagen:</label>
                <div class="preview-container">
                    <img :src="previewUrl" :alt="productName" class="preview-image" />
                    <Button icon="pi pi-times" class="remove-preview-btn" severity="danger" size="small" rounded text @click="clearSelection" :disabled="isUploading" v-tooltip.top="'Remover imagen'" />
                </div>
            </div>

            <!-- Componente de subida de archivos -->
            <div class="upload-section">
                <FileUpload
                    mode="basic"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    :maxFileSize="2097152"
                    customUpload
                    auto
                    chooseLabel="Seleccionar imagen"
                    class="upload-component"
                    :disabled="isUploading"
                    @select="onFileSelect"
                    @error="onFileError"
                />

                <div class="upload-info">
                    <div class="format-info">
                        <i class="pi pi-info-circle"></i>
                        <span>Formatos: JPEG, PNG, JPG, GIF, WEBP</span>
                    </div>
                    <div class="size-info">
                        <i class="pi pi-file"></i>
                        <span>Tamaño máximo: 2MB</span>
                    </div>
                </div>
            </div>

            <!-- Progreso de subida -->
            <div v-if="isUploading" class="upload-progress">
                <label class="progress-label">Subiendo imagen...</label>
                <ProgressBar :value="uploadProgress" class="progress-bar" />
                <span class="progress-text">{{ uploadProgress }}%</span>
            </div>
        </div>

        <!-- Botones del modal -->
        <template #footer>
            <div class="modal-actions">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="closeModal" :disabled="isUploading" text />
                <Button label="Subir Imagen" icon="pi pi-upload" severity="success" @click="uploadImage" :disabled="!selectedFile || isUploading" :loading="isUploading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.modal-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.product-info {
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 1rem;
}

.product-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 1rem 0;
}

.section-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.current-image-section {
    margin-top: 1rem;
}

.current-image-container {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
}

.current-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 0.5rem;
    border: 2px solid var(--surface-border);
}

.preview-section {
    animation: fadeIn 0.3s ease;
}

.preview-container {
    position: relative;
    display: flex;
    justify-content: center;
    padding: 1rem;
    background: var(--surface-50);
    border: 2px dashed var(--primary-300);
    border-radius: 0.5rem;
}

.preview-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 0.5rem;
    border: 2px solid var(--primary-300);
}

.remove-preview-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
}

.upload-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

:deep(.upload-component .p-fileupload-choose) {
    width: 100%;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    color: white;
    font-weight: 600;
    padding: 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
}

:deep(.upload-component .p-fileupload-choose:hover) {
    background: var(--primary-600);
    transform: translateY(-1px);
}

:deep(.upload-component .p-fileupload-choose:disabled) {
    opacity: 0.6;
    transform: none;
}

.upload-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--surface-100);
    border-radius: 0.5rem;
    border: 1px solid var(--surface-border);
}

.format-info,
.size-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.format-info i,
.size-info i {
    color: var(--primary-color);
}

.upload-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
}

.progress-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-color);
}

.progress-bar {
    height: 0.75rem;
}

.progress-text {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    text-align: center;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    :deep(.product-image-modal) {
        width: 95vw !important;
        max-width: 400px !important;
    }

    .current-image,
    .preview-image {
        width: 100px;
        height: 100px;
    }

    .modal-actions {
        flex-direction: column;
        gap: 0.75rem;
    }

    .modal-actions .p-button {
        width: 100%;
    }
}
</style>
