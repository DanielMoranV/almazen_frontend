<script setup>
defineProps({
    visible: Boolean,
    itemName: {
        type: String,
        default: ''
    }
});

defineEmits(['update:visible', 'confirm']);
</script>

<template>
    <Dialog :visible="visible" @update:visible="(val) => $emit('update:visible', val)" :style="{ width: '450px' }" header="Confirmar" :modal="true">
        <div class="flex align-items-center gap-3">
            <i class="pi pi-exclamation-triangle text-red-500 text-2xl" />
            <span v-if="itemName">
                ¿Está seguro de eliminar a <strong>{{ itemName }}</strong
                >?
            </span>
            <span v-else> ¿Está seguro de eliminar este elemento? </span>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
            <Button label="Eliminar" icon="pi pi-trash" class="p-button-danger" @click="$emit('confirm')" />
        </template>
    </Dialog>
</template>
