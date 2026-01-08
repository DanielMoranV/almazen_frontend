import api from './axios';

/**
 * Promotional Prices API Service
 * Handles all API calls related to promotional prices management
 */

const PROMOTIONS_ENDPOINT = '/promotional-prices';

export const promotionsApi = {
    /**
     * List all promotions with optional filters
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} List of promotions
     */
    list(params = {}) {
        return api.get(PROMOTIONS_ENDPOINT, { params });
    },

    /**
     * Get a single promotion by ID
     * @param {number} id - Promotion ID
     * @returns {Promise<Object>} Promotion details
     */
    get(id) {
        return api.get(`${PROMOTIONS_ENDPOINT}/${id}`);
    },

    /**
     * Create a new promotion
     * @param {Object} data - Promotion data
     * @returns {Promise<Object>} Created promotion
     */
    create(data) {
        return api.post(PROMOTIONS_ENDPOINT, data);
    },

    /**
     * Update an existing promotion
     * @param {number} id - Promotion ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated promotion
     */
    update(id, data) {
        return api.put(`${PROMOTIONS_ENDPOINT}/${id}`, data);
    },

    /**
     * Delete a promotion (soft delete)
     * @param {number} id - Promotion ID
     * @returns {Promise<void>}
     */
    delete(id) {
        return api.delete(`${PROMOTIONS_ENDPOINT}/${id}`);
    }
};

export default promotionsApi;
