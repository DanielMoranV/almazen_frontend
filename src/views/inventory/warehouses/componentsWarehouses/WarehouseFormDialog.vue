<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    warehouse: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    address: '',
    phone: ''
});

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        address: '',
        phone: ''
    };
};

const isFormValid = computed(() => {
    return form.value.name && form.value.address; // Phone is optional
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
    () => props.warehouse,
    (newWarehouse) => {
        if (newWarehouse) {
            form.value = { ...newWarehouse };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Almacén' : 'Nuevo Almacén'" :modal="true" class="p-fluid">
        <div class="field">
            <label for="name">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre del almacén" :class="{ 'p-invalid': !form.name }" fluid />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
        </div>
        <div class="field">
            <label for="address">Dirección</label>
            <InputText id="address" v-model="form.address" placeholder="Ingrese la dirección del almacén" :class="{ 'p-invalid': !form.address }" fluid />
            <small class="p-error" v-if="!form.address">Dirección es requerida.</small>
        </div>
        <div class="field">
            <label for="phone">Teléfono</label>
            <InputText id="phone" v-model="form.phone" placeholder="Ingrese el teléfono del almacén" fluid />
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
