<script setup>
import { ref, computed, watch } from 'vue';
import { Positions } from '@/constants/positions';

const props = defineProps({
    visible: Boolean,
    loading: Boolean,
    user: {
        type: Object,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'submit']);

const form = ref({
    id: null,
    name: '',
    dni: '',
    email: '',
    phone: '',
    position: '',
    is_active: true
});

const positions = Object.values(Positions).map((value) => ({
    label: value,
    value
}));

const resetForm = () => {
    form.value = {
        id: null,
        name: '',
        dni: '',
        email: '',
        phone: '',
        position: '',
        is_active: true
    };
};

// Reset form when user changes
watch(
    () => props.user,
    (user) => {
        if (user) {
            form.value = { ...user };
        } else {
            resetForm();
        }
    },
    { immediate: true }
);

// Validations
const isValidDNI = computed(() => /^\d{8}$/.test(form.value.dni));
const isValidPhone = computed(() => /^\d{9}$/.test(form.value.phone));
const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email));
const isFormValid = computed(() => form.value.name && isValidDNI.value && isValidPhone.value && isValidEmail.value && form.value.position);

const handleSubmit = () => {
    if (isFormValid.value) {
        emit('submit', form.value);
    }
};

const handleCancel = () => {
    emit('update:visible', false);
};
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => emit('update:visible', val)" :style="{ width: '500px' }" :header="form.id ? 'Editar Usuario' : 'Nuevo Usuario'" :modal="true" class="p-fluid">
        <div class="field">
            <label for="name">Nombre</label>
            <InputText id="name" v-model="form.name" placeholder="Ingrese el nombre completo" :class="{ 'p-invalid': !form.name }" fluid />
            <small class="p-error" v-if="!form.name">Nombre es requerido.</small>
        </div>

        <div class="field">
            <label for="dni">DNI</label>
            <InputText id="dni" v-model="form.dni" placeholder="Ingrese el DNI (8 dígitos)" :class="{ 'p-invalid': form.dni && !isValidDNI }" fluid />
            <small class="p-error" v-if="form.dni && !isValidDNI"> DNI debe tener 8 dígitos numéricos. </small>
        </div>

        <div class="field">
            <label for="email">Email</label>
            <InputText id="email" v-model="form.email" placeholder="Ingrese el email" :class="{ 'p-invalid': form.email && !isValidEmail }" fluid />
            <small class="p-error" v-if="form.email && !isValidEmail"> Ingrese un email válido. </small>
        </div>

        <div class="field">
            <label for="phone">Teléfono</label>
            <InputText id="phone" v-model="form.phone" placeholder="Ingrese el teléfono (9 dígitos)" :class="{ 'p-invalid': form.phone && !isValidPhone }" fluid />
            <small class="p-error" v-if="form.phone && !isValidPhone"> Teléfono debe tener 9 dígitos numéricos. </small>
        </div>

        <div class="field">
            <label for="position">Cargo</label>
            <Select id="position" v-model="form.position" :options="positions" optionLabel="label" optionValue="value" placeholder="Seleccione un cargo" :class="{ 'p-invalid': !form.position }" fluid />
            <small class="p-error" v-if="!form.position">Cargo es requerido.</small>
        </div>

        <div class="field-checkbox">
            <Checkbox id="is_active" v-model="form.is_active" :binary="true" fluid />
            <label for="is_active">Usuario activo</label>
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

.field-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}
</style>
