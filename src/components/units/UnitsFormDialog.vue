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
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Unidad' : 'Nueva Unidad'" :modal="true" class="p-fluid">
        <div class="field">
            <label for="name">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre de la unidad" :class="{ 'p-invalid': !form.name }" fluid />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
        </div>
        <div class="field">
            <label for="symbol">Simbolo</label>
            <InputText id="symbol" v-model="form.symbol" placeholder="Ingrese el simbolo de la unidad" :class="{ 'p-invalid': !form.symbol }" fluid />
            <small class="p-error" v-if="!form.symbol">Simbolo es requerido.</small>
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
