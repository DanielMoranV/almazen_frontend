<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    provider: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    contact_name: '',
    phone: '',
    email: ''
});

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        contact_name: '',
        phone: '',
        email: ''
    };
};

const isFormValid = computed(() => {
    return form.value.name && form.value.contact_name; // Phone and email are optional
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
    () => props.provider,
    (newProvider) => {
        if (newProvider) {
            form.value = { ...newProvider };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Proveedor' : 'Nuevo Proveedor'" :modal="true" class="p-fluid">
        <div class="field">
            <label for="name">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre del proveedor" :class="{ 'p-invalid': !form.name }" fluid />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
        </div>
        <div class="field">
            <label for="contact_name">Nombre de Contacto</label>
            <InputText id="contact_name" v-model="form.contact_name" placeholder="Ingrese el nombre de contacto" :class="{ 'p-invalid': !form.contact_name }" fluid />
            <small class="p-error" v-if="!form.contact_name">Nombre de contacto es requerido.</small>
        </div>
        <div class="field">
            <label for="phone">Teléfono</label>
            <InputText id="phone" v-model="form.phone" placeholder="Ingrese el teléfono del proveedor" fluid />
        </div>
        <div class="field">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" placeholder="Ingrese el email del proveedor" fluid />
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
