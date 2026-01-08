import promotionsApi from '@/api/promotions';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const usePromotionsStore = defineStore('promotions', () => {
    // State
    const promotions = ref([]);
    const currentPromotion = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Getters
    const activePromotions = computed(() => {
        return promotions.value.filter((promo) => promo.is_active);
    });

    const getPromotionById = computed(() => {
        return (id) => promotions.value.find((promo) => promo.id === id);
    });

    // Actions
    /**
     * Fetch all promotions with optional filters
     */
    const fetchPromotions = async (filters = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await promotionsApi.list(filters);
            const data = response.data || [];
            promotions.value = Array.isArray(data) ? data : [];
            return promotions.value;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al cargar promociones';
            console.error('[PromotionsStore] Error fetching promotions:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get a single promotion by ID
     */
    const getPromotion = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await promotionsApi.get(id);
            currentPromotion.value = response.data;
            return currentPromotion.value;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al cargar promoción';
            console.error('[PromotionsStore] Error getting promotion:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Create a new promotion
     */
    const createPromotion = async (data) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await promotionsApi.create(data);
            const newPromotion = response.data;

            // Add to list if valid
            if (newPromotion) {
                promotions.value.unshift(newPromotion);
            }

            return newPromotion;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al crear promoción';
            console.error('[PromotionsStore] Error creating promotion:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Update an existing promotion
     */
    const updatePromotion = async (id, data) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await promotionsApi.update(id, data);
            const updatedPromotion = response.data;

            // Update in list
            const index = promotions.value.findIndex((promo) => promo.id === id);
            if (index !== -1) {
                promotions.value[index] = updatedPromotion;
            }

            if (currentPromotion.value?.id === id) {
                currentPromotion.value = updatedPromotion;
            }

            return updatedPromotion;
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al actualizar promoción';
            console.error('[PromotionsStore] Error updating promotion:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Delete a promotion
     */
    const deletePromotion = async (id) => {
        loading.value = true;
        error.value = null;

        try {
            await promotionsApi.delete(id);

            // Remove from list
            promotions.value = promotions.value.filter((promo) => promo.id !== id);

            if (currentPromotion.value?.id === id) {
                currentPromotion.value = null;
            }
        } catch (err) {
            error.value = err.details?.error_message || err.message || 'Error al eliminar promoción';
            console.error('[PromotionsStore] Error deleting promotion:', err);
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
     * Clear current promotion
     */
    const clearCurrentPromotion = () => {
        currentPromotion.value = null;
    };

    return {
        // State
        promotions,
        currentPromotion,
        loading,
        error,

        // Getters
        activePromotions,
        getPromotionById,

        // Actions
        fetchPromotions,
        getPromotion,
        createPromotion,
        updatePromotion,
        deletePromotion,
        clearError,
        clearCurrentPromotion
    };
});
