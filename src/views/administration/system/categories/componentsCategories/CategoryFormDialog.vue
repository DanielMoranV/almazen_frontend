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
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Categoría' : 'Nueva Categoría'" :modal="true" class="p-fluid">
        <div class="field">
            <label for="name">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre de la categoría" :class="{ 'p-invalid': !form.name }" fluid />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="handleCancel" />
            <Button label="Guardar" icon="pi pi-check" class="p-button-text" :disabled="!isFormValid" @click="handleSubmit" :loading="loading" />
        </template>
    </Dialog>
</template>

<style scoped>
.field {
    margin-bottom: 1.5rem;
}
</style>
