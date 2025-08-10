<script>
import { useProductImportStore } from '@/stores/productImportStore.js';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, ref, watch } from 'vue';

export default {
    name: 'ProductImportDialog',
    emits: ['update:visible', 'products-imported', 'view-products'],
    props: {
        visible: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const toast = useToast();
        const productImportStore = useProductImportStore();

        // Estado reactivo
        const activeTab = ref('0');
        const selectedFile = ref(null);
        const fileValidation = ref(null);
        const fileUploadRef = ref(null);
        const isValidating = ref(false);
        const dragActive = ref(false);
        const previewData = ref(null);
        const validationProgress = ref(0);
        const showErrorDetails = ref(false);

        // Estados computados
        const downloading = computed(() => productImportStore.isDownloading);
        const importing = computed(() => productImportStore.isImporting);
        const importSummary = computed(() => productImportStore.getImportSummary());

        const canImport = computed(() => selectedFile.value && fileValidation.value?.isValid && !importing.value);

        const fileInfo = computed(() => {
            if (!selectedFile.value) return null;
            return {
                name: selectedFile.value.name,
                size: formatFileSize(selectedFile.value.size),
                type: selectedFile.value.type
            };
        });

        // Auto-switch tabs
        watch(importSummary, (newSummary) => {
            if (newSummary && activeTab.value !== '2') {
                activeTab.value = '2';
            }
        });

        watch(
            () => props.visible,
            (newVal) => {
                if (!newVal) {
                    nextTick(() => resetForm());
                }
            }
        );

        // Métodos
        const close = () => {
            emit('update:visible', false);
        };

        const resetForm = () => {
            selectedFile.value = null;
            fileValidation.value = null;
            isValidating.value = false;
            activeTab.value = '0';

            if (fileUploadRef.value) {
                fileUploadRef.value.clear();
            }
            productImportStore.clearMessages();
        };

        const showToast = (severity, summary, detail, life = 5000) => {
            toast.add({ severity, summary, detail, life });
        };

        const downloadTemplate = async () => {
            try {
                await productImportStore.downloadTemplate();

                if (productImportStore.success) {
                    showToast('success', 'Éxito', productImportStore.message, 3000);
                    activeTab.value = '1';
                } else {
                    throw new Error(productImportStore.error);
                }
            } catch (error) {
                console.error('Error al descargar plantilla:', error);
                showToast('error', 'Error', productImportStore.error || 'Error al descargar la plantilla');
            }
        };

        const processFile = async (file) => {
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

            if (!validTypes.includes(file.type)) {
                showToast('warn', 'Archivo inválido', 'Solo archivos Excel (.xlsx, .xls)');
                return false;
            }

            selectedFile.value = file;
            fileValidation.value = null;
            previewData.value = null;
            isValidating.value = true;
            validationProgress.value = 0;

            try {
                // Simular progreso de validación
                const progressInterval = setInterval(() => {
                    if (validationProgress.value < 80) {
                        validationProgress.value += 20;
                    }
                }, 150);

                await new Promise((resolve) => setTimeout(resolve, 800));
                const validation = productImportStore.validateImportFile(file);

                clearInterval(progressInterval);
                validationProgress.value = 100;

                fileValidation.value = validation;

                // Simular preview de datos (primeras 3 filas)
                if (validation.isValid) {
                    previewData.value = {
                        headers: ['Nombre', 'SKU', 'Categoría', 'Precio'],
                        rows: [
                            ['Producto Ejemplo 1', 'SKU001', 'Cat001', '29.99'],
                            ['Producto Ejemplo 2', 'SKU002', 'Cat002', '39.99'],
                            ['Producto Ejemplo 3', 'SKU003', 'Cat001', '19.99']
                        ]
                    };
                    showToast('success', 'Archivo válido', 'Listo para importar', 2000);
                } else {
                    showToast('warn', 'Errores encontrados', 'Revisa la validación');
                }
                return true;
            } catch (error) {
                fileValidation.value = {
                    isValid: false,
                    errors: ['Error al validar archivo']
                };
                showToast('error', 'Error', 'No se pudo validar el archivo');
                return false;
            } finally {
                isValidating.value = false;
            }
        };

        const onFileSelect = async (event) => {
            const file = event.files[0];
            if (!file) return;

            const success = await processFile(file);
            if (!success && fileUploadRef.value) {
                fileUploadRef.value.clear();
            }
        };

        const onDrop = async (event) => {
            event.preventDefault();
            dragActive.value = false;

            const files = Array.from(event.dataTransfer.files);
            if (files.length > 0) {
                await processFile(files[0]);
            }
        };

        const onDragOver = (event) => {
            event.preventDefault();
            dragActive.value = true;
        };

        const onDragLeave = (event) => {
            event.preventDefault();
            dragActive.value = false;
        };

        const removeFile = () => {
            selectedFile.value = null;
            fileValidation.value = null;
            previewData.value = null;
            validationProgress.value = 0;
            if (fileUploadRef.value) {
                fileUploadRef.value.clear();
            }
        };

        const retryValidation = async () => {
            if (selectedFile.value) {
                await processFile(selectedFile.value);
            }
        };

        const importProducts = async () => {
            if (!canImport.value) return;

            try {
                const result = await productImportStore.importProducts(selectedFile.value);

                if (productImportStore.success) {
                    showToast('success', 'Importación iniciada', productImportStore.message);
                    emit('products-imported', result);
                } else {
                    throw new Error(productImportStore.error);
                }
            } catch (error) {
                console.error('Error al importar productos:', error);

                const errorMessage = productImportStore.error || 'Error al importar productos';
                showToast('error', 'Error de importación', errorMessage);

                const summary = productImportStore.getImportSummary();
                if (summary?.validationErrors?.length > 0) {
                    summary.validationErrors.slice(0, 2).forEach((error) => {
                        showToast('warn', 'Error de validación', error, 6000);
                    });
                }
            }
        };

        const viewProducts = () => {
            emit('view-products');
            close();
        };

        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const getSuccessRate = () => {
            if (!importSummary.value) return 0;
            const { totalProcessed, successfulImports } = importSummary.value;
            return totalProcessed > 0 ? Math.round((successfulImports / totalProcessed) * 100) : 0;
        };

        return {
            activeTab,
            selectedFile,
            fileValidation,
            fileUploadRef,
            isValidating,
            dragActive,
            previewData,
            validationProgress,
            downloading,
            importing,
            importSummary,
            canImport,
            fileInfo,
            close,
            resetForm,
            downloadTemplate,
            onFileSelect,
            onDrop,
            onDragOver,
            onDragLeave,
            removeFile,
            retryValidation,
            importProducts,
            viewProducts,
            formatFileSize,
            getSuccessRate,
            showErrorDetails
        };
    }
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" modal header="Importar Productos" :style="{ width: '85vw', maxWidth: '450px', height: '75vh' }" :closable="true" class="compact-dialog">
        <div class="dialog-body">
            <div class="steps">
                <div :class="['step', { active: activeTab === '0', done: activeTab !== '0' }]">
                    <i class="pi pi-download"></i>
                </div>
                <div :class="['step', { active: activeTab === '1', done: activeTab === '2' }]">
                    <i class="pi pi-upload"></i>
                </div>
                <div :class="['step', { active: activeTab === '2' }]">
                    <i class="pi pi-check"></i>
                </div>
            </div>

            <div class="content-area">
                <!-- Paso 1: Descargar Plantilla -->
                <div v-if="activeTab === '0'" class="content">
                    <h4>Descargar Plantilla Excel</h4>
                    <div class="info">
                        <div class="field"><strong>Obligatorios:</strong> Nombre, SKU, Categoría, Precio</div>
                        <div class="field"><strong>Opcionales:</strong> Marca, Descripción, Stock</div>
                        <div class="field"><strong>Incluye:</strong> Hojas de referencia con IDs</div>
                    </div>
                    <div class="actions">
                        <Button label="Descargar Plantilla" icon="pi pi-download" @click="downloadTemplate" :loading="downloading" class="btn-primary" />
                        <Button label="Continuar" icon="pi pi-arrow-right" text @click="activeTab = '1'" size="small" />
                    </div>
                </div>

                <!-- Paso 2: Importar Archivo -->
                <div v-else-if="activeTab === '1'" class="content">
                    <h4>Importar Archivo Excel</h4>

                    <!-- Sin archivo -->
                    <div v-if="!selectedFile" class="upload" @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave" :class="{ active: dragActive }">
                        <i class="pi pi-cloud-upload"></i>
                        <div class="text">Arrastra archivo o</div>
                        <FileUpload ref="fileUploadRef" mode="basic" name="file" :auto="false" accept=".xlsx,.xls" :maxFileSize="10485760" @select="onFileSelect" :disabled="importing" chooseLabel="Seleccionar" class="upload-btn" />
                        <small>Excel (.xlsx, .xls) • Max 10MB</small>
                    </div>

                    <!-- Con archivo -->
                    <div v-else class="selected">
                        <div class="file">
                            <i class="pi pi-file-excel"></i>
                            <div class="details">
                                <div class="name">{{ fileInfo.name }}</div>
                                <div class="size">{{ fileInfo.size }}</div>
                            </div>
                            <Button icon="pi pi-times" text size="small" @click="removeFile" :disabled="isValidating || importing" />
                        </div>

                        <!-- Validación -->
                        <div class="status">
                            <div v-if="isValidating" class="validating">
                                <ProgressSpinner style="width: 14px; height: 14px" strokeWidth="4" />
                                <span>Validando...</span>
                            </div>
                            <div v-else-if="fileValidation && !fileValidation.isValid" class="error">
                                <i class="pi pi-exclamation-triangle"></i>
                                <span>{{ fileValidation.errors.length }} error{{ fileValidation.errors.length > 1 ? 'es' : '' }}</span>
                            </div>
                            <div v-else-if="fileValidation?.isValid" class="success">
                                <i class="pi pi-check-circle"></i>
                                <span>Archivo válido</span>
                            </div>
                        </div>

                        <!-- Importar -->
                        <div v-if="fileValidation?.isValid && !isValidating" class="actions">
                            <Button v-if="!importing" label="Importar Productos" icon="pi pi-upload" @click="importProducts" :disabled="!canImport" class="btn-primary" />
                            <div v-else class="importing">
                                <ProgressSpinner style="width: 16px; height: 16px" strokeWidth="4" />
                                <span>Importando...</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Paso 3: Resultados -->
                <div v-else-if="activeTab === '2' && importSummary" class="content">
                    <h4>Importación Completada</h4>

                    <div class="summary">
                        <div class="rate" :class="getSuccessRate() === 100 ? 'perfect' : getSuccessRate() >= 80 ? 'good' : 'warning'">
                            <span class="number">{{ getSuccessRate() }}%</span>
                            <span class="label">Éxito</span>
                        </div>

                        <div class="metrics">
                            <div class="item success">
                                <span class="value">{{ importSummary.successfulImports }}</span>
                                <span class="text">Creados</span>
                            </div>
                            <div class="item warning" v-if="importSummary.duplicatesSkipped > 0">
                                <span class="value">{{ importSummary.duplicatesSkipped }}</span>
                                <span class="text">Duplicados</span>
                            </div>
                            <div class="item error" v-if="importSummary.failedImports > 0">
                                <span class="value">{{ importSummary.failedImports }}</span>
                                <span class="text">Errores</span>
                            </div>
                        </div>
                    </div>

                    <!-- Errores -->
                    <div v-if="importSummary.hasErrors" class="errors">
                        <div class="toggle" @click="showErrorDetails = !showErrorDetails">
                            <i class="pi pi-exclamation-triangle"></i>
                            <span>{{ importSummary.failedImports }} errores</span>
                            <i :class="showErrorDetails ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"></i>
                        </div>
                        <div v-if="showErrorDetails" class="list">
                            <ScrollPanel style="width: 100%; height: 100px">
                                <div v-for="(error, index) in [...(importSummary.rowErrors || []), ...(importSummary.validationErrors || [])]" :key="index" class="error">
                                    <span v-if="error.row" class="row">{{ error.row }}:</span>
                                    <span class="msg">{{ error.message || error }}</span>
                                </div>
                            </ScrollPanel>
                        </div>
                    </div>

                    <div class="actions">
                        <Button v-if="importSummary.successfulImports > 0" label="Ver Productos" icon="pi pi-eye" @click="viewProducts" class="btn-primary" />
                        <Button
                            label="Nueva Importación"
                            icon="pi pi-refresh"
                            text
                            @click="
                                resetForm();
                                activeTab = '0';
                            "
                            size="small"
                        />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <Button label="Cerrar" icon="pi pi-times" text @click="close" :disabled="importing || downloading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
/* === ULTRA COMPACTO === */
.compact-dialog :deep(.p-dialog-content) {
    padding: 0;
    height: 70vh;
    overflow: hidden;
}

.dialog-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
}

