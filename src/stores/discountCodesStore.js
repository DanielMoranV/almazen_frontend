import discountCodesApi from '@/api/discountCodes';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useDiscountCodesStore = defineStore('discountCodes', () => {
    // State
    const discountCodes = ref([]);
    const currentCode = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Getters
    const activeDiscountCodes = computed(() => {
        return discountCodes.value.filter((code) => code.is_active);
    });

    const validDiscountCodes = computed(() => {
        const now = new Date();
        return discountCodes.value.filter((code) => {
            const validFrom = code.valid_from ? new Date(code.valid_from) : null;
            const validUntil = code.valid_until ? new Date(code.valid_until) : null;

            const isAfterStart = !validFrom || now >= validFrom;
            const isBeforeEnd = !validUntil || now <= validUntil;

            return code.is_active && isAfterStart && isBeforeEnd;
        });
    });

    const getCodeById = computed(() => {
        return (id) => discountCodes.value.find((code) => code.id === id);
    });

    // Actions
    /**
     * Fetch all discount codes with optional filters
     */
    const fetchDiscountCodes = async (filters = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.list(filters);
            const codes = response.data || [];
            discountCodes.value = codes.filter(c => c);
            return discountCodes.value;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al cargar códigos de descuento';
            console.error('[DiscountCodesStore] Error fetching codes:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get a single discount code by ID
     */
    const getDiscountCode = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.get(id);
            currentCode.value = response.data;
            return currentCode.value;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al cargar código de descuento';
            console.error('[DiscountCodesStore] Error getting code:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create a new discount code
     */
    const createDiscountCode = async (data) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.create(data);
            const newCode = response.data;

            // Add to list if valid
            if (newCode) {
                discountCodes.value.unshift(newCode);
            }

            return newCode;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al crear código de descuento';
            console.error('[DiscountCodesStore] Error creating code:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update an existing discount code
     */
    const updateDiscountCode = async (id, data) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.update(id, data);
            const updatedCode = response.data;

            // Update in list
            const index = discountCodes.value.findIndex((code) => code.id === id);
            if (index !== -1) {
                discountCodes.value[index] = updatedCode;
            }

            if (currentCode.value?.id === id) {
                currentCode.value = updatedCode;
            }

            return updatedCode;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al actualizar código de descuento';
            console.error('[DiscountCodesStore] Error updating code:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete a discount code
     */
    const deleteDiscountCode = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            await discountCodesApi.delete(id);

            // Remove from list
            discountCodes.value = discountCodes.value.filter((code) => code.id !== id);

            if (currentCode.value?.id === id) {
                currentCode.value = null;
            }
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al eliminar código de descuento';
            console.error('[DiscountCodesStore] Error deleting code:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Validate a discount code
     */
    const validateCode = async (code, subtotal, customerId = null) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.validate(code, subtotal, customerId);
            return response.data;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Código de descuento inválido';
            console.error('[DiscountCodesStore] Error validating code:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get statistics for a discount code
     */
    const getStats = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.getStats(id);
            return response.data;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al cargar estadísticas';
            console.error('[DiscountCodesStore] Error getting stats:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Toggle active status
     */
    const toggleActive = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await discountCodesApi.toggleActive(id);
            const updatedCode = response.data;

            // Update in list
            const index = discountCodes.value.findIndex((code) => code.id === id);
            if (index !== -1) {
                discountCodes.value[index] = updatedCode;
            }

            return updatedCode;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al cambiar estado';
            console.error('[DiscountCodesStore] Error toggling active:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Clear error
     */
    const clearError = () => {
        error.value = null;
    };

    /**
     * Clear current code
     */
    const clearCurrentCode = () => {
        currentCode.value = null;
    };

    return {
        // State
        discountCodes,
        currentCode,
        loading,
        error,

        // Getters
        activeDiscountCodes,
        validDiscountCodes,
        getCodeById,

        // Actions
        fetchDiscountCodes,
        getDiscountCode,
        createDiscountCode,
        updateDiscountCode,
        deleteDiscountCode,
        validateCode,
        getStats,
        toggleActive,
        clearError,
        clearCurrentCode
    };
});
