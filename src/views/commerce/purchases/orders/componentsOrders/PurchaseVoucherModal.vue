<script setup>
import { uploadVoucher } from '@/api';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import ProgressBar from 'primevue/progressbar';
import { computed, ref, watch } from 'vue';

const toast = useToast();

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    purchaseOrder: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'voucher-updated']);

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
    if (!props.purchaseOrder) return 'Subir Comprobante';
    return props.purchaseOrder.voucher_url ? 'Cambiar Comprobante' : 'Subir Comprobante';
});

// Computed para el número de la orden
const orderNumber = computed(() => props.purchaseOrder?.order_number || 'N/A');

// Computed para el comprobante actual
const currentVoucherUrl = computed(() => {
    return props.purchaseOrder?.voucher_url || null;
});

// Computed para determinar si es PDF
const isCurrentVoucherPdf = computed(() => {
    return currentVoucherUrl.value && currentVoucherUrl.value.toLowerCase().includes('.pdf');
});

const isPreviewPdf = computed(() => {
    return selectedFile.value && selectedFile.value.type === 'application/pdf';
});

// Validaciones de archivo
const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Solo se permiten archivos: JPEG, PNG, JPG, GIF, WEBP, PDF',
            life: 5000
        });
        return false;
    }

    if (file.size > maxSize) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'El archivo debe ser menor a 5MB',
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

        // Crear preview para imágenes
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewUrl.value = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            previewUrl.value = ''; // No preview para PDFs
        }
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

