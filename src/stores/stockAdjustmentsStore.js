import { createBulkStockAdjustments, createStockAdjustment, downloadStockAdjustmentTemplate, fetchStockAdjustments, getStockAdjustment, getStockAdjustmentsSummary, importStockAdjustmentsFromExcel } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useStockAdjustmentsStore = defineStore('stockAdjustmentsStore', {
    state: () => ({
        // Ajustes de stock
        adjustments: [],
        selectedAdjustment: null,

        // Filtros y búsqueda
        searchTerm: '',
        filters: {
            type: null, // 'POSITIVO', 'NEGATIVO'
            warehouse: null,
            dateFrom: null,
            dateTo: null,
            reason: null
        },

        // Estados de la aplicación
        message: '',
        success: false,
        isLoading: false,
        validationErrors: [],

        // Paginación
        pagination: {
            current_page: 1,
            per_page: 50,
            total: 0,
            last_page: 1
        },

        // Estadísticas
        statistics: {
            totalAdjustments: 0,
            totalPositive: 0,
            totalNegative: 0,
            totalQuantityAdjusted: 0
        },

        // Resumen de ajustes
        summary: null,

        // Excel Import/Export
        isExcelProcessing: false,
        importResult: null,
        importErrors: []
    }),

    getters: {
        // Lista de ajustes
        adjustmentsList: (state) => state.adjustments,
        isLoadingAdjustments: (state) => state.isLoading,

        // Estadísticas
        adjustmentStatistics: (state) => state.statistics,

        // Ajustes filtrados
        filteredAdjustments: (state) => {
            let result = state.adjustments;

            // Filtrar por término de búsqueda
            if (state.searchTerm) {
                const query = state.searchTerm.toLowerCase();
                result = result.filter(
                    (adjustment) =>
                        adjustment.product_name?.toLowerCase().includes(query) ||
                        adjustment.product_sku?.toLowerCase().includes(query) ||
                        adjustment.reason?.toLowerCase().includes(query) ||
                        adjustment.reference_document?.toLowerCase().includes(query) ||
                        adjustment.warehouse_name?.toLowerCase().includes(query) ||
                        adjustment.user_name?.toLowerCase().includes(query)
                );
            }

            // Filtrar por tipo de movimiento
            if (state.filters.type) {
                result = result.filter((adjustment) => adjustment.movement_type === state.filters.type);
            }

            // Filtrar por almacén
            if (state.filters.warehouse) {
                result = result.filter((adjustment) => adjustment.warehouse_id === state.filters.warehouse);
            }

            // Filtrar por fecha desde
            if (state.filters.dateFrom) {
                result = result.filter((adjustment) => new Date(adjustment.created_at) >= new Date(state.filters.dateFrom));
            }

            // Filtrar por fecha hasta
            if (state.filters.dateTo) {
                result = result.filter((adjustment) => new Date(adjustment.created_at) <= new Date(state.filters.dateTo));
            }

            return result;
        },

        // Totales por tipo (mapear movement_type a adjustment_type para compatibilidad)
        totalPositive() {
            return this.filteredAdjustments.filter((a) => a.movement_type === 'ENTRADA').length;
        },

        totalNegative() {
            return this.filteredAdjustments.filter((a) => a.movement_type === 'SALIDA').length;
        },

        totalQuantityAdjusted() {
            return this.filteredAdjustments.reduce((total, adjustment) => {
                return total + parseFloat(adjustment.quantity || 0);
            }, 0);
        }
    },

    actions: {
        // Obtener todos los ajustes
        async fetchAdjustments(params = {}) {
            this.isLoading = true;
            this.clearMessage();
            try {
                // Mapear filtros internos a parámetros de API
                const queryParams = {
                    // Parámetros de búsqueda
                    product_id: params.product_id,
                    warehouse_id: this.filters.warehouse || params.warehouse_id,
                    movement_type: this.filters.type || params.movement_type,
                    user_id: params.user_id,
                    date_from: this.filters.dateFrom || params.date_from,
                    date_to: this.filters.dateTo || params.date_to,
                    reference_document: params.reference_document,
                    per_page: params.per_page || 25,
                    page: params.page || 1
                };

                // Filtrar parámetros nulos
                Object.keys(queryParams).forEach((key) => {
                    if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === '') {
                        delete queryParams[key];
                    }
                });

                // Llamada real a la API
                const response = await fetchStockAdjustments(queryParams);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    let adjustmentsData = [];

                    if (processed.data && Array.isArray(processed.data)) {
                        adjustmentsData = processed.data;
                    } else if (processed.data && processed.data.data) {
                        // Respuesta paginada según especificación API
                        adjustmentsData = processed.data.data;
                        this.pagination = {
                            current_page: processed.data.current_page || 1,
                            per_page: processed.data.per_page || 25,
                            total: processed.data.total || 0,
                            last_page: processed.data.last_page || 1
                        };
                    }

                    this.adjustments = adjustmentsData.map((adjustment) => ({
                        ...adjustment,
                        product_name: adjustment.stock?.product?.name,
                        product_sku: adjustment.stock?.product?.sku,
                        warehouse_name: adjustment.stock?.warehouse?.name,
                        warehouse_id: adjustment.stock?.warehouse?.id,
                        batch_code: adjustment.stock?.batch?.code,
                        user_name: adjustment.user?.name,
                        // Mapear movement_type a adjustment_type para compatibilidad con el modal
                        adjustment_type: adjustment.movement_type === 'ENTRADA' ? 'POSITIVO' : 'NEGATIVO'
                    }));

                    this.updateStatistics();
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Crear nuevo ajuste
        async createAdjustment(adjustmentData) {
            this.isLoading = true;
            this.clearMessage();
            try {
                // Mapear datos del frontend a formato de API
                const apiPayload = {
                    stock_id: adjustmentData.stock_id,
                    adjustment_type: adjustmentData.adjustment_type, // POSITIVO/NEGATIVO
                    quantity: adjustmentData.quantity,
                    reason: adjustmentData.reason,
                    reference_document: adjustmentData.reference_document || null,
                    notes: adjustmentData.notes || null
                };

                // Llamada real a la API
                const response = await createStockAdjustment(apiPayload);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Recargar ajustes después de crear uno nuevo
                    await this.fetchAdjustments();
                }

                return processed;
            } catch (error) {
                return handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Obtener ajuste específico por ID
        async getAdjustment(id) {
            this.isLoading = true;
            this.clearMessage();
            try {
                const response = await getStockAdjustment(id);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.selectedAdjustment = {
                        ...processed.data,
                        product_name: processed.data.stock?.product?.name,
                        product_sku: processed.data.stock?.product?.sku,
                        warehouse_name: processed.data.stock?.warehouse?.name,
                        warehouse_id: processed.data.stock?.warehouse?.id,
                        batch_code: processed.data.stock?.batch?.code,
                        user_name: processed.data.user?.name,
                        // Mapear movement_type a adjustment_type para compatibilidad con el modal
                        adjustment_type: processed.data.movement_type === 'ENTRADA' ? 'POSITIVO' : 'NEGATIVO'
                    };
                }

                return processed;
            } catch (error) {
                return handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Obtener resumen de ajustes
        async getSummary(params = {}) {
            this.isLoading = true;
            this.clearMessage();
            try {
                const response = await getStockAdjustmentsSummary(params);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.summary = processed.data;
                }

                return processed;
            } catch (error) {
                return handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Crear ajustes masivos
        async createBulkAdjustments(adjustmentsData) {
            this.isLoading = true;
            this.clearMessage();
            try {
                // Mapear datos del frontend a formato de API para bulk
                const apiPayload = {
                    adjustments: adjustmentsData.adjustments.map((adj) => ({
                        stock_id: adj.stock_id,
                        adjustment_type: adj.adjustment_type, // POSITIVO/NEGATIVO
                        quantity: adj.quantity,
                        reason: adj.reason,
                        reference_document: adj.reference_document || null,
                        notes: adj.notes || null
                    })),
                    global_reason: adjustmentsData.global_reason || null,
                    global_reference_document: adjustmentsData.global_reference_document || null
                };

                const response = await createBulkStockAdjustments(apiPayload);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    // Recargar ajustes después de crear ajustes masivos
                    await this.fetchAdjustments();
                }

                return processed;
            } catch (error) {
                return handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Actualizar estadísticas
        updateStatistics() {
            this.statistics = {
                totalAdjustments: this.adjustments.length,
                totalPositive: this.adjustments.filter((a) => a.movement_type === 'ENTRADA').length,
                totalNegative: this.adjustments.filter((a) => a.movement_type === 'SALIDA').length,
                totalQuantityAdjusted: this.adjustments.reduce((total, adjustment) => {
                    return total + parseFloat(adjustment.quantity || 0);
                }, 0)
            };
        },

        // Setters para filtros
        setSearchTerm(term) {
            this.searchTerm = term;
        },

        setTypeFilter(type) {
            this.filters.type = type;
        },

        setWarehouseFilter(warehouseId) {
            this.filters.warehouse = warehouseId;
        },

        setDateFromFilter(date) {
            this.filters.dateFrom = date;
        },

        setDateToFilter(date) {
            this.filters.dateTo = date;
        },

        // Limpiar filtros
        clearFilters() {
            this.searchTerm = '';
            this.filters = {
                type: null,
                warehouse: null,
                dateFrom: null,
                dateTo: null,
                reason: null
            };
        },

        // Resetear estado
        resetState() {
            this.isLoading = true;
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        },

        // Limpiar mensajes
        clearMessage() {
            this.message = '';
            this.success = false;
            this.validationErrors = [];
        },

        // Descargar plantilla Excel
        async downloadTemplate(params = {}) {
            this.isExcelProcessing = true;
            this.clearMessage();
            try {
                const queryParams = {
                    warehouse_id: params.warehouse_id,
                    include_expired: params.include_expired || false
                };

                // Filtrar parámetros nulos
                Object.keys(queryParams).forEach((key) => {
                    if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === '') {
                        delete queryParams[key];
                    }
                });

                const response = await downloadStockAdjustmentTemplate(queryParams);

                // Crear enlace de descarga
                const blob = new Blob([response.data], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                // Generar nombre del archivo
                const timestamp = new Date().toISOString().slice(0, 10);
                const warehouseSuffix = params.warehouse_id ? `_almacen_${params.warehouse_id}` : '';
                link.download = `plantilla_ajustes_stock${warehouseSuffix}_${timestamp}.xlsx`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                this.message = 'Plantilla descargada exitosamente';
                this.success = true;

                return { success: true, message: 'Plantilla descargada exitosamente' };
            } catch (error) {
                return handleProcessError(error, this);
            } finally {
                this.isExcelProcessing = false;
            }
        },

        // Importar ajustes desde Excel
        async importFromExcel(file, options = {}) {
            this.isExcelProcessing = true;
            this.clearMessage();
            this.importResult = null;
            this.importErrors = [];

            try {
                const formData = new FormData();
                formData.append('file', file);

                if (options.globalReason) {
                    formData.append('global_reason', options.globalReason);
                }
                if (options.globalReference) {
                    formData.append('global_reference_document', options.globalReference);
                }
                if (options.skipErrors) {
                    formData.append('skip_validation_errors', 'true');
                }

                const response = await importStockAdjustmentsFromExcel(formData);
                const processed = handleProcessSuccess(response, this);

                if (processed.success) {
                    this.importResult = processed.data;

                    // Si hay errores pero se procesó parcialmente
                    if (processed.data.errors && processed.data.errors.length > 0) {
                        this.importErrors = processed.data.errors;
                        this.message = `Importación completada con ${processed.data.summary.successful_adjustments} ajustes exitosos y ${processed.data.summary.failed_rows} errores`;
                    } else {
                        this.message = `Importación exitosa: ${processed.data.summary.successful_adjustments} ajustes procesados`;
                    }

                    this.success = true;

                    // Recargar ajustes después de importar
                    await this.fetchAdjustments();
                } else {
                    // Manejar errores de validación completos
                    if (processed.data && processed.data.errors) {
                        this.importErrors = processed.data.errors;
                    }
                }

                return processed;
            } catch (error) {
                return handleProcessError(error, this);
            } finally {
                this.isExcelProcessing = false;
            }
        },

        // Limpiar resultados de importación
        clearImportResult() {
            this.importResult = null;
            this.importErrors = [];
        }
    }
});