/* === INDICADOR DE PASOS === */
.steps {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--surface-200);
    color: var(--text-color-secondary);
    font-size: 0.75rem;
    transition: all 0.2s ease;
}

.step.active {
    background: var(--primary-color);
    color: white;
    transform: scale(1.1);
}

.step.done {
    background: var(--green-500);
    color: white;
}

/* === CONTENIDO === */
.content-area {
    flex: 1;
    display: flex;
    align-items: stretch;
}

.content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.content h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
    text-align: center;
}

/* === PASO 1: PLANTILLA === */
.info {
    background: var(--surface-50);
    border: 1px solid var(--surface-200);
    border-radius: 0.5rem;
    padding: 0.75rem;
}

.field {
    font-size: 0.75rem;
    line-height: 1.4;
    margin-bottom: 0.5rem;
    color: var(--text-color);
}

.field:last-child {
    margin-bottom: 0;
}

/* === PASO 2: UPLOAD === */
.upload {
    border: 2px dashed var(--surface-300);
    border-radius: 0.5rem;
    padding: 1.5rem 1rem;
    text-align: center;
    background: var(--surface-50);
    transition: all 0.2s ease;
    cursor: pointer;
}

.upload.active,
.upload:hover {
    border-color: var(--primary-color);
    background: var(--primary-50);
}