// Subir comprobante
const uploadVoucherFile = async () => {
    if (!selectedFile.value || !props.purchaseOrder) return;

    isUploading.value = true;
    uploadProgress.value = 0;

    try {
        // Simular progreso de subida
        const progressInterval = setInterval(() => {
            if (uploadProgress.value < 90) {
                uploadProgress.value += 10;
            }
        }, 200);

        const apiResponse = await uploadVoucher(props.purchaseOrder.id, selectedFile.value);

        clearInterval(progressInterval);
        uploadProgress.value = 100;

        if (apiResponse.success) {
            toast.add({
                severity: 'success',
                summary: 'Comprobante subido',
                detail: 'El comprobante de la orden se ha actualizado correctamente',
                life: 3000
            });

            // Emitir evento de actualización
            emit('voucher-updated', {
                purchaseOrderId: props.purchaseOrder.id,
                voucherUrl: apiResponse.data.voucher_url,
                purchaseOrder: apiResponse.data.purchase
            });

            // Cerrar modal después de un breve delay
            setTimeout(() => {
                closeModal();
            }, 1000);
        } else {
            throw new Error(apiResponse.message || 'Error al subir comprobante');
        }
    } catch (error) {
        console.error('Error uploading voucher:', error);

        let errorMessage = 'Error al subir el comprobante';

        if (error.response?.data?.errors?.voucher) {
            errorMessage = error.response.data.errors.voucher.join(', ');
        } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
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

// Abrir archivo en nueva pestaña
const openCurrentVoucher = () => {
    if (currentVoucherUrl.value) {
        window.open(currentVoucherUrl.value, '_blank');
    }
};

// Obtener icono según tipo de archivo
const getFileIcon = (isImage = false) => {
    return isImage ? 'pi pi-image' : 'pi pi-file-pdf';
};

const getFileTypeLabel = (file) => {
    if (file.type.startsWith('image/')) return 'Imagen';
    if (file.type === 'application/pdf') return 'PDF';
    return 'Documento';
};
</script>

<template>
    <Dialog v-model:visible="dialogVisible" :header="modalTitle" modal class="purchase-voucher-modal" :style="{ width: '600px' }" :closable="!isUploading" :closeOnEscape="!isUploading" @hide="closeModal">
        <div class="modal-content">
            <!-- Información de la orden ---->
            <div class="order-info">
                <h3 class="order-title">Orden #{{ orderNumber }}</h3>
                <div class="order-details">
                    <div class="detail-item">
                        <i class="pi pi-building"></i>
                        <span>{{ purchaseOrder?.provider?.name || 'Sin proveedor' }}</span>
                    </div>
                    <div class="detail-item">
                        <i class="pi pi-calendar"></i>
                        <span>{{ purchaseOrder?.purchase_date || 'Sin fecha' }}</span>
                    </div>
                    <div class="detail-item">
                        <i class="pi pi-dollar"></i>
                        <span>{{ purchaseOrder?.total_amount ? `S/ ${Number(purchaseOrder.total_amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/ 0.00' }}</span>
                    </div>
                </div>
            </div>

            <!-- Comprobante actual ---->
            <div v-if="currentVoucherUrl" class="current-voucher-section">
                <label class="section-label">Comprobante actual:</label>
                <div class="current-voucher-container">
                    <div class="voucher-preview">
                        <div v-if="isCurrentVoucherPdf" class="pdf-preview">
                            <i class="pi pi-file-pdf pdf-icon"></i>
                            <span class="file-name">Comprobante PDF</span>
                        </div>
                        <img v-else :src="currentVoucherUrl" alt="Comprobante actual" class="current-image" />
                    </div>
                    <Button icon="pi pi-external-link" label="Abrir" size="small" severity="info" outlined @click="openCurrentVoucher" v-tooltip.top="'Abrir en nueva pestaña'" />
                </div>
            </div>

            <!-- Vista previa del nuevo archivo ---->
            <div v-if="selectedFile" class="preview-section">
                <label class="section-label">{{ getFileTypeLabel(selectedFile) }} seleccionado:</label>
                <div class="preview-container">
                    <div class="file-preview">
                        <div v-if="isPreviewPdf" class="pdf-preview-new">
                            <i class="pi pi-file-pdf pdf-icon-new"></i>
                            <div class="file-info">
                                <span class="file-name">{{ selectedFile.name }}</span>
                                <span class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
                            </div>
                        </div>
                        <img v-else-if="previewUrl" :src="previewUrl" alt="Vista previa" class="preview-image" />
                    </div>
                    <Button icon="pi pi-times" class="remove-preview-btn" severity="danger" size="small" rounded text @click="clearSelection" :disabled="isUploading" v-tooltip.top="'Remover archivo'" />
                </div>
            </div>

            <!-- Componente de subida de archivos ---->
            <div class="upload-section">
                <FileUpload
                    mode="basic"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp,application/pdf"
                    :maxFileSize="5242880"
                    customUpload
                    auto
                    chooseLabel="Seleccionar comprobante"
                    class="upload-component"
                    :disabled="isUploading"
                    @select="onFileSelect"
                    @error="onFileError"
                />

                <div class="upload-info">
                    <div class="format-info">
                        <i class="pi pi-info-circle"></i>
                        <span>Formatos: JPEG, PNG, JPG, GIF, WEBP, PDF</span>
                    </div>
                    <div class="size-info">
                        <i class="pi pi-file"></i>
                        <span>Tamaño máximo: 5MB</span>
                    </div>
                </div>
            </div>

            <!-- Progreso de subida ---->
            <div v-if="isUploading" class="upload-progress">
                <label class="progress-label">Subiendo comprobante...</label>
                <ProgressBar :value="uploadProgress" class="progress-bar" />
                <span class="progress-text">{{ uploadProgress }}%</span>
            </div>
        </div>

        <!-- Botones del modal ---->
        <template #footer>
            <div class="modal-actions">
                <Button label="Cancelar" icon="pi pi-times" severity="secondary" @click="closeModal" :disabled="isUploading" text />
                <Button label="Subir Comprobante" icon="pi pi-upload" severity="success" @click="uploadVoucherFile" :disabled="!selectedFile || isUploading" :loading="isUploading" />
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

.order-info {
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 1rem;
}

.order-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.75rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.order-details {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.detail-item i {
    color: var(--primary-color);
    font-size: 0.75rem;
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

.current-voucher-section {
    margin-top: 1rem;
}

.current-voucher-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    gap: 1rem;
}

.voucher-preview {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.pdf-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: white;
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
}

.pdf-icon {
    font-size: 2rem;
    color: #dc2626;
}

.file-name {
    font-size: 0.875rem;
    color: var(--text-color);
}

.current-image {
    width: 80px;
    height: 80px;
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

.file-preview {
    display: flex;
    align-items: center;
    justify-content: center;
}

.pdf-preview-new {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: white;
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    min-width: 200px;
}

.pdf-icon-new {
    font-size: 2.5rem;
    color: #dc2626;
    flex-shrink: 0;
}

.file-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.file-size {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
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
    :deep(.purchase-voucher-modal) {
        width: 95vw !important;
        max-width: 500px !important;
    }

    .order-details {
        flex-direction: column;
        gap: 0.5rem;
    }

    .current-voucher-container {
        flex-direction: column;
        align-items: center;
    }

    .pdf-preview-new {
        flex-direction: column;
        text-align: center;
        min-width: auto;
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
