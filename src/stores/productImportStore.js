import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { downloadProductImportTemplate, importProductsFromExcel } from '@/api/index.js';
import { downloadBlobAsFile } from '@/utils/excelUtils.js';

export const useProductImportStore = defineStore('productImport', () => {
    // State
    const isLoading = ref(false);
    const isDownloading = ref(false);
    const isImporting = ref(false);
    const error = ref(null);
    const success = ref(false);
    const message = ref('');
    const importResults = ref(null);
    const uploadProgress = ref(0);

    // Computed
    const hasError = computed(() => !!error.value);
    const isProcessing = computed(() => isLoading.value || isDownloading.value || isImporting.value);

    // Actions
    const clearMessages = () => {
        error.value = null;
        success.value = false;
        message.value = '';
        uploadProgress.value = 0;
    };

    const setError = (errorMessage) => {
        error.value = errorMessage;
        success.value = false;
        message.value = errorMessage;
    };

    const setSuccess = (successMessage) => {
        error.value = null;
        success.value = true;
        message.value = successMessage;
    };

    // Descargar plantilla de importación de productos
    const downloadTemplate = async () => {
        try {
            isDownloading.value = true;
            clearMessages();

            const response = await downloadProductImportTemplate();

            // Generar nombre de archivo con timestamp
            const timestamp = new Date()
                .toISOString()
                .replace(/[-T:.Z]/g, '')
                .slice(0, 14);
            const filename = `plantilla_importacion_productos_${timestamp}.xlsx`;

            downloadBlobAsFile(response.data, filename);

            setSuccess('Plantilla de importación descargada correctamente');
        } catch (err) {
            console.error('Error downloading product import template:', err);
            setError(err.response?.data?.message || 'Error al descargar la plantilla de importación');
            throw err;
        } finally {
            isDownloading.value = false;
        }
    };

    // Importar productos desde Excel
    const importProducts = async (file) => {
        try {
            isImporting.value = true;
            clearMessages();
            uploadProgress.value = 0;

            const response = await importProductsFromExcel(file);

            // DEBUG: Log completo de la respuesta para diagnosticar
            console.log('🔍 Respuesta completa del backend:', response);
            console.log('🔍 response.data:', response.data);
            console.log('🔍 response.data.data:', response.data.data);

            // Manejar estructura de respuesta del backend
            const responseData = response.data.data || response.data;
            importResults.value = responseData;

            console.log('🔍 responseData procesado:', responseData);

            // Extraer información del resultado con múltiples variantes de nombres
            const totalProcessed = responseData.total_processed || 
                                  responseData.total_rows || 
                                  responseData.total || 
                                  responseData.count || 0;
            
            const successfulImports = responseData.successful_imports || 
                                     responseData.created_count || 
                                     responseData.created || 
                                     responseData.success_count || 
                                     responseData.imported || 0;
            
            const failedImports = responseData.failed_imports || 
                                 responseData.failed_count || 
                                 responseData.errors_count || 
                                 responseData.failed || 0;
            
            const duplicatesSkipped = responseData.duplicates_skipped || 
                                     responseData.duplicates || 
                                     responseData.skipped || 0;

            console.log('🔍 Estadísticas extraídas:', {
                totalProcessed,
                successfulImports,
                failedImports,
                duplicatesSkipped
            });

            // Construir mensaje de éxito detallado
            let successMessage = `Importación completada: ${totalProcessed} productos procesados`;
            if (successfulImports > 0) {
                successMessage += `, ${successfulImports} creados exitosamente`;
            }
            if (duplicatesSkipped > 0) {
                successMessage += `, ${duplicatesSkipped} duplicados omitidos`;
            }
            if (failedImports > 0) {
                successMessage += `, ${failedImports} con errores`;
            }

            setSuccess(successMessage);
            uploadProgress.value = 100;

            return response.data;
        } catch (err) {
            console.error('Error importing products from Excel:', err);

            const errorMessage = err.response?.data?.message || 'Error al importar productos desde Excel';
            setError(errorMessage);

            // Guardar resultados con errores para mostrar detalles
            if (err.response?.data) {
                const errorData = err.response.data;
                importResults.value = {
                    success: false,
                    total_processed: errorData.total_processed || 0,
                    successful_imports: 0,
                    failed_imports: errorData.failed_imports || 0,
                    duplicates_skipped: errorData.duplicates_skipped || 0,
                    // Errores de validación específicos
                    validation_errors: errorData.validation_errors || [],
                    field_errors: errorData.field_errors || {},
                    row_errors: errorData.row_errors || [],
                    // Errores generales
                    errors: errorData.errors || []
                };
            }

            throw err;
        } finally {
            isImporting.value = false;
        }
    };

    // Validar archivo antes de importar
    const validateImportFile = (file) => {
        const errors = [];

        // Validar tipo de archivo
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];

        if (!allowedTypes.includes(file.type)) {
            errors.push('El archivo debe ser de formato Excel (.xlsx o .xls)');
        }

        // Validar tamaño (máximo 10MB para productos)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            errors.push('El archivo es demasiado grande. Tamaño máximo permitido: 10MB');
        }

        // Validar nombre del archivo
        if (!file.name) {
            errors.push('El archivo debe tener un nombre válido');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };

    // Obtener resumen de importación
    const getImportSummary = () => {
        if (!importResults.value) return null;

        const results = importResults.value;
        return {
            totalProcessed: results.total_processed || 0,
            successfulImports: results.successful_imports || 0,
            failedImports: results.failed_imports || 0,
            duplicatesSkipped: results.duplicates_skipped || 0,
            hasErrors: results.validation_errors?.length > 0 || results.row_errors?.length > 0,
            validationErrors: results.validation_errors || [],
            rowErrors: results.row_errors || [],
            fieldErrors: results.field_errors || {}
        };
    };

    // Reset store state
    const resetStore = () => {
        isLoading.value = false;
        isDownloading.value = false;
        isImporting.value = false;
        error.value = null;
        success.value = false;
        message.value = '';
        importResults.value = null;
        uploadProgress.value = 0;
    };

    return {
        // State
        isLoading: readonly(isLoading),
        isDownloading: readonly(isDownloading),
        isImporting: readonly(isImporting),
        error: readonly(error),
        success: readonly(success),
        message: readonly(message),
        importResults: readonly(importResults),
        uploadProgress: readonly(uploadProgress),

        // Computed
        hasError,
        isProcessing,

        // Actions
        clearMessages,
        downloadTemplate,
        importProducts,
        validateImportFile,
        getImportSummary,
        resetStore
    };
});
