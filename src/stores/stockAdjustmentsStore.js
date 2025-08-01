import { createBulkStockAdjustments, createStockAdjustment, fetchStockAdjustments, getStockAdjustment, getStockAdjustmentsSummary } from '@/api';
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
        summary: null
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

            // Filtrar por tipo de ajuste (mapear POSITIVO/NEGATIVO a ENTRADA/SALIDA)
            if (state.filters.type) {
                const movementType = state.filters.type === 'POSITIVO' ? 'ENTRADA' : 'SALIDA';
                result = result.filter((adjustment) => adjustment.movement_type === movementType);
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
                    movement_type: this.filters.type ? (this.filters.type === 'POSITIVO' ? 'ENTRADA' : 'SALIDA') : params.movement_type,
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
                        adjustmentsData = processed.data.data || [];
                        this.pagination = {
                            current_page: processed.data.current_page || 1,
                            per_page: processed.data.per_page || 25,
                            total: processed.data.total || 0,
                            last_page: processed.data.last_page || 1
                        };
                    }

                    // Mapear campos anidados para compatibilidad con componentes
                    this.adjustments = adjustmentsData.map((adjustment) => ({
                        ...adjustment,
                        product_name: adjustment.stock?.product?.name,
                        product_sku: adjustment.stock?.product?.sku,
                        warehouse_name: adjustment.stock?.warehouse?.name,
                        warehouse_id: adjustment.stock?.warehouse?.id,
                        batch_code: adjustment.stock?.batch?.code,
                        user_name: adjustment.user?.name
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
                    this.selectedAdjustment = processed.data;
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
                totalPositive: this.adjustments.filter((a) => a.adjustment_type === 'POSITIVO').length,
                totalNegative: this.adjustments.filter((a) => a.adjustment_type === 'NEGATIVO').length,
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
        }
    }
});