.upload i {
    font-size: 2rem;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
    opacity: 0.7;
}

.upload .text {
    font-size: 0.875rem;
    color: var(--text-color);
    margin-bottom: 0.75rem;
}

.upload small {
    display: block;
    margin-top: 0.5rem;
    color: var(--text-color-secondary);
    font-size: 0.6875rem;
}

.upload-btn :deep(.p-button) {
    background: var(--primary-color);
    border: none;
    padding: 0.5rem 1rem;
    font-weight: 500;
    font-size: 0.8125rem;
}

/* === ARCHIVO SELECCIONADO === */
.selected {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.file {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-200);
    border-radius: 0.5rem;
}

.file i {
    font-size: 1.5rem;
    color: var(--green-500);
}

.details {
    flex: 1;
    text-align: left;
}

.name {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-color);
    margin-bottom: 0.125rem;
    word-break: break-all;
}

.size {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
}

/* === ESTADOS === */
.status {
    padding: 0.75rem;
    border-radius: 0.5rem;
}

.validating,
.success,
.error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
}

.validating {
    background: var(--blue-50);
    border: 1px solid var(--blue-200);
    color: var(--blue-700);
}

.success {
    background: var(--green-50);
    border: 1px solid var(--green-200);
    color: var(--green-700);
}

.error {
    background: var(--red-50);
    border: 1px solid var(--red-200);
    color: var(--red-700);
}

