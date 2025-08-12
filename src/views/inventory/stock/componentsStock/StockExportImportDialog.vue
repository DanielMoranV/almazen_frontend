<script>
import { useStockExportImportStore } from '@/stores/stockExportImportStore.js';
import { processStockImportData, validateStockImportStructure } from '@/utils/excelUtils.js';
import { useToast } from 'primevue/usetoast';
import { computed, nextTick, ref, watch } from 'vue';

export default {
    name: 'StockExportImportDialog',
    emits: ['update:visible', 'stock-imported', 'refresh-data'],
    props: {
        visible: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const toast = useToast();
        const stockExportImportStore = useStockExportImportStore();

        // Estado reactivo
        const activeTab = ref('0');
        const selectedFile = ref(null);
        const validationResult = ref(null);
        const fileUploadRef = ref(null);
        const isValidating = ref(false);
        const validationProgress = ref(0);

        // Estados computados
        const exporting = computed(() => stockExportImportStore.isExporting);
        const downloadingTemplate = computed(() => stockExportImportStore.isExporting);
        const importing = computed(() => stockExportImportStore.isImporting);

        const canImport = computed(() => selectedFile.value && validationResult.value?.isValid && !importing.value);

        const fileInfo = computed(() => {
            if (!selectedFile.value) return null;
            return {
                name: selectedFile.value.name,
                size: formatFileSize(selectedFile.value.size),
                type: selectedFile.value.type
            };
        });

        // Watcher para limpiar cuando se cierra el diálogo
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
            validationResult.value = null;
            isValidating.value = false;
            validationProgress.value = 0;
            activeTab.value = '0';

            if (fileUploadRef.value) {
                fileUploadRef.value.clear();
            }
            stockExportImportStore.clearMessages();
        };

        const showToast = (severity, summary, detail, life = 5000) => {
            toast.add({ severity, summary, detail, life });
        };

        const exportProductsWithoutStock = async () => {
            try {
                await stockExportImportStore.exportProductsWithoutStock();

                if (stockExportImportStore.success) {
                    showToast('success', 'Éxito', stockExportImportStore.message, 3000);
                } else {
                    throw new Error(stockExportImportStore.error);
                }
            } catch (error) {
                console.error('Error al exportar productos sin stock:', error);
                showToast('error', 'Error', stockExportImportStore.error || 'Error al exportar productos sin stock');
            }
        };

        const downloadTemplate = async () => {
            try {
                await stockExportImportStore.downloadTemplate();

                if (stockExportImportStore.success) {
                    showToast('success', 'Éxito', stockExportImportStore.message, 3000);
                } else {
                    throw new Error(stockExportImportStore.error);
                }
            } catch (error) {
                console.error('Error al descargar plantilla:', error);
                showToast('error', 'Error', stockExportImportStore.error || 'Error al descargar la plantilla');
            }
        };

        const onFileSelect = async (event) => {
            const file = event.files[0];
            if (!file) return;

            // Validar tipo de archivo
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

            if (!validTypes.includes(file.type)) {
                showToast('warn', 'Archivo inválido', 'Por favor selecciona un archivo Excel (.xlsx o .xls)');
                if (fileUploadRef.value) {
                    fileUploadRef.value.clear();
                }
                return;
            }

            selectedFile.value = file;
            validationResult.value = null;
            isValidating.value = true;
            validationProgress.value = 0;

            try {
                // Simular progreso de validación
                const progressInterval = setInterval(() => {
                    if (validationProgress.value < 90) {
                        validationProgress.value += 10;
                    }
                }, 100);

                // Procesar y validar el archivo
                const rows = await processStockImportData(file);
                const result = validateStockImportStructure(rows);

                clearInterval(progressInterval);
                validationProgress.value = 100;

                validationResult.value = result;

                if (result.isValid) {
                    showToast('success', 'Validación exitosa', `${result.validRows} filas válidas encontradas`, 3000);
                } else {
                    showToast('warn', 'Errores encontrados', `Se encontraron ${result.errors.length} errores de validación`);
                }
            } catch (error) {
                console.error('Error al procesar archivo:', error);
                validationResult.value = {
                    isValid: false,
                    errors: ['Error al procesar el archivo. Verifique que sea un archivo Excel válido.'],
                    validRows: 0
                };
                showToast('error', 'Error', 'No se pudo procesar el archivo seleccionado');
            } finally {
                isValidating.value = false;
            }
        };

        const importStock = async () => {
            if (!canImport.value) return;

            try {
                const result = await stockExportImportStore.importInitialStock(selectedFile.value);

                if (stockExportImportStore.success) {
                    showToast('success', 'Importación exitosa', stockExportImportStore.message);
                    emit('stock-imported', result);
                    // Emitir evento adicional para recargar datos
                    emit('refresh-data');
                    close();
                } else {
                    throw new Error(stockExportImportStore.error);
                }
            } catch (error) {
                console.error('Error al importar stock:', error);

                const errorMessage = stockExportImportStore.error || 'Error al importar stock inicial';
                showToast('error', 'Error de importación', errorMessage);

                // Mostrar errores específicos del backend
                handleImportErrors();
            }
        };

        const handleImportErrors = () => {
            const importResults = stockExportImportStore.importResults;
            if (!importResults?.errors) return;

            if (typeof importResults.errors === 'object' && !Array.isArray(importResults.errors)) {
                // Errores por campo
                Object.entries(importResults.errors).forEach(([field, fieldErrors]) => {
                    if (Array.isArray(fieldErrors)) {
                        fieldErrors.forEach((err) => {
                            showToast('warn', `Error en ${field}`, err, 7000);
                        });
                    }
                });
            } else if (Array.isArray(importResults.errors)) {
                // Array de errores
                importResults.errors.forEach((error) => {
                    showToast('warn', 'Error de validación', error, 7000);
                });
            }
        };

        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const removeFile = () => {
            selectedFile.value = null;
            validationResult.value = null;
            if (fileUploadRef.value) {
                fileUploadRef.value.clear();
            }
        };

        return {
            // Estado
            activeTab,
            selectedFile,
            validationResult,
            fileUploadRef,
            isValidating,
            validationProgress,

            // Computadas
            exporting,
            downloadingTemplate,
            importing,
            canImport,
            fileInfo,

            // Métodos
            close,
            resetForm,
            exportProductsWithoutStock,
            downloadTemplate,
            onFileSelect,
            importStock,
            formatFileSize,
            removeFile
        };
    }
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" modal header="Importar/Exportar Stock Inicial" :style="{ width: '60vw' }" :closable="true" :draggable="false" :resizable="false" class="stock-dialog">
        <div class="p-fluid">
            <Tabs v-model:value="activeTab">
                <TabList>
                    <Tab value="0">
                        <i class="pi pi-download mr-2"></i>
                        Exportar
                    </Tab>
                    <Tab value="1">
                        <i class="pi pi-upload mr-2"></i>
                        Importar
                    </Tab>
                </TabList>

                <TabPanels>
                    <!-- Panel de Exportación -->
                    <TabPanel value="0">
                        <div class="flex flex-column gap-5">
                            <!-- Exportar productos sin stock -->
                            <Card class="shadow-1">
                                <template #header>
                                    <div class="p-3 bg-blue-50">
                                        <div class="flex align-items-center gap-3">
                                            <i class="pi pi-database text-blue-600 text-2xl"></i>
                                            <div>
                                                <h5 class="m-0 text-blue-800">Exportar Productos sin Stock</h5>
                                                <p class="m-0 text-sm text-blue-600">Productos activos con stock 0 o sin stock</p>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template #content>
                                    <p class="text-600 mb-4 line-height-3">Exporta productos activos que no tienen stock o tienen cantidad 0. El archivo incluye información completa del producto y columnas preparadas para llenar manualmente.</p>
                                    <Button label="Exportar Productos" icon="pi pi-download" @click="exportProductsWithoutStock" :loading="exporting" size="large" class="w-full" />
                                </template>
                            </Card>

                            <!-- Descargar plantilla -->
                            <Card class="shadow-1">
                                <template #header>
                                    <div class="p-3 bg-green-50">
                                        <div class="flex align-items-center gap-3">
                                            <i class="pi pi-file-excel text-green-600 text-2xl"></i>
                                            <div>
                                                <h5 class="m-0 text-green-800">Plantilla de Importación</h5>
                                                <p class="m-0 text-sm text-green-600">Archivo Excel con formato estándar</p>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template #content>
                                    <p class="text-600 mb-4 line-height-3">Descarga una plantilla Excel vacía para importar stock inicial. Esta plantilla tiene la misma estructura que la exportación anterior.</p>
                                    <Button label="Descargar Plantilla" icon="pi pi-file-excel" severity="success" @click="downloadTemplate" :loading="downloadingTemplate" size="large" class="w-full" />
                                </template>
                            </Card>
                        </div>
                    </TabPanel>

                    <!-- Panel de Importación -->
                    <TabPanel value="1">
                        <div class="import-container">
                            <!-- Paso 1: Instrucciones -->
                            <div class="import-step">
                                <div class="step-header">
                                    <span class="step-number">1</span>
                                    <h5 class="step-title">Preparar archivo</h5>
                                </div>
                                <div class="step-content">
                                    <p class="text-600 line-height-3 mb-0">Asegúrate de que tu archivo Excel siga la estructura de la plantilla. Puedes descargar la plantilla desde la pestaña "Exportar".</p>
                                </div>
                            </div>

                            <Divider />

                            <!-- Paso 2: Seleccionar archivo -->
                            <div class="import-step">
                                <div class="step-header">
                                    <span class="step-number">2</span>
                                    <h5 class="step-title">Seleccionar archivo</h5>
                                </div>
                                <div class="step-content">
                                    <FileUpload
                                        ref="fileUploadRef"
                                        mode="basic"
                                        name="file"
                                        :auto="false"
                                        accept=".xlsx,.xls"
                                        :maxFileSize="2097152"
                                        @select="onFileSelect"
                                        :disabled="importing"
                                        chooseLabel="Seleccionar Archivo Excel"
                                        class="w-full file-upload-custom"
                                    />
                                    <small class="text-500 mt-2 block"> Formatos: .xlsx, .xls | Tamaño máximo: 2MB </small>

                                    <!-- Información del archivo seleccionado -->
                                    <div v-if="fileInfo" class="mt-4">
                                        <div class="file-info-card">
                                            <div class="flex align-items-center gap-3">
                                                <div class="file-icon">
                                                    <i class="pi pi-file-excel"></i>
                                                </div>
                                                <div class="flex-1">
                                                    <div class="file-name">{{ fileInfo.name }}</div>
                                                    <div class="file-size">{{ fileInfo.size }}</div>
                                                </div>
                                                <Button icon="pi pi-times" size="small" text rounded severity="secondary" @click="removeFile" :disabled="isValidating" class="remove-file-btn" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Paso 3: Validación (solo cuando está validando) -->
                            <template v-if="selectedFile">
                                <Divider />

                                <div class="import-step">
                                    <div class="step-header">
                                        <span class="step-number">3</span>
                                        <h5 class="step-title">Validación</h5>
                                    </div>
                                    <div class="step-content">
                                        <!-- Progreso de validación -->
                                        <div v-if="isValidating" class="validation-progress">
                                            <div class="flex align-items-center gap-3 mb-3">
                                                <i class="pi pi-spin pi-spinner text-primary"></i>
                                                <span class="text-600">Validando estructura del archivo...</span>
                                            </div>
                                            <ProgressBar :value="validationProgress" />
                                        </div>

                                        <!-- Resultados de validación -->
                                        <div v-else-if="validationResult" class="validation-results">
                                            <!-- Errores de validación -->
                                            <div v-if="!validationResult.isValid" class="validation-error">
                                                <div class="flex align-items-start gap-3">
                                                    <i class="pi pi-exclamation-triangle text-red-500 mt-1"></i>
                                                    <div class="flex-1">
                                                        <h6 class="text-red-700 mt-0 mb-2">Errores encontrados</h6>
                                                        <div class="error-list">
                                                            <ScrollPanel style="width: 100%; height: 120px">
                                                                <ul class="text-red-600 text-sm mt-0 mb-0 pl-0 list-none">
                                                                    <li v-for="(error, index) in validationResult.errors" :key="index" class="mb-2 p-2 bg-red-50 border-round"><i class="pi pi-times-circle mr-2"></i>{{ error }}</li>
                                                                </ul>
                                                            </ScrollPanel>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Validación exitosa -->
                                            <div v-else class="validation-success">
                                                <div class="flex align-items-center gap-3">
                                                    <i class="pi pi-check-circle text-green-500 text-xl"></i>
                                                    <div>
                                                        <h6 class="text-green-700 mt-0 mb-1">¡Archivo válido!</h6>
                                                        <p class="text-green-600 text-sm m-0">{{ validationResult.validRows }} filas listas para importar</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Paso 4: Importar (solo si el archivo es válido) -->
                                <template v-if="validationResult?.isValid && !isValidating">
                                    <Divider />

                                    <div class="import-step">
                                        <div class="step-header">
                                            <span class="step-number">4</span>
                                            <h5 class="step-title">Importar datos</h5>
                                        </div>
                                        <div class="step-content">
                                            <p class="text-600 mb-4 line-height-3">Todo listo para importar. Esta acción actualizará el stock inicial de los productos.</p>
                                            <Button label="Importar Stock Inicial" icon="pi pi-upload" @click="importStock" :disabled="!canImport" :loading="importing" size="large" class="w-full" />
                                        </div>
                                    </div>
                                </template>
                            </template>
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </div>

        <template #footer>
            <div class="flex justify-content-between align-items-center">
                <small class="text-500"> Formatos soportados: Excel (.xlsx, .xls) - Tamaño máximo: 2MB </small>
                <Button label="Cerrar" icon="pi pi-times" text @click="close" :disabled="importing || exporting || downloadingTemplate" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.stock-dialog :deep(.p-dialog-content) {
    padding: 1.5rem;
}

