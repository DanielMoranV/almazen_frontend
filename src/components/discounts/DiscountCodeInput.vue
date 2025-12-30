<script setup>
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { ref } from 'vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    loading: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'apply', 'clear']);

const code = ref(props.modelValue);

const handleInput = (value) => {
    code.value = value.toUpperCase();
    emit('update:modelValue', code.value);
};

const handleApply = () => {
    if (code.value.trim()) {
        emit('apply', code.value);
    }
};

const handleClear = () => {
    code.value = '';
    emit('update:modelValue', '');
    emit('clear');
};
</script>

<template>
    <div class="discount-code-input">
        <div class="p-inputgroup">
            <InputText :model-value="code" @update:model-value="handleInput" placeholder="Código de descuento" :disabled="disabled || loading" @keydown.enter.prevent="handleApply" class="code-input" />
            <Button
                v-if="code"
                icon="pi pi-times"
                severity="secondary"
                @click="handleClear"
                :disabled="disabled || loading"
                v-tooltip.top="'Limpiar'"
            />
            <Button
                label="Aplicar"
                icon="pi pi-check"
                @click="handleApply"
                :loading="loading"
                :disabled="disabled || !code.trim()"
            />
        </div>
        <small class="helper-text">Presiona Enter para aplicar</small>
    </div>
</template>

<style scoped>
.discount-code-input {
    @apply flex flex-col gap-1;
}

.code-input {
    @apply font-mono uppercase font-bold;
}

.helper-text {
    @apply text-xs text-gray-500 dark:text-gray-400 ml-1;
}
</style>
