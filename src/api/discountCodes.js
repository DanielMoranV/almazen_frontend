import api from './index';

/**
 * Discount Codes API Service
 * Handles all API calls related to discount codes management
 */

const DISCOUNT_CODES_ENDPOINT = '/discount-codes';

export const discountCodesApi = {
    /**
     * List all discount codes with optional filters
     * @param {Object} params - Filter parameters
     * @returns {Promise<Array>} List of discount codes
     */
    list(params = {}) {
        return api.get(DISCOUNT_CODES_ENDPOINT, { params });
    },

    /**
     * Get a single discount code by ID
     * @param {number} id - Discount code ID
     * @returns {Promise<Object>} Discount code details
     */
    get(id) {
        return api.get(`${DISCOUNT_CODES_ENDPOINT}/${id}`);
    },

    /**
     * Create a new discount code
     * @param {Object} data - Discount code data
     * @returns {Promise<Object>} Created discount code
     */
    create(data) {
        return api.post(DISCOUNT_CODES_ENDPOINT, data);
    },

    /**
     * Update an existing discount code
     * @param {number} id - Discount code ID
     * @param {Object} data - Updated data
     * @returns {Promise<Object>} Updated discount code
     */
    update(id, data) {
        return api.put(`${DISCOUNT_CODES_ENDPOINT}/${id}`, data);
    },

    /**
     * Delete a discount code (soft delete)
     * @param {number} id - Discount code ID
     * @returns {Promise<void>}
     */
    delete(id) {
        return api.delete(`${DISCOUNT_CODES_ENDPOINT}/${id}`);
    },

    /**
     * Validate a discount code
     * @param {string} code - Discount code to validate
     * @param {number} subtotal - Order subtotal
     * @param {number} customerId - Customer ID (optional)
     * @returns {Promise<Object>} Validation result with discount details
     */
    validate(code, subtotal, customerId = null) {
        return api.post(`${DISCOUNT_CODES_ENDPOINT}/validate`, {
            code: code.toUpperCase().trim(),
            subtotal,
            customer_id: customerId
        });
    },

    /**
     * Get statistics for a discount code
     * @param {number} id - Discount code ID
     * @returns {Promise<Object>} Usage statistics
     */
    getStats(id) {
        return api.get(`${DISCOUNT_CODES_ENDPOINT}/${id}/stats`);
    },

    /**
     * Toggle active status of a discount code
     * @param {number} id - Discount code ID
     * @returns {Promise<Object>} Updated discount code
     */
    toggleActive(id) {
        return api.patch(`${DISCOUNT_CODES_ENDPOINT}/${id}/toggle-active`);
    }
};

export default discountCodesApi;
