<script setup>
import { useProductGalleryStore } from '@/stores/productGalleryStore';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';

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

const emit = defineEmits(['uploaded']);

const toast = useToast();
const galleryStore = useProductGalleryStore();

const selectedFiles = ref([]);
const uploading = ref(false);
const uploadProgress = ref(0);
const isDragging = ref(false);

const fileInput = ref(null);

// File validation constants
const MAX_FILES = 10;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

/**
 * Validate file
 */
const validateFile = (file) => {
    const errors = [];

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Formato no permitido. Use JPEG, PNG, JPG, GIF o WEBP`);
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Tamaño excede 2MB`);
    }

    return errors;
};

/**
 * Add files to selection
 */
const addFiles = (files) => {
    const fileArray = Array.from(files);

    // Check total count
    if (selectedFiles.value.length + fileArray.length > MAX_FILES) {
        toast.add({
            severity: 'warn',
            summary: 'Límite excedido',
            detail: `Máximo ${MAX_FILES} imágenes permitidas`,
            life: 4000
        });
        return;
    }

    // Validate and add each file
    fileArray.forEach((file) => {
        const errors = validateFile(file);

        if (errors.length > 0) {
            errors.forEach((error) => {
                toast.add({
                    severity: 'error',
                    summary: 'Error de validación',
                    detail: error,
                    life: 5000
                });
            });
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedFiles.value.push({
                file,
                name: file.name,
                preview: e.target.result,
                altText: '',
                description: ''
            });
        };
        reader.readAsDataURL(file);
    });
};

/**
 * Handle drag over
 */
const handleDragOver = (e) => {
    e.preventDefault();
    isDragging.value = true;
};

/**
 * Handle drag leave
 */
const handleDragLeave = () => {
    isDragging.value = false;
};

/**
 * Handle drop
 */
const handleDrop = (e) => {
    e.preventDefault();
    isDragging.value = false;
    const files = e.dataTransfer.files;
    addFiles(files);
};

/**
 * Handle file select
 */
const handleFileSelect = (e) => {
    const files = e.target.files;
    addFiles(files);
    // Reset input
    if (fileInput.value) {
        fileInput.value.value = '';
    }
};

/**
 * Remove file from selection
 */
const removeFile = (index) => {
    selectedFiles.value.splice(index, 1);
};

/**
 * Upload images
 */
const uploadImages = async () => {
    if (selectedFiles.value.length === 0) return;

    uploading.value = true;
    uploadProgress.value = 0;

    try {
        const files = selectedFiles.value.map((f) => f.file);
        const altTexts = selectedFiles.value.map((f) => f.altText);
        const descriptions = selectedFiles.value.map((f) => f.description);

        // Simulate progress
        const progressInterval = setInterval(() => {
            if (uploadProgress.value < 90) {
                uploadProgress.value += 10;
            }
        }, 200);

        await galleryStore.uploadImages(props.productId, files, altTexts, descriptions);

        clearInterval(progressInterval);
        uploadProgress.value = 100;

        toast.add({
            severity: 'success',
            summary: 'Imágenes subidas',
            detail: `${files.length} imagen(es) subida(s) correctamente`,
            life: 3000
        });

        // Clear selection
        selectedFiles.value = [];
        uploadProgress.value = 0;

        emit('uploaded');
    } catch (error) {
        console.error('[ProductGalleryUpload] Error uploading images:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Error al subir imágenes',
            life: 5000
        });
    } finally {
        uploading.value = false;
    }
};

/**
 * Open file dialog
 */
const openFileDialog = () => {
    if (fileInput.value) {
        fileInput.value.click();
    }
};
</script>

<template>
    <div class="gallery-upload">
        <!-- Dropzone -->
        <div class="dropzone" :class="{ dragging: isDragging }" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop" @click="openFileDialog">
            <input ref="fileInput" type="file" multiple accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" @change="handleFileSelect" style="display: none" />

            <div class="dropzone-content">
                <i class="pi pi-cloud-upload dropzone-icon"></i>
                <p class="dropzone-text">Arrastra imágenes aquí o haz clic para seleccionar</p>
                <p class="dropzone-hint">Máximo {{ MAX_FILES }} imágenes • 2MB cada una • JPEG, PNG, GIF, WEBP</p>
            </div>
        </div>

        <!-- Preview List -->
        <div v-if="selectedFiles.length" class="preview-section">
            <h4 class="preview-title">
                <i class="pi pi-images"></i>
                Imágenes seleccionadas ({{ selectedFiles.length }}/{{ MAX_FILES }})
            </h4>

            <div class="preview-grid">
                <div v-for="(item, index) in selectedFiles" :key="index" class="preview-item">
                    <div class="preview-image-container">
                        <img :src="item.preview" :alt="item.name" class="preview-image" />
                        <button class="remove-btn" @click.stop="removeFile(index)" :disabled="uploading">
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <div class="preview-inputs">
                        <input v-model="item.altText" type="text" placeholder="Texto alternativo (opcional)" class="preview-input" :disabled="uploading" />
                        <textarea v-model="item.description" placeholder="Descripción (opcional)" class="preview-textarea" rows="2" :disabled="uploading"></textarea>
                    </div>

                    <p class="preview-filename">{{ item.name }}</p>
                </div>
            </div>
        </div>

        <!-- Upload Progress -->
        <div v-if="uploading" class="upload-progress">
            <label class="progress-label">Subiendo imágenes...</label>
            <ProgressBar :value="uploadProgress" class="progress-bar" />
            <span class="progress-text">{{ uploadProgress }}%</span>
        </div>

        <!-- Actions -->
        <div class="actions">
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="selectedFiles = []" :disabled="!selectedFiles.length || uploading" text />
            <Button label="Subir Imágenes" icon="pi pi-upload" severity="success" @click="uploadImages" :disabled="!selectedFiles.length || uploading" :loading="uploading" />
        </div>
    </div>
</template>

<style scoped>
.gallery-upload {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* Dropzone */
.dropzone {
    border: 2px dashed var(--surface-border);
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--surface-50);
}

.dropzone:hover,
.dropzone.dragging {
    border-color: var(--primary-color);
    background: var(--primary-50);
}

.dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
}

.dropzone-icon {
    font-size: 3rem;
    color: var(--primary-color);
}

.dropzone-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.dropzone-hint {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    margin: 0;
}

/* Preview Section */
.preview-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.preview-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
}

.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.preview-item {
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--surface-card);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.preview-image-container {
    position: relative;
    width: 100%;
    height: 150px;
    border-radius: 6px;
    overflow: hidden;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: none;
    background: rgba(244, 67, 54, 0.9);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
    background: rgb(244, 67, 54);
    transform: scale(1.1);
}

.remove-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.preview-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.preview-input,
.preview-textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--surface-border);
    border-radius: 4px;
    font-size: 0.875rem;
    font-family: inherit;
}

.preview-input:focus,
.preview-textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

.preview-input:disabled,
.preview-textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.preview-filename {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Upload Progress */
.upload-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 8px;
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

/* Actions */
.actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
}

/* Responsive */
@media (max-width: 768px) {
    .preview-grid {
        grid-template-columns: 1fr;
    }

    .actions {
        flex-direction: column-reverse;
    }

    .actions .p-button {
        width: 100%;
    }
}
</style>
