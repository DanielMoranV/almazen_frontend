import discountCodesApi from '@/api/discountCodes';
import { computed, ref } from 'vue';

/**
 * Composable for managing discount logic
 * Provides reusable functionality for applying and validating discounts
 */
export function useDiscount() {
    // State
    const discountCode = ref(null);
    const discountType = ref('none');
    const discountPercentage = ref(0);
    const discountAmount = ref(0);
    const validating = ref(false);
    const error = ref('');

    // Computed
    const hasDiscount = computed(() => discountAmount.value > 0);

    const hasDiscountCode = computed(() => discountCode.value !== null);

    const discountInfo = computed(() => {
        if (!hasDiscount.value) return null;

        return {
            code: discountCode.value?.code || null,
            name: discountCode.value?.name || 'Descuento Manual',
            type: discountType.value,
            percentage: discountPercentage.value,
            amount: discountAmount.value,
            description: discountCode.value?.description || null
        };
    });

    /**
     * Validate a discount code
     * @param {string} code - Discount code to validate
     * @param {number} subtotal - Order subtotal
     * @param {number} customerId - Customer ID (optional)
     * @returns {Promise<boolean>} True if valid, false otherwise
     */
    const validateCode = async (code, subtotal, customerId = null) => {
        if (!code || !code.trim()) {
            clearDiscount();
            return false;
        }

        validating.value = true;
        error.value = '';

        try {
            const response = await discountCodesApi.validate(code, subtotal, customerId);
            console.log('[useDiscount] API Response:', response);

            if (response.success) {
                const data = response.data;

                // Apply discount
                discountCode.value = data.discount_code;
                discountType.value = data.discount_type;
                discountPercentage.value = data.discount_percentage;
                discountAmount.value = data.discount_amount;

                console.log('[useDiscount] Code validated successfully:', data);
                return true;
            }
        } catch (err) {
            error.value = err.response?.data?.message || 'Código de descuento inválido';
            console.error('[useDiscount] Error validating code:', err);
            clearDiscount();
            return false;
        } finally {
            validating.value = false;
        }

        return false;
    };

    /**
     * Apply a manual discount
     * @param {string} type - 'fixed' or 'percentage'
     * @param {number} value - Discount value
     * @param {number} subtotal - Order subtotal
     */
    const applyManualDiscount = (type, value, subtotal) => {
        // Clear any existing code
        if (discountCode.value) {
            discountCode.value = null;
        }

        discountType.value = type;
        error.value = '';

        if (type === 'percentage') {
            // Ensure percentage is between 0 and 100
            const percentage = Math.max(0, Math.min(100, parseFloat(value) || 0));
            discountPercentage.value = percentage;
            discountAmount.value = (subtotal * percentage) / 100;
        } else if (type === 'fixed') {
            // Ensure fixed amount doesn't exceed subtotal
            const amount = Math.max(0, parseFloat(value) || 0);
            discountPercentage.value = 0;
            discountAmount.value = Math.min(amount, subtotal);
        }

        console.log('[useDiscount] Manual discount applied:', {
            type,
            value,
            discountAmount: discountAmount.value
        });
    };

    /**
     * Clear all discount data
     */
    const clearDiscount = () => {
        discountCode.value = null;
        discountType.value = 'none';
        discountPercentage.value = 0;
        discountAmount.value = 0;
        error.value = '';

        console.log('[useDiscount] Discount cleared');
    };

    /**
     * Calculate discount amount based on current settings
     * @param {number} subtotal - Order subtotal
     * @returns {number} Calculated discount amount
     */
    const calculateDiscount = (subtotal) => {
        if (discountType.value === 'percentage') {
            return (subtotal * discountPercentage.value) / 100;
        } else if (discountType.value === 'fixed') {
            return Math.min(discountAmount.value, subtotal);
        }
        return 0;
    };

    /**
     * Get discount data for API submission
     * @returns {Object} Discount data object
     */
    const getDiscountData = () => {
        return {
            discount_code: discountCode.value?.code || '',
            discount_code_id: discountCode.value?.id || null,
            discount_type: discountType.value,
            discount_percentage: discountPercentage.value,
            discount_amount: discountAmount.value
        };
    };

    /**
     * Format discount for display
     * @returns {string} Formatted discount string
     */
    const formatDiscount = () => {
        if (!hasDiscount.value) return '';

        if (discountType.value === 'percentage') {
            return `${discountPercentage.value}% (S/ ${discountAmount.value.toFixed(2)})`;
        } else if (discountType.value === 'fixed') {
            return `S/ ${discountAmount.value.toFixed(2)}`;
        }

        return '';
    };

    return {
        // State
        discountCode,
        discountType,
        discountPercentage,
        discountAmount,
        validating,
        error,

        // Computed
        hasDiscount,
        hasDiscountCode,
        discountInfo,

        // Methods
        validateCode,
        applyManualDiscount,
        clearDiscount,
        calculateDiscount,
        getDiscountData,
        formatDiscount
    };
}
