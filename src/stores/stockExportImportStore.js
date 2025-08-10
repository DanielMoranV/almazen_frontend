import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { exportProductsWithoutStock, downloadStockTemplate, importInitialStock } from '@/api/index.js';
import { downloadBlobAsFile } from '@/utils/excelUtils.js';

export const useStockExportImportStore = defineStore('stockExportImport', () => {
    // State
    const isLoading = ref(false);
    const isExporting = ref(false);
    const isImporting = ref(false);
    const error = ref(null);
    const success = ref(false);
    const message = ref('');
    const importResults = ref(null);

    // Computed
    const hasError = computed(() => !!error.value);
    const isProcessing = computed(() => isLoading.value || isExporting.value || isImporting.value);

    // Actions
    const clearMessages = () => {
        error.value = null;
        success.value = false;
        message.value = '';
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

    // Exportar productos sin stock usando backend
    const exportProductsWithoutStockAction = async () => {
        try {
            isExporting.value = true;
            clearMessages();

            const response = await exportProductsWithoutStock();

            // Generar nombre de archivo con company_id y timestamp
            const timestamp = new Date()
                .toISOString()
                .replace(/[-T:.Z]/g, '')
                .slice(0, 14);
            // Note: company_id should come from user auth context
            // For now using timestamp, but backend should provide proper filename
            const filename = `productos_sin_stock_${timestamp}.xlsx`;

            downloadBlobAsFile(response.data, filename);

            setSuccess('Productos sin stock exportados correctamente');
        } catch (err) {
            console.error('Error exporting products without stock:', err);
            setError(err.response?.data?.message || 'Error al exportar productos sin stock');
            throw err;
        } finally {
            isExporting.value = false;
        }
    };

    // Descargar plantilla usando backend
    const downloadTemplateAction = async () => {
        try {
            isExporting.value = true;
            clearMessages();

            const response = await downloadStockTemplate();

            // Generar nombre de archivo con company_id y timestamp
            const timestamp = new Date()
                .toISOString()
                .replace(/[-T:.Z]/g, '')
                .slice(0, 14);
            // Note: company_id should come from user auth context
            // For now using timestamp, but backend should provide proper filename
            const filename = `plantilla_stock_inicial_${timestamp}.xlsx`;

            downloadBlobAsFile(response.data, filename);

            setSuccess('Plantilla descargada correctamente');
        } catch (err) {
            console.error('Error downloading template:', err);
            setError(err.response?.data?.message || 'Error al descargar la plantilla');
            throw err;
        } finally {
            isExporting.value = false;
        }
    };

    // Importar stock inicial usando backend
    const importInitialStockAction = async (file) => {
        try {
            isImporting.value = true;
            clearMessages();

            const response = await importInitialStock(file);

            // Manejar estructura de respuesta del backend: { success: true, data: { ... } }
            const responseData = response.data.data || response.data;
            importResults.value = responseData;

            const processedRows = responseData.processed_rows || 0;
            const successfulRows = responseData.successful_rows?.length || processedRows;

            setSuccess(`Stock inicial importado exitosamente: ${processedRows} filas procesadas (${successfulRows} exitosas)`);

            return response.data;
        } catch (err) {
            console.error('Error importing initial stock:', err);

            const errorMessage = err.response?.data?.message || 'Error al importar stock inicial';
            setError(errorMessage);

            // Guardar resultados con errores para mostrar detalles
            if (err.response?.data) {
                const errorData = err.response.data;
                importResults.value = {
                    success: false,
                    errors: errorData.errors || [],
                    processed_rows: 0,
                    // Manejo de errores específicos por campo/fila
                    validation_errors: errorData.errors || {},
                    field_errors: typeof errorData.errors === 'object' ? errorData.errors : []
                };
            }

            throw err;
        } finally {
            isImporting.value = false;
        }
    };

    // Reset store state
    const resetStore = () => {
        isLoading.value = false;
        isExporting.value = false;
        isImporting.value = false;
        error.value = null;
        success.value = false;
        message.value = '';
        importResults.value = null;
    };

    return {
        // State
        isLoading: readonly(isLoading),
        isExporting: readonly(isExporting),
        isImporting: readonly(isImporting),
        error: readonly(error),
        success: readonly(success),
        message: readonly(message),
        importResults: readonly(importResults),

        // Computed
        hasError,
        isProcessing,

        // Actions
        clearMessages,
        exportProductsWithoutStock: exportProductsWithoutStockAction,
        downloadTemplate: downloadTemplateAction,
        importInitialStock: importInitialStockAction,
        resetStore
    };
});