.importing {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--blue-50);
    border: 1px solid var(--blue-200);
    border-radius: 0.5rem;
    color: var(--blue-700);
    font-size: 0.8125rem;
    font-weight: 500;
}

/* === PASO 3: RESULTADOS === */
.summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-200);
    border-radius: 0.5rem;
}

.rate {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 4rem;
}

.rate .number {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
}

.rate .label {
    font-size: 0.625rem;
    font-weight: 500;
    text-transform: uppercase;
    margin-top: 0.25rem;
}

.rate.perfect {
    color: var(--green-700);
}

.rate.good {
    color: var(--blue-700);
}

.rate.warning {
    color: var(--yellow-700);
}

.metrics {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 0.75rem;
}

.item {
    text-align: center;
    padding: 0.5rem;
    background: var(--surface-0);
    border: 1px solid var(--surface-200);
    border-radius: 0.375rem;
}

.item.success {
    background: var(--green-50);
    border-color: var(--green-200);
}

.item.warning {
    background: var(--yellow-50);
    border-color: var(--yellow-200);
}

.item.error {
    background: var(--red-50);
    border-color: var(--red-200);
}

.item .value {
    display: block;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-color);
    line-height: 1;
}

.item .text {
    display: block;
    font-size: 0.625rem;
    color: var(--text-color-secondary);
    font-weight: 500;
    text-transform: uppercase;
    margin-top: 0.25rem;
}

