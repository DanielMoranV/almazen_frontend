<script setup>
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { computed } from 'vue';

const props = defineProps({
    discount: {
        type: Object,
        required: true,
        validator: (value) => {
            return value && typeof value.amount === 'number';
        }
    },
    removable: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['remove']);

const discountText = computed(() => {
    if (props.discount.type === 'percentage') {
        return `${props.discount.percentage}% (S/ ${props.discount.amount.toFixed(2)})`;
    }
    return `S/ ${props.discount.amount.toFixed(2)}`;
});

const discountLabel = computed(() => {
    if (props.discount.code) {
        return `Código: ${props.discount.code}`;
    }
    return 'Descuento Manual';
});

const severity = computed(() => {
    return props.discount.code ? 'success' : 'info';
});
</script>

<template>
    <div class="discount-summary" v-if="discount.amount > 0">
        <div class="discount-info">
            <div class="discount-header">
                <span class="discount-label">{{ discountLabel }}</span>
                <Tag :severity="severity" :value="discount.code ? 'Cupón' : 'Manual'" class="discount-tag" />
            </div>
            
            <div class="discount-details">
                <span class="discount-amount">- {{ discountText }}</span>
                <p v-if="discount.description" class="discount-description">{{ discount.description }}</p>
                <p v-if="discount.name && discount.code" class="discount-name">{{ discount.name }}</p>
            </div>
        </div>

        <Button
            v-if="removable"
            icon="pi pi-times"
            severity="danger"
            text
            rounded
            size="small"
            @click="emit('remove')"
            v-tooltip.top="'Quitar descuento'"
            class="remove-button"
        />
    </div>
</template>

<style scoped>
.discount-summary {
    @apply flex items-start justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg;
}

.discount-info {
    @apply flex flex-col gap-1 flex-1;
}

.discount-header {
    @apply flex items-center gap-2;
}

.discount-label {
    @apply font-semibold text-gray-900 dark:text-gray-100;
}

.discount-tag {
    @apply text-xs px-2 py-0.5;
}

.discount-details {
    @apply flex flex-col;
}

.discount-amount {
    @apply font-bold text-red-600 dark:text-red-400;
}

.discount-description,
.discount-name {
    @apply text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5;
}

.remove-button {
    @apply flex-shrink-0;
}
</style>