.stock-dialog :deep(.p-card-header) {
    padding: 0;
}

.stock-dialog :deep(.p-card-content) {
    padding-top: 0;
}

.stock-dialog :deep(.p-tabview-panels) {
    padding-top: 1rem;
}

.stock-dialog :deep(.p-fileupload-basic) {
    justify-content: center;
}

.stock-dialog :deep(.p-fileupload-basic .p-button) {
    width: 100%;
    justify-content: center;
}

/* Estilos para la sección de importación */
.import-container {
    max-width: 100%;
}

.import-step {
    margin-bottom: 2rem;
}

.step-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: var(--primary-color);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.875rem;
    flex-shrink: 0;
}

.step-title {
    margin: 0;
    color: var(--text-color);
    font-size: 1.1rem;
}

.step-content {
    margin-left: 3rem;
}

.file-info-card {
    padding: 1rem;
    background: var(--surface-50);
    border: 1px solid var(--surface-200);
    border-radius: var(--border-radius);
    transition: all 0.2s ease;
}

.file-info-card:hover {
    background: var(--surface-100);
}

.file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    background: var(--primary-50);
    color: var(--primary-500);
    border-radius: var(--border-radius);
    font-size: 1.25rem;
}

.file-name {
    font-weight: 600;
    color: var(--text-color);
    margin-bottom: 0.25rem;
}

.file-size {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
}

.remove-file-btn {
    opacity: 0.7;
    transition: opacity 0.2s ease;
}

.remove-file-btn:hover {
    opacity: 1;
}

.validation-progress {
    padding: 1.5rem;
    background: var(--surface-50);
    border-radius: var(--border-radius);
    border: 1px solid var(--surface-200);
}

.validation-results {
    margin-top: 0.5rem;
}

.validation-error {
    padding: 1.5rem;
    background: var(--red-50);
    border: 1px solid var(--red-200);
    border-radius: var(--border-radius);
}

.validation-success {
    padding: 1.5rem;
    background: var(--green-50);
    border: 1px solid var(--green-200);
    border-radius: var(--border-radius);
}

.error-list {
    margin-top: 0.75rem;
}

.file-upload-custom :deep(.p-button) {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
}

/* Dividers con espaciado */
.import-container :deep(.p-divider) {
    margin: 2rem 0;
}

.import-container :deep(.p-divider .p-divider-content) {
    background: var(--surface-0);
}
</style>
