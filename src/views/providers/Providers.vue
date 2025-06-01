<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProvidersStore } from '@/stores/providersStore';
import ProvidersTable from '@/components/providers/ProvidersTable.vue';
import ProviderFormDialog from '@/components/providers/ProviderFormDialog.vue';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog.vue';

const toast = useToast();
const providersStore = useProvidersStore();

// Estados
const providers = ref([]);
const selectedProvider = ref(null);
const showProviderDialog = ref(false);
const showDeleteDialog = ref(false);

// Inicialización
onMounted(async () => {
    await loadProviders();
});

// Métodos
const loadProviders = async () => {
    await providersStore.fetchProviders();

    if (providersStore.success) {
        providers.value = providersStore.providersList;
        showSuccess('Proveedores cargados', providersStore.message);
    } else {
        if (providersStore.validationErrors && providersStore.validationErrors.length > 0) {
            providersStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(providersStore.message);
        }
    }
};

const handleProviderSubmit = async (providerData) => {
    const action = providerData.id ? providersStore.updateProvider : providersStore.createProvider;
    await action(providerData);

    if (providersStore.success) {
        providers.value = providersStore.providersList;
        showSuccess(providerData.id ? 'Proveedor actualizado' : 'Proveedor creado', providersStore.message);
        showProviderDialog.value = false;
    } else {
        if (providersStore.validationErrors && providersStore.validationErrors.length > 0) {
            providersStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(providersStore.message);
        }
    }
};

const handleProviderDelete = async () => {
    await providersStore.deleteProvider(selectedProvider.value.id);
    if (providersStore.success) {
        providers.value = providersStore.providersList;
        showSuccess('Proveedor eliminado', providersStore.message);
        showDeleteDialog.value = false;
    } else {
        if (providersStore.validationErrors && providersStore.validationErrors.length > 0) {
            providersStore.validationErrors.forEach((err) => {
                toast.add({ severity: 'error', summary: 'Error de validación', detail: err, life: 4000 });
            });
        } else {
            showError(providersStore.message);
        }
    }
};

const showSuccess = (title, message) => {
    toast.add({
        severity: 'success',
        summary: title,
        detail: message,
        life: 3000
    });
};

const showError = (message) => {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 3000
    });
};
</script>
<template>
    <div class="p-6 card">
        <Toast />
        <ConfirmDialog />

        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Proveedores</h2>
            <Button
                icon="pi pi-plus"
                class="p-button-success"
                @click="
                    () => {
                        selectedProvider = null;
                        showProviderDialog = true;
                    }
                "
            />
        </div>
        <ProvidersTable
            :providers="providers"
            :loading="providersStore.isLoadingProviders"
            @edit="
                (provider) => {
                    selectedProvider = provider;
                    showProviderDialog = true;
                }
            "
            @delete="
                (provider) => {
                    selectedProvider = provider;
                    showDeleteDialog = true;
                }
            "
        />

        <ProviderFormDialog v-model:visible="showProviderDialog" :provider="selectedProvider" @submit="handleProviderSubmit" :loading="providersStore.isLoadingProviders" />

        <DeleteConfirmationDialog v-model:visible="showDeleteDialog" :item-name="selectedProvider?.name || ''" @confirm="handleProviderDelete" />
    </div>
</template>