/* === ERRORES === */
.errors {
    background: var(--red-50);
    border: 1px solid var(--red-200);
    border-radius: 0.5rem;
    overflow: hidden;
}

.toggle {
    padding: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--red-700);
    font-size: 0.8125rem;
    font-weight: 500;
    background: var(--red-100);
    border-bottom: 1px solid var(--red-200);
}

.toggle:hover {
    background: var(--red-150);
}

.list {
    padding: 0.5rem;
}

.error {
    display: flex;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
    line-height: 1.3;
}

.row {
    font-weight: 600;
    color: var(--red-700);
    flex-shrink: 0;
}

.msg {
    color: var(--red-600);
}

/* === BOTONES === */
.actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.btn-primary {
    background: var(--primary-color);
    border: none;
    color: white;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 0.375rem;
    width: 100%;
    transition: all 0.2s ease;
}

.btn-primary:hover {
    background: var(--primary-600);
    transform: translateY(-1px);
}

/* === FOOTER === */
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem 0 0 0;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
    .compact-dialog :deep(.p-dialog) {
        margin: 0.5rem;
        width: calc(100vw - 1rem) !important;
    }

    .dialog-body {
        padding: 0.75rem;
        gap: 0.5rem;
    }

    .steps {
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }

    .step {
        width: 1.75rem;
        height: 1.75rem;
        font-size: 0.6875rem;
    }

    .content h4 {
        font-size: 1rem;
    }

    .info,
    .status,
    .file {
        padding: 0.625rem;
    }

    .upload {
        padding: 1.25rem 0.75rem;
    }

    .upload i {
        font-size: 1.75rem;
    }

    .summary {
        padding: 0.75rem;
        gap: 0.75rem;
    }

    .rate .number {
        font-size: 1.25rem;
    }

    .metrics {
        gap: 0.5rem;
    }

    .item {
        padding: 0.375rem;
    }

    .item .value {
        font-size: 1rem;
    }
}

@media (max-width: 480px) {
    .compact-dialog :deep(.p-dialog) {
        margin: 0.25rem;
        width: calc(100vw - 0.5rem) !important;
    }

    .compact-dialog :deep(.p-dialog-content) {
        height: 75vh;
    }

    .dialog-body {
        padding: 0.5rem;
        gap: 0.5rem;
    }

    .steps {
        gap: 0.5rem;
    }

    .step {
        width: 1.5rem;
        height: 1.5rem;
        font-size: 0.625rem;
    }

    .content h4 {
        font-size: 0.9375rem;
    }

    .field {
        font-size: 0.6875rem;
    }

    .upload {
        padding: 1rem 0.5rem;
    }

    .upload i {
        font-size: 1.5rem;
    }

    .upload .text {
        font-size: 0.8125rem;
    }

    .file {
        gap: 0.5rem;
    }

    .file i {
        font-size: 1.25rem;
    }

    .name {
        font-size: 0.75rem;
    }

    .size {
        font-size: 0.625rem;
    }

    .summary {
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
    }

    .rate {
        min-width: auto;
    }

    .rate .number {
        font-size: 1.125rem;
    }

    .metrics {
        grid-template-columns: repeat(3, 1fr);
    }

    .item .value {
        font-size: 0.9375rem;
    }

    .item .text {
        font-size: 0.5625rem;
    }
}

/* === ANIMACIONES === */
.content {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.item {
    transition: all 0.2s ease;
}

.item:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* === FOCUS STATES === */
.btn-primary:focus-visible,
.upload-btn :deep(.p-button):focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

/* === DARK MODE === */
@media (prefers-color-scheme: dark) {
    .upload:hover,
    .upload.active {
        background: var(--primary-900);
    }

    .item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
}
</style>
