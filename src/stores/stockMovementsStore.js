import { fetchStockEntries, fetchStockExits, fetchStockMovements } from '@/api';
import { handleProcessError, handleProcessSuccess } from '@/utils/apiHelpers';
import { defineStore } from 'pinia';

export const useStockMovementsStore = defineStore('stockMovementsStore', {
    state: () => ({
        // Movimientos de stock
        movements: [],
        selectedMovement: null,

        // Filtros y búsqueda
        searchTerm: '',
        filters: {
            type: null, // 'entry', 'exit', 'adjustment', 'transfer'
            product: null,
            warehouse: null,
            user: null,
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
            totalMovements: 0,
            totalEntries: 0,
            totalExits: 0,
            totalAdjustments: 0,
            totalTransfers: 0
        }
    }),

    getters: {
        // Lista de movimientos
        movementsList: (state) => state.movements,
        isLoadingMovements: (state) => state.isLoading,

        // Estadísticas
        movementStatistics: (state) => state.statistics,

        // Movimientos filtrados
        filteredMovements: (state) => {
            let result = state.movements;

            // Filtrar por término de búsqueda
            if (state.searchTerm) {
                const query = state.searchTerm.toLowerCase();
                result = result.filter(
                    (movement) =>
                        movement.product_name?.toLowerCase().includes(query) ||
                        movement.product_sku?.toLowerCase().includes(query) ||
                        movement.product_barcode?.toLowerCase().includes(query) ||
                        movement.reason?.toLowerCase().includes(query) ||
                        movement.reference_document?.toLowerCase().includes(query) ||
                        movement.warehouse_name?.toLowerCase().includes(query)
                );
            }

            // Filtrar por tipo de movimiento
            if (state.filters.type) {
                result = result.filter((movement) => movement.movement_type === state.filters.type);
            }

            // Filtrar por producto
            if (state.filters.product) {
                result = result.filter((movement) => movement.product_id === state.filters.product);
            }

            // Filtrar por almacén
            if (state.filters.warehouse) {
                result = result.filter((movement) => movement.warehouse_id === state.filters.warehouse);
            }

            // Filtrar por usuario
            if (state.filters.user) {
                result = result.filter((movement) => movement.user_id === state.filters.user);
            }

            // Filtrar por fecha desde
            if (state.filters.dateFrom) {
                result = result.filter((movement) => new Date(movement.created_at) >= new Date(state.filters.dateFrom));
            }

            // Filtrar por fecha hasta
            if (state.filters.dateTo) {
                result = result.filter((movement) => new Date(movement.created_at) <= new Date(state.filters.dateTo));
            }

            return result;
        },

        totalEntries() {
            return this.filteredMovements.filter((m) => m.movement_type === 'ENTRADA').length;
        },

        totalExits() {
            return this.filteredMovements.filter((m) => m.movement_type === 'SALIDA').length;
        },

        totalAdjustments() {
            return this.filteredMovements.filter((m) => m.movement_type === 'AJUSTE').length;
        },

        totalTransfers() {
            return this.filteredMovements.filter((m) => m.movement_type === 'TRANSFERENCIA').length;
        }
    },

    actions: {
        // Obtener todos los movimientos
        async fetchMovements(params = {}) {
            this.isLoading = true;
            this.clearMessage();
            try {
                const queryParams = {
                    search: this.searchTerm,
                    type: this.filters.type,
                    product_id: this.filters.product,
                    warehouse_id: this.filters.warehouse,
                    user_id: this.filters.user,
                    date_from: this.filters.dateFrom,
                    date_to: this.filters.dateTo,
                    paginate: params.paginate || false,
                    per_page: params.per_page || 50,
                    ...params
                };

                // Filtrar parámetros nulos
                Object.keys(queryParams).forEach((key) => {
                    if (queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === '') {
                        delete queryParams[key];
                    }
                });

                const res = await fetchStockMovements(queryParams);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    let movementsData = [];

                    if (processed.data && Array.isArray(processed.data)) {
                        movementsData = processed.data;
                    } else if (processed.data && processed.data.data) {
                        movementsData = processed.data.data || [];
                        this.pagination = {
                            current_page: processed.data.current_page || 1,
                            per_page: processed.data.per_page || 50,
                            total: processed.data.total || 0,
                            last_page: processed.data.last_page || 1
                        };
                    }

                    this.movements = movementsData.map((movement) => ({
                        ...movement,
                        product_name: movement.product?.name,
                        product_sku: movement.product?.sku,
                        product_barcode: movement.product?.barcode,
                        warehouse_name: movement.warehouse?.name,
                        warehouse_id: movement.warehouse?.id,
                        batch_code: movement.batch?.code,
                        batch_expiration: movement.batch?.expiration_date,
                        user_name: movement.user?.name
                    }));

                    this.updateStatistics();
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Obtener solo entradas
        async fetchEntries(params = {}) {
            this.isLoading = true;
            this.clearMessage();
            try {
                const res = await fetchStockEntries(params);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    const movementsData = processed.data || [];
                    // Mapear campos anidados para compatibilidad con componentes
                    this.movements = movementsData.map((movement) => ({
                        ...movement,
                        id: movement.id, // Asegurar que el ID esté disponible
                        type: movement.movement_type,
                        product_name: movement.product?.name,
                        product_sku: movement.product?.sku,
                        product_barcode: movement.product?.barcode,
                        warehouse_name: movement.warehouse?.name,
                        warehouse_id: movement.warehouse?.id,
                        batch_code: movement.batch?.code,
                        batch_expiration: movement.batch?.expiration_date,
                        user_name: movement.user?.name
                    }));
                    this.updateStatistics();
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        // Obtener solo salidas
        async fetchExits(params = {}) {
            this.isLoading = true;
            this.clearMessage();
            try {
                const res = await fetchStockExits(params);
                const processed = handleProcessSuccess(res, this);

                if (processed.success) {
                    const movementsData = processed.data || [];
                    // Mapear campos anidados para compatibilidad con componentes
                    this.movements = movementsData.map((movement) => ({
                        ...movement,
                        id: movement.id, // Asegurar que el ID esté disponible
                        type: movement.movement_type,
                        product_name: movement.product?.name,
                        product_sku: movement.product?.sku,
                        product_barcode: movement.product?.barcode,
                        warehouse_name: movement.warehouse?.name,
                        warehouse_id: movement.warehouse?.id,
                        batch_code: movement.batch?.code,
                        batch_expiration: movement.batch?.expiration_date,
                        user_name: movement.user?.name
                    }));
                    this.updateStatistics();
                }
            } catch (error) {
                handleProcessError(error, this);
            } finally {
                this.isLoading = false;
            }
        },

        updateStatistics() {
            this.statistics = {
                totalMovements: this.movements.length,
                totalEntries: this.movements.filter((m) => m.movement_type === 'ENTRADA').length,
                totalExits: this.movements.filter((m) => m.movement_type === 'SALIDA').length,
                totalAdjustments: this.movements.filter((m) => m.movement_type === 'AJUSTE').length,
                totalTransfers: this.movements.filter((m) => m.movement_type === 'TRANSFERENCIA').length
            };
        },

        // Setters para filtros
        setSearchTerm(term) {
            this.searchTerm = term;
        },

        setTypeFilter(type) {
            this.filters.type = type;
        },

        setProductFilter(productId) {
            this.filters.product = productId;
        },

        setWarehouseFilter(warehouseId) {
            this.filters.warehouse = warehouseId;
        },

        setUserFilter(userId) {
            this.filters.user = userId;
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
                product: null,
                warehouse: null,
                user: null,
                dateFrom: null,
                dateTo: null,
                reason: null
            };
        },

        // Resetear estado (patrón estándar)
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
