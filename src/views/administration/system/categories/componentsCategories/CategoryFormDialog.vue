<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    category: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: ''
});

const resetForm = () => {
    form.value = {
        id: null,
        name: ''
    };
};

const isFormValid = computed(() => {
    return form.value.name;
});

const handleSubmit = () => {
    emit('submit', form.value);
    resetForm();
};

const handleCancel = () => {
    emit('update:visible', false);
    resetForm();
};

watch(
    () => props.category,
    (newCategory) => {
        if (newCategory) {
            form.value = { ...newCategory };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Categoría' : 'Nueva Categoría'" :modal="true" class="p-fluid"
        :pt="{
            header: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
            content: 'p-6 bg-white dark:bg-gray-800'
        }"
    >
        <div class="field">
            <label for="name" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre de la categoría" :class="{ 'p-invalid': !form.name }" fluid class="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
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
