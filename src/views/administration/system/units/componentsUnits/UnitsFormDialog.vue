<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    unit: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    symbol: ''
});

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        symbol: ''
    };
};

const isFormValid = computed(() => {
    return form.value.name && form.value.symbol;
});

const handleSubmit = () => {
    emit('submit', form.value);
};

const handleCancel = () => {
    emit('update:visible', false);
};

watch(
    () => props.unit,
    (newUnit) => {
        if (newUnit) {
            form.value = { ...newUnit };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Unidad' : 'Nueva Unidad'" :modal="true" :pt="{ header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white', content: 'p-6 bg-white dark:bg-gray-800' }"
        
    >
        >
        
    >
        <div class="field">
            <label for="name" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre de la unidad" :class="{ 'p-invalid': !form.name }" fluid class="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
        </div>
        <div class="field">
            <label for="symbol" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Simbolo</label>
            <InputText id="symbol" v-model="form.symbol" placeholder="Ingrese el simbolo de la unidad" :class="{ 'p-invalid': !form.symbol }" fluid class="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            <small class="p-error" v-if="!form.symbol">Simbolo es requerido.</small>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" severity="secondary" outlined @click="handleCancel" />
            <Button label="Guardar" icon="pi pi-check" severity="success" :disabled="!isFormValid" @click="handleSubmit" :loading="loading" />
        </template>
    </Dialog>
</template>

<style scoped>
.field {
    margin-bottom: 1.5rem;
}
</style>
