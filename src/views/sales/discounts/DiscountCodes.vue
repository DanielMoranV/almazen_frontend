<script setup>
import { useDiscountCodesStore } from '@/stores/discountCodesStore';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';
import DiscountCodeForm from './componentsDiscounts/DiscountCodeForm.vue';
import DiscountCodesList from './componentsDiscounts/DiscountCodesList.vue';

const toast = useToast();
const discountCodesStore = useDiscountCodesStore();

const searchQuery = ref('');
const selectedStatus = ref('all');
const selectedType = ref('all');
const showFormDialog = ref(false);
const editingCode = ref(null);

const statusOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' }
];

const typeOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Porcentaje', value: 'percentage' },
    { label: 'Monto Fijo', value: 'fixed' }
];

const loading = computed(() => discountCodesStore.loading);

// Filtered codes
const filteredCodes = computed(() => {
    let codes = (discountCodesStore.discountCodes || []).filter(c => c);

    // Filter by search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        codes = codes.filter(
            (code) =>
                code.code.toLowerCase().includes(query) ||
                code.name.toLowerCase().includes(query) ||
                code.description?.toLowerCase().includes(query)
        );
    }

    // Filter by status
    if (selectedStatus.value === 'active') {
        codes = codes.filter((code) => code.is_active);
    } else if (selectedStatus.value === 'inactive') {
        codes = codes.filter((code) => !code.is_active);
    }

    // Filter by type
    if (selectedType.value !== 'all') {
        codes = codes.filter((code) => code.discount_type === selectedType.value);
    }

    return codes;
});

onMounted(async () => {
    await loadDiscountCodes();
});

/**
 * Load discount codes
 */
const loadDiscountCodes = async () => {
    try {
        await discountCodesStore.fetchDiscountCodes();
    } catch (error) {
        console.error('[DiscountCodes] Error loading codes:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar códigos de descuento',
            life: 4000
        });
    }
};

/**
 * Open form dialog for new code
 */
const openNewCodeDialog = () => {
    editingCode.value = null;
    showFormDialog.value = true;
};

/**
 * Open form dialog for editing
 */
const openEditDialog = (code) => {
    editingCode.value = code;
    showFormDialog.value = true;
};

/**
 * Close form dialog
 */
const closeFormDialog = () => {
    showFormDialog.value = false;
    editingCode.value = null;
};

/**
 * Handle code saved
 */
const handleCodeSaved = async () => {
    await loadDiscountCodes();
    closeFormDialog();
};

/**
 * View statistics
 */
const viewStats = (codeId) => {
    // TODO: Implement stats view
    console.log('View stats for code:', codeId);
    toast.add({
        severity: 'info',
        summary: 'Próximamente',
        detail: 'La vista de estadísticas estará disponible pronto',
        life: 3000
    });
};
</script>

<template>
    <div class="discount-codes-page">
        <Toast />

        <!-- Page Header -->
        <div class="page-header">
            <div class="header-content">
                <div class="title-section">
                    <h1 class="page-title">
                        <i class="pi pi-percentage"></i>
                        Códigos de Descuento
                    </h1>
                    <p class="page-subtitle">Gestiona códigos promocionales y descuentos para tus ventas</p>
                </div>
            </div>
        </div>

        <!-- Content Container -->
        <div class="content-container">
            <!-- Toolbar -->
            <div class="toolbar">
                <div class="toolbar-left">
                    <div class="search-container">
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="searchQuery" placeholder="Buscar códigos..." class="search-input" />
                        </IconField>
                    </div>

                    <div class="filter-container">
                        <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Estado" class="filter-select" />
                        <Select v-model="selectedType" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Tipo" class="filter-select" />
                    </div>
                </div>

                <div class="toolbar-right">
                    <Button icon="pi pi-refresh" label="Actualizar" severity="secondary" @click="loadDiscountCodes" :loading="loading" outlined />
                    <Button icon="pi pi-plus" label="Nuevo Código" severity="success" @click="openNewCodeDialog" />
                </div>
            </div>

            <!-- Discount Codes List -->
            <DiscountCodesList :codes="filteredCodes" :loading="loading" @edit="openEditDialog" @view-stats="viewStats" @refresh="loadDiscountCodes" />
        </div>

        <!-- Form Dialog -->
        <Dialog v-model:visible="showFormDialog" :header="editingCode ? 'Editar Código de Descuento' : 'Nuevo Código de Descuento'" modal :style="{ width: '900px' }" :closable="true">
            <DiscountCodeForm :code="editingCode" :visible="showFormDialog" @close="closeFormDialog" @saved="handleCodeSaved" />
        </Dialog>
    </div>
</template>

<style scoped>
.discount-codes-page {
    @apply flex flex-col gap-6 p-6 min-h-screen;
}

/* Page Header */
.page-header {
    @apply relative overflow-hidden mb-6 rounded-xl;
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%);
    padding: 1.5rem;
    box-shadow:
        0 4px 12px -2px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.05);
}

.header-content {
    @apply relative z-10;
}

.title-section {
    @apply text-center;
}

.page-title {
    @apply flex items-center justify-center gap-2 text-2xl font-bold text-white mb-1;
}

.page-title i {
    @apply text-2xl;
}

.page-subtitle {
    @apply text-white/90 text-sm;
}

/* Content Container */
.content-container {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6;
}

/* Toolbar */
.toolbar {
    @apply flex justify-between items-center gap-4 flex-wrap;
}

.toolbar-left {
    @apply flex items-center gap-4 flex-wrap flex-1;
}

.toolbar-right {
    @apply flex gap-2;
}

.search-container {
    @apply min-w-64;
}

.search-input {
    @apply w-full;
}

.filter-container {
    @apply flex gap-2;
}

.filter-select {
    @apply min-w-40;
}

/* Responsive */
@media (max-width: 768px) {
    .discount-codes-page {
        @apply p-4;
    }

    .toolbar {
        @apply flex-col items-stretch;
    }

    .toolbar-left {
        @apply flex-col w-full;
    }

    .search-container {
        @apply w-full min-w-0;
    }

    .filter-container {
        @apply w-full;
    }

    .filter-select {
        @apply flex-1 min-w-0;
    }

    .toolbar-right {
        @apply w-full;
    }

    .toolbar-right .p-button {
        @apply flex-1;
    }
}
</style>
