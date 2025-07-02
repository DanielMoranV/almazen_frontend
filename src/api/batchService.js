import api from '@/api/axios';

// Usar la instancia de axios centralizada que ya tiene 
// configurados los interceptores de autenticación y manejo de errores

/**
 * Servicio para gestión de lotes
 */
export const batchService = {
    /**
     * Obtener todos los lotes
     * @param {Object} params - Parámetros de consulta
     * @param {boolean} params.paginate - Si paginar los resultados
     * @param {number} params.per_page - Elementos por página
     * @param {string} params.search - Término de búsqueda
     * @param {string} params.product_id - ID del producto para filtrar
     * @returns {Promise} Respuesta de la API
     */
    async getBatches(params = {}) {
        try {
            const response = await api.get('/batches', { params });
            return response;
        } catch (error) {
            console.error('Error al obtener lotes:', error);
            throw error;
        }
    },

    /**
     * Crear un nuevo lote
     * @param {Object} batchData - Datos del lote
     * @param {string} batchData.product_id - ID del producto
     * @param {string} batchData.code - Código del lote
     * @param {string|null} batchData.expiration_date - Fecha de vencimiento
     * @returns {Promise} Respuesta de la API
     */
    async createBatch(batchData) {
        try {
            const response = await api.post('/batches', batchData);
            return response;
        } catch (error) {
            console.error('Error al crear lote:', error);
            throw error;
        }
    },

    /**
     * Obtener un lote específico
     * @param {string} batchId - ID del lote
     * @returns {Promise} Respuesta de la API
     */
    async getBatch(batchId) {
        try {
            const response = await api.get(`/batches/${batchId}`);
            return response;
        } catch (error) {
            console.error('Error al obtener lote:', error);
            throw error;
        }
    },

    /**
     * Actualizar un lote
     * @param {string} batchId - ID del lote
     * @param {Object} batchData - Datos a actualizar
     * @returns {Promise} Respuesta de la API
     */
    async updateBatch(batchId, batchData) {
        try {
            const response = await api.put(`/batches/${batchId}`, batchData);
            return response;
        } catch (error) {
            console.error('Error al actualizar lote:', error);
            throw error;
        }
    },

    /**
     * Eliminar un lote
     * @param {string} batchId - ID del lote
     * @returns {Promise} Respuesta de la API
     */
    async deleteBatch(batchId) {
        try {
            const response = await api.delete(`/batches/${batchId}`);
            return response;
        } catch (error) {
            console.error('Error al eliminar lote:', error);
            throw error;
        }
    },

    /**
     * Obtener lotes por producto
     * @param {string} productId - ID del producto
     * @param {Object} params - Parámetros adicionales
     * @param {boolean} params.include_expired - Incluir lotes expirados
     * @param {string} params.search - Término de búsqueda
     * @returns {Promise} Respuesta de la API
     */
    async getBatchesByProduct(productId, params = {}) {
        try {
            // Por defecto no incluir lotes expirados para la gestión de órdenes
            const queryParams = {
                include_expired: false,
                ...params
            };
            
            const response = await api.get(`/products/${productId}/batches`, { 
                params: queryParams 
            });
            
            // El interceptor ya retorna response.data, así que response ya es la data
            return response;
        } catch (error) {
            console.error('Error al obtener lotes por producto:', error);
            throw error;
        }
    },

    /**
     * Búsqueda avanzada de lotes
     * @param {Object} searchParams - Parámetros de búsqueda
     * @param {string} searchParams.code - Código del lote
     * @param {string} searchParams.product_id - ID del producto
     * @param {boolean} searchParams.expired - true para expirados, false para vigentes
     * @param {string} searchParams.expires_before - Fecha límite antes
     * @param {string} searchParams.expires_after - Fecha límite después
     * @param {number} searchParams.per_page - Elementos por página
     * @returns {Promise} Respuesta de la API
     */
    async searchBatches(searchParams = {}) {
        try {
            // Filtrar solo lotes vigentes por defecto
            const params = {
                expired: false,
                ...searchParams
            };
            
            const response = await api.get('/batches/search/advanced', { params });
            return response;
        } catch (error) {
            console.error('Error en búsqueda avanzada de lotes:', error);
            throw error;
        }
    },

    /**
     * Obtener lotes disponibles (no expirados) para un producto
     * @param {string} productId - ID del producto
     * @returns {Promise} Lotes disponibles para el producto
     */
    async getAvailableBatchesForProduct(productId) {
        try {
            const response = await this.getBatchesByProduct(productId, {
                include_expired: false
            });
            
            if (response.success) {
                // Filtrar solo lotes que no estén expirados
                const availableBatches = response.data.batches?.filter(batch => {
                    const isNotExpired = !batch.is_expired;
                    const isFutureDate = batch.expiration_date === null || new Date(batch.expiration_date) > new Date();
                    return isNotExpired && isFutureDate;
                }) || [];
                
                return {
                    ...response,
                    data: {
                        ...response.data,
                        batches: availableBatches
                    }
                };
            }
            
            return response;
        } catch (error) {
            console.error('Error al obtener lotes disponibles:', error);
            throw error;
        }
    },

    /**
     * Validar si un lote está disponible para usar
     * @param {Object} batch - Objeto del lote
     * @returns {boolean} True si el lote está disponible
     */
    isBatchAvailable(batch) {
        if (!batch) return false;
        
        // No debe estar expirado
        if (batch.is_expired) return false;
        
        // Si tiene fecha de vencimiento, debe ser futura
        if (batch.expiration_date) {
            const expirationDate = new Date(batch.expiration_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Inicio del día actual
            
            if (expirationDate <= today) return false;
        }
        
        return true;
    },

    /**
     * Formatear lote para mostrar en dropdown
     * @param {Object} batch - Objeto del lote
     * @returns {Object} Lote formateado para UI
     */
    formatBatchForDropdown(batch) {
        const expirationText = batch.expiration_date 
            ? new Date(batch.expiration_date).toLocaleDateString('es-PE')
            : 'Sin vencimiento';
            
        const daysToExpire = batch.days_to_expire !== null 
            ? `${Math.floor(batch.days_to_expire)} días`
            : '';

        return {
            id: batch.id,
            code: batch.code,
            label: `${batch.code} - Vence: ${expirationText}${daysToExpire ? ` (${daysToExpire})` : ''}`,
            expirationDate: batch.expiration_date,
            isExpired: batch.is_expired,
            daysToExpire: batch.days_to_expire !== null ? Math.floor(batch.days_to_expire) : null,
            totalStock: batch.total_stock || 0,
            stockSummary: batch.stock_summary || [],
            ...batch
        };
    }
};

export default batchService;